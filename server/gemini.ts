import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export function isGeminiAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * AI Math Tutor: Explains concepts, answers questions with LaTeX formulas,
 * provides step-by-step hints without immediately revealing the full answer.
 */
export async function askMathTutor(params: {
  message: string;
  grade?: number;
  lessonTitle?: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
}): Promise<string> {
  const ai = getGenAI();
  if (!ai) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng thiết lập biến môi trường.');
  }

  const systemInstruction = `Bạn là Trợ lý AI dạy Toán THPT (lớp 10, 11, 12) của Thầy Phan Quốc Cường - THPT Đức Hòa, theo chương trình GDPT 2018 (sách Kết nối tri thức với cuộc sống).
Nhiệm vụ của bạn:
1. Giải thích cặn kẽ, sư phạm, khích lệ học sinh tự tư duy.
2. Tuyệt đối LUÔN viết công thức toán học dưới định dạng LaTeX:
   - Công thức trong dòng: kẹp giữa cặp dấu $, ví dụ $f'(x) = 3x^2 - 2x$.
   - Công thức riêng dòng: kẹp giữa cặp dấu $$, ví dụ $$I = \\int_{0}^{1} x e^x dx$$.
3. Không giải tắt, gợi ý từng bước tư duy nếu học sinh đang bí.
4. Lớp hiện tại học sinh đang học: Lớp ${params.grade || 12}.
5. Bài học liên quan: ${params.lessonTitle || 'Toán học THPT'}.
6. Luôn giữ phong cách ân cần, chuẩn mực nhà giáo Việt Nam.`;

  const contents: any[] = [];
  if (params.history && params.history.length > 0) {
    for (const h of params.history) {
      contents.push({
        role: h.role,
        parts: [{ text: h.text }],
      });
    }
  }
  contents.push({
    role: 'user',
    parts: [{ text: params.message }],
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents,
    config: {
      systemInstruction,
      temperature: 0.4,
    },
  });

  return response.text || 'Xin lỗi, tôi chưa thể trả lời câu hỏi này vào lúc này.';
}

/**
 * Step-by-step hint without spoiling full answer
 */
export async function getQuestionHint(params: {
  questionContent: string;
  optionsText?: string;
  studentAttempt?: string;
}): Promise<string> {
  const ai = getGenAI();
  if (!ai) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY trên máy chủ.');
  }

  const prompt = `Câu hỏi Toán:
${params.questionContent}
${params.optionsText ? `Các phương án: ${params.optionsText}` : ''}
${params.studentAttempt ? `Học sinh đang nghĩ: "${params.studentAttempt}"` : ''}

Hãy đưa ra một gợi ý sư phạm (1 đến 2 câu ngắn gọn, hướng dẫn công thức hoặc phương pháp cần dùng, KHÔNG NÊU TRỰC TIẾP ĐÁP ÁN CUỐI CÙNG). Viết công thức toán trong dấu $...$.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      temperature: 0.3,
    },
  });

  return response.text || 'Hãy nhớ lại các định nghĩa và công thức cơ bản liên quan đến bài toán này.';
}

/**
 * Explain why a chosen answer is wrong
 */
export async function explainError(params: {
  questionContent: string;
  studentAnswer: string;
  correctAnswer: string;
  explanation?: string;
}): Promise<string> {
  const ai = getGenAI();
  if (!ai) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY trên máy chủ.');
  }

  const prompt = `Học sinh làm sai câu hỏi sau:
Đề bài: ${params.questionContent}
Đáp án học sinh chọn: ${params.studentAnswer}
Đáp án đúng: ${params.correctAnswer}
Lời giải gốc (nếu có): ${params.explanation || 'Chưa có'}

Hãy chỉ rõ học sinh thường mắc bẫy hoặc nhầm lẫn ở điểm nào (ví dụ: quên điều kiện xác định, nhầm dấu đạo hàm, nhầm VTPT với VTCP...), và cách khắc phục. Viết công thức bằng LaTeX trong $...$. Ngắn gọn, dễ hiểu.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      temperature: 0.3,
    },
  });

  return response.text || 'Bạn hãy kiểm tra lại điều kiện bài toán và các bước biến đổi.';
}

/**
 * AI assistance for recognizing 4-part exam questions from raw text or multimodal document
 */
export async function parseDocumentWithGemini(params: {
  documentText: string;
  base64File?: { data: string; mimeType: string };
}): Promise<any> {
  const ai = getGenAI();
  if (!ai) {
    return null; // Fallback to local regex/structural parser
  }

  const systemPrompt = `Bạn là trợ lý AI chuyên nghiệp phân tích đề thi Toán THPT (GDPT 2018).
Đề thi theo cấu trúc 4 phần chuẩn của Bộ GD&ĐT:
- PHẦN I: Trắc nghiệm 4 phương án (chọn 1 trong A, B, C, D)
- PHẦN II: Trắc nghiệm Đúng/Sai (câu có 4 ý a, b, c, d, mỗi ý chọn Đúng hoặc Sai)
- PHẦN III: Trả lời ngắn (điền kết quả số, phân số, số thập phân)
- PHẦN IV: Tự luận (trình bày bài giải)

RÀNG BUỘC NGHIÊM NGẶT:
1. Chỉ trích xuất nội dung có trong tài liệu nguồn. Không tự giải đề hoặc tự bịa thêm câu hỏi.
2. Công thức toán học PHẢI chuyển về LaTeX chuẩn, kẹp giữa dấu $ (inline) hoặc $$ (block), ví dụ $\\frac{a}{b}$, $\\sqrt{x}$, $\\int_0^1 f(x)dx$.
3. Trả về định dạng JSON thuần túy theo schema sau:
{
  "questions": [
    {
      "part": "PART_1" | "PART_2" | "PART_3" | "PART_4",
      "questionNumber": number,
      "content": "Nội dung câu hỏi với LaTeX $...$",
      "points": number,
      "difficulty": "NB" | "TH" | "VD" | "VDC",
      "options": [
        {"id": "A", "content": "..."},
        {"id": "B", "content": "..."},
        {"id": "C", "content": "..."},
        {"id": "D", "content": "..."}
      ],
      "correctOption": "A" | "B" | "C" | "D" | null,
      "statements": [
        {"id": "a", "content": "...", "isCorrect": boolean},
        {"id": "b", "content": "...", "isCorrect": boolean},
        {"id": "c", "content": "...", "isCorrect": boolean},
        {"id": "d", "content": "...", "isCorrect": boolean}
      ],
      "shortAnswer": string | null,
      "roundingRule": string | null,
      "essayRubric": string | null,
      "explanation": string | null,
      "needsReview": boolean,
      "reviewReason": string | null
    }
  ],
  "warnings": ["cảnh báo nếu có chỗ chưa chắc chắn"]
}`;

  try {
    const parts: any[] = [];
    if (params.base64File) {
      parts.push({
        inlineData: {
          data: params.base64File.data,
          mimeType: params.base64File.mimeType,
        },
      });
    }
    parts.push({
      text: `Hãy phân tích tài liệu sau thành các câu hỏi theo 4 phần:\n\n${params.documentText.slice(0, 30000)}`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
  } catch (err) {
    console.warn('Gemini doc parse error, will fallback to local structural parser:', err);
  }
  return null;
}
