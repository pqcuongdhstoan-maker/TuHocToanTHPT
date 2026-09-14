import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Edit3,
  Trash2,
  Plus,
  Save,
  RefreshCw,
  Eye,
  Sliders,
  Check,
} from 'lucide-react';
import { Question, GradeLevel, Chapter, Lesson } from '../types';
import MathView from './MathView';
import MathToolbar from './MathToolbar';

interface WordPdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  lessons: Lesson[];
  initialGrade?: GradeLevel;
  onImportSuccess: (createdExam: any) => void;
}

export const WordPdfImportModal: React.FC<WordPdfImportModalProps> = ({
  isOpen,
  onClose,
  chapters,
  lessons,
  initialGrade = 12,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStage, setProgressStage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Result state
  const [rawTextPreview, setRawTextPreview] = useState<string>('');
  const [detectedQuestions, setDetectedQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Metadata configuration for saving
  const [examTitle, setExamTitle] = useState<string>('');
  const [examDescription, setExamDescription] = useState<string>('');
  const [examType, setExamType] = useState<'practice' | 'mock_exam'>('practice');
  const [targetGrade, setTargetGrade] = useState<GradeLevel>(initialGrade);
  const [targetChapterId, setTargetChapterId] = useState<string>('');
  const [targetLessonId, setTargetLessonId] = useState<string>('');
  const [timeMinutes, setTimeMinutes] = useState<number>(45);

  // Editing state for individual question
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [activePartFilter, setActivePartFilter] = useState<string>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const filteredChapters = chapters.filter((c) => c.grade === targetGrade);
  const filteredLessons = lessons.filter(
    (l) => l.grade === targetGrade && (!targetChapterId || l.chapterId === targetChapterId)
  );

  // Process File Upload via API
  const handleUploadFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setProgressPercent(20);
    setProgressStage('Đang đọc tệp tài liệu và trích xuất cấu trúc văn bản...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setTimeout(() => {
        setProgressPercent(50);
        setProgressStage('Đang nhận diện công thức toán học và phân tích 4 phần...');
      }, 500);

      setTimeout(() => {
        setProgressPercent(80);
        setProgressStage('Đang chuẩn hóa trắc nghiệm, đúng/sai, trả lời ngắn và tự luận...');
      }, 1000);

      const res = await fetch('/api/exams/import-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi phân tích tệp.');
      }

      setProgressPercent(100);
      setProgressStage('Hoàn tất nhận diện!');

      setRawTextPreview(data.result.rawTextPreview);
      setDetectedQuestions(data.result.questions);
      setStats(data.result.stats);
      setWarnings(data.result.warnings || []);

      const baseTitle = selectedFile.name.replace(/\.[^/.]+$/, '');
      setExamTitle(baseTitle.includes('Toán') ? baseTitle : `Đề tự học: ${baseTitle}`);
    } catch (err: any) {
      setProgressPercent(0);
      setProgressStage('Đã dừng do lỗi: ' + (err.message || 'Lỗi xử lý tệp'));
      alert(`Đã dừng do lỗi: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Load Built-in Demo Sample Document (One-click test)
  const handleLoadSampleData = () => {
    const sampleText = `PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN
Thí sinh trả lời từ câu 1 đến câu 2. Mỗi câu hỏi thí sinh chỉ chọn một phương án.
Câu 1: Cho hàm số $y = f(x)$ có bảng xét dấu của đạo hàm $f'(x) = x(x - 2)^2$. Số điểm cực trị của hàm số đã cho là:
A. 0.
B. 1.
C. 2.
D. 3.
Lời giải: Ta có $f'(x) = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$. Do $(x-2)^2 \\ge 0$ không đổi dấu qua $x = 2$, nên $f'(x)$ chỉ đổi dấu qua $x = 0$. Hàm số có 1 điểm cực trị. Chọn B.

Câu 2: Trong không gian $Oxyz$, cho mặt phẳng $(\\alpha): 3x - y + 2z - 7 = 0$. Vectơ nào sau đây là vectơ pháp tuyến của $(\\alpha)$?
A. $\\vec{n}_1 = (3; -1; 2)$.
B. $\\vec{n}_2 = (3; 1; 2)$.
C. $\\vec{n}_3 = (-3; -1; 2)$.
D. $\\vec{n}_4 = (3; -1; -7)$.

PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI
Thí sinh trả lời từ câu 1 đến câu 1. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
Câu 1: Cho hàm số $y = f(x) = \\frac{2x + 1}{x - 1}$. Xét tính đúng sai của các khẳng định sau:
a) Tập xác định của hàm số là $D = \\mathbb{R} \\setminus \\{1\\}$. (Đúng)
b) Đạo hàm $f'(x) = \\frac{-3}{(x-1)^2} < 0, \\forall x \\neq 1$. (Đúng)
c) Đồ thị hàm số có tiệm cận đứng là $x = 2$. (Sai)
d) Đồ thị hàm số có tiệm cận ngang là $y = 2$. (Đúng)

PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN
Thí sinh trả lời từ câu 1 đến câu 1.
Câu 1: Một mảnh vườn hình chữ nhật có chu vi $40\\text{m}$. Diện tích lớn nhất của mảnh vườn đó bằng bao nhiêu mét vuông?
Đáp án: 100

PHẦN IV. TỰ LUẬN
Câu 1: Cho hàm số $y = x^3 - 3x^2 + 2$.
a) Tìm các khoảng đơn điệu và cực trị của hàm số.
b) Viết phương trình tiếp tuyến của đồ thị hàm số tại điểm có hoành độ $x_0 = 1$.
Thang điểm: Ý a: 1.0 điểm; Ý b: 1.0 điểm.`;

    const blob = new Blob([sampleText], { type: 'text/plain' });
    const dummyFile = new File([blob], 'De_Mau_Chuan_GDPT_2018_KNTT.docx', { type: 'text/plain' });
    handleUploadFile(dummyFile);
  };

  // Update a question in memory
  const handleUpdateQuestion = (qId: string, updates: Partial<Question>) => {
    setDetectedQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, ...updates } : q))
    );
  };

  // Remove a question
  const handleDeleteQuestion = (qId: string) => {
    if (confirm('Bạn có chắc muốn xóa câu hỏi này khỏi đề?')) {
      setDetectedQuestions((prev) => prev.filter((q) => q.id !== qId));
    }
  };

  // Save imported exam into database
  const handleSaveExam = async () => {
    if (!examTitle.trim()) {
      alert('Vui lòng nhập tên đề thi.');
      return;
    }
    if (detectedQuestions.length === 0) {
      alert('Chưa có câu hỏi nào được nhận diện.');
      return;
    }

    try {
      const res = await fetch('/api/exams/import-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: examTitle,
          description: examDescription || `Đề nhập tự động từ tệp ${file?.name || 'Word/PDF'}`,
          grade: targetGrade,
          chapterId: targetChapterId || undefined,
          lessonId: targetLessonId || undefined,
          type: examType,
          timeMinutes: Number(timeMinutes),
          questions: detectedQuestions,
          isPublished: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu đề.');

      alert('Đã lưu đề thi vào hệ thống thành công!');
      onImportSuccess(data.exam);
      onClose();
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // Filter questions by part
  const visibleQuestions = detectedQuestions.filter((q) => {
    if (activePartFilter === 'ALL') return true;
    return q.part === activePartFilter;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Nhập đề từ Word / PDF (Cấu trúc 4 Phần GDPT 2018)
                <span className="text-[10px] uppercase font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  AI Enhanced
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Tự động nhận diện công thức MathJax/KaTeX, tách Phần I (TN), Phần II (Đúng/Sai), Phần III (Ngắn), Phần IV (Tự luận)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Upload Dropzone if no file loaded */}
          {detectedQuestions.length === 0 && !isProcessing && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleUploadFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition flex flex-col items-center justify-center cursor-pointer ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/30'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".docx,.pdf,.txt"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleUploadFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  Kéo thả tệp đề thi (.docx, .pdf) vào đây hoặc bấm để chọn tệp
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Hỗ trợ công thức Toán Word (OMML), LaTeX, hình ảnh minh họa trong tệp, cấu trúc 4 phần của Bộ GD&ĐT
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600">
                    Microsoft Word (.docx)
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600">
                    Tài liệu PDF (.pdf)
                  </span>
                </div>
              </div>

              {/* Sample loader */}
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs text-blue-950 font-medium">
                    Chưa có tệp sẵn trên máy? Bạn có thể nạp ngay mẫu đề chuẩn GDPT 2018 (4 Phần) để kiểm tra:
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSampleData}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  Nạp đề mẫu chuẩn 4 phần
                </button>
              </div>
            </div>
          )}

          {/* Processing Loading Indicator */}
          {isProcessing && (
            <div className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                <Sparkles className="w-6 h-6 text-blue-600 absolute inset-0 m-auto" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base">{progressStage}</h4>
                <p className="text-xs text-slate-500 mt-1">Đang tối ưu công thức và bóc tách cấu trúc 4 phần...</p>
              </div>
              <div className="w-64 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Split 2-Column Review Interface */}
          {detectedQuestions.length > 0 && !isProcessing && (
            <div className="space-y-5">
              {/* Top Configuration & Stats Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Tên đề thi *
                    </label>
                    <input
                      type="text"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden font-medium"
                      placeholder="Nhập tên đề..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Khối lớp *
                    </label>
                    <select
                      value={targetGrade}
                      onChange={(e) => setTargetGrade(Number(e.target.value) as GradeLevel)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value={10}>Lớp 10 (KNTT)</option>
                      <option value={11}>Lớp 11 (KNTT)</option>
                      <option value={12}>Lớp 12 (KNTT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Loại đề
                    </label>
                    <select
                      value={examType}
                      onChange={(e) => setExamType(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                    >
                      <option value="practice">Luyện tập theo bài</option>
                      <option value="mock_exam">Đề thi thử THPT (Đủ 4 phần)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Thời gian làm bài
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={timeMinutes}
                        onChange={(e) => setTimeMinutes(Number(e.target.value))}
                        className="w-20 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                        min={5}
                        max={180}
                      />
                      <span className="text-xs text-slate-500 font-medium">phút</span>
                    </div>
                  </div>
                </div>

                {/* Lesson mapping if practice */}
                {examType === 'practice' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Chương tương ứng
                      </label>
                      <select
                        value={targetChapterId}
                        onChange={(e) => {
                          setTargetChapterId(e.target.value);
                          setTargetLessonId('');
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">-- Chọn chương --</option>
                        {filteredChapters.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code}: {c.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Bài học tương ứng
                      </label>
                      <select
                        value={targetLessonId}
                        onChange={(e) => setTargetLessonId(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">-- Chọn bài học --</option>
                        {filteredLessons.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Summary badges */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-200 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-700">Tổng nhận diện:</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                      Phần I (TN): {stats?.part1Count || 0}
                    </span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold">
                      Phần II (Đúng/Sai): {stats?.part2Count || 0}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">
                      Phần III (Ngắn): {stats?.part3Count || 0}
                    </span>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-semibold">
                      Phần IV (Tự luận): {stats?.part4Count || 0}
                    </span>
                    {stats?.needsReviewCount > 0 && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Cần kiểm tra: {stats.needsReviewCount}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDetectedQuestions([]);
                      setFile(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" /> Tải tệp khác
                  </button>
                </div>
              </div>

              {/* 2-Column Area */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[500px]">
                {/* Left Column: Raw Preview */}
                <div className="lg:col-span-4 bg-slate-50/70 border border-slate-200 rounded-xl p-3 flex flex-col">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>Văn bản trích xuất gốc</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {rawTextPreview.length} ký tự
                    </span>
                  </div>
                  <div className="flex-1 max-h-[500px] overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-600 bg-white p-3 rounded-lg border border-slate-200 scrollbar-thin whitespace-pre-wrap select-text">
                    {rawTextPreview || 'Không có văn bản trích xuất.'}
                  </div>
                </div>

                {/* Right Column: Structured Questions with KaTeX */}
                <div className="lg:col-span-8 flex flex-col space-y-3">
                  {/* Part filter tabs */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-200">
                    <div className="flex items-center gap-1">
                      {[
                        { id: 'ALL', label: `Tất cả (${detectedQuestions.length})` },
                        { id: 'PART_1', label: `Phần I (${stats?.part1Count || 0})` },
                        { id: 'PART_2', label: `Phần II (${stats?.part2Count || 0})` },
                        { id: 'PART_3', label: `Phần III (${stats?.part3Count || 0})` },
                        { id: 'PART_4', label: `Phần IV (${stats?.part4Count || 0})` },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActivePartFilter(tab.id)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                            activePartFilter === tab.id
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newQ: Question = {
                          id: `man-q-${Date.now()}`,
                          part: 'PART_1',
                          questionNumber: detectedQuestions.length + 1,
                          content: 'Nội dung câu hỏi mới...',
                          points: 0.25,
                          difficulty: 'TH',
                          options: [
                            { id: 'A', content: 'Phương án A' },
                            { id: 'B', content: 'Phương án B' },
                            { id: 'C', content: 'Phương án C' },
                            { id: 'D', content: 'Phương án D' },
                          ],
                          correctOption: 'A',
                        };
                        setDetectedQuestions([...detectedQuestions, newQ]);
                        setEditingQuestionId(newQ.id);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 hover:border-blue-500 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                      <span>Thêm câu hỏi</span>
                    </button>
                  </div>

                  {/* Question items list */}
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                    {visibleQuestions.map((q, qIndex) => {
                      const isEditing = editingQuestionId === q.id;

                      return (
                        <div
                          key={q.id}
                          className={`bg-white border rounded-xl p-4 transition shadow-xs ${
                            q.needsReview
                              ? 'border-red-300 ring-1 ring-red-100'
                              : 'border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          {/* Item Top Bar */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase ${
                                  q.part === 'PART_1'
                                    ? 'bg-blue-100 text-blue-800'
                                    : q.part === 'PART_2'
                                    ? 'bg-purple-100 text-purple-800'
                                    : q.part === 'PART_3'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {q.part === 'PART_1'
                                  ? 'Phần I - TN 4 Phương án'
                                  : q.part === 'PART_2'
                                  ? 'Phần II - Đúng / Sai'
                                  : q.part === 'PART_3'
                                  ? 'Phần III - Trả lời ngắn'
                                  : 'Phần IV - Tự luận'}
                              </span>

                              <span className="font-bold text-slate-800 text-xs">
                                Câu {q.questionNumber || qIndex + 1}
                              </span>

                              <span className="text-[11px] text-slate-400">
                                ({q.points} điểm)
                              </span>

                              {q.needsReview && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  {q.reviewReason || 'Cần kiểm tra'}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingQuestionId(isEditing ? null : q.id)}
                                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                                  isEditing
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{isEditing ? 'Đóng sửa' : 'Sửa câu'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Xóa câu này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Editable Form or Live Preview View */}
                          {isEditing ? (
                            <div className="mt-3 space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                              {/* Formula toolbar for easy insertion */}
                              <MathToolbar
                                onInsert={(formula) => {
                                  handleUpdateQuestion(q.id, {
                                    content: q.content + ' ' + formula,
                                  });
                                }}
                              />

                              {/* Question content editor */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                  Nội dung câu hỏi (hỗ trợ LaTeX kẹp trong $...$)
                                </label>
                                <textarea
                                  value={q.content}
                                  onChange={(e) => handleUpdateQuestion(q.id, { content: e.target.value })}
                                  rows={3}
                                  className="w-full p-2 text-xs bg-white border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-500"
                                />
                              </div>

                              {/* Part 1 Options Editor */}
                              {q.part === 'PART_1' && q.options && (
                                <div className="space-y-2">
                                  <label className="block text-[11px] font-bold text-slate-600 uppercase">
                                    Các phương án và đáp án đúng:
                                  </label>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {q.options.map((opt) => (
                                      <div
                                        key={opt.id}
                                        className={`flex items-center gap-2 p-2 rounded-lg border bg-white ${
                                          q.correctOption === opt.id
                                            ? 'border-blue-500 ring-1 ring-blue-200 bg-blue-50/30'
                                            : 'border-slate-200'
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateQuestion(q.id, { correctOption: opt.id })}
                                          className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center transition shrink-0 ${
                                            q.correctOption === opt.id
                                              ? 'bg-blue-600 text-white'
                                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                          }`}
                                        >
                                          {opt.id}
                                        </button>
                                        <input
                                          type="text"
                                          value={opt.content}
                                          onChange={(e) => {
                                            const newOpts = q.options!.map((o) =>
                                              o.id === opt.id ? { ...o, content: e.target.value } : o
                                            );
                                            handleUpdateQuestion(q.id, { options: newOpts });
                                          }}
                                          className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Part 2 Statements Editor */}
                              {q.part === 'PART_2' && q.statements && (
                                <div className="space-y-2">
                                  <label className="block text-[11px] font-bold text-slate-600 uppercase">
                                    Các mệnh đề Đúng / Sai (a, b, c, d):
                                  </label>
                                  {q.statements.map((stmt) => (
                                    <div
                                      key={stmt.id}
                                      className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white"
                                    >
                                      <span className="font-bold text-xs w-5 text-slate-700">{stmt.id})</span>
                                      <input
                                        type="text"
                                        value={stmt.content}
                                        onChange={(e) => {
                                          const newStmts = q.statements!.map((s) =>
                                            s.id === stmt.id ? { ...s, content: e.target.value } : s
                                          );
                                          handleUpdateQuestion(q.id, { statements: newStmts });
                                        }}
                                        className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                                      />
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newStmts = q.statements!.map((s) =>
                                              s.id === stmt.id ? { ...s, isCorrect: true } : s
                                            );
                                            handleUpdateQuestion(q.id, { statements: newStmts });
                                          }}
                                          className={`px-2.5 py-1 text-xs rounded font-bold transition ${
                                            stmt.isCorrect
                                              ? 'bg-blue-600 text-white'
                                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                          }`}
                                        >
                                          Đúng
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newStmts = q.statements!.map((s) =>
                                              s.id === stmt.id ? { ...s, isCorrect: false } : s
                                            );
                                            handleUpdateQuestion(q.id, { statements: newStmts });
                                          }}
                                          className={`px-2.5 py-1 text-xs rounded font-bold transition ${
                                            !stmt.isCorrect
                                              ? 'bg-rose-700 text-white'
                                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                          }`}
                                        >
                                          Sai
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Part 3 Short Answer Editor */}
                              {q.part === 'PART_3' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                      Đáp án số / kết quả chính xác
                                    </label>
                                    <input
                                      type="text"
                                      value={q.shortAnswer || ''}
                                      onChange={(e) => handleUpdateQuestion(q.id, { shortAnswer: e.target.value })}
                                      placeholder="Ví dụ: 2.5 hoặc -1/3"
                                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                      Quy tắc làm tròn (nếu có)
                                    </label>
                                    <input
                                      type="text"
                                      value={q.roundingRule || ''}
                                      onChange={(e) => handleUpdateQuestion(q.id, { roundingRule: e.target.value })}
                                      placeholder="Ví dụ: Làm tròn đến hàng phần mười"
                                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Part 4 Essay Rubric Editor */}
                              {q.part === 'PART_4' && (
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                    Thang điểm / Hướng dẫn chấm
                                  </label>
                                  <textarea
                                    value={q.essayRubric || ''}
                                    onChange={(e) => handleUpdateQuestion(q.id, { essayRubric: e.target.value })}
                                    rows={2}
                                    placeholder="Biểu điểm từng ý nhỏ..."
                                    className="w-full p-2 text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                              )}

                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateQuestion(q.id, { needsReview: false });
                                    setEditingQuestionId(null);
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-2xs"
                                >
                                  <Check className="w-3.5 h-3.5" /> Xác nhận đã sửa
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Live Visual Rendering with KaTeX */
                            <div className="mt-2.5 space-y-2.5">
                              {/* Question Stem */}
                              <div className="text-xs sm:text-sm text-slate-900 leading-relaxed font-normal">
                                <MathView text={q.content} />
                              </div>

                              {/* Image preview if extracted */}
                              {q.imageUrl && (
                                <div className="my-2 max-w-sm rounded-lg overflow-hidden border border-slate-200">
                                  <img
                                    src={q.imageUrl}
                                    alt="Minh họa câu hỏi"
                                    className="w-full h-auto object-contain"
                                  />
                                </div>
                              )}

                              {/* Part 1: Options render */}
                              {q.part === 'PART_1' && q.options && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  {q.options.map((opt) => (
                                    <div
                                      key={opt.id}
                                      className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${
                                        q.correctOption === opt.id
                                          ? 'border-blue-400 bg-blue-50/50 font-medium'
                                          : 'border-slate-200 bg-slate-50/40 text-slate-700'
                                      }`}
                                    >
                                      <span
                                        className={`w-5 h-5 rounded-full font-bold text-[11px] flex items-center justify-center shrink-0 ${
                                          q.correctOption === opt.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white border border-slate-300 text-slate-600'
                                        }`}
                                      >
                                        {opt.id}
                                      </span>
                                      <div className="flex-1">
                                        <MathView text={opt.content} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Part 2: Statements render */}
                              {q.part === 'PART_2' && q.statements && (
                                <div className="space-y-1.5 pt-1">
                                  {q.statements.map((stmt) => (
                                    <div
                                      key={stmt.id}
                                      className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50/40 text-xs gap-2"
                                    >
                                      <div className="flex items-start gap-2">
                                        <span className="font-bold text-slate-700">{stmt.id})</span>
                                        <MathView text={stmt.content} />
                                      </div>
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                          stmt.isCorrect
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : 'bg-rose-100 text-rose-800'
                                        }`}
                                      >
                                        {stmt.isCorrect ? 'ĐÚNG' : 'SAI'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Part 3: Short answer render */}
                              {q.part === 'PART_3' && (
                                <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-200 flex items-center justify-between text-xs">
                                  <span className="text-amber-900 font-semibold">
                                    Đáp án chính xác: <span className="font-bold text-amber-950 font-mono">{q.shortAnswer || '(Chưa nhập)'}</span>
                                  </span>
                                  {q.roundingRule && (
                                    <span className="text-[11px] text-amber-700 italic">
                                      ({q.roundingRule})
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Part 4: Essay rubric render */}
                              {q.part === 'PART_4' && q.essayRubric && (
                                <div className="p-2.5 bg-rose-50/50 rounded-lg border border-rose-200 text-xs text-rose-900">
                                  <span className="font-bold block mb-1">Thang điểm chấm:</span>
                                  <p className="whitespace-pre-line text-[11px]">{q.essayRubric}</p>
                                </div>
                              )}

                              {/* Explanation */}
                              {q.explanation && (
                                <div className="p-2 bg-blue-50/40 border border-blue-200/60 rounded-lg text-xs text-slate-700">
                                  <span className="font-semibold text-blue-900 block mb-0.5">Lời giải chi tiết:</span>
                                  <MathView text={q.explanation} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition"
          >
            Hủy bỏ
          </button>

          {detectedQuestions.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 hidden sm:inline font-medium">
                Đã sẵn sàng lưu {detectedQuestions.length} câu hỏi
              </span>
              <button
                type="button"
                onClick={handleSaveExam}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Lưu đề vào hệ thống</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordPdfImportModal;
