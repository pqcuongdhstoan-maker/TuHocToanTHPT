import JSZip from 'jszip';
import { Exam, Question } from '../types';

interface ExportDocxOptions {
  includeSolutions: boolean;
  schoolName?: string;
  teacherName?: string;
}

/**
 * Escapes XML special characters
 */
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Strips LaTeX delimiters for clean Word text representation
 */
function cleanMathForDocx(text: string): string {
  if (!text) return '';
  return text
    .replace(/\$\$(.*?)\$\$/g, '$1')
    .replace(/\\\[(.*?)\\\]/g, '$1')
    .replace(/\$(.*?)\$/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\cdot/g, '·')
    .replace(/\\pm/g, '±')
    .replace(/\\neq/g, '≠')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\in/g, '∈')
    .replace(/\\notin/g, '∉')
    .replace(/\\mathbb\{R\}/g, 'ℝ')
    .replace(/\\infty/g, '∞')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\vec\{([^}]+)\}/g, 'vectơ $1')
    .replace(/\\int/g, '∫');
}

/**
 * Generates openxml paragraph XML
 */
function createDocxParagraph(text: string, options: { bold?: boolean; italic?: boolean; size?: number; align?: 'left' | 'center' | 'right'; color?: string } = {}): string {
  const alignTag = options.align ? `<w:jc w:val="${options.align}"/>` : '';
  const boldTag = options.bold ? '<w:b/>' : '';
  const italicTag = options.italic ? '<w:i/>' : '';
  const sizeTag = options.size ? `<w:sz w:val="${options.size * 2}"/>` : '<w:sz w:val="24"/>'; // 12pt default
  const colorTag = options.color ? `<w:color w:val="${options.color}"/>` : '';

  const cleanText = escapeXml(cleanMathForDocx(text));

  return `
    <w:p>
      <w:pPr>
        ${alignTag}
        <w:spacing w:after="120" w:line="276" w:lineRule="auto"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
          ${boldTag}
          ${italicTag}
          ${sizeTag}
          ${colorTag}
        </w:rPr>
        <w:t xml:space="preserve">${cleanText}</w:t>
      </w:r>
    </w:p>
  `;
}

/**
 * Service to export Exams to Word (.docx), Moodle XML, and GIFT format
 */
export const examExportService = {
  /**
   * Export exam to Word (.docx) document
   */
  async exportToDocx(exam: Exam, options: ExportDocxOptions): Promise<void> {
    const school = options.schoolName || 'TRƯỜNG THPT ĐỨC HÒA';
    const teacher = options.teacherName || 'Thầy Phan Quốc Cường';
    const isTeacherKey = options.includeSolutions;

    const zip = new JSZip();

    // 1. [Content_Types].xml
    zip.file(
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
        <Default Extension="xml" ContentType="application/xml"/>
        <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
        <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
      </Types>`
    );

    // 2. _rels/.rels
    zip.file(
      '_rels/.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
      </Relationships>`
    );

    // 3. word/_rels/document.xml.rels
    zip.file(
      'word/_rels/document.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
      </Relationships>`
    );

    // 4. word/styles.xml
    zip.file(
      'word/styles.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:docDefaults>
          <w:rPrDefault>
            <w:rPr>
              <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
              <w:sz w:val="24"/>
              <w:lang w:val="vi-VN"/>
            </w:rPr>
          </w:rPrDefault>
        </w:docDefaults>
      </w:styles>`
    );

    // 5. word/document.xml content generation
    let docBody = '';

    // Official Header
    docBody += createDocxParagraph(school.toUpperCase(), { bold: true, align: 'center', size: 12 });
    docBody += createDocxParagraph('TỔ TOÁN - TIN HỌC • GIÁO VIÊN: ' + teacher.toUpperCase(), { italic: true, align: 'center', size: 11 });
    docBody += createDocxParagraph(exam.title.toUpperCase(), { bold: true, align: 'center', size: 14, color: '1E40AF' });
    docBody += createDocxParagraph(`Thời gian làm bài: ${exam.timeMinutes} phút (Không kể thời gian phát đề)`, { italic: true, align: 'center', size: 11 });
    docBody += createDocxParagraph('Định hướng GDPT 2018 — Sách Kết nối tri thức với cuộc sống', { align: 'center', size: 10, color: '4B5563' });

    if (isTeacherKey) {
      docBody += createDocxParagraph('★★★ BẢN DÀNH CHO GIÁO VIÊN — CÓ ĐÁP ÁN VÀ LỜI GIẢI CHI TIẾT ★★★', { bold: true, align: 'center', size: 12, color: 'DC2626' });
    } else {
      docBody += createDocxParagraph('Họ và tên thí sinh: ................................................................ Lớp: ............. SBD: .............', { bold: true, size: 11 });
      docBody += createDocxParagraph('───────────────────────────────────────────────────────────────────', { align: 'center', color: '9CA3AF' });
    }

    const questions = exam.questions || [];
    const part1 = questions.filter((q) => q.part === 'PART_1');
    const part2 = questions.filter((q) => q.part === 'PART_2');
    const part3 = questions.filter((q) => q.part === 'PART_3');
    const part4 = questions.filter((q) => q.part === 'PART_4');

    // PHẦN I
    if (part1.length > 0) {
      docBody += createDocxParagraph('PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (3,0 điểm)', { bold: true, size: 12, color: '1E3A8A' });
      docBody += createDocxParagraph('Thí sinh trả lời từ câu 1 đến câu ' + part1.length + '. Mỗi câu hỏi thí sinh chỉ chọn một phương án.', { italic: true, size: 11 });

      part1.forEach((q, idx) => {
        docBody += createDocxParagraph(`Câu ${idx + 1}: ${q.content}`, { bold: true });
        if (q.options) {
          q.options.forEach((opt) => {
            const isCorrect = isTeacherKey && opt.id === q.correctOption;
            docBody += createDocxParagraph(`    ${opt.id}. ${opt.content}${isCorrect ? '  ◄ [ĐÁP ÁN ĐÚNG]' : ''}`, {
              bold: isCorrect,
              color: isCorrect ? '15803D' : undefined,
            });
          });
        }
        if (isTeacherKey && q.explanation) {
          docBody += createDocxParagraph(`    Lời giải chi tiết: ${q.explanation}`, { italic: true, color: '4B5563', size: 10 });
        }
      });
    }

    // PHẦN II
    if (part2.length > 0) {
      docBody += createDocxParagraph('PHẦN II. Câu trắc nghiệm đúng sai (4,0 điểm)', { bold: true, size: 12, color: '6B21A8' });
      docBody += createDocxParagraph('Thí sinh trả lời từ câu 1 đến câu ' + part2.length + '. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.', { italic: true, size: 11 });

      part2.forEach((q, idx) => {
        docBody += createDocxParagraph(`Câu ${idx + 1}: ${q.content}`, { bold: true });
        if (q.statements) {
          q.statements.forEach((stmt) => {
            const keyLabel = isTeacherKey ? (stmt.isCorrect ? '  ◄ [ĐÚNG]' : '  ◄ [SAI]') : '';
            docBody += createDocxParagraph(`    ${stmt.id}) ${stmt.content}${keyLabel}`, {
              color: isTeacherKey ? (stmt.isCorrect ? '15803D' : 'B91C1C') : undefined,
            });
          });
        }
        if (isTeacherKey && q.explanation) {
          docBody += createDocxParagraph(`    Lời giải chi tiết: ${q.explanation}`, { italic: true, color: '4B5563', size: 10 });
        }
      });
    }

    // PHẦN III
    if (part3.length > 0) {
      docBody += createDocxParagraph('PHẦN III. Câu trắc nghiệm trả lời ngắn (1,5 điểm)', { bold: true, size: 12, color: 'B45309' });
      docBody += createDocxParagraph('Thí sinh trả lời từ câu 1 đến câu ' + part3.length + '. Điền đáp số vào ô quy định.', { italic: true, size: 11 });

      part3.forEach((q, idx) => {
        docBody += createDocxParagraph(`Câu ${idx + 1}: ${q.content}`, { bold: true });
        if (isTeacherKey && q.shortAnswer) {
          docBody += createDocxParagraph(`    Đáp số: ${q.shortAnswer}`, { bold: true, color: '15803D' });
        } else {
          docBody += createDocxParagraph('    Đáp số: .....................................................', { italic: true });
        }
        if (isTeacherKey && q.explanation) {
          docBody += createDocxParagraph(`    Lời giải chi tiết: ${q.explanation}`, { italic: true, color: '4B5563', size: 10 });
        }
      });
    }

    // PHẦN IV
    if (part4.length > 0) {
      docBody += createDocxParagraph('PHẦN IV. Câu hỏi tự luận (1,5 điểm)', { bold: true, size: 12, color: 'BE123C' });
      docBody += createDocxParagraph('Thí sinh trình bày chi tiết các bước giải toán.', { italic: true, size: 11 });

      part4.forEach((q, idx) => {
        docBody += createDocxParagraph(`Câu ${idx + 1} (${q.points} điểm): ${q.content}`, { bold: true });
        if (isTeacherKey) {
          if (q.essayRubric) {
            docBody += createDocxParagraph(`    Biểu điểm chấm:\n${q.essayRubric}`, { italic: true, color: '1D4ED8', size: 10 });
          }
          if (q.explanation) {
            docBody += createDocxParagraph(`    Hướng dẫn giải chi tiết:\n${q.explanation}`, { italic: true, color: '4B5563', size: 10 });
          }
        } else {
          docBody += createDocxParagraph('    (Thí sinh làm bài vào giấy thi)\n\n\n\n', { italic: true });
        }
      });
    }

    // Footer signature
    docBody += createDocxParagraph('─────────── HẾT ───────────', { bold: true, align: 'center' });
    docBody += createDocxParagraph('Cán bộ coi thi không giải thích gì thêm.', { italic: true, align: 'center', size: 10 });

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          ${docBody}
          <w:sectPr>
            <w:pgSz w:w="11906" w:h="16838"/>
            <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/>
          </w:sectPr>
        </w:body>
      </w:document>`;

    zip.file('word/document.xml', documentXml);

    const blob = await zip.generateAsync({ type: 'blob' });
    const filename = `De_thi_Toan_${exam.grade}_${isTeacherKey ? 'DAP_AN_' : ''}${exam.title.slice(0, 30).replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')}.docx`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Export exam to standard Moodle XML format
   */
  exportToMoodleXml(exam: Exam): void {
    const questions = exam.questions || [];
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n`;

    // Category
    xml += `  <question type="category">\n    <category>\n      <text>$course$/Toan_${exam.grade}/${escapeXml(exam.title)}</text>\n    </category>\n  </question>\n`;

    questions.forEach((q, idx) => {
      const qName = `Câu ${idx + 1} (${q.part})`;
      const cleanContent = cleanMathForDocx(q.content);

      if (q.part === 'PART_1') {
        xml += `  <question type="multichoice">\n`;
        xml += `    <name><text>${escapeXml(qName)}</text></name>\n`;
        xml += `    <questiontext format="html"><text><![CDATA[<p>${cleanContent}</p>]]></text></questiontext>\n`;
        xml += `    <generalfeedback format="html"><text><![CDATA[<p>${q.explanation || ''}</p>]]></text></generalfeedback>\n`;
        xml += `    <defaultgrade>${q.points}</defaultgrade>\n`;
        xml += `    <single>true</single>\n`;
        xml += `    <shuffleanswers>true</shuffleanswers>\n`;
        xml += `    <answernumbering>ABCD</answernumbering>\n`;

        q.options?.forEach((opt) => {
          const isCorrect = opt.id === q.correctOption;
          const fraction = isCorrect ? 100 : 0;
          xml += `    <answer fraction="${fraction}" format="html">\n`;
          xml += `      <text><![CDATA[<p>${cleanMathForDocx(opt.content)}</p>]]></text>\n`;
          xml += `    </answer>\n`;
        });
        xml += `  </question>\n`;
      } else if (q.part === 'PART_2') {
        // True / False statements in Moodle XML
        q.statements?.forEach((stmt, sIdx) => {
          const stmtName = `Câu ${idx + 1}.${stmt.id}`;
          xml += `  <question type="truefalse">\n`;
          xml += `    <name><text>${escapeXml(stmtName)}</text></name>\n`;
          xml += `    <questiontext format="html"><text><![CDATA[<p><b>${cleanContent}</b></p><p>Ý ${stmt.id}) ${cleanMathForDocx(stmt.content)}</p>]]></text></questiontext>\n`;
          xml += `    <defaultgrade>0.25</defaultgrade>\n`;
          xml += `    <answer fraction="${stmt.isCorrect ? 100 : 0}"><text>true</text></answer>\n`;
          xml += `    <answer fraction="${!stmt.isCorrect ? 100 : 0}"><text>false</text></answer>\n`;
          xml += `  </question>\n`;
        });
      } else if (q.part === 'PART_3') {
        xml += `  <question type="shortanswer">\n`;
        xml += `    <name><text>${escapeXml(qName)}</text></name>\n`;
        xml += `    <questiontext format="html"><text><![CDATA[<p>${cleanContent}</p>]]></text></questiontext>\n`;
        xml += `    <defaultgrade>${q.points}</defaultgrade>\n`;
        xml += `    <usecase>0</usecase>\n`;
        xml += `    <answer fraction="100">\n`;
        xml += `      <text>${escapeXml(q.shortAnswer || '')}</text>\n`;
        xml += `      <feedback><text>Chính xác!</text></feedback>\n`;
        xml += `    </answer>\n`;
        xml += `  </question>\n`;
      } else if (q.part === 'PART_4') {
        xml += `  <question type="essay">\n`;
        xml += `    <name><text>${escapeXml(qName)}</text></name>\n`;
        xml += `    <questiontext format="html"><text><![CDATA[<p>${cleanContent}</p>]]></text></questiontext>\n`;
        xml += `    <defaultgrade>${q.points}</defaultgrade>\n`;
        xml += `    <responseformat>editor</responseformat>\n`;
        xml += `    <responserequired>1</responserequired>\n`;
        xml += `    <graderinfo format="html"><text><![CDATA[<p>${q.explanation || q.essayRubric || ''}</p>]]></text></graderinfo>\n`;
        xml += `  </question>\n`;
      }
    });

    xml += `</quiz>`;

    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const filename = `Moodle_XML_De_${exam.grade}_${exam.title.slice(0, 25).replace(/[^a-zA-Z0-9]/g, '_')}.xml`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Export exam to GIFT format (compatible with Moodle, Azota, vnEdu, K12Online)
   */
  exportToGift(exam: Exam): void {
    const questions = exam.questions || [];
    let gift = `// Đề thi: ${cleanMathForDocx(exam.title)}\n// GDPT 2018 - THPT Đức Hòa - Thầy Phan Quốc Cường\n\n`;

    questions.forEach((q, idx) => {
      const cleanContent = cleanMathForDocx(q.content).replace(/[{}]/g, '\\$&');

      if (q.part === 'PART_1' && q.options) {
        gift += `// Câu ${idx + 1} (Phần I: Trắc nghiệm 4 lựa chọn)\n`;
        gift += `::Câu ${idx + 1}:: ${cleanContent} {\n`;
        q.options.forEach((opt) => {
          const optText = cleanMathForDocx(opt.content).replace(/[{}]/g, '\\$&');
          const prefix = opt.id === q.correctOption ? '=' : '~';
          gift += `  ${prefix}${optText}\n`;
        });
        gift += `}\n\n`;
      } else if (q.part === 'PART_2' && q.statements) {
        q.statements.forEach((stmt) => {
          const stmtText = cleanMathForDocx(stmt.content).replace(/[{}]/g, '\\$&');
          gift += `// Câu ${idx + 1}.${stmt.id} (Phần II: Đúng/Sai)\n`;
          gift += `::Câu ${idx + 1}.${stmt.id}:: ${cleanContent} -> Ý ${stmt.id}) ${stmtText} {${stmt.isCorrect ? 'TRUE' : 'FALSE'}}\n\n`;
        });
      } else if (q.part === 'PART_3' && q.shortAnswer) {
        gift += `// Câu ${idx + 1} (Phần III: Trả lời ngắn)\n`;
        gift += `::Câu ${idx + 1}:: ${cleanContent} {=${q.shortAnswer.trim()}}\n\n`;
      } else if (q.part === 'PART_4') {
        gift += `// Câu ${idx + 1} (Phần IV: Tự luận)\n`;
        gift += `::Câu ${idx + 1}:: ${cleanContent} {}\n\n`;
      }
    });

    const blob = new Blob([gift], { type: 'text/plain;charset=utf-8' });
    const filename = `GIFT_De_${exam.grade}_${exam.title.slice(0, 25).replace(/[^a-zA-Z0-9]/g, '_')}.txt`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
