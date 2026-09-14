import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ChevronRight,
  UploadCloud,
  FileCheck,
  Clock,
  ArrowLeft,
  Sparkles,
  Search,
  CheckCircle2,
  GraduationCap,
  LineChart,
} from 'lucide-react';
import { GradeLevel, Chapter, Lesson, Exam } from '../types';
import MathView from '../components/MathView';
import { clientDataService } from '../services/clientDataService';
import FunctionGraphPlotter from '../components/FunctionGraphPlotter';

interface PracticeViewProps {
  selectedGrade: GradeLevel;
  onSelectGrade: (grade: GradeLevel) => void;
  onStartExam: (examId: string) => void;
  onOpenImportModal: () => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  selectedGrade,
  onSelectGrade,
  onStartExam,
  onOpenImportModal,
}) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [showPlotter, setShowPlotter] = useState<boolean>(false);

  // Fetch chapters & lessons for the selected grade
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [loadedChapters, loadedLessons, loadedExams] = await Promise.all([
          clientDataService.getChapters(selectedGrade),
          clientDataService.getLessons(selectedGrade),
          clientDataService.getExams({ grade: selectedGrade, type: 'practice' }),
        ]);

        if (mounted) {
          setChapters(loadedChapters);
          setLessons(loadedLessons);
          setExams(loadedExams);

          if (loadedChapters.length > 0) {
            setSelectedChapterId(loadedChapters[0].id);
          }
          setSelectedLesson(null);
        }
      } catch (err) {
        console.error('Failed loading curriculum:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [selectedGrade]);

  const currentChapter = chapters.find((c) => c.id === selectedChapterId);
  const chapterLessons = lessons.filter((l) => l.chapterId === selectedChapterId);

  // Filter lessons by search term
  const displayedLessons = searchTerm
    ? lessons.filter((l) => l.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : chapterLessons;

  // Exams for the currently selected lesson
  const lessonExams = selectedLesson
    ? exams.filter((e) => e.lessonId === selectedLesson.id)
    : [];

  const gradeOptions = [
    { grade: 10 as GradeLevel, title: 'Lớp 10', subtitle: '1 môn học →' },
    { grade: 11 as GradeLevel, title: 'Lớp 11', subtitle: '1 môn học →' },
    { grade: 12 as GradeLevel, title: 'Lớp 12', subtitle: '1 môn học →' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 bg-white text-slate-900">
      {/* SECTION: "CHỌN LỚP" (Exact Match to Screenshot 1 & 2) */}
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-[11px] font-black tracking-wider uppercase text-blue-600 block mb-1">
              LUYỆN TẬP
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Chọn lớp
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Bạn đang học lớp mấy?
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPlotter(!showPlotter)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-2xs ${
                showPlotter
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <LineChart className="w-4 h-4" />
              <span>{showPlotter ? 'Đóng đồ thị' : 'Đồ thị tương tác D3'}</span>
            </button>

            <button
              onClick={onOpenImportModal}
              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/70 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-2xs"
            >
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span>Nhập đề Word/PDF</span>
            </button>
          </div>
        </div>

        {/* Conditional D3 Function Plotter Widget */}
        {showPlotter && (
          <div className="pt-2 animate-in fade-in">
            <FunctionGraphPlotter grade={selectedGrade} />
          </div>
        )}

        {/* 3 3D Class Cards Side by Side (Screenshot 1 & 2) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl">
          {gradeOptions.map((opt) => {
            const isSelected = selectedGrade === opt.grade;
            return (
              <div
                key={opt.grade}
                onClick={() => {
                  onSelectGrade(opt.grade);
                  setSelectedLesson(null);
                }}
                className={`group bg-white rounded-3xl p-6 text-center cursor-pointer transition-all border-2 border-b-4 ${
                  isSelected
                    ? 'border-blue-600 border-b-blue-700 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20'
                    : 'border-slate-200 border-b-slate-300 hover:border-blue-400 hover:border-b-blue-500 hover:shadow-md'
                }`}
              >
                {/* Soft rounded icon box with graduation cap icon */}
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mx-auto mb-3.5 shadow-2xs group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-7 h-7 text-blue-600" />
                </div>

                <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-blue-600 transition">
                  {opt.title}
                </h3>

                <p className="text-xs font-bold text-blue-600 mt-1 flex items-center justify-center gap-1">
                  <span>{opt.subtitle}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION: CURRICULUM BROWSER & LESSON EXAMS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        {/* Left Column: Chapters & Lessons List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm bài học Toán..."
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden shadow-2xs"
            />
          </div>

          {/* Chapters Pills */}
          {!searchTerm && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {chapters.map((chap) => (
                <button
                  key={chap.id}
                  onClick={() => {
                    setSelectedChapterId(chap.id);
                    setSelectedLesson(null);
                  }}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition shrink-0 ${
                    selectedChapterId === chap.id
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {chap.code}
                </button>
              ))}
            </div>
          )}

          {/* Current Chapter Description Banner */}
          {currentChapter && !searchTerm && (
            <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 text-xs space-y-1">
              <span className="font-extrabold text-blue-950 block text-sm">{currentChapter.title}</span>
              <p className="text-blue-800 text-[11px] leading-relaxed">{currentChapter.description}</p>
            </div>
          )}

          {/* Lessons List Cards */}
          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
            {displayedLessons.map((lesson) => {
              const isSelected = selectedLesson?.id === lesson.id;
              return (
                <div
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-600 shadow-xs ring-1 ring-blue-500'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                      {lesson.title}
                    </h4>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                      <span className="text-blue-600 font-semibold">{lesson.examCount || 0} đề luyện tập</span>
                      <span>•</span>
                      <span>GDPT 2018</span>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition ${
                      isSelected ? 'text-blue-600 translate-x-1' : 'text-slate-400'
                    }`}
                  />
                </div>
              );
            })}

            {displayedLessons.length === 0 && (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                Không tìm thấy bài học nào phù hợp.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Lesson Detail (7 cols) */}
        <div className="lg:col-span-7">
          {selectedLesson ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">
                    Toán {selectedGrade} • Bài học chi tiết
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                    {selectedLesson.title}
                  </h2>
                </div>

                <button
                  onClick={onOpenImportModal}
                  className="px-3.5 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Nhập thêm đề</span>
                </button>
              </div>

              {/* Theory Summary Section with MathJax / KaTeX */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-700">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Tóm tắt kiến thức trọng tâm</span>
                </div>

                <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                  <MathView text={selectedLesson.theorySummary} />
                </div>
              </div>

              {/* Practice Exams for this Lesson */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-700">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <span>Đề luyện tập của bài ({lessonExams.length})</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {lessonExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 transition flex items-center justify-between flex-wrap gap-3 shadow-2xs"
                    >
                      <div className="space-y-1.5 max-w-md">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                          {exam.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{exam.description}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <Clock className="w-3 h-3 text-blue-600" /> {exam.timeMinutes} phút
                          </span>
                          <span>•</span>
                          <span>{exam.questions?.length || exam.questionCount || 0} câu hỏi</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onStartExam(exam.id)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition shadow-md shadow-blue-500/20"
                      >
                        Bắt đầu làm bài
                      </button>
                    </div>
                  ))}

                  {lessonExams.length === 0 && (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                      <p className="text-xs text-slate-500">
                        Chưa có đề nào trong bài học này. Bạn có thể nạp đề ngay từ tệp Word/PDF!
                      </p>
                      <button
                        type="button"
                        onClick={onOpenImportModal}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                      >
                        Nhập đề từ Word/PDF vào bài này
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 text-slate-500">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-sm text-slate-700">Chưa chọn bài học</h3>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                Hãy chọn một bài học từ danh sách bên trái để xem tóm tắt lý thuyết và làm các bài tập rèn luyện.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeView;
