import { Chapter, Lesson, Exam, Submission, User, GradeLevel } from '../types';

const STORAGE_KEYS = {
  EXAMS: 'beedemy_exams_v1',
  SUBMISSIONS: 'beedemy_submissions_v1',
  USER: 'beedemy_current_user_v1',
  ARENA_HIGHSCORES: 'beedemy_arena_scores_v1',
};

// Default seed data for offline & Vercel deployment
const SEED_CHAPTERS: Chapter[] = [
  // LỚP 10
  { id: 'c10-1', grade: 10, order: 1, code: 'CHƯƠNG I', title: 'Mệnh đề và tập hợp', description: 'Mệnh đề toán học, mệnh đề chứa biến, các phép toán trên tập hợp.' },
  { id: 'c10-2', grade: 10, order: 2, code: 'CHƯƠNG II', title: 'Bất phương trình và hệ bất phương trình bậc nhất hai ẩn', description: 'Biểu diễn miền nghiệm trên mặt phẳng tọa độ.' },
  { id: 'c10-3', grade: 10, order: 3, code: 'CHƯƠNG III', title: 'Hệ thức lượng trong tam giác', description: 'Định lí côsin, sin và công thức diện tích tam giác.' },
  { id: 'c10-4', grade: 10, order: 4, code: 'CHƯƠNG IV', title: 'Vectơ', description: 'Khái niệm, các phép toán vectơ và tích vô hướng.' },
  { id: 'c10-6', grade: 10, order: 6, code: 'CHƯƠNG VI', title: 'Hàm số, đồ thị và ứng dụng', description: 'Hàm số bậc hai, dấu của tam thức bậc hai.' },

  // LỚP 11
  { id: 'c11-1', grade: 11, order: 1, code: 'CHƯƠNG I', title: 'Hàm số lượng giác và phương trình lượng giác', description: 'Giá trị lượng giác góc lượng giác, đồ thị và phương trình cơ bản.' },
  { id: 'c11-2', grade: 11, order: 2, code: 'CHƯƠNG II', title: 'Dãy số. Cấp số cộng và cấp số nhân', description: 'Số hạng tổng quát, tính chất, tổng n số hạng đầu tiên.' },
  { id: 'c11-7', grade: 11, order: 7, code: 'CHƯƠNG VII', title: 'Đạo hàm', description: 'Định nghĩa, quy tắc tính đạo hàm và ý nghĩa hình học tiếp tuyến.' },

  // LỚP 12
  { id: 'c12-1', grade: 12, order: 1, code: 'CHƯƠNG I', title: 'Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số', description: 'Tính đơn điệu, cực trị, GTLN-GTNN, đường tiệm cận, khảo sát đồ thị.' },
  { id: 'c12-2', grade: 12, order: 2, code: 'CHƯƠNG II', title: 'Tọa độ của vectơ trong không gian', description: 'Vectơ trong không gian, hệ tọa độ Oxyz và các phép toán tọa độ.' },
  { id: 'c12-4', grade: 12, order: 4, code: 'CHƯƠNG IV', title: 'Nguyên hàm và tích phân', description: 'Khái niệm nguyên hàm, bảng nguyên hàm cơ bản, tích phân và ứng dụng diện tích, thể tích.' },
  { id: 'c12-5', grade: 12, order: 5, code: 'CHƯƠNG V', title: 'Phương pháp tọa độ trong không gian', description: 'Phương trình mặt phẳng, phương trình đường thẳng và phương trình mặt cầu.' },
];

const SEED_LESSONS: Lesson[] = [
  {
    id: 'l10-1',
    chapterId: 'c10-1',
    grade: 10,
    order: 1,
    title: 'Bài 1: Mệnh đề',
    theorySummary: '### 1. Mệnh đề toán học\n- Mệnh đề là một khẳng định đúng hoặc một khẳng định sai.\n- Một mệnh đề không thể vừa đúng vừa sai.\n\n### 2. Mệnh đề phủ định\n- Cho mệnh đề $P$. Mệnh đề phủ định của $P$ là $\\overline{P}$.\n- $\\overline{P}$ đúng khi $P$ sai, và sai khi $P$ đúng.',
    isPublished: true,
    examCount: 1,
  },
  {
    id: 'l10-16',
    chapterId: 'c10-6',
    grade: 10,
    order: 1,
    title: 'Bài 16: Hàm số bậc hai và Parabol',
    theorySummary: '### 1. Dạng hàm số bậc hai\n$$y = ax^2 + bx + c \\quad (a \\neq 0)$$\n- Tọa độ đỉnh parabol: $I\\left(-\\frac{b}{2a}; -\\frac{\\Delta}{4a}\\right)$\n- Trục đối xứng: đường thẳng $x = -\\frac{b}{2a}$\n- Bề lõm hướng lên nếu $a > 0$, hướng xuống nếu $a < 0$.',
    isPublished: true,
    examCount: 1,
  },
  {
    id: 'l11-1',
    chapterId: 'c11-1',
    grade: 11,
    order: 1,
    title: 'Bài 1: Giá trị lượng giác của góc lượng giác',
    theorySummary: '### 1. Các hệ thức cơ bản\n- $\\sin^2 \\alpha + \\cos^2 \\alpha = 1$\n- $1 + \\tan^2 \\alpha = \\frac{1}{\\cos^2 \\alpha} \\quad (\\alpha \\neq \\frac{\\pi}{2} + k\\pi)$\n- $\\tan \\alpha \\cdot \\cot \\alpha = 1$',
    isPublished: true,
    examCount: 1,
  },
  {
    id: 'l11-7',
    chapterId: 'c11-7',
    grade: 11,
    order: 1,
    title: 'Bài 23: Đạo hàm và quy tắc tính đạo hàm',
    theorySummary: '### 1. Đạo hàm của hàm lũy thừa và sơ cấp\n- $(x^n)\' = n x^{n-1}$\n- $(\\sqrt{x})\' = \\frac{1}{2\\sqrt{x}}$\n- $(\\sin x)\' = \\cos x, \\quad (\\cos x)\' = -\\sin x$',
    isPublished: true,
    examCount: 1,
  },
  {
    id: 'l12-1',
    chapterId: 'c12-1',
    grade: 12,
    order: 1,
    title: 'Bài 1: Tính đơn điệu và cực trị của hàm số',
    theorySummary: '### 1. Điều kiện để hàm số đồng biến, nghịch biến\n- Cho hàm số $y = f(x)$ có đạo hàm trên khoảng $K$.\n- Nếu $f\'(x) > 0$ với mọi $x \\in K$ thì hàm số đồng biến trên $K$.\n- Nếu $f\'(x) < 0$ với mọi $x \\in K$ thì hàm số nghịch biến trên $K$.\n\n### 2. Cực trị của hàm số\n- Nếu $f\'(x)$ đổi dấu từ dương sang âm qua $x_0$ thì $x_0$ là điểm cực đại.\n- Nếu $f\'(x)$ đổi dấu từ âm sang dương qua $x_0$ thì $x_0$ là điểm cực tiểu.',
    isPublished: true,
    examCount: 2,
  },
  {
    id: 'l12-3',
    chapterId: 'c12-1',
    grade: 12,
    order: 3,
    title: 'Bài 3: Đường tiệm cận của đồ thị hàm số',
    theorySummary: '### 1. Tiệm cận đứng\nĐường thẳng $x = x_0$ là tiệm cận đứng nếu ít nhất một trong các giới hạn sau xảy ra:\n$$\\lim_{x \\to x_0^+} f(x) = \\pm\\infty \\quad \\text{hoặc} \\quad \\lim_{x \\to x_0^-} f(x) = \\pm\\infty$$\n\n### 2. Tiệm cận ngang\nĐường thẳng $y = y_0$ là tiệm cận ngang nếu:\n$$\\lim_{x \\to +\\infty} f(x) = y_0 \\quad \\text{hoặc} \\quad \\lim_{x \\to -\\infty} f(x) = y_0$$\n\n### 3. Tiệm cận xiên\nĐường thẳng $y = ax + b \\, (a \\neq 0)$ là tiệm cận xiên nếu $\\lim_{x \\to \\pm\\infty} [f(x) - (ax + b)] = 0$.',
    isPublished: true,
    examCount: 1,
  },
  {
    id: 'l12-5',
    chapterId: 'c12-5',
    grade: 12,
    order: 1,
    title: 'Bài 14: Phương trình mặt phẳng và tọa độ Oxyz',
    theorySummary: '### 1. Vectơ pháp tuyến và phương trình tổng quát\n- Vectơ $\\vec{n} = (A; B; C) \\neq \\vec{0}$ là VTPT của mặt phẳng $(P)$.\n- Phương trình mặt phẳng đi qua $M_0(x_0; y_0; z_0)$ có VTPT $\\vec{n}$ là:\n$$A(x - x_0) + B(y - y_0) + C(z - z_0) = 0$$\n- Dạng khai triển: $Ax + By + Cz + D = 0 \\quad (A^2 + B^2 + C^2 > 0)$',
    isPublished: true,
    examCount: 1,
  },
];

const SEED_EXAMS: Exam[] = [
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
    createdBy: 'Thầy Phan Quốc Cường',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
      {
        id: 'q-12-1',
        part: 'PART_1',
        questionNumber: 1,
        content: 'Cho hàm số $y = f(x)$ có bảng biến thiên như sau. Biết rằng trên khoảng $(-\\infty; 2)$, hàm số có $f\'(x) > 0$; trên khoảng $(2; +\\infty)$, $f\'(x) < 0$. Mệnh đề nào dưới đây đúng?',
        points: 0.25,
        difficulty: 'NB',
        options: [
          { id: 'A', content: 'Hàm số đồng biến trên khoảng $(2; +\\infty)$.' },
          { id: 'B', content: 'Hàm số nghịch biến trên khoảng $(-\\infty; 2)$.' },
          { id: 'C', content: 'Hàm số đồng biến trên khoảng $(-\\infty; 2)$.' },
          { id: 'D', content: 'Hàm số nghịch biến trên toàn trục số.' },
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
        explanation: 'Nghiệm của mẫu số $x + 3 = 0 \\Leftrightarrow x = -3$. Tử số tại $x = -3$ bằng $-7 \\neq 0$. Do đó $x = -3$ là tiệm cận đứng.',
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
        explanation: 'Ta có $y\' = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$. Bảng xét dấu $y\'$ cho thấy hàm số đạt cực đại tại $x = -1$. Khi đó $y(-1) = (-1)^3 - 3(-1) + 2 = 4$.',
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
        explanation: 'Mặt phẳng tổng quát $Ax + By + Cz + D = 0$ có VTPT $\\vec{n} = (A; B; C) = (2; -3; 1)$.',
      },
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
        explanation: '- Ý a: $x - 1 \\neq 0 \\Leftrightarrow x \\neq 1$. Đúng.\n- Ý b: $\\lim_{x \\to 1^+} f(x) = +\\infty$, TC đứng $x = 1$. Đúng.\n- Ý c: $f(x) = x - 1 + \\frac{3}{x - 1}$, TC xiên $y = x - 1$. Đúng.\n- Ý d: Đạo hàm có nghiệm nên hàm số không đồng biến trên toàn TXĐ. Sai.',
      },
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
        explanation: 'Ta có $f\'(x) = 3x^2 - 6x = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$. Tính $f(0) = 2, f(2) = -2, f(3) = 2$. Vậy GTLN bằng 2.',
      },
      {
        id: 'q-12-9',
        part: 'PART_4',
        questionNumber: 1,
        content: 'Cho hàm số $y = -x^3 + 3x^2 - 2$ có đồ thị là $(C)$.\na) Khảo sát sự biến thiên và vẽ đồ thị $(C)$.\nb) Viết phương trình tiếp tuyến của $(C)$ tại điểm có hoành độ $x_0 = 2$.',
        points: 2.0,
        difficulty: 'VD',
        essayRubric: '- Khảo sát đầy đủ TXĐ, đạo hàm, chiều biến thiên, điểm cực trị: 1.0 điểm\n- Vẽ đồ thị chính xác các điểm đặc biệt: 0.5 điểm\n- Viết đúng phương trình tiếp tuyến $y = 2$: 0.5 điểm',
        explanation: '1. $y\' = -3x^2 + 6x = 0 \\Leftrightarrow x = 0$ ($y = -2$) hoặc $x = 2$ ($y = 2$).\n2. Tại $x_0 = 2$, $y(2) = 2$, $k = y\'(2) = 0$. Phương trình tiếp tuyến là $y = 2$.',
      },
    ],
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
    createdBy: 'Thầy Phan Quốc Cường',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: [
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
        explanation: 'Hoành độ đỉnh $x = -b / (2a) = 2$. Thay vào hàm số: $y = 2^2 - 4(2) + 3 = -1$. Đỉnh $I(2; -1)$.',
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
        explanation: 'Trục đối xứng $x = -b / (2a) = -4 / (-4) = 1$.',
      },
    ],
  },
];

class ClientDataService {
  // Check if server is running
  private async checkOnline(): Promise<boolean> {
    try {
      const res = await fetch('/api/health', { method: 'GET', signal: AbortSignal.timeout(1200) });
      return res.ok;
    } catch {
      return false;
    }
  }

  // Chapters
  public async getChapters(grade?: GradeLevel): Promise<Chapter[]> {
    try {
      const isOnline = await this.checkOnline();
      if (isOnline) {
        const url = grade ? `/api/curriculum/chapters?grade=${grade}` : '/api/curriculum/chapters';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          return data.chapters;
        }
      }
    } catch {
      // Fallback
    }

    if (grade) {
      return SEED_CHAPTERS.filter((c) => c.grade === grade);
    }
    return SEED_CHAPTERS;
  }

  // Lessons
  public async getLessons(grade?: GradeLevel, chapterId?: string): Promise<Lesson[]> {
    try {
      const isOnline = await this.checkOnline();
      if (isOnline) {
        const params = new URLSearchParams();
        if (grade) params.set('grade', String(grade));
        if (chapterId) params.set('chapterId', chapterId);
        const res = await fetch(`/api/curriculum/lessons?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          return data.lessons;
        }
      }
    } catch {
      // Fallback
    }

    let list = SEED_LESSONS;
    if (grade) list = list.filter((l) => l.grade === grade);
    if (chapterId) list = list.filter((l) => l.chapterId === chapterId);
    return list;
  }

  // Exams
  public async getExams(filters?: { grade?: GradeLevel; type?: string; lessonId?: string }): Promise<Exam[]> {
    try {
      const isOnline = await this.checkOnline();
      if (isOnline) {
        const params = new URLSearchParams();
        if (filters?.grade) params.set('grade', String(filters.grade));
        if (filters?.type) params.set('type', filters.type);
        if (filters?.lessonId) params.set('lessonId', filters.lessonId);
        const res = await fetch(`/api/exams?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          return data.exams;
        }
      }
    } catch {
      // Fallback
    }

    // Load from LocalStorage
    let exams = this.getLocalExams();
    if (filters?.grade) exams = exams.filter((e) => e.grade === filters.grade);
    if (filters?.type) exams = exams.filter((e) => e.type === filters.type);
    if (filters?.lessonId) exams = exams.filter((e) => e.lessonId === filters.lessonId);
    return exams;
  }

  public async getExamById(id: string): Promise<Exam | undefined> {
    try {
      const isOnline = await this.checkOnline();
      if (isOnline) {
        const res = await fetch(`/api/exams/${id}`);
        if (res.ok) {
          const data = await res.json();
          return data.exam;
        }
      }
    } catch {
      // Fallback
    }

    const exams = this.getLocalExams();
    return exams.find((e) => e.id === id);
  }

  public getLocalExams(): Exam[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EXAMS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('LocalStorage read error:', e);
    }
    // Seed initial exams
    this.saveLocalExams(SEED_EXAMS);
    return SEED_EXAMS;
  }

  public saveLocalExams(exams: Exam[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    } catch (e) {
      console.warn('LocalStorage write error:', e);
    }
  }

  public addLocalExam(exam: Exam) {
    const list = this.getLocalExams();
    list.unshift(exam);
    this.saveLocalExams(list);
  }

  // Submissions
  public async getSubmissions(userId?: string): Promise<Submission[]> {
    try {
      const isOnline = await this.checkOnline();
      if (isOnline) {
        const url = userId ? `/api/stats/submissions?userId=${userId}` : '/api/stats/submissions';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          return data.submissions;
        }
      }
    } catch {
      // Fallback
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      if (raw) {
        const list: Submission[] = JSON.parse(raw);
        return userId ? list.filter((s) => s.userId === userId) : list;
      }
    } catch {}
    return [];
  }

  public saveLocalSubmission(submission: Submission) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      const list: Submission[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((s) => s.id === submission.id);
      if (idx !== -1) {
        list[idx] = submission;
      } else {
        list.unshift(submission);
      }
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed saving submission to LocalStorage', e);
    }
  }
}

export const clientDataService = new ClientDataService();
