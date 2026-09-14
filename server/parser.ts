import JSZip from 'jszip';
import path from 'path';
import fs from 'fs';
import { parseDocumentWithGemini } from './gemini';

export interface ExtractedQuestion {
  id: string;
  part: 'PART_1' | 'PART_2' | 'PART_3' | 'PART_4';
  questionNumber: number;
  content: string;
  imageUrl?: string;
  points: number;
  difficulty: 'NB' | 'TH' | 'VD' | 'VDC';
  options?: { id: 'A' | 'B' | 'C' | 'D'; content: string; imageUrl?: string }[];
  correctOption?: 'A' | 'B' | 'C' | 'D';
  statements?: { id: 'a' | 'b' | 'c' | 'd'; content: string; isCorrect: boolean }[];
  shortAnswer?: string;
  tolerance?: number;
  roundingRule?: string;
  essayRubric?: string;
  explanation?: string;
  needsReview?: boolean;
  reviewReason?: string;
  sourceLocation?: { page?: number; rawText?: string; section?: string };
}

export interface ParseResult {
  fileName: string;
  fileSize: number;
  fileType: 'docx' | 'pdf' | 'text';
  rawTextPreview: string;
  questions: ExtractedQuestion[];
  stats: {
    part1Count: number;
    part2Count: number;
    part3Count: number;
    part4Count: number;
    totalFormulas: number;
    totalImages: number;
    needsReviewCount: number;
  };
  warnings: string[];
}

/**
 * Basic OMML to LaTeX converter for Word math equations
 */
function convertOmmlToLatex(ommlXml: string): string {
  let tex = ommlXml;
  // Fractions: <m:f> <m:num> ... </m:num> <m:den> ... </m:den> </m:f>
  tex = tex.replace(/<m:f>[\s\S]*?<m:num>([\s\S]*?)<\/m:num>[\s\S]*?<m:den>([\s\S]*?)<\/m:den>[\s\S]*?<\/m:f>/gi, (_, num, den) => {
    return `\\frac{${cleanMathText(num)}}{${cleanMathText(den)}}`;
  });
  // Radicals: <m:rad> ... <m:e> ... </m:e> </m:rad>
  tex = tex.replace(/<m:rad>[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<\/m:rad>/gi, (_, body) => {
    return `\\sqrt{${cleanMathText(body)}}`;
  });
  // Superscripts: <m:sSup> ... <m:e> ... </m:e> <m:sup> ... </m:sup> </m:sSup>
  tex = tex.replace(/<m:sSup>[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<m:sup>([\s\S]*?)<\/m:sup>[\s\S]*?<\/m:sSup>/gi, (_, base, sup) => {
    return `${cleanMathText(base)}^{${cleanMathText(sup)}}`;
  });
  // Subscripts: <m:sSub> ... <m:e> ... </m:e> <m:sub> ... </m:sub> </m:sSub>
  tex = tex.replace(/<m:sSub>[\s\S]*?<m:e>([\s\S]*?)<\/m:e>[\s\S]*?<m:sub>([\s\S]*?)<\/m:sub>[\s\S]*?<\/m:sSub>/gi, (_, base, sub) => {
    return `${cleanMathText(base)}_{${cleanMathText(sub)}}`;
  });
  return cleanMathText(tex);
}

function cleanMathText(xml: string): string {
  // Extract text within <m:t>...</m:t> or <w:t>...</w:t>
  const matches = xml.match(/<[mw]:t[^>]*>([^<]*)<\/[mw]:t>/gi);
  if (matches) {
    return matches.map((m) => m.replace(/<[^>]+>/g, '')).join('');
  }
  return xml.replace(/<[^>]+>/g, '').trim();
}

/**
 * Extracts text, math formulas, and images from a docx buffer using JSZip
 */
export async function extractFromDocx(buffer: Buffer): Promise<{ text: string; images: string[] }> {
  const zip = await JSZip.loadAsync(buffer);
  const images: string[] = [];

  // Extract images from word/media/
  const mediaFolder = zip.folder('word/media');
  if (mediaFolder) {
    const mediaFiles = Object.keys(zip.files).filter((name) => name.startsWith('word/media/'));
    for (const fileName of mediaFiles) {
      const file = zip.file(fileName);
      if (file) {
        const ext = path.extname(fileName).toLowerCase().replace('.', '');
        if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
          const imgBase64 = await file.async('base64');
          const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
          images.push(`data:${mime};base64,${imgBase64}`);
        }
      }
    }
  }

  // Parse word/document.xml
  const docFile = zip.file('word/document.xml');
  if (!docFile) {
    throw new Error('Tệp .docx không hợp lệ (thiếu word/document.xml).');
  }

  const xmlContent = await docFile.async('text');

  // Convert paragraphs to text lines
  // Replace <m:oMath>...</m:oMath> with converted LaTeX
  const withMath = xmlContent.replace(/<m:oMath>([\s\S]*?)<\/m:oMath>/gi, (match, mathXml) => {
    const latex = convertOmmlToLatex(mathXml);
    return ` $${latex}$ `;
  });

  // Convert paragraph <w:p> to newlines
  const textLines: string[] = [];
  const pMatches = withMath.match(/<w:p[\s\S]*?<\/w:p>/gi) || [withMath];

  for (const p of pMatches) {
    const textOnly = p.replace(/<w:t[^>]*>([^<]*)<\/w:t>/gi, '$1');
    const cleaned = textOnly.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (cleaned) {
      textLines.push(cleaned);
    }
  }

  return {
    text: textLines.join('\n'),
    images,
  };
}

/**
 * Parses raw text containing a 4-part exam into structured Question objects.
 */
export function parseStructuredExamText(rawText: string, images: string[] = []): ExtractedQuestion[] {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const questions: ExtractedQuestion[] = [];

  let currentPart: 'PART_1' | 'PART_2' | 'PART_3' | 'PART_4' = 'PART_1';
  let currentQuestion: ExtractedQuestion | null = null;
  let imgIndex = 0;

  function finalizeCurrentQuestion() {
    if (currentQuestion) {
      // Validate Part 1
      if (currentQuestion.part === 'PART_1') {
        if (!currentQuestion.options || currentQuestion.options.length === 0) {
          currentQuestion.needsReview = true;
          currentQuestion.reviewReason = 'Chưa nhận diện đủ các phương án A, B, C, D';
        }
        if (!currentQuestion.correctOption) {
          currentQuestion.needsReview = true;
          currentQuestion.reviewReason = (currentQuestion.reviewReason ? currentQuestion.reviewReason + '; ' : '') + 'Chưa có đáp án đúng';
        }
      } else if (currentQuestion.part === 'PART_2') {
        if (!currentQuestion.statements || currentQuestion.statements.length < 4) {
          currentQuestion.needsReview = true;
          currentQuestion.reviewReason = `Mới nhận diện được ${currentQuestion.statements?.length || 0}/4 ý a, b, c, d`;
        }
      } else if (currentQuestion.part === 'PART_3') {
        if (!currentQuestion.shortAnswer) {
          currentQuestion.needsReview = true;
          currentQuestion.reviewReason = 'Chưa có đáp án ngắn';
        }
      }
      questions.push(currentQuestion);
      currentQuestion = null;
    }
  }

  const part1Regex = /^(PHẦN\s+(?:I|1)|PHẦN\s+THỨ\s+NHẤT)[\s.:\-]*(.*trắc\s+nghiệm\s+nhiều\s+phương\s+án.*)?/i;
  const part2Regex = /^(PHẦN\s+(?:II|2)|PHẦN\s+THỨ\s+HAI)[\s.:\-]*(.*trắc\s+nghiệm\s+đúng\s*[\/\-]?\s*sai.*)?/i;
  const part3Regex = /^(PHẦN\s+(?:III|3)|PHẦN\s+THỨ\s+BA)[\s.:\-]*(.*trả\s+lời\s+ngắn.*)?/i;
  const part4Regex = /^(PHẦN\s+(?:IV|4)|PHẦN\s+THỨ\s+TƯ)[\s.:\-]*(.*tự\s+luận.*)?/i;

  const questionStartRegex = /^(?:Câu|Bài)\s*(\d+)[\s.:\)-]+([\s\S]*)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check Part Header
    if (part1Regex.test(line)) {
      finalizeCurrentQuestion();
      currentPart = 'PART_1';
      continue;
    }
    if (part2Regex.test(line)) {
      finalizeCurrentQuestion();
      currentPart = 'PART_2';
      continue;
    }
    if (part3Regex.test(line)) {
      finalizeCurrentQuestion();
      currentPart = 'PART_3';
      continue;
    }
    if (part4Regex.test(line)) {
      finalizeCurrentQuestion();
      currentPart = 'PART_4';
      continue;
    }

    // Check Answer Key Table at the bottom (e.g. "BẢNG ĐÁP ÁN: 1-A, 2-B, 3-C...")
    if (/^(?:BẢNG\s+ĐÁP\s+ÁN|ĐÁP\s+ÁN\s+CHI\s+TIẾT|HƯỚNG\s+DẪN\s+CHẤM)/i.test(line)) {
      finalizeCurrentQuestion();
      // Parse answers at the end and assign back to questions
      parseTrailingAnswers(lines.slice(i), questions);
      break;
    }

    // Check Question Start
    const qMatch = line.match(questionStartRegex);
    if (qMatch) {
      finalizeCurrentQuestion();
      const qNum = parseInt(qMatch[1], 10);
      const contentRest = qMatch[2].trim();

      const defaultPoints =
        currentPart === 'PART_1' ? 0.25 : currentPart === 'PART_2' ? 1.0 : currentPart === 'PART_3' ? 0.5 : 2.0;

      currentQuestion = {
        id: `imp-q-${Date.now()}-${questions.length + 1}`,
        part: currentPart,
        questionNumber: qNum,
        content: contentRest,
        points: defaultPoints,
        difficulty: 'TH',
        options: currentPart === 'PART_1' ? [] : undefined,
        statements: currentPart === 'PART_2' ? [] : undefined,
        needsReview: false,
      };

      // Assign an extracted image if present
      if (images.length > imgIndex && (line.includes('hình') || line.includes('đồ thị') || line.includes('bảng'))) {
        currentQuestion.imageUrl = images[imgIndex++];
      }
      continue;
    }

    // If within a question:
    if (currentQuestion) {
      // PART 1: Option detection (A. ..., B. ..., C. ..., D. ...)
      if (currentQuestion.part === 'PART_1') {
        // Option pattern on single line or multiple on one line
        // E.g.: "A. 1   B. 2   C. 3   D. 4" or "A. (1; -2)"
        const optInlineRegex = /([A-D])[\.\)]\s*([^\n\r]+?)(?=(?:\s+[A-D][\.\)]|$))/g;
        let optMatch;
        let matchedAny = false;

        while ((optMatch = optInlineRegex.exec(line)) !== null) {
          const optLetter = optMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
          const optContent = optMatch[2].trim();
          if (['A', 'B', 'C', 'D'].includes(optLetter)) {
            matchedAny = true;
            // Check if already exists
            if (!currentQuestion.options) currentQuestion.options = [];
            const existing = currentQuestion.options.find((o) => o.id === optLetter);
            if (!existing) {
              currentQuestion.options.push({ id: optLetter, content: optContent });
            }
          }
        }

        if (!matchedAny) {
          // Check if it's an answer indicator (e.g. "Chọn A" or "Đáp án: A")
          const ansMatch = line.match(/(?:Chọn|Đáp\s*án)[:\s]*([A-D])/i);
          if (ansMatch) {
            currentQuestion.correctOption = ansMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
          } else if (line.toLowerCase().startsWith('lời giải:') || line.toLowerCase().startsWith('hướng dẫn:')) {
            currentQuestion.explanation = line.replace(/^(?:Lời giải|Hướng dẫn)[:\s]*/i, '');
          } else {
            // Append to question content
            currentQuestion.content += '\n' + line;
          }
        }
      }
      // PART 2: True/False statement (a) ..., b) ..., c) ..., d) ...)
      else if (currentQuestion.part === 'PART_2') {
        const stmtMatch = line.match(/^([a-d])[\.\)]\s*([^\n\r]+)/i);
        if (stmtMatch) {
          const letter = stmtMatch[1].toLowerCase() as 'a' | 'b' | 'c' | 'd';
          let stmtText = stmtMatch[2].trim();
          let isCorrect = false;

          // Check if inline indicator exists, e.g. "(Đúng)" or "(Sai)"
          if (/(?:\(Đúng\)|\[Đúng\]|:\s*Đúng)/i.test(stmtText)) {
            isCorrect = true;
            stmtText = stmtText.replace(/(?:\(Đúng\)|\[Đúng\]|:\s*Đúng)/gi, '').trim();
          } else if (/(?:\(Sai\)|\[Sai\]|:\s*Sai)/i.test(stmtText)) {
            isCorrect = false;
            stmtText = stmtText.replace(/(?:\(Sai\)|\[Sai\]|:\s*Sai)/gi, '').trim();
          }

          if (!currentQuestion.statements) currentQuestion.statements = [];
          currentQuestion.statements.push({
            id: letter,
            content: stmtText,
            isCorrect,
          });
        } else {
          currentQuestion.content += '\n' + line;
        }
      }
      // PART 3: Short answer
      else if (currentQuestion.part === 'PART_3') {
        const ansMatch = line.match(/(?:Đáp\s*án|Kết\s*quả)[:\s]*([^\n\r]+)/i);
        if (ansMatch) {
          currentQuestion.shortAnswer = ansMatch[1].trim();
        } else if (line.toLowerCase().includes('làm tròn')) {
          currentQuestion.roundingRule = line;
        } else {
          currentQuestion.content += '\n' + line;
        }
      }
      // PART 4: Essay
      else if (currentQuestion.part === 'PART_4') {
        if (line.toLowerCase().startsWith('thang điểm:') || line.toLowerCase().startsWith('biểu điểm:')) {
          currentQuestion.essayRubric = line;
        } else if (line.toLowerCase().startsWith('lời giải:') || line.toLowerCase().startsWith('hướng dẫn:')) {
          currentQuestion.explanation = line;
        } else {
          currentQuestion.content += '\n' + line;
        }
      }
    }
  }

  finalizeCurrentQuestion();

  // If questions are still empty, try fallback splitting
  if (questions.length === 0 && rawText.length > 50) {
    questions.push({
      id: `imp-fallback-1`,
      part: 'PART_1',
      questionNumber: 1,
      content: rawText.slice(0, 300),
      points: 0.25,
      difficulty: 'TH',
      options: [
        { id: 'A', content: 'Phương án A' },
        { id: 'B', content: 'Phương án B' },
        { id: 'C', content: 'Phương án C' },
        { id: 'D', content: 'Phương án D' },
      ],
      correctOption: 'A',
      needsReview: true,
      reviewReason: 'Cần kiểm tra lại ranh giới câu do tài liệu có định dạng đặc thù',
    });
  }

  return questions;
}

/**
 * Parses trailing answer key table (e.g., "1.A 2.B 3.C 4.D") and updates questions
 */
function parseTrailingAnswers(lines: string[], questions: ExtractedQuestion[]) {
  const fullText = lines.join(' ');
  // Match pairs like 1.A, 1-B, 1: C
  const pairRegex = /(\d+)[\s.:\-_]+([A-D])/gi;
  let match;
  while ((match = pairRegex.exec(fullText)) !== null) {
    const qNum = parseInt(match[1], 10);
    const ans = match[2].toUpperCase() as 'A' | 'B' | 'C' | 'D';
    const targetQ = questions.find((q) => q.questionNumber === qNum && q.part === 'PART_1');
    if (targetQ && !targetQ.correctOption) {
      targetQ.correctOption = ans;
      if (targetQ.reviewReason?.includes('Chưa có đáp án')) {
        targetQ.reviewReason = targetQ.reviewReason.replace(/;?\s*Chưa có đáp án đúng/g, '');
        if (!targetQ.reviewReason) targetQ.needsReview = false;
      }
    }
  }
}

/**
 * Main importer orchestrator:
 * Docx / PDF / Text -> Extract text & images -> Gemini assistance if available -> Structural extraction -> Preview
 */
export async function processExamDocument(params: {
  buffer: Buffer;
  fileName: string;
  fileSize: number;
  mimeType: string;
}): Promise<ParseResult> {
  const ext = path.extname(params.fileName).toLowerCase();
  let rawText = '';
  const images: string[] = [];
  const warnings: string[] = [];

  if (ext === '.docx') {
    try {
      const extracted = await extractFromDocx(params.buffer);
      rawText = extracted.text;
      images.push(...extracted.images);
    } catch (err: any) {
      warnings.push(`Lỗi khi mở tệp docx: ${err.message}. Đã chuyển sang trích xuất văn bản dự phòng.`);
      rawText = params.buffer.toString('utf-8');
    }
  } else if (ext === '.pdf') {
    // For PDF, convert text or send base64 to Gemini
    rawText = params.buffer.toString('utf-8');
    warnings.push('Tài liệu PDF: Đang sử dụng mô hình trí tuệ nhân tạo Gemini để nhận diện công thức và cấu trúc 4 phần.');
  } else {
    rawText = params.buffer.toString('utf-8');
  }

  let finalQuestions: ExtractedQuestion[] = [];

  // Try Gemini AI extraction first if key is configured
  try {
    const geminiData = await parseDocumentWithGemini({
      documentText: rawText,
      base64File: ext === '.pdf' ? { data: params.buffer.toString('base64'), mimeType: 'application/pdf' } : undefined,
    });

    if (geminiData && geminiData.questions && geminiData.questions.length > 0) {
      finalQuestions = geminiData.questions.map((q: any, idx: number) => ({
        ...q,
        id: `gemini-q-${Date.now()}-${idx + 1}`,
      }));
      if (geminiData.warnings) warnings.push(...geminiData.warnings);
    }
  } catch (geminiErr) {
    console.warn('Gemini parser skipped:', geminiErr);
  }

  // If Gemini didn't return questions, use local structural parser
  if (finalQuestions.length === 0) {
    finalQuestions = parseStructuredExamText(rawText, images);
  }

  // Count stats
  const part1Count = finalQuestions.filter((q) => q.part === 'PART_1').length;
  const part2Count = finalQuestions.filter((q) => q.part === 'PART_2').length;
  const part3Count = finalQuestions.filter((q) => q.part === 'PART_3').length;
  const part4Count = finalQuestions.filter((q) => q.part === 'PART_4').length;
  const totalFormulas = (rawText.match(/\$[^$\n]+\$/g) || []).length;
  const needsReviewCount = finalQuestions.filter((q) => q.needsReview).length;

  return {
    fileName: params.fileName,
    fileSize: params.fileSize,
    fileType: ext === '.docx' ? 'docx' : ext === '.pdf' ? 'pdf' : 'text',
    rawTextPreview: rawText.slice(0, 5000),
    questions: finalQuestions,
    stats: {
      part1Count,
      part2Count,
      part3Count,
      part4Count,
      totalFormulas,
      totalImages: images.length,
      needsReviewCount,
    },
    warnings,
  };
}
