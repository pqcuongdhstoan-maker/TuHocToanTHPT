import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface ChapterData {
  id: string;
  grade: 10 | 11 | 12;
  order: number;
  code: string;
  title: string;
  description: string;
}

export interface LessonData {
  id: string;
  chapterId: string;
  grade: 10 | 11 | 12;
  order: number;
  title: string;
  theorySummary: string;
  isPublished: boolean;
}

export interface QuestionData {
  id: string;
  examId?: string;
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

export interface ExamData {
  id: string;
  lessonId?: string;
  chapterId?: string;
  grade: 10 | 11 | 12;
  title: string;
  description: string;
  type: 'practice' | 'mock_exam';
  timeMinutes: number;
  allowedClasses: string[];
  maxAttempts: number;
  isPublished: boolean;
  version: number;
  releaseAnswerMode: 'immediate' | 'after_deadline' | 'teacher_manual';
  deadline?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  questions: QuestionData[];
}

export interface UserData {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  studentCode?: string;
  email?: string;
  grade?: 10 | 11 | 12;
  className?: string;
  role: 'admin' | 'teacher' | 'student' | 'guest';
  avatarUrl?: string;
  status: 'active' | 'locked';
  mustChangePassword?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface SubmissionData {
  id: string;
  examId: string;
  userId: string;
  userName?: string;
  userClassName?: string;
  grade: 10 | 11 | 12;
  startedAt: string;
  submittedAt?: string;
  isFinished: boolean;
  timeSpentSeconds: number;
  answers: Record<string, { value: any; flagged?: boolean; updatedAt?: string }>;
  scores: {
    part1: number;
    part2: number;
    part3: number;
    part4: number;
    total: number;
    maxTotal: number;
  };
  part2GradingRule?: 'moet_standard' | 'linear_per_item';
  gradedBy?: string;
  feedback?: Record<string, string>;
  status: 'in_progress' | 'submitted' | 'graded';
}

export interface DatabaseSchema {
  users: UserData[];
  chapters: ChapterData[];
  lessons: LessonData[];
  exams: ExamData[];
  submissions: SubmissionData[];
  classes: string[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Simple password hashing helper
export function hashPassword(pwd: string): string {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

// Initial Database Seeding with verified SGK Kết nối tri thức với cuộc sống curriculum
function getInitialData(): DatabaseSchema {
  const adminPassword = hashPassword('password123');

  const users: UserData[] = [
    {
      id: 'u-admin-1',
      username: 'admin',
      passwordHash: adminPassword,
      fullName: 'Thầy Phan Quốc Cường',
      email: 'pqcuong.dhstoan@gmail.com',
      role: 'admin',
      status: 'active',
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'u-teacher-1',
      username: 'gv_minh',
      passwordHash: adminPassword,
      fullName: 'Thầy Nguyễn Văn Minh',
      email: 'nvminh@thptduchoa.edu.vn',
      role: 'teacher',
      status: 'active',
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'u-student-1',
      username: 'quan_12a1',
      passwordHash: adminPassword,
      fullName: 'Trần Minh Quân',
      studentCode: 'DH2026-001',
      email: 'tmquan@gmail.com',
      grade: 12,
      className: '12A1',
      role: 'student',
      status: 'active',
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'u-student-2',
      username: 'my_11b2',
      passwordHash: adminPassword,
      fullName: 'Lê Thảo My',
      studentCode: 'DH2026-045',
      grade: 11,
      className: '11B2',
      role: 'student',
      status: 'active',
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'u-student-3',
      username: 'ngan_10a3',
      passwordHash: adminPassword,
      fullName: 'Hoàng Kim Ngân',
      studentCode: 'DH2026-112',
      grade: 10,
      className: '10A3',
      role: 'student',
      status: 'active',
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
    },
  ];

  // Official Chapters (Kết nối tri thức với cuộc sống - GDPT 2018)
  const chapters: ChapterData[] = [
    // LỚP 10
    { id: 'c10-1', grade: 10, order: 1, code: 'CHƯƠNG I', title: 'Mệnh đề và tập hợp', description: 'Mệnh đề toán học, mệnh đề chứa biến, các phép toán trên tập hợp.' },
    { id: 'c10-2', grade: 10, order: 2, code: 'CHƯƠNG II', title: 'Bất phương trình và hệ bất phương trình bậc nhất hai ẩn', description: 'Biểu diễn miền nghiệm trên mặt phẳng tọa độ.' },
    { id: 'c10-3', grade: 10, order: 3, code: 'CHƯƠNG III', title: 'Hệ thức lượng trong tam giác', description: 'Định lí côsin, sin và công thức diện tích tam giác.' },
    { id: 'c10-4', grade: 10, order: 4, code: 'CHƯƠNG IV', title: 'Vectơ', description: 'Khái niệm, các phép toán vectơ và tích vô hướng.' },
    { id: 'c10-5', grade: 10, order: 5, code: 'CHƯƠNG V', title: 'Các số đặc trưng đo xu thế trung tâm và độ phân tán của mẫu số liệu không ghép nhóm', description: 'Số trung bình, trung vị, tứ phân vị, phương sai và độ lệch chuẩn.' },
    { id: 'c10-6', grade: 10, order: 6, code: 'CHƯƠNG VI', title: 'Hàm số, đồ thị và ứng dụng', description: 'Hàm số bậc hai, dấu của tam thức bậc hai.' },
    { id: 'c10-7', grade: 10, order: 7, code: 'CHƯƠNG VII', title: 'Phương pháp tọa độ trong mặt phẳng', description: 'Phương trình đường thẳng, đường tròn và ba đường conic.' },
    { id: 'c10-8', grade: 10, order: 8, code: 'CHƯƠNG VIII', title: 'Đại số tổ hợp', description: 'Quy tắc cộng, quy tắc nhân, hoán vị, chỉnh hợp, tổ hợp, nhị thức Newton.' },
    { id: 'c10-9', grade: 10, order: 9, code: 'CHƯƠNG IX', title: 'Tính xác suất theo định nghĩa cổ điển', description: 'Biến cố và xác suất của biến cố.' },

    // LỚP 11
    { id: 'c11-1', grade: 11, order: 1, code: 'CHƯƠNG I', title: 'Hàm số lượng giác và phương trình lượng giác', description: 'Giá trị lượng giác góc lượng giác, đồ thị và phương trình cơ bản.' },
    { id: 'c11-2', grade: 11, order: 2, code: 'CHƯƠNG II', title: 'Dãy số. Cấp số cộng và cấp số nhân', description: 'Số hạng tổng quát, tính chất, tổng n số hạng đầu tiên.' },
    { id: 'c11-3', grade: 11, order: 3, code: 'CHƯƠNG III', title: 'Giới hạn. Hàm số liên tục', description: 'Giới hạn dãy số, hàm số và định lí hàm số liên tục.' },
    { id: 'c11-4', grade: 11, order: 4, code: 'CHƯƠNG IV', title: 'Quan hệ song song trong không gian', description: 'Đường thẳng và mặt phẳng song song, phép chiếu song song.' },
    { id: 'c11-5', grade: 11, order: 5, code: 'CHƯƠNG V', title: 'Các số đặc trưng đo xu thế trung tâm cho mẫu số liệu ghép nhóm', description: 'Mốt, trung vị, tứ phân vị mẫu số liệu ghép nhóm.' },
    { id: 'c11-6', grade: 11, order: 6, code: 'CHƯƠNG VI', title: 'Hàm số mũ và hàm số lôgarit', description: 'Phép tính lũy thừa, hàm số mũ, lôgarit và phương trình mũ, log.' },
    { id: 'c11-7', grade: 11, order: 7, code: 'CHƯƠNG VII', title: 'Đạo hàm', description: 'Định nghĩa, quy tắc tính đạo hàm và ý nghĩa hình học tiếp tuyến.' },
    { id: 'c11-8', grade: 11, order: 8, code: 'CHƯƠNG VIII', title: 'Quan hệ vuông góc trong không gian', description: 'Góc giữa hai đường thẳng, đường thẳng vuông góc mặt phẳng, khoảng cách.' },
    { id: 'c11-9', grade: 11, order: 9, code: 'CHƯƠNG IX', title: 'Xác suất', description: 'Biến cố giao, quy tắc cộng và quy tắc nhân xác suất.' },

    // LỚP 12
    { id: 'c12-1', grade: 12, order: 1, code: 'CHƯƠNG I', title: 'Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số', description: 'Tính đơn điệu, cực trị, GTLN-GTNN, đường tiệm cận, khảo sát đồ thị.' },
    { id: 'c12-2', grade: 12, order: 2, code: 'CHƯƠNG II', title: 'Tọa độ của vectơ trong không gian', description: 'Vectơ trong không gian, hệ tọa độ Oxyz và các phép toán tọa độ.' },
    { id: 'c12-3', grade: 12, order: 3, code: 'CHƯƠNG III', title: 'Các số đặc trưng đo mức độ phân tán cho mẫu số liệu ghép nhóm', description: 'Khoảng biến thiên, khoảng tứ phân vị, phương sai, độ lệch chuẩn ghép nhóm.' },
    { id: 'c12-4', grade: 12, order: 4, code: 'CHƯƠNG IV', title: 'Nguyên hàm và tích phân', description: 'Khái niệm nguyên hàm, bảng nguyên hàm cơ bản, tích phân và ứng dụng diện tích, thể tích.' },
    { id: 'c12-5', grade: 12, order: 5, code: 'CHƯƠNG V', title: 'Phương pháp tọa độ trong không gian', description: 'Phương trình mặt phẳng, phương trình đường thẳng và phương trình mặt cầu.' },
    { id: 'c12-6', grade: 12, order: 6, code: 'CHƯƠNG VI', title: 'Xác suất có điều kiện', description: 'Xác suất có điều kiện, công thức xác suất toàn phần và công thức Bayes.' },
  ];

  // Official Lessons (subset of key lessons for rich learning experience)
  const lessons: LessonData[] = [
    // Lớp 10
    {
      id: 'l10-1',
      chapterId: 'c10-1',
      grade: 10,
      order: 1,
      title: 'Bài 1: Mệnh đề',
      theorySummary: '### 1. Mệnh đề toán học\n- Mệnh đề là một khẳng định đúng hoặc một khẳng định sai.\n- Một mệnh đề không thể vừa đúng vừa sai.\n\n### 2. Mệnh đề phủ định\n- Cho mệnh đề $P$. Mệnh đề phủ định của $P$ là $\\overline{P}$.\n- $\\overline{P}$ đúng khi $P$ sai, và sai khi $P$ đúng.',
      isPublished: true,
    },
    {
      id: 'l10-2',
      chapterId: 'c10-1',
      grade: 10,
      order: 2,
      title: 'Bài 2: Tập hợp và các phép toán trên tập hợp',
      theorySummary: '### 1. Các phép toán trên tập hợp\n- **Giao:** $A \\cap B = \\{x \\mid x \\in A \\text{ và } x \\in B\\}$\n- **Hợp:** $A \\cup B = \\{x \\mid x \\in A \\text{ hoặc } x \\in B\\}$\n- **Hiệu:** $A \\setminus B = \\{x \\mid x \\in A \\text{ và } x \\notin B\\}$',
      isPublished: true,
    },
    {
      id: 'l10-16',
      chapterId: 'c10-6',
      grade: 10,
      order: 1,
      title: 'Bài 16: Hàm số bậc hai',
      theorySummary: '### 1. Dạng hàm số bậc hai\n$$y = ax^2 + bx + c \\quad (a \\neq 0)$$\n- Tọa độ đỉnh parabol: $I\\left(-\\frac{b}{2a}; -\\frac{\\Delta}{4a}\\right)$\n- Trục đối xứng: đường thẳng $x = -\\frac{b}{2a}$\n- Bề lõm hướng lên nếu $a > 0$, hướng xuống nếu $a < 0$.',
      isPublished: true,
    },

    // Lớp 11
    {
      id: 'l11-1',
      chapterId: 'c11-1',
      grade: 11,
      order: 1,
      title: 'Bài 1: Giá trị lượng giác của góc lượng giác',
      theorySummary: '### 1. Các hệ thức cơ bản\n- $\\sin^2 \\alpha + \\cos^2 \\alpha = 1$\n- $1 + \\tan^2 \\alpha = \\frac{1}{\\cos^2 \\alpha} \\quad (\\alpha \\neq \\frac{\\pi}{2} + k\\pi)$\n- $\\tan \\alpha \\cdot \\cot \\alpha = 1$',
      isPublished: true,
    },
    {
      id: 'l11-7',
      chapterId: 'c11-7',
      grade: 11,
      order: 1,
      title: 'Bài 23: Đạo hàm và quy tắc tính đạo hàm',
      theorySummary: '### 1. Đạo hàm của hàm lũy thừa và sơ cấp\n- $(x^n)\' = n x^{n-1}$\n- $(\\sqrt{x})\' = \\frac{1}{2\\sqrt{x}}$\n- $(\\sin x)\' = \\cos x, \\quad (\\cos x)\' = -\\sin x$',
      isPublished: true,
    },

    // Lớp 12
    {
      id: 'l12-1',
      chapterId: 'c12-1',
      grade: 12,
      order: 1,
      title: 'Bài 1: Tính đơn điệu và cực trị của hàm số',
      theorySummary: '### 1. Điều kiện để hàm số đồng biến, nghịch biến\n- Cho hàm số $y = f(x)$ có đạo hàm trên khoảng $K$.\n- Nếu $f\'(x) > 0$ với mọi $x \\in K$ thì hàm số đồng biến trên $K$.\n- Nếu $f\'(x) < 0$ với mọi $x \\in K$ thì hàm số nghịch biến trên $K$.\n\n### 2. Cực trị của hàm số\n- Nếu $f\'(x)$ đổi dấu từ dương sang âm qua $x_0$ thì $x_0$ là điểm cực đại.\n- Nếu $f\'(x)$ đổi dấu từ âm sang dương qua $x_0$ thì $x_0$ là điểm cực tiểu.',
      isPublished: true,
    },
    {
      id: 'l12-2',
      chapterId: 'c12-1',
      grade: 12,
      order: 2,
      title: 'Bài 2: Giá trị lớn nhất và giá trị nhỏ nhất của hàm số',
      theorySummary: '### 1. Phương pháp tìm GTLN, GTNN trên đoạn $[a; b]$\n- Tính $f\'(x)$, giải $f\'(x) = 0$ tìm nghiệm $x_i \\in [a; b]$.\n- Tính các giá trị $f(a), f(b), f(x_i)$.\n- Số lớn nhất trong các giá trị trên là $\\max_{[a; b]} f(x)$, số nhỏ nhất là $\\min_{[a; b]} f(x)$.',
      isPublished: true,
    },
    {
      id: 'l12-3',
      chapterId: 'c12-1',
      grade: 12,
      order: 3,
      title: 'Bài 3: Đường tiệm cận của đồ thị hàm số',
      theorySummary: '### 1. Tiệm cận đứng\nĐường thẳng $x = x_0$ là tiệm cận đứng nếu ít nhất một trong các giới hạn sau xảy ra:\n$$\\lim_{x \\to x_0^+} f(x) = \\pm\\infty \\quad \\text{hoặc} \\quad \\lim_{x \\to x_0^-} f(x) = \\pm\\infty$$\n\n### 2. Tiệm cận ngang\nĐường thẳng $y = y_0$ là tiệm cận ngang nếu:\n$$\\lim_{x \\to +\\infty} f(x) = y_0 \\quad \\text{hoặc} \\quad \\lim_{x \\to -\\infty} f(x) = y_0$$\n\n### 3. Tiệm cận xiên\nĐường thẳng $y = ax + b \\, (a \\neq 0)$ là tiệm cận xiên nếu $\\lim_{x \\to \\pm\\infty} [f(x) - (ax + b)] = 0$.',
      isPublished: true,
    },
    {
      id: 'l12-4',
      chapterId: 'c12-4',
      grade: 12,
      order: 1,
      title: 'Bài 11: Nguyên hàm',
      theorySummary: '### 1. Bảng nguyên hàm cơ bản\n- $\\int x^\\alpha dx = \\frac{x^{\\alpha+1}}{\\alpha+1} + C \\quad (\\alpha \\neq -1)$\n- $\\int \\frac{1}{x} dx = \\ln|x| + C$\n- $\\int e^x dx = e^x + C$\n- $\\int \\cos x dx = \\sin x + C, \\quad \\int \\sin x dx = -\\cos x + C$',
      isPublished: true,
    },
    {
      id: 'l12-5',
      chapterId: 'c12-5',
      grade: 12,
      order: 1,
      title: 'Bài 14: Phương trình mặt phẳng',
      theorySummary: '### 1. Vectơ pháp tuyến và phương trình tổng quát\n- Vectơ $\\vec{n} = (A; B; C) \\neq \\vec{0}$ là VTPT của mặt phẳng $(P)$.\n- Phương trình mặt phẳng đi qua $M_0(x_0; y_0; z_0)$ có VTPT $\\vec{n}$ là:\n$$A(x - x_0) + B(y - y_0) + C(z - z_0) = 0$$\n- Dạng khai triển: $Ax + By + Cz + D = 0 \\quad (A^2 + B^2 + C^2 > 0)$',
      isPublished: true,
    },
  ];

  // Authentic 4-part Questions
  const sample12ExamQuestions: QuestionData[] = [
    // PHẦN I
    {
      id: 'q-12-1',
      part: 'PART_1',
      questionNumber: 1,
      content: 'Cho hàm số $y = f(x)$ có bảng biến thiên như sau. Mệnh đề nào dưới đây đúng?\n\nBiết rằng trên khoảng $(-\\infty; 2)$, hàm số có $f\'(x) > 0$; trên khoảng $(2; +\\infty)$, $f\'(x) < 0$.',
      points: 0.25,
      difficulty: 'NB',
      options: [
        { id: 'A', content: 'Hàm số đồng biến trên khoảng $(2; +\\infty)$.' },
        { id: 'B', content: 'Hàm số nghịch biến trên khoảng $(-\\infty; 2)$.' },
        { id: 'C', content: 'Hàm số đồng biến trên khoảng $(-\\infty; 2)$.' },
        { id: 'D', content: 'Hàm số nghịch biến trên khoảng $(-\\infty; +\\infty)$.' },
      ],
      correctOption: 'C',
      explanation: 'Vì $f\'(x) > 0$ với mọi $x \\in (-\\infty; 2)$ nên hàm số đồng biến trên khoảng $(-\\infty; 2)$.',
    },
    {
      id: 'q-12-2',
      part: 'PART_1',
      questionNumber: 2,
      content: 'Đường tiệm cận đứng của đồ thị hàm số $y = \\frac{2x - 1}{x + 3}$ là đường thẳng có phương trình:',
      points: 0.25,
      difficulty: 'NB',
      options: [
        { id: 'A', content: '$x = -3$' },
        { id: 'B', content: '$x = 3$' },
        { id: 'C', content: '$y = 2$' },
        { id: 'D', content: '$y = -3$' },
      ],
      correctOption: 'A',
      explanation: 'Nghiệm của mẫu số $x + 3 = 0 \\Leftrightarrow x = -3$. Tử số tại $x = -3$ bằng $2(-3) - 1 = -7 \\neq 0$. Do đó $x = -3$ là tiệm cận đứng.',
    },
    {
      id: 'q-12-3',
      part: 'PART_1',
      questionNumber: 3,
      content: 'Giá trị cực đại của hàm số $y = x^3 - 3x + 2$ là:',
      points: 0.25,
      difficulty: 'TH',
      options: [
        { id: 'A', content: '$y_{CĐ} = 4$' },
        { id: 'B', content: '$y_{CĐ} = 0$' },
        { id: 'C', content: '$x_{CĐ} = -1$' },
        { id: 'D', content: '$y_{CĐ} = 2$' },
      ],
      correctOption: 'A',
      explanation: 'Ta có $y\' = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$. Bảng xét dấu $y\'$ cho thấy hàm số đạt cực đại tại $x = -1$. Giá trị cực đại $y(-1) = (-1)^3 - 3(-1) + 2 = 4$.',
    },
    {
      id: 'q-12-4',
      part: 'PART_1',
      questionNumber: 4,
      content: 'Trong không gian $Oxyz$, cho mặt phẳng $(P): 2x - 3y + z - 5 = 0$. Một vectơ pháp tuyến của $(P)$ là:',
      points: 0.25,
      difficulty: 'NB',
      options: [
        { id: 'A', content: '$\\vec{n} = (2; -3; 1)$' },
        { id: 'B', content: '$\\vec{n} = (2; 3; 1)$' },
        { id: 'C', content: '$\\vec{n} = (2; -3; -5)$' },
        { id: 'D', content: '$\\vec{n} = (-2; 3; 1)$' },
      ],
      correctOption: 'A',
      explanation: 'Mặt phẳng $Ax + By + Cz + D = 0$ có VTPT $\\vec{n} = (A; B; C) = (2; -3; 1)$.',
    },

    // PHẦN II (Trắc nghiệm Đúng/Sai)
    {
      id: 'q-12-5',
      part: 'PART_2',
      questionNumber: 1,
      content: 'Cho hàm số $y = f(x) = \\frac{x^2 - 2x + 4}{x - 1}$. Xét tính đúng sai của các khẳng định sau:',
      points: 1.0,
      difficulty: 'VD',
      statements: [
        { id: 'a', content: 'Tập xác định của hàm số là $D = \\mathbb{R} \\setminus \\{1\\}$.', isCorrect: true },
        { id: 'b', content: 'Đồ thị hàm số có đường tiệm cận đứng là $x = 1$.', isCorrect: true },
        { id: 'c', content: 'Đồ thị hàm số có đường tiệm cận xiên là $y = x - 1$.', isCorrect: true },
        { id: 'd', content: 'Hàm số đồng biến trên toàn bộ tập xác định $D$.', isCorrect: false },
      ],
      explanation: '- Ý a: Mẫu số $x - 1 \\neq 0 \\Leftrightarrow x \\neq 1$. Đúng.\n- Ý b: $\\lim_{x \\to 1^+} f(x) = +\\infty$, tiệm cận đứng $x = 1$. Đúng.\n- Ý c: Ta có $f(x) = x - 1 + \\frac{3}{x - 1}$, do đó tiệm cận xiên là $y = x - 1$. Đúng.\n- Ý d: Đạo hàm $f\'(x) = 1 - \\frac{3}{(x-1)^2} = \\frac{x^2 - 2x - 2}{(x-1)^2}$. Phương trình $f\'(x) = 0$ có 2 nghiệm phân biệt nên hàm số không thể luôn đồng biến trên $D$. Sai.',
    },
    {
      id: 'q-12-6',
      part: 'PART_2',
      questionNumber: 2,
      content: 'Trong không gian $Oxyz$, cho điểm $A(1; 2; 3)$ và mặt phẳng $(P): x + 2y - 2z + 4 = 0$. Xét tính đúng sai của các mệnh đề:',
      points: 1.0,
      difficulty: 'TH',
      statements: [
        { id: 'a', content: 'Khoảng cách từ điểm $A$ đến mặt phẳng $(P)$ bằng $1$.', isCorrect: true },
        { id: 'b', content: 'Điểm $A$ thuộc mặt phẳng $(P)$.', isCorrect: false },
        { id: 'c', content: 'Đường thẳng đi qua $A$ vuông góc với $(P)$ có VTCP $\\vec{u} = (1; 2; -2)$.', isCorrect: true },
        { id: 'd', content: 'Mặt cầu tâm $A$ tiếp xúc với $(P)$ có bán kính $R = 3$.', isCorrect: false },
      ],
      explanation: '- Khoảng cách $d(A, (P)) = \\frac{|1 + 2(2) - 2(3) + 4|}{\\sqrt{1^2 + 2^2 + (-2)^2}} = \\frac{|3|}{3} = 1$.\n- Ý a: Đúng.\n- Ý b: $1 + 4 - 6 + 4 = 3 \\neq 0 \\Rightarrow A \\notin (P)$. Sai.\n- Ý c: VTCP $\\vec{u} = \\vec{n}_P = (1; 2; -2)$. Đúng.\n- Ý d: Tiếp xúc thì $R = d(A, (P)) = 1 \\neq 3$. Sai.',
    },

    // PHẦN III (Trả lời ngắn)
    {
      id: 'q-12-7',
      part: 'PART_3',
      questionNumber: 1,
      content: 'Tìm giá trị lớn nhất của hàm số $f(x) = x^3 - 3x^2 + 2$ trên đoạn $[0; 3]$.',
      points: 0.5,
      difficulty: 'TH',
      shortAnswer: '2',
      tolerance: 0,
      roundingRule: 'Nhập số nguyên',
      explanation: 'Ta có $f\'(x) = 3x^2 - 6x = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$ (cả hai đều thuộc $[0; 3]$).\nTính: $f(0) = 2$, $f(2) = -2$, $f(3) = 2$.\nVậy giá trị lớn nhất bằng $2$.',
    },
    {
      id: 'q-12-8',
      part: 'PART_3',
      questionNumber: 2,
      content: 'Một vật thể chuyển động với vận tốc $v(t) = 3t^2 + 2t$ (m/s). Quãng đường vật thể đi được từ thời điểm $t = 0$ đến $t = 3$ giây bằng bao nhiêu mét?',
      points: 0.5,
      difficulty: 'VD',
      shortAnswer: '36',
      tolerance: 0,
      roundingRule: 'Nhập số nguyên',
      explanation: 'Quãng đường $s = \\int_0^3 (3t^2 + 2t) dt = [t^3 + t^2]_0^3 = (27 + 9) - 0 = 36\\text{ m}$.',
    },

    // PHẦN IV (Tự luận)
    {
      id: 'q-12-9',
      part: 'PART_4',
      questionNumber: 1,
      content: 'Cho hàm số $y = -x^3 + 3x^2 - 2$ có đồ thị là $(C)$.\na) Khảo sát sự biến thiên và vẽ đồ thị $(C)$.\nb) Viết phương trình tiếp tuyến của $(C)$ tại điểm có hoành độ $x_0 = 2$.',
      points: 2.0,
      difficulty: 'VD',
      essayRubric: '- Khảo sát đầy đủ TXĐ, đạo hàm, chiều biến thiên, điểm cực trị: 1.0 điểm\n- Vẽ đồ thị chính xác các điểm đặc biệt: 0.5 điểm\n- Viết đúng phương trình tiếp tuyến $y = -2$: 0.5 điểm',
      explanation: '1. $y\' = -3x^2 + 6x = 0 \\Leftrightarrow x = 0$ (cực tiểu $y = -2$) hoặc $x = 2$ (cực đại $y = 2$).\n2. Tại $x_0 = 2$, ta có $y(2) = 2$ và hệ số góc $k = y\'(2) = 0$. Phương trình tiếp tuyến là $y - 2 = 0(x - 2) \\Leftrightarrow y = 2$.',
    },
  ];

  // Practice Exam for Grade 10 Parabola
  const sample10ExamQuestions: QuestionData[] = [
    {
      id: 'q-10-1',
      part: 'PART_1',
      questionNumber: 1,
      content: 'Đỉnh của parabol $y = x^2 - 4x + 3$ có tọa độ là:',
      points: 0.25,
      difficulty: 'NB',
      options: [
        { id: 'A', content: '$(1; -2)$' },
        { id: 'B', content: '$(2; -1)$' },
        { id: 'C', content: '$(-2; 1)$' },
        { id: 'D', content: '$(4; 3)$' },
      ],
      correctOption: 'B',
      explanation: 'Hoành độ đỉnh $x = -\\frac{b}{2a} = -\\frac{-4}{2(1)} = 2$. Thay vào hàm số: $y = 2^2 - 4(2) + 3 = -1$. Vậy đỉnh $I(2; -1)$.',
    },
    {
      id: 'q-10-2',
      part: 'PART_1',
      questionNumber: 2,
      content: 'Trục đối xứng của parabol $y = -2x^2 + 4x - 1$ là đường thẳng:',
      points: 0.25,
      difficulty: 'NB',
      options: [
        { id: 'A', content: '$x = 1$' },
        { id: 'B', content: '$x = -1$' },
        { id: 'C', content: '$y = 1$' },
        { id: 'D', content: '$x = 2$' },
      ],
      correctOption: 'A',
      explanation: 'Trục đối xứng $x = -\\frac{b}{2a} = -\\frac{4}{2(-2)} = 1$.',
    },
    {
      id: 'q-10-3',
      part: 'PART_2',
      questionNumber: 1,
      content: 'Cho tam thức bậc hai $f(x) = x^2 - 5x + 6$. Xét tính đúng sai của các mệnh đề sau:',
      points: 1.0,
      difficulty: 'TH',
      statements: [
        { id: 'a', content: 'Tam thức có hai nghiệm phân biệt là $x_1 = 2$ và $x_2 = 3$.', isCorrect: true },
        { id: 'b', content: '$f(x) > 0$ khi và chỉ khi $x \\in (2; 3)$.', isCorrect: false },
        { id: 'c', content: '$f(x) < 0$ khi và chỉ khi $x \\in (2; 3)$.', isCorrect: true },
        { id: 'd', content: '$f(0) = 6 > 0$.', isCorrect: true },
      ],
      explanation: '- Nghiệm $x^2 - 5x + 6 = 0 \\Leftrightarrow x = 2$ hoặc $x = 3$. Ý a đúng.\n- Hệ số $a = 1 > 0$, theo quy tắc "trong trái ngoài cùng": $f(x) < 0$ với $x \\in (2; 3)$ và $f(x) > 0$ với $x \\in (-\\infty; 2) \\cup (3; +\\infty)$. Do đó ý b sai, ý c đúng.\n- $f(0) = 6 > 0$ đúng.',
    },
    {
      id: 'q-10-4',
      part: 'PART_3',
      questionNumber: 1,
      content: 'Biết đồ thị hàm số $y = ax^2 + bx + c$ đi qua điểm $A(0; 1)$, $B(1; 2)$ và $C(2; 7)$. Tính giá trị của biểu thức $T = a + b + c$.',
      points: 0.5,
      difficulty: 'VD',
      shortAnswer: '2',
      tolerance: 0,
      roundingRule: 'Nhập số nguyên',
      explanation: 'Vì đồ thị đi qua $B(1; 2)$ nên $a(1)^2 + b(1) + c = 2 \\Leftrightarrow a + b + c = 2$.',
    },
  ];

  const exams: ExamData[] = [
    {
      id: 'exam-12-mock-1',
      lessonId: 'l12-1',
      chapterId: 'c12-1',
      grade: 12,
      title: 'Đề thi thử THPT Quốc gia 2026 - Môn Toán (Chuẩn cấu trúc GDPT 2018 - Đề số 01)',
      description: 'Đề thi thử tổng hợp 4 phần theo quy chuẩn mới nhất của Bộ GD&ĐT: Trắc nghiệm 4 phương án, Trắc nghiệm Đúng/Sai, Trả lời ngắn và Tự luận.',
      type: 'mock_exam',
      timeMinutes: 90,
      allowedClasses: [],
      maxAttempts: 3,
      isPublished: true,
      version: 1,
      releaseAnswerMode: 'immediate',
      createdBy: 'u-admin-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: sample12ExamQuestions,
    },
    {
      id: 'exam-12-practice-1',
      lessonId: 'l12-1',
      chapterId: 'c12-1',
      grade: 12,
      title: 'Luyện tập: Tính đơn điệu và cực trị hàm số (Đề số 01)',
      description: 'Hệ thống câu hỏi rèn luyện kỹ năng tìm khoảng đơn điệu, điểm cực đại, cực tiểu của hàm số.',
      type: 'practice',
      timeMinutes: 45,
      allowedClasses: [],
      maxAttempts: 99,
      isPublished: true,
      version: 1,
      releaseAnswerMode: 'immediate',
      createdBy: 'u-admin-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: sample12ExamQuestions.slice(0, 6),
    },
    {
      id: 'exam-10-practice-1',
      lessonId: 'l10-16',
      chapterId: 'c10-6',
      grade: 10,
      title: 'Luyện tập: Hàm số bậc hai & đồ thị parabol',
      description: 'Đề rèn luyện xác định tọa độ đỉnh, trục đối xứng, dấu tam thức bậc hai theo SGK Kết nối tri thức.',
      type: 'practice',
      timeMinutes: 40,
      allowedClasses: [],
      maxAttempts: 99,
      isPublished: true,
      version: 1,
      releaseAnswerMode: 'immediate',
      createdBy: 'u-admin-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: sample10ExamQuestions,
    },
  ];

  // Initial mock submission for student1 to populate stats
  const submissions: SubmissionData[] = [
    {
      id: 'sub-1',
      examId: 'exam-12-practice-1',
      userId: 'u-student-1',
      userName: 'Trần Minh Quân',
      userClassName: '12A1',
      grade: 12,
      startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      submittedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      isFinished: true,
      timeSpentSeconds: 1800,
      answers: {
        'q-12-1': { value: 'C' },
        'q-12-2': { value: 'A' },
        'q-12-3': { value: 'A' },
        'q-12-4': { value: 'A' },
        'q-12-5': { value: { a: true, b: true, c: true, d: false } },
      },
      scores: {
        part1: 1.0,
        part2: 1.0,
        part3: 0,
        part4: 0,
        total: 2.0,
        maxTotal: 2.0,
      },
      status: 'submitted',
    },
  ];

  const classes = ['10A1', '10A2', '10A3', '11B1', '11B2', '11B3', '12A1', '12A2', '12TN1'];

  return {
    users,
    chapters,
    lessons,
    exams,
    submissions,
    classes,
  };
}

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDirectory();
    this.data = this.loadData();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.error('Error reading db.json, seeding initial data:', e);
    }

    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  public saveData(data?: DatabaseSchema) {
    if (data) this.data = data;
    try {
      this.ensureDataDirectory();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing db.json:', err);
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  // Users
  public getUsers(): UserData[] {
    return this.data.users;
  }

  public getUserById(id: string): UserData | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByUsername(username: string): UserData | undefined {
    return this.data.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() || (u.email && u.email.toLowerCase() === username.toLowerCase())
    );
  }

  public addUser(user: UserData) {
    this.data.users.push(user);
    this.saveData();
  }

  public updateUser(id: string, updates: Partial<UserData>) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.saveData();
      return this.data.users[idx];
    }
    return null;
  }

  // Curriculum
  public getChapters(grade?: number): ChapterData[] {
    if (grade) {
      return this.data.chapters.filter((c) => c.grade === Number(grade));
    }
    return this.data.chapters;
  }

  public getLessons(chapterId?: string, grade?: number): LessonData[] {
    let list = this.data.lessons;
    if (chapterId) list = list.filter((l) => l.chapterId === chapterId);
    if (grade) list = list.filter((l) => l.grade === Number(grade));
    return list;
  }

  public addChapter(chapter: ChapterData) {
    this.data.chapters.push(chapter);
    this.saveData();
  }

  public addLesson(lesson: LessonData) {
    this.data.lessons.push(lesson);
    this.saveData();
  }

  public updateLesson(id: string, updates: Partial<LessonData>) {
    const idx = this.data.lessons.findIndex((l) => l.id === id);
    if (idx !== -1) {
      this.data.lessons[idx] = { ...this.data.lessons[idx], ...updates };
      this.saveData();
      return this.data.lessons[idx];
    }
    return null;
  }

  // Exams
  public getExams(filters?: { grade?: number; lessonId?: string; type?: string }): ExamData[] {
    let list = this.data.exams;
    if (filters?.grade) list = list.filter((e) => e.grade === Number(filters.grade));
    if (filters?.lessonId) list = list.filter((e) => e.lessonId === filters.lessonId);
    if (filters?.type) list = list.filter((e) => e.type === filters.type);
    return list;
  }

  public getExamById(id: string): ExamData | undefined {
    return this.data.exams.find((e) => e.id === id);
  }

  public addExam(exam: ExamData) {
    this.data.exams.push(exam);
    this.saveData();
  }

  public updateExam(id: string, updates: Partial<ExamData>) {
    const idx = this.data.exams.findIndex((e) => e.id === id);
    if (idx !== -1) {
      this.data.exams[idx] = { ...this.data.exams[idx], ...updates, updatedAt: new Date().toISOString() };
      this.saveData();
      return this.data.exams[idx];
    }
    return null;
  }

  public deleteExam(id: string) {
    this.data.exams = this.data.exams.filter((e) => e.id !== id);
    this.saveData();
  }

  // Submissions
  public getSubmissions(filters?: { userId?: string; examId?: string }): SubmissionData[] {
    let list = this.data.submissions;
    if (filters?.userId) list = list.filter((s) => s.userId === filters.userId);
    if (filters?.examId) list = list.filter((s) => s.examId === filters.examId);
    return list;
  }

  public getSubmissionById(id: string): SubmissionData | undefined {
    return this.data.submissions.find((s) => s.id === id);
  }

  public saveSubmission(submission: SubmissionData) {
    const idx = this.data.submissions.findIndex((s) => s.id === submission.id);
    if (idx !== -1) {
      this.data.submissions[idx] = submission;
    } else {
      this.data.submissions.push(submission);
    }
    this.saveData();
  }

  // Classes
  public getClasses(): string[] {
    return this.data.classes;
  }

  public addClass(className: string) {
    if (!this.data.classes.includes(className)) {
      this.data.classes.push(className);
      this.saveData();
    }
  }
}

export const db = new DatabaseManager();
