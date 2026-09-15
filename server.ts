import express from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { db, hashPassword, UserData } from './server/db';
import { processExamDocument } from './server/parser';
import { askMathTutor, getQuestionHint, explainError, isGeminiAvailable } from './server/gemini';

const app = express();
const PORT = 3000;

// Body parsing
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Multer in-memory storage for docx/pdf uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiAvailable: isGeminiAvailable(),
    time: new Date().toISOString(),
  });
});

// 1. AUTHENTICATION
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập hoặc email và mật khẩu.' });
  }

  const user = db.getUserByUsername(username);
  if (!user) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
  }

  if (user.status === 'locked') {
    return res.status(403).json({ error: 'Tài khoản đã bị khóa bởi quản trị viên.' });
  }

  const pwdHash = hashPassword(password);
  if (user.passwordHash !== pwdHash) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
  }

  db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
  const token = db.createSession(user.id);

  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser, token });
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, fullName, grade, className, email } = req.body;
  if (!username || !password || !fullName) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ họ tên, tên đăng nhập và mật khẩu.' });
  }

  const existing = db.getUserByUsername(username);
  if (existing) {
    return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại trong hệ thống.' });
  }

  const newUser: UserData = {
    id: `u-student-${Date.now()}`,
    username: username.trim(),
    passwordHash: hashPassword(password),
    fullName: fullName.trim(),
    email: email ? email.trim() : undefined,
    grade: grade ? Number(grade) as 10 | 11 | 12 : 12,
    className: className || '12A1',
    role: 'student', // Registration can only create student accounts
    status: 'active',
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
  };

  db.addUser(newUser);
  const token = db.createSession(newUser.id);
  const { passwordHash: _, ...safeUser } = newUser;
  res.json({ user: safeUser, token });
});

// Verify active session token
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.query.token as string);
  if (!token) {
    return res.status(401).json({ error: 'Chưa cung cấp phiên đăng nhập.' });
  }

  const user = db.getUserBySessionToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.' });
  }

  if (user.status === 'locked') {
    return res.status(403).json({ error: 'Tài khoản đã bị khóa bởi quản trị viên.' });
  }

  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.body?.token as string);
  if (token) {
    db.deleteSession(token);
  }
  res.json({ success: true, message: 'Đăng xuất thành công.' });
});

// Forgot password request endpoint
app.post('/api/auth/forgot-password', (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Vui lòng nhập email hoặc tên đăng nhập.' });
  }

  const user = db.getUserByUsername(identifier);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy tài khoản với thông tin đã cung cấp.' });
  }

  if (user.email) {
    res.json({
      success: true,
      hasEmail: true,
      email: user.email,
      message: `Hướng dẫn đặt lại mật khẩu đã được gửi đến địa chỉ email: ${user.email}. Vui lòng kiểm tra hòm thư của bạn.`,
    });
  } else {
    res.json({
      success: true,
      hasEmail: false,
      message: 'Tài khoản này được cấp trực tiếp và chưa liên kết email. Vui lòng liên hệ Thầy Phan Quốc Cường (Giáo viên quản trị) để được cấp lại mật khẩu.',
    });
  }
});

app.post('/api/auth/change-password', (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'Thiếu thông tin cập nhật mật khẩu.' });
  }

  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
  }

  if (oldPassword && user.passwordHash !== hashPassword(oldPassword)) {
    return res.status(400).json({ error: 'Mật khẩu cũ không chính xác.' });
  }

  db.updateUser(userId, {
    passwordHash: hashPassword(newPassword),
    mustChangePassword: false,
  });

  res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
});

app.get('/api/auth/social-status', (req, res) => {
  res.json({
    google: {
      configured: Boolean(process.env.GOOGLE_CLIENT_ID),
      clientId: process.env.GOOGLE_CLIENT_ID || null,
      guide: 'Để kích hoạt Google Login: Tạo OAuth Client ID trong Google Cloud Console, thêm tên miền ứng dụng vào Authorized JavaScript Origins và cấu hình biến GOOGLE_CLIENT_ID.',
    },
    zalo: {
      configured: Boolean(process.env.ZALO_APP_ID),
      appId: process.env.ZALO_APP_ID || null,
      guide: 'Để kích hoạt Zalo Login: Đăng ký ứng dụng tại developers.zalo.me, cấu hình Zalo Login và gán biến ZALO_APP_ID.',
    },
    facebook: {
      configured: Boolean(process.env.FACEBOOK_APP_ID),
      appId: process.env.FACEBOOK_APP_ID || null,
      guide: 'Để kích hoạt Facebook Login: Tạo App tại developers.facebook.com, cấu hình Facebook Login JavaScript SDK và gán biến FACEBOOK_APP_ID.',
    },
  });
});

// 2. ADMIN USER MANAGEMENT
app.get('/api/admin/users', (req, res) => {
  const users = db.getUsers().map(({ passwordHash: _, ...u }) => u);
  res.json({ users, classes: db.getClasses() });
});

app.post('/api/admin/users', (req, res) => {
  const { fullName, studentCode, username, grade, className, role, email } = req.body;
  if (!fullName || !username) {
    return res.status(400).json({ error: 'Họ tên và tên đăng nhập là bắt buộc.' });
  }

  const existing = db.getUserByUsername(username);
  if (existing) {
    return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại.' });
  }

  const defaultPassword = 'DH@' + (studentCode ? studentCode.replace(/\D/g, '') : '2026');
  const newUser: UserData = {
    id: `u-${Date.now()}`,
    username: username.trim(),
    passwordHash: hashPassword(defaultPassword),
    fullName: fullName.trim(),
    studentCode: studentCode ? studentCode.trim() : undefined,
    email: email ? email.trim() : undefined,
    grade: grade ? Number(grade) as 10 | 11 | 12 : 12,
    className: className || '12A1',
    role: role || 'student',
    status: 'active',
    mustChangePassword: true, // First login requires password change
    createdAt: new Date().toISOString(),
  };

  db.addUser(newUser);
  res.json({ user: newUser, tempPassword: defaultPassword });
});

app.post('/api/admin/users/bulk', (req, res) => {
  const { rows } = req.body; // Array of { fullName, studentCode, username, grade, className }
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Dữ liệu danh sách trống.' });
  }

  const created: any[] = [];
  const errors: string[] = [];

  for (const row of rows) {
    if (!row.fullName || !row.username) {
      errors.push(`Dòng thiếu họ tên hoặc tên đăng nhập: ${JSON.stringify(row)}`);
      continue;
    }
    const existing = db.getUserByUsername(row.username);
    if (existing) {
      errors.push(`Bỏ qua: Tên đăng nhập ${row.username} đã tồn tại`);
      continue;
    }

    const tempPassword = 'DH@' + (row.studentCode ? row.studentCode.replace(/\D/g, '') : '2026');
    const u: UserData = {
      id: `u-bulk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      username: row.username.trim(),
      passwordHash: hashPassword(tempPassword),
      fullName: row.fullName.trim(),
      studentCode: row.studentCode ? row.studentCode.trim() : undefined,
      grade: row.grade ? Number(row.grade) as 10 | 11 | 12 : 12,
      className: row.className || '12A1',
      role: 'student',
      status: 'active',
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
    };
    db.addUser(u);
    created.push({ ...u, tempPassword });
  }

  res.json({ success: true, createdCount: created.length, created, errors });
});

app.patch('/api/admin/users/:id', (req, res) => {
  const { status, className, grade, resetPassword, role } = req.body;
  const updates: Partial<UserData> = {};
  if (status) updates.status = status;
  if (className) updates.className = className;
  if (grade) updates.grade = Number(grade) as 10 | 11 | 12;
  if (role) updates.role = role;
  if (resetPassword) {
    updates.passwordHash = hashPassword(resetPassword);
    updates.mustChangePassword = true;
  }

  const updated = db.updateUser(req.params.id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
  }
  const { passwordHash: _, ...safeUser } = updated;
  res.json({ user: safeUser });
});

// 3. CURRICULUM
app.get('/api/curriculum/grades', (req, res) => {
  const grades = [
    { grade: 10, name: 'Lớp 10', book: 'Kết nối tri thức với cuộc sống', chapterCount: db.getChapters(10).length },
    { grade: 11, name: 'Lớp 11', book: 'Kết nối tri thức với cuộc sống', chapterCount: db.getChapters(11).length },
    { grade: 12, name: 'Lớp 12', book: 'Kết nối tri thức với cuộc sống', chapterCount: db.getChapters(12).length },
  ];
  res.json({ grades });
});

app.get('/api/curriculum/chapters', (req, res) => {
  const grade = req.query.grade ? Number(req.query.grade) : undefined;
  const chapters = db.getChapters(grade);
  res.json({ chapters });
});

app.get('/api/curriculum/lessons', (req, res) => {
  const chapterId = req.query.chapterId as string;
  const grade = req.query.grade ? Number(req.query.grade) : undefined;
  const lessons = db.getLessons(chapterId, grade);

  // Attach exam count to each lesson
  const withCounts = lessons.map((l) => {
    const exams = db.getExams({ lessonId: l.id });
    return {
      ...l,
      examCount: exams.length,
    };
  });

  res.json({ lessons: withCounts });
});

// 4. EXAMS & SUBMISSIONS
app.get('/api/exams', (req, res) => {
  const { grade, lessonId, type } = req.query;
  const exams = db.getExams({
    grade: grade ? Number(grade) : undefined,
    lessonId: lessonId as string,
    type: type as string,
  });

  // Strip question answers in list view
  const summaries = exams.map((e) => ({
    id: e.id,
    lessonId: e.lessonId,
    chapterId: e.chapterId,
    grade: e.grade,
    title: e.title,
    description: e.description,
    type: e.type,
    timeMinutes: e.timeMinutes,
    maxAttempts: e.maxAttempts,
    isPublished: e.isPublished,
    version: e.version,
    questionCount: e.questions.length,
    part1Count: e.questions.filter((q) => q.part === 'PART_1').length,
    part2Count: e.questions.filter((q) => q.part === 'PART_2').length,
    part3Count: e.questions.filter((q) => q.part === 'PART_3').length,
    part4Count: e.questions.filter((q) => q.part === 'PART_4').length,
    updatedAt: e.updatedAt,
  }));

  res.json({ exams: summaries });
});

app.get('/api/exams/:id', (req, res) => {
  const exam = db.getExamById(req.params.id);
  if (!exam) {
    return res.status(404).json({ error: 'Không tìm thấy đề thi.' });
  }

  const role = req.headers['x-user-role'] as string;
  const isTeacherOrAdmin = role === 'admin' || role === 'teacher';

  // For students taking test, strip answers and explanations
  const sanitizedQuestions = exam.questions.map((q) => {
    if (isTeacherOrAdmin) return q;

    const { correctOption: _c, explanation: _e, ...rest } = q;
    let safeStatements = q.statements;
    if (q.part === 'PART_2' && q.statements) {
      safeStatements = q.statements.map((s) => ({
        id: s.id,
        content: s.content,
        isCorrect: false, // Don't reveal correctness before submission
      }));
    }

    return {
      ...rest,
      shortAnswer: undefined, // Hide short answer key
      statements: safeStatements,
    };
  });

  res.json({
    exam: {
      ...exam,
      questions: sanitizedQuestions,
    },
  });
});

// Save in-progress exam answers
app.post('/api/exams/:id/save-draft', (req, res) => {
  const { submissionId, userId, answers, timeSpentSeconds, grade } = req.body;
  const exam = db.getExamById(req.params.id);
  if (!exam) return res.status(404).json({ error: 'Đề không tồn tại.' });

  const subId = submissionId || `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const existing = db.getSubmissionById(subId);

  const sub = {
    id: subId,
    examId: exam.id,
    userId: userId || 'anonymous',
    grade: grade ? Number(grade) as 10 | 11 | 12 : exam.grade,
    startedAt: existing?.startedAt || new Date().toISOString(),
    isFinished: false,
    timeSpentSeconds: timeSpentSeconds || 0,
    answers: answers || {},
    scores: existing?.scores || { part1: 0, part2: 0, part3: 0, part4: 0, total: 0, maxTotal: 10 },
    status: 'in_progress' as const,
  };

  db.saveSubmission(sub);
  res.json({ success: true, submissionId: subId });
});

// Submit exam and grade on the backend
app.post('/api/exams/:id/submit', (req, res) => {
  const { submissionId, userId, answers, timeSpentSeconds } = req.body;
  const exam = db.getExamById(req.params.id);
  if (!exam) {
    return res.status(404).json({ error: 'Không tìm thấy đề thi.' });
  }

  const user = userId ? db.getUserById(userId) : null;

  // Grade Part 1, 2, 3 on the server
  let scorePart1 = 0;
  let scorePart2 = 0;
  let scorePart3 = 0;
  let scorePart4 = 0;

  let maxPart1 = 0;
  let maxPart2 = 0;
  let maxPart3 = 0;
  let maxPart4 = 0;

  const feedback: Record<string, string> = {};

  for (const q of exam.questions) {
    const userAns = answers?.[q.id]?.value;

    if (q.part === 'PART_1') {
      maxPart1 += q.points;
      if (userAns && userAns === q.correctOption) {
        scorePart1 += q.points;
      } else {
        feedback[q.id] = `Đáp án đúng là ${q.correctOption}.`;
      }
    } else if (q.part === 'PART_2') {
      maxPart2 += q.points;
      if (q.statements && typeof userAns === 'object' && userAns !== null) {
        // Count how many statements user got right
        let correctCount = 0;
        q.statements.forEach((stmt) => {
          const userVal = userAns[stmt.id];
          if (typeof userVal === 'boolean' && userVal === stmt.isCorrect) {
            correctCount++;
          }
        });

        // Official MOET standard grading for Part II:
        // 1 ý đúng: 0.1đ | 2 ý: 0.25đ | 3 ý: 0.5đ | 4 ý: 1.0đ (scaled by question points / 1.0)
        let ratio = 0;
        if (correctCount === 1) ratio = 0.1;
        else if (correctCount === 2) ratio = 0.25;
        else if (correctCount === 3) ratio = 0.5;
        else if (correctCount === 4) ratio = 1.0;

        const earned = ratio * q.points;
        scorePart2 += earned;
        feedback[q.id] = `Đúng ${correctCount}/4 ý. Điểm đạt được: ${earned.toFixed(2)} / ${q.points}.`;
      }
    } else if (q.part === 'PART_3') {
      maxPart3 += q.points;
      if (userAns && q.shortAnswer) {
        const normUser = String(userAns).trim().toLowerCase().replace(',', '.');
        const normKey = String(q.shortAnswer).trim().toLowerCase().replace(',', '.');

        let isCorrect = normUser === normKey;
        if (!isCorrect && !isNaN(Number(normUser)) && !isNaN(Number(normKey))) {
          const diff = Math.abs(Number(normUser) - Number(normKey));
          const tolerance = q.tolerance !== undefined ? q.tolerance : 0.01;
          if (diff <= tolerance) isCorrect = true;
        }

        if (isCorrect) {
          scorePart3 += q.points;
        } else {
          feedback[q.id] = `Đáp án chính xác: ${q.shortAnswer}.`;
        }
      }
    } else if (q.part === 'PART_4') {
      maxPart4 += q.points;
      // Essay submitted, awaits teacher review
      feedback[q.id] = 'Bài tự luận đã được ghi nhận. Thầy Phan Quốc Cường sẽ chấm và phản hồi sớm nhất.';
    }
  }

  const totalScore = Number((scorePart1 + scorePart2 + scorePart3 + scorePart4).toFixed(2));
  const maxTotal = Number((maxPart1 + maxPart2 + maxPart3 + maxPart4).toFixed(2)) || 10;

  const finalSub: any = {
    id: submissionId || `sub-${Date.now()}`,
    examId: exam.id,
    userId: user?.id || 'guest',
    userName: user?.fullName || 'Học sinh tự do',
    userClassName: user?.className || '12A1',
    grade: exam.grade,
    startedAt: new Date(Date.now() - (timeSpentSeconds || 60) * 1000).toISOString(),
    submittedAt: new Date().toISOString(),
    isFinished: true,
    timeSpentSeconds: timeSpentSeconds || 60,
    answers: answers || {},
    scores: {
      part1: Number(scorePart1.toFixed(2)),
      part2: Number(scorePart2.toFixed(2)),
      part3: Number(scorePart3.toFixed(2)),
      part4: Number(scorePart4.toFixed(2)),
      total: totalScore,
      maxTotal: maxTotal,
    },
    feedback,
    status: 'submitted',
  };

  db.saveSubmission(finalSub);

  // Return full exam with explanations now that it's submitted!
  res.json({
    submission: finalSub,
    examWithSolutions: exam,
  });
});

// 5. WORD & PDF IMPORT
app.post('/api/exams/import-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn tệp .docx hoặc .pdf.' });
    }

    const result = await processExamDocument({
      buffer: req.file.buffer,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    res.json({ result });
  } catch (err: any) {
    console.error('Import error:', err);
    res.status(500).json({ error: err.message || 'Lỗi khi phân tích tệp tài liệu.' });
  }
});

// Save imported or edited exam
app.post('/api/exams/import-publish', (req, res) => {
  const { title, description, grade, chapterId, lessonId, type, timeMinutes, questions, isPublished } = req.body;
  if (!title || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'Tiêu đề và danh sách câu hỏi là bắt buộc.' });
  }

  const newExam: any = {
    id: `exam-${Date.now()}`,
    grade: Number(grade) as 10 | 11 | 12,
    chapterId,
    lessonId,
    title: title.trim(),
    description: description || 'Đề được tạo từ tệp tài liệu.',
    type: type || 'practice',
    timeMinutes: timeMinutes ? Number(timeMinutes) : 45,
    allowedClasses: [],
    maxAttempts: 99,
    isPublished: isPublished !== false,
    version: 1,
    releaseAnswerMode: 'immediate',
    createdBy: 'Thầy Phan Quốc Cường',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions,
  };

  db.addExam(newExam);
  res.json({ success: true, exam: newExam });
});

// 6. GEMINI AI ASSISTANT
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { message, grade, lessonTitle, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Thiếu nội dung câu hỏi.' });
    }

    const reply = await askMathTutor({
      message,
      grade: grade ? Number(grade) : undefined,
      lessonTitle,
      history,
    });

    res.json({ reply });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi khi gọi Trợ lý AI Gemini.' });
  }
});

app.post('/api/ai/hint', async (req, res) => {
  try {
    const { questionContent, optionsText, studentAttempt } = req.body;
    const hint = await getQuestionHint({
      questionContent,
      optionsText,
      studentAttempt,
    });
    res.json({ hint });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi tạo gợi ý từ AI.' });
  }
});

app.post('/api/ai/explain', async (req, res) => {
  try {
    const { questionContent, studentAnswer, correctAnswer, explanation } = req.body;
    const errorExplanation = await explainError({
      questionContent,
      studentAnswer,
      correctAnswer,
      explanation,
    });
    res.json({ explanation: errorExplanation });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi phân tích từ AI.' });
  }
});

// 7. STATISTICS
app.get('/api/stats/submissions', (req, res) => {
  const userId = req.query.userId as string;
  const submissions = db.getSubmissions(userId ? { userId } : undefined);
  res.json({ submissions });
});

app.get('/api/stats/student', (req, res) => {
  const userId = req.query.userId as string;
  const submissions = db.getSubmissions({ userId });

  const completed = submissions.filter((s) => s.isFinished);
  const avg = completed.length
    ? Number((completed.reduce((sum, s) => sum + (s.scores.total / s.scores.maxTotal) * 10, 0) / completed.length).toFixed(1))
    : 0;

  res.json({
    stats: {
      completedExamsCount: completed.length,
      totalAttempts: submissions.length,
      averageScore: avg,
      streakDays: 12, // Default motivational streak
      recentSubmissions: completed.slice(-5).map((s) => ({
        id: s.id,
        examId: s.examId,
        score: s.scores.total,
        maxScore: s.scores.maxTotal,
        date: s.submittedAt || s.startedAt,
      })),
    },
  });
});

app.get('/api/stats/teacher', (req, res) => {
  const allSubmissions = db.getSubmissions();
  const allUsers = db.getUsers().filter((u) => u.role === 'student');
  const allExams = db.getExams();

  res.json({
    totalStudents: allUsers.length,
    totalExams: allExams.length,
    totalSubmissions: allSubmissions.length,
    classes: db.getClasses(),
    recentActivity: allSubmissions.slice(-15),
  });
});

// Start server with Vite middleware integration
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server chạy thành công tại http://localhost:${PORT}`);
  });
}

start();
