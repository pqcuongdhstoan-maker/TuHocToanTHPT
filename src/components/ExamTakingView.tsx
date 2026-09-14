import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  ArrowLeft,
  Upload,
  Check,
  X,
  HelpCircle,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { Exam, Question, Submission, ExamAttemptAnswer, User } from '../types';
import MathView from './MathView';

interface ExamTakingViewProps {
  examId: string;
  currentUser: User | null;
  onBack: () => void;
  onAskAiAboutQuestion?: (questionText: string) => void;
}

export const ExamTakingView: React.FC<ExamTakingViewProps> = ({
  examId,
  currentUser,
  onBack,
  onAskAiAboutQuestion,
}) => {
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Taking state
  const [answers, setAnswers] = useState<Record<string, ExamAttemptAnswer>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45 * 60);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [activePartFilter, setActivePartFilter] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Vừa xong');
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // Result state
  const [submissionResult, setSubmissionResult] = useState<Submission | null>(null);
  const [examWithSolutions, setExamWithSolutions] = useState<Exam | null>(null);
  const [hintForQuestion, setHintForQuestion] = useState<{ qId: string; text: string } | null>(null);
  const [loadingHint, setLoadingHint] = useState<boolean>(false);

  // Auto-save interval ref
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Fetch exam data
  useEffect(() => {
    let mounted = true;
    async function fetchExam() {
      try {
        setLoading(true);
        const headers: Record<string, string> = {};
        if (currentUser?.role) {
          headers['x-user-role'] = currentUser.role;
        }

        const res = await fetch(`/api/exams/${examId}`, { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Không tải được đề thi');

        if (mounted) {
          setExam(data.exam);
          setSecondsRemaining(data.exam.timeMinutes * 60);
        }
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchExam();
    return () => {
      mounted = false;
    };
  }, [examId, currentUser]);

  // Timer countdown
  useEffect(() => {
    if (submissionResult || loading || !exam) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submissionResult, loading, exam]);

  // Periodic Auto-save every 30s
  useEffect(() => {
    if (submissionResult || !exam) return;

    const autoSaveTimer = setInterval(async () => {
      try {
        await fetch(`/api/exams/${exam.id}/save-draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser?.id || 'guest',
            answers: answersRef.current,
            timeSpentSeconds: exam.timeMinutes * 60 - secondsRemaining,
            grade: exam.grade,
          }),
        });
        setLastSavedTime(new Date().toLocaleTimeString('vi-VN'));
      } catch (e) {
        console.warn('Auto-save failed:', e);
      }
    }, 30000);

    return () => clearInterval(autoSaveTimer);
  }, [exam, currentUser, secondsRemaining, submissionResult]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const questionsList: Question[] = useMemo(() => {
    return (submissionResult && examWithSolutions?.questions) || exam?.questions || [];
  }, [exam, submissionResult, examWithSolutions]);

  const filteredQuestions = useMemo(() => {
    if (activePartFilter === 'ALL') return questionsList;
    return questionsList.filter((q) => q.part === activePartFilter);
  }, [questionsList, activePartFilter]);

  const currentQ = questionsList[currentQuestionIndex];

  // Update answer handler
  const handleSetAnswer = (qId: string, val: any) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || {}),
        value: val,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  // Toggle flag review
  const handleToggleFlag = (qId: string) => {
    setAnswers((prev) => {
      const current = prev[qId] || { value: null };
      return {
        ...prev,
        [qId]: {
          ...current,
          flagged: !current.flagged,
        },
      };
    });
  };

  // Submit exam
  const handleSubmitExam = async () => {
    if (!exam || isSubmitting) return;

    setIsSubmitting(true);
    setShowSubmitModal(false);

    try {
      const res = await fetch(`/api/exams/${exam.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'guest',
          answers,
          timeSpentSeconds: exam.timeMinutes * 60 - secondsRemaining,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi nộp bài');

      setSubmissionResult(data.submission);
      setExamWithSolutions(data.examWithSolutions);
      setCurrentQuestionIndex(0); // reset to first question for review
    } catch (err: any) {
      alert(`Không thể nộp bài: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Request AI Hint for question
  const handleGetAiHint = async (q: Question) => {
    setLoadingHint(true);
    try {
      const optionsText = q.options ? q.options.map((o) => `${o.id}. ${o.content}`).join(' | ') : undefined;
      const studentAttempt = answers[q.id]?.value ? JSON.stringify(answers[q.id].value) : undefined;

      const res = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionContent: q.content,
          optionsText,
          studentAttempt,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setHintForQuestion({ qId: q.id, text: data.hint });
      }
    } catch (e) {
      console.warn('Hint error', e);
    } finally {
      setLoadingHint(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Đang chuẩn bị đề thi...</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Không thể tải đề thi</h3>
        <p className="text-sm text-slate-500">{error}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // Answered count calculation
  const totalQuestions = questionsList.length;
  const answeredCount = Object.keys(answers).filter((qId) => {
    const a = answers[qId]?.value;
    if (!a) return false;
    if (typeof a === 'object') return Object.keys(a).length > 0;
    return String(a).trim().length > 0;
  }).length;
  const flaggedCount = Object.keys(answers).filter((qId) => answers[qId]?.flagged).length;

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-12">
      {/* Top Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            title="Thoát"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Lớp {exam.grade}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                {exam.type === 'mock_exam' ? 'Thi thử THPT' : 'Luyện tập'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {exam.title}
            </h1>
          </div>
        </div>

        {/* Status / Timer / Submit */}
        <div className="flex items-center gap-3">
          {!submissionResult ? (
            <>
              {/* Auto-save indicator */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Đã lưu: {lastSavedTime}</span>
              </div>

              {/* Countdown Timer */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-sm font-bold shadow-2xs border ${
                  secondsRemaining < 300
                    ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                    : 'bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(secondsRemaining)}</span>
              </div>

              {/* Submit button */}
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Nộp bài</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-blue-100 text-blue-900 rounded-xl text-xs font-bold">
                Điểm tổng: {submissionResult.scores.total} / {submissionResult.scores.maxTotal}
              </div>
              <button
                onClick={onBack}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Quay lại
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RESULT DASHBOARD BANNER IF SUBMITTED */}
      {submissionResult && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-500/15 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-blue-200">
                Kết quả bài làm
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-0.5">
                {submissionResult.scores.total} <span className="text-base font-normal text-blue-200">/ {submissionResult.scores.maxTotal} điểm</span>
              </h2>
              <p className="text-xs text-blue-100 mt-1">
                Thời gian làm bài: {Math.floor(submissionResult.timeSpentSeconds / 60)} phút {submissionResult.timeSpentSeconds % 60} giây
              </p>
            </div>

            {/* Breakdown by 4 parts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] uppercase block text-blue-200 font-semibold">Phần I (TN)</span>
                <span className="text-base font-extrabold">{submissionResult.scores.part1} đ</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] uppercase block text-blue-200 font-semibold">Phần II (Đúng/Sai)</span>
                <span className="text-base font-extrabold">{submissionResult.scores.part2} đ</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] uppercase block text-blue-200 font-semibold">Phần III (Ngắn)</span>
                <span className="text-base font-extrabold">{submissionResult.scores.part3} đ</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                <span className="text-[10px] uppercase block text-blue-200 font-semibold">Phần IV (Tự luận)</span>
                <span className="text-base font-extrabold">{submissionResult.scores.part4} đ</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-blue-100 border-t border-white/10 pt-3">
            💡 Bạn có thể bấm vào từng câu hỏi bên dưới để xem lại lời giải chi tiết và công thức Toán học chuẩn xác.
          </p>
        </div>
      )}

      {/* Main Body: Question content & Navigation palette */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Active Question Viewer (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {currentQ ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              {/* Question Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase ${
                      currentQ.part === 'PART_1'
                        ? 'bg-blue-100 text-blue-800'
                        : currentQ.part === 'PART_2'
                        ? 'bg-purple-100 text-purple-800'
                        : currentQ.part === 'PART_3'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {currentQ.part === 'PART_1'
                      ? 'Phần I - Trắc nghiệm'
                      : currentQ.part === 'PART_2'
                      ? 'Phần II - Đúng / Sai'
                      : currentQ.part === 'PART_3'
                      ? 'Phần III - Trả lời ngắn'
                      : 'Phần IV - Tự luận'}
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    Câu {currentQ.questionNumber || currentQuestionIndex + 1}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    ({currentQ.points} điểm)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!submissionResult && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleToggleFlag(currentQ.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                          answers[currentQ.id]?.flagged
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Xem lại sau</span>
                      </button>

                      {/* AI Hint button for practice */}
                      <button
                        type="button"
                        onClick={() => handleGetAiHint(currentQ)}
                        disabled={loadingHint}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Gợi ý AI</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* AI Hint message if open */}
              {hintForQuestion && hintForQuestion.qId === currentQ.id && (
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-xs text-blue-950 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-blue-900 block">Gợi ý từ Trợ lý AI:</span>
                    <MathView text={hintForQuestion.text} />
                  </div>
                </div>
              )}

              {/* Question Content (Rendered with KaTeX) */}
              <div className="text-sm sm:text-base text-slate-900 leading-relaxed">
                <MathView text={currentQ.content} />
              </div>

              {/* Optional Question Image */}
              {currentQ.imageUrl && (
                <div className="max-w-md rounded-xl overflow-hidden border border-slate-200 my-2">
                  <img
                    src={currentQ.imageUrl}
                    alt="Hình minh họa"
                    className="w-full h-auto object-contain"
                  />
                </div>
              )}

              {/* PART 1: Multiple choice options */}
              {currentQ.part === 'PART_1' && currentQ.options && (
                <div className="space-y-2.5 pt-2">
                  {currentQ.options.map((opt) => {
                    const userSelected = answers[currentQ.id]?.value === opt.id;
                    const isSolution = Boolean(submissionResult);
                    const isCorrect = currentQ.correctOption === opt.id;

                    let optStyle = 'border-slate-200 bg-white hover:border-blue-300';
                    if (userSelected && !isSolution) {
                      optStyle = 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600';
                    } else if (isSolution) {
                      if (isCorrect) {
                        optStyle = 'border-emerald-500 bg-emerald-100/70 ring-1 ring-emerald-500 text-emerald-950 font-medium';
                      } else if (userSelected && !isCorrect) {
                        optStyle = 'border-rose-400 bg-rose-50 text-rose-900';
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isSolution}
                        onClick={() => handleSetAnswer(currentQ.id, opt.id)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition-all ${optStyle}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                            userSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <div className="flex-1">
                          <MathView text={opt.content} />
                        </div>
                        {isSolution && isCorrect && (
                          <Check className="w-5 h-5 text-emerald-700 shrink-0" />
                        )}
                        {isSolution && userSelected && !isCorrect && (
                          <X className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* PART 2: True/False statements */}
              {currentQ.part === 'PART_2' && currentQ.statements && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs text-slate-500 italic">
                    Chọn "Đúng" hoặc "Sai" cho từng khẳng định bên dưới:
                  </div>
                  {currentQ.statements.map((stmt) => {
                    const currentObj = answers[currentQ.id]?.value || {};
                    const currentVal = currentObj[stmt.id];
                    const isSolution = Boolean(submissionResult);

                    return (
                      <div
                        key={stmt.id}
                        className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-3"
                      >
                        <div className="flex items-start gap-2.5 text-xs sm:text-sm flex-1">
                          <span className="font-bold text-slate-800">{stmt.id})</span>
                          <div>
                            <MathView text={stmt.content} />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={isSolution}
                            onClick={() => {
                              handleSetAnswer(currentQ.id, {
                                ...currentObj,
                                [stmt.id]: true,
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              currentVal === true
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            Đúng
                          </button>
                          <button
                            type="button"
                            disabled={isSolution}
                            onClick={() => {
                              handleSetAnswer(currentQ.id, {
                                ...currentObj,
                                [stmt.id]: false,
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              currentVal === false
                                ? 'bg-rose-700 text-white shadow-xs'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            Sai
                          </button>

                          {isSolution && (
                            <span
                              className={`ml-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                                stmt.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              Đáp án: {stmt.isCorrect ? 'ĐÚNG' : 'SAI'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PART 3: Short answer numeric input */}
              {currentQ.part === 'PART_3' && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Nhập kết quả bài toán:
                  </label>
                  <div className="max-w-xs">
                    <input
                      type="text"
                      disabled={Boolean(submissionResult)}
                      value={answers[currentQ.id]?.value || ''}
                      onChange={(e) => handleSetAnswer(currentQ.id, e.target.value)}
                      placeholder="Ví dụ: 3 hoặc -2.5"
                      className="w-full px-3 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                  {currentQ.roundingRule && (
                    <p className="text-xs text-amber-800 italic">
                      * Lưu ý: {currentQ.roundingRule}
                    </p>
                  )}
                  {submissionResult && currentQ.shortAnswer && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 font-medium">
                      Đáp án chính xác: <span className="font-bold text-blue-900">{currentQ.shortAnswer}</span>
                    </div>
                  )}
                </div>
              )}

              {/* PART 4: Essay solution & photo upload */}
              {currentQ.part === 'PART_4' && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Trình bày các bước tự luận:
                  </label>
                  <textarea
                    rows={4}
                    disabled={Boolean(submissionResult)}
                    value={answers[currentQ.id]?.value?.text || ''}
                    onChange={(e) => {
                      const current = answers[currentQ.id]?.value || {};
                      handleSetAnswer(currentQ.id, {
                        ...current,
                        text: e.target.value,
                      });
                    }}
                    placeholder="Ghi vắn tắt các bước giải hoặc biến đổi công thức..."
                    className="w-full p-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Photo upload mock */}
                  <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-600">Đính kèm ảnh chụp bài giải tay (nếu có):</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert('Đã mở công cụ đính kèm ảnh bài giải chụp từ máy ảnh/điện thoại.')}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Tải ảnh lên
                    </button>
                  </div>

                  {currentQ.essayRubric && submissionResult && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950">
                      <span className="font-bold block mb-1">Thang điểm chấm tự luận:</span>
                      <p className="whitespace-pre-line">{currentQ.essayRubric}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation after submission */}
              {submissionResult && currentQ.explanation && (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase text-blue-900 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> Lời giải chi tiết của Thầy Phan Quốc Cường:
                    </span>
                    {onAskAiAboutQuestion && (
                      <button
                        type="button"
                        onClick={() => onAskAiAboutQuestion(currentQ.content)}
                        className="text-xs text-blue-800 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <Sparkles className="w-3 h-3" /> Hỏi AI giải thích thêm
                      </button>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm leading-relaxed text-slate-800">
                    <MathView text={currentQ.explanation} />
                  </div>
                </div>
              )}

              {/* Prev / Next Bottom Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Câu trước
                </button>

                <span className="text-xs font-bold text-slate-500">
                  {currentQuestionIndex + 1} / {totalQuestions}
                </span>

                <button
                  type="button"
                  disabled={currentQuestionIndex >= totalQuestions - 1}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition"
                >
                  Câu tiếp theo <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">Không có câu hỏi.</div>
          )}
        </div>

        {/* Right: Question Navigation Palette (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 sticky top-20">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-xs uppercase text-slate-700">
                Danh sách câu hỏi
              </h3>
              <span className="text-xs text-blue-800 font-semibold">
                Đã làm: {answeredCount}/{totalQuestions}
              </span>
            </div>

            {/* Part filter buttons */}
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              {[
                { id: 'ALL', label: 'Tất cả các phần' },
                { id: 'PART_1', label: 'Phần I (TN)' },
                { id: 'PART_2', label: 'Phần II (Đ/S)' },
                { id: 'PART_3', label: 'Phần III (Ngắn)' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePartFilter(p.id)}
                  className={`px-2 py-1 rounded-lg font-medium text-center transition ${
                    activePartFilter === p.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Questions Number Grid */}
            <div className="grid grid-cols-5 gap-1.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
              {questionsList.map((q, idx) => {
                const isSelected = currentQuestionIndex === idx;
                const isAnswered = Boolean(answers[q.id]?.value);
                const isFlagged = Boolean(answers[q.id]?.flagged);

                let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                if (isFlagged) {
                  colorClasses = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                } else if (isAnswered) {
                  colorClasses = 'bg-blue-600 text-white border-blue-700 font-bold';
                }

                if (isSelected) {
                  colorClasses += ' ring-2 ring-slate-900 ring-offset-1';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-9 rounded-xl border text-xs font-semibold flex items-center justify-center transition ${colorClasses}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-2 border-t border-slate-100 text-[10px] space-y-1 text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-600 shrink-0" />
                <span>Đã trả lời ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 shrink-0" />
                <span>Chưa trả lời ({totalQuestions - answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 shrink-0" />
                <span>Đánh dấu xem lại ({flaggedCount})</span>
              </div>
            </div>

            {/* Submit Action */}
            {!submissionResult && (
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Nộp bài ngay</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Xác nhận nộp bài</h3>
                <p className="text-xs text-slate-500">Kiểm tra lại tình trạng trước khi gửi</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Tổng số câu hỏi:</span>
                <span className="font-bold text-slate-900">{totalQuestions} câu</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Đã hoàn thành:</span>
                <span className="font-bold text-blue-600">{answeredCount} câu</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Chưa trả lời:</span>
                <span className="font-bold text-rose-600">{totalQuestions - answeredCount} câu</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Thời gian còn lại:</span>
                <span className="font-bold text-slate-900">{formatTime(secondsRemaining)}</span>
              </div>
            </div>

            {totalQuestions - answeredCount > 0 && (
              <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                ⚠️ Bạn vẫn còn {totalQuestions - answeredCount} câu chưa làm. Bạn có chắc chắn muốn nộp bài bây giờ không?
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={handleSubmitExam}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Xác nhận nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamTakingView;
