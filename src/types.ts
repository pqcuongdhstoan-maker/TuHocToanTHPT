export type UserRole = 'admin' | 'teacher' | 'student' | 'guest';

export interface User {
  id: string;
  username: string;
  fullName: string;
  studentCode?: string;
  email?: string;
  grade?: 10 | 11 | 12;
  className?: string; // e.g. '12A1', '12TN1'
  role: UserRole;
  avatarUrl?: string;
  status: 'active' | 'locked';
  mustChangePassword?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export type GradeLevel = 10 | 11 | 12;

export interface Chapter {
  id: string;
  grade: GradeLevel;
  order: number;
  code: string;
  title: string;
  description?: string;
}

export interface Lesson {
  id: string;
  chapterId: string;
  grade: GradeLevel;
  order: number;
  title: string;
  theorySummary: string;
  examCount?: number;
  completedCount?: number;
  isPublished: boolean;
}

export type QuestionPartType = 'PART_1' | 'PART_2' | 'PART_3' | 'PART_4';

export interface QuestionOption {
  id: 'A' | 'B' | 'C' | 'D';
  content: string;
  imageUrl?: string;
}

export interface TrueFalseStatement {
  id: 'a' | 'b' | 'c' | 'd';
  content: string;
  isCorrect: boolean; // true = Đúng, false = Sai
}

export type DifficultyLevel = 'NB' | 'TH' | 'VD' | 'VDC';

export interface Question {
  id: string;
  examId?: string;
  part: QuestionPartType;
  questionNumber: number; // 1, 2, 3... per part
  content: string; // supports LaTeX $...$ and $$...$$
  imageUrl?: string;
  points: number;
  difficulty: DifficultyLevel;
  
  // Part 1: Multiple choice 1 of 4
  options?: QuestionOption[];
  correctOption?: 'A' | 'B' | 'C' | 'D';
  
  // Part 2: True/False matrix (a, b, c, d)
  statements?: TrueFalseStatement[];
  
  // Part 3: Short answer
  shortAnswer?: string;
  tolerance?: number;
  roundingRule?: string; // e.g. "Làm tròn đến 2 chữ số thập phân"
  
  // Part 4: Essay
  essayRubric?: string;
  
  // Explanation & verification
  explanation?: string;
  needsReview?: boolean;
  reviewReason?: string;
  sourceLocation?: {
    page?: number;
    rawText?: string;
    section?: string;
  };
}

export interface Exam {
  id: string;
  lessonId?: string;
  chapterId?: string;
  grade: GradeLevel;
  title: string;
  description: string;
  type: 'practice' | 'mock_exam';
  timeMinutes: number;
  allowedClasses: string[]; // empty means all classes
  maxAttempts: number;
  isPublished: boolean;
  version: number;
  releaseAnswerMode: 'immediate' | 'after_deadline' | 'teacher_manual';
  deadline?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  questions?: Question[];
  totalQuestions?: number;
}

export interface ExamAttemptAnswer {
  // Part 1: 'A' | 'B' | 'C' | 'D'
  // Part 2: { a: boolean; b: boolean; c: boolean; d: boolean }
  // Part 3: string (e.g. '2.5')
  // Part 4: { text?: string; imageUrls?: string[] }
  value: any;
  flagged?: boolean;
  updatedAt?: string;
}

export interface Submission {
  id: string;
  examId: string;
  userId: string;
  userName?: string;
  userClassName?: string;
  grade: GradeLevel;
  startedAt: string;
  submittedAt?: string;
  isFinished: boolean;
  timeSpentSeconds: number;
  answers: Record<string, ExamAttemptAnswer>; // questionId -> answer
  scores: {
    part1: number;
    part2: number;
    part3: number;
    part4: number;
    total: number;
    maxTotal: number;
  };
  part2GradingRule?: 'moet_standard' | 'linear_per_item'; // default moet_standard: 1->0.1, 2->0.25, 3->0.5, 4->1.0
  gradedBy?: string;
  feedback?: Record<string, string>; // questionId -> feedback
  status: 'in_progress' | 'submitted' | 'graded';
}

export interface ImportPreviewData {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: 'docx' | 'pdf';
  detectedQuestions: Question[];
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
  rawTextPreview?: string;
}

export interface StudentStats {
  completedExamsCount: number;
  totalAttempts: number;
  averageScore: number;
  streakDays: number;
  recentSubmissions: {
    examId: string;
    examTitle: string;
    grade: GradeLevel;
    score: number;
    maxScore: number;
    date: string;
  }[];
  weakChapters: {
    chapterId: string;
    chapterTitle: string;
    incorrectCount: number;
  }[];
  dailyActivity: {
    date: string;
    count: number;
    avgScore: number;
  }[];
}
