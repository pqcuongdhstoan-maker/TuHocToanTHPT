import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  UploadCloud,
  Flame,
  Award,
  ArrowRight,
  CheckCircle2,
  School,
  Clock,
  ChevronRight,
  FileEdit,
  ShieldCheck,
  Zap,
  LineChart,
} from 'lucide-react';
import { GradeLevel, User } from '../types';
import MathView from '../components/MathView';

interface HomeViewProps {
  currentUser: User | null;
  selectedGrade: GradeLevel;
  onSelectGrade: (grade: GradeLevel) => void;
  onNavigateTab: (tab: any) => void;
  onStartExam: (examId: string) => void;
  onOpenImportModal: () => void;
  onOpenAuth: () => void;
  onOpenArena?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  selectedGrade,
  onSelectGrade,
  onNavigateTab,
  onStartExam,
  onOpenImportModal,
  onOpenAuth,
  onOpenArena,
}) => {
  // Interactive quiz card state (Matching exact quiz in Image 5)
  const [selectedQuizOption, setSelectedQuizOption] = useState<string>('B');
  const [isExplanationOpen, setIsExplanationOpen] = useState<boolean>(true);

  const heroQuiz = {
    title: 'Toán 10 · Hàm số bậc hai',
    streak: '12 ngày liên tiếp',
    questionNumber: 'CÂU 4 / 10 · TRẮC NGHIỆM',
    question: 'Đỉnh của parabol $y = x^2 - 4x + 3$ có tọa độ là?',
    options: [
      { id: 'A', text: '$(1; -2)$', isCorrect: false },
      { id: 'B', text: '$(2; -1)$', isCorrect: true },
      { id: 'C', text: '$(-2; 1)$', isCorrect: false },
      { id: 'D', text: '$(4; 3)$', isCorrect: false },
    ],
    explanation: 'Hoành độ đỉnh $x = -b / (2a) = 2$, thay vào hàm số được $y = (2)^2 - 4(2) + 3 = -1$. Do đó đỉnh parabol là $(2; -1)$.',
  };

  const gradeCards = [
    {
      grade: 10 as GradeLevel,
      title: 'Lớp 10',
      subtitle: '1 môn học →',
      desc: 'Mệnh đề, BPT bậc nhất 2 ẩn, Hệ thức lượng, Vectơ, Hàm số bậc hai, Phương pháp tọa độ, Xác suất cổ điển.',
    },
    {
      grade: 11 as GradeLevel,
      title: 'Lớp 11',
      subtitle: '1 môn học →',
      desc: 'Lượng giác, Dãy số - Cấp số, Giới hạn, Hình học không gian, Hàm số mũ & Lôgarit, Đạo hàm, Xác suất.',
    },
    {
      grade: 12 as GradeLevel,
      title: 'Lớp 12',
      subtitle: '1 môn học →',
      desc: 'Ứng dụng đạo hàm khảo sát hàm số, Vectơ Oxyz, Nguyên hàm - Tích phân, Tọa độ Oxyz, Xác suất có điều kiện.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-16 bg-white text-slate-900">
      {/* SECTION 1: HERO (Matching Screenshot 5) */}
      <div className="pt-4 lg:pt-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Headline, Pill tag, Description, Action Buttons */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Lớp 10 · 11 · 12 — Chuẩn SGK Kết nối tri thức</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.15] text-slate-900">
            Luyện thi Toán THPT <br className="hidden sm:inline" />
            <span className="text-blue-600">chuẩn cấu trúc</span>, <br className="hidden sm:inline" />
            trúng trọng tâm.
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl font-normal">
            Thay vì giải đề tràn lan, hệ thống Tự học toán THPT giúp bạn khoanh vùng kiến thức, chia nhỏ thành từng dạng bài cụ thể. Quét sạch 3 định dạng câu hỏi của đề thi tốt nghiệp THPT môn Toán với lời giải thích cặn kẽ từng bước.
          </p>

          <div className="pt-2 flex items-center flex-wrap gap-3.5">
            <button
              onClick={() => onNavigateTab('practice')}
              className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full text-sm transition shadow-lg shadow-blue-500/25 flex items-center gap-2 group"
            >
              <span>Học thử ngay</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('class-selector-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-full text-sm transition border border-slate-200 shadow-2xs"
            >
              Xem tính năng
            </button>
          </div>
        </div>

        {/* Right Column: Realistic Phone-style Quiz Card Mockup (Exact match to Image 5) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-md bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-2xl shadow-blue-500/10 space-y-5 transition-all">
            {/* Top Bar: Subject & Streak */}
            <div className="flex items-center justify-between text-xs pb-1">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-xl font-bold">
                {heroQuiz.title}
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{heroQuiz.streak}</span>
              </span>
            </div>

            {/* Question Counter & Text */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                {heroQuiz.questionNumber}
              </span>
              <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                <MathView text={heroQuiz.question} />
              </h3>
            </div>

            {/* Options A, B, C, D (Matching Image 5 layout) */}
            <div className="space-y-2.5">
              {heroQuiz.options.map((opt) => {
                const isSelected = selectedQuizOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedQuizOption(opt.id)}
                    className={`w-full p-3 rounded-2xl border text-xs font-semibold flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600 text-blue-950 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {opt.id}
                    </span>
                    <span className="text-sm">
                      <MathView text={opt.text} />
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Explanation box (Matching Image 5) */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs space-y-1">
              <span className="font-bold text-blue-900 block">
                Giải thích:
              </span>
              <p className="text-slate-700 leading-relaxed">
                <MathView text={heroQuiz.explanation} />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: BEEDEMY CALL-TO-ACTION (Matching Screenshot 3) */}
      <div className="py-8 text-center space-y-4 max-w-lg mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black tracking-wider uppercase text-slate-900">
          TỰ HỌC TOÁN THPT
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {!currentUser ? (
            <button
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-full border border-slate-200 text-xs shadow-xs transition"
            >
              Đăng nhập để xem tiến độ →
            </button>
          ) : (
            <div className="text-xs font-semibold text-slate-600">
              Chào mừng, <span className="font-bold text-blue-600">{currentUser.fullName}</span>!
            </div>
          )}

          <button
            onClick={() => onNavigateTab('practice')}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-full text-xs sm:text-sm uppercase tracking-wider transition shadow-md shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            <span>BẮT ĐẦU HỌC 🚀</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: "CHỌN LỚP" (Matching Screenshot 1 & 2) */}
      <div id="class-selector-section" className="space-y-6 pt-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Chọn lớp
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Bạn đang học lớp mấy?
          </p>
        </div>

        {/* 3 Large 3D Cards side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {gradeCards.map((card) => {
            const isSelected = selectedGrade === card.grade;
            return (
              <div
                key={card.grade}
                onClick={() => {
                  onSelectGrade(card.grade);
                  onNavigateTab('practice');
                }}
                className={`group bg-white rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all border-2 border-b-4 ${
                  isSelected
                    ? 'border-blue-600 border-b-blue-700 shadow-lg shadow-blue-500/10'
                    : 'border-slate-200 border-b-slate-300 hover:border-blue-400 hover:border-b-blue-500 hover:shadow-md'
                }`}
              >
                {/* Soft rounded icon box with graduation cap icon */}
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-2xs group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-8 h-8 text-blue-600" />
                </div>

                <h3 className="font-extrabold text-xl text-slate-900 group-hover:text-blue-600 transition">
                  {card.title}
                </h3>

                <p className="text-xs font-bold text-blue-600 mt-2 flex items-center justify-center gap-1">
                  <span>{card.subtitle}</span>
                </p>

                <p className="text-[11px] text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: MOTIVATIONAL STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Flame className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chuỗi tự học</span>
            <div className="text-xl font-extrabold text-slate-900">12 ngày liên tiếp</div>
            <span className="text-[10px] text-blue-600 font-semibold">Tăng 2 ngày so với tuần trước</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đề đã hoàn thành</span>
            <div className="text-xl font-extrabold text-slate-900">18 bài luyện tập</div>
            <span className="text-[10px] text-slate-500">Đầy đủ 4 phần GDPT 2018</span>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Điểm trung bình</span>
            <div className="text-xl font-extrabold text-slate-900">8.4 / 10.0</div>
            <span className="text-[10px] text-indigo-600 font-semibold">Tự tin chinh phục điểm 9+</span>
          </div>
        </div>
      </div>

      {/* SECTION 4.5: INTERACTIVE FEATURES (ARENA 60S & D3 GRAPH PLOTTER) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#0f5132]">ĐỘC QUYỀN TỰ HỌC TOÁN THPT</span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Học Tương Tác & Luyện Phản Xạ</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Trực quan hóa D3 & Gamification 60s</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Math Arena 60s */}
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 border-2 border-amber-200/80 rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5 hover:border-amber-400 transition-all hover:shadow-lg group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold">
                  <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  SPEED MATH 60 GIÂY
                </span>
                <span className="text-[11px] font-bold text-slate-500">Combo x1.5 • Streak</span>
              </div>
              <h4 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-amber-700 transition">
                Đấu Trường Toán Học 60s
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Rèn phản xạ tính nhẩm siêu tốc và ghi nhớ công thức lượng giác, đạo hàm, tích phân, tọa độ Oxyz. Chinh phục bảng xếp hạng điểm cao!
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  if (onOpenArena) onOpenArena();
                  else onNavigateTab('arena');
                }}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>VÀO ĐẤU TRƯỜNG NGAY ⚡</span>
              </button>
            </div>
          </div>

          {/* Card 2: D3 Graph Plotter */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-cyan-500/10 border-2 border-blue-200/80 rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5 hover:border-blue-400 transition-all hover:shadow-lg group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-extrabold">
                  <LineChart className="w-3.5 h-3.5 text-blue-600" />
                  D3.JS VISUALIZATION
                </span>
                <span className="text-[11px] font-bold text-slate-500">Lớp 10 & 12</span>
              </div>
              <h4 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-blue-700 transition">
                Khảo Sát Đồ Thị Tương Tác
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Kéo thanh trượt tham số để quan sát tức thời sự biến thiên của Parabol bậc 2, Đồ thị bậc 3, Tiệm cận đứng/ngang và Tiếp tuyến chuyển động.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigateTab('graph')}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
              >
                <LineChart className="w-4 h-4" />
                <span>KHÁM PHÁ ĐỒ THỊ D3 📊</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: AI TUTOR & WORD/PDF IMPORT PROMO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
        <div className="lg:col-span-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-8 shadow-xl shadow-blue-500/15 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 text-white">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-lg text-white">Trợ lý AI Toán học Thầy Cường</h4>
              <p className="text-xs text-blue-100 font-medium">Tích hợp mô hình Gemini 3.8 Flash</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-xl">
            Bạn đang gặp khó ở bài toán nào? AI hỗ trợ gợi ý từng bước tư duy, giải thích công thức toán học và sửa lỗi sai mà không làm lộ ngay kết quả cuối cùng.
          </p>

          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('ai_tutor')}
              className="px-6 py-3 bg-white text-blue-700 hover:bg-blue-50 rounded-full text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <span>Hỏi Trợ lý AI ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm uppercase text-slate-900">
              Dành cho Giáo viên & Quản trị
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Nhập đề tự động từ tệp Word (.docx) hoặc PDF với nhận diện 4 phần chuẩn GDPT 2018.
            </p>
          </div>

          <button
            onClick={onOpenImportModal}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs transition"
          >
            Mở công cụ nhập đề
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
