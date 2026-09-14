import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Clock,
  Award,
  UploadCloud,
  FileCheck2,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  FileEdit,
  FileText,
} from 'lucide-react';
import { GradeLevel, Exam } from '../types';

interface MockExamViewProps {
  selectedGrade: GradeLevel;
  onSelectGrade: (grade: GradeLevel) => void;
  onStartExam: (examId: string) => void;
  onOpenImportModal: () => void;
}

export const MockExamView: React.FC<MockExamViewProps> = ({
  selectedGrade,
  onSelectGrade,
  onStartExam,
  onOpenImportModal,
}) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    async function loadExams() {
      setLoading(true);
      try {
        const res = await fetch(`/api/exams?grade=${selectedGrade}&type=mock_exam`);
        const data = await res.json();
        if (mounted) {
          setExams(data.exams || []);
        }
      } catch (err) {
        console.error('Failed loading mock exams:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadExams();
    return () => {
      mounted = false;
    };
  }, [selectedGrade]);

  const gradeOptions = [
    { grade: 10 as GradeLevel, title: 'Lớp 10' },
    { grade: 11 as GradeLevel, title: 'Lớp 11' },
    { grade: 12 as GradeLevel, title: 'Lớp 12' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 bg-white text-slate-900">
      {/* SECTION: "CHỌN LỚP" (Exact match to Screenshot 4) */}
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-[11px] font-black tracking-wider uppercase text-blue-600 block mb-1">
              THI THỬ
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Chọn lớp
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Bạn muốn thi thử lớp mấy?
            </p>
          </div>

          <button
            onClick={onOpenImportModal}
            className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/70 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-2xs"
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            <span>Nhập đề Word/PDF</span>
          </button>
        </div>

        {/* 3 3D Class Cards Side by Side (Exact match to Screenshot 4 with Exam Paper Icon) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl">
          {gradeOptions.map((opt) => {
            const isSelected = selectedGrade === opt.grade;
            return (
              <div
                key={opt.grade}
                onClick={() => onSelectGrade(opt.grade)}
                className={`group bg-white rounded-3xl p-6 text-center cursor-pointer transition-all border-2 border-b-4 ${
                  isSelected
                    ? 'border-blue-600 border-b-blue-700 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20'
                    : 'border-slate-200 border-b-slate-300 hover:border-blue-400 hover:border-b-blue-500 hover:shadow-md'
                }`}
              >
                {/* Soft rounded icon box with exam paper/pencil icon */}
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mx-auto mb-3.5 shadow-2xs group-hover:scale-105 transition-transform">
                  <FileEdit className="w-7 h-7 text-blue-600" />
                </div>

                <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-blue-600 transition">
                  {opt.title}
                </h3>
              </div>
            );
          })}
        </div>
      </div>

      {/* Structure Guide Card */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-800 tracking-wider">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Cấu trúc 4 Phần thi chuẩn Bộ Giáo dục & Đào tạo:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-white p-4 rounded-2xl border border-blue-200/90 text-blue-950 shadow-2xs">
            <span className="font-bold block text-blue-700 text-[11px] uppercase">Phần I: TN 4 Phương án</span>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">Chọn 1 đáp án đúng duy nhất. 0.25 điểm mỗi câu.</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-purple-200 text-purple-950 shadow-2xs">
            <span className="font-bold block text-purple-700 text-[11px] uppercase">Phần II: Đúng / Sai</span>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">Mỗi câu có 4 ý a, b, c, d. Điểm lũy tiến 0.1, 0.25, 0.5, 1.0 đ.</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-amber-200 text-amber-950 shadow-2xs">
            <span className="font-bold block text-amber-700 text-[11px] uppercase">Phần III: Trả lời ngắn</span>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">Điền số hoặc phân số tối giản. 0.5 điểm mỗi câu.</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-rose-200 text-rose-950 shadow-2xs">
            <span className="font-bold block text-rose-700 text-[11px] uppercase">Phần IV: Tự luận</span>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">Trình bày bài giải chi tiết, có thể chụp ảnh tải lên.</p>
          </div>
        </div>
      </div>

      {/* Mock Exams List */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">
            Danh sách đề thi thử Lớp {selectedGrade} ({exams.length} đề)
          </h2>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Định dạng GDPT 2018
          </span>
        </div>

        {exams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white border-2 border-slate-100 hover:border-blue-400 rounded-3xl p-6 sm:p-7 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
          >
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-black">
                  Đề số {exam.version || 1}
                </span>
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> Thời gian: {exam.timeMinutes} phút
                </span>
                <span className="text-xs text-slate-400">
                  • Tổng {exam.questions?.length || exam.questionCount || 0} câu
                </span>
              </div>

              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                {exam.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {exam.description}
              </p>

              {/* Part badges */}
              <div className="flex items-center gap-2 pt-1 text-[10px] font-bold flex-wrap">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                  Phần I: {exam.part1Count || 4} câu
                </span>
                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg">
                  Phần II: {exam.part2Count || 2} câu
                </span>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg">
                  Phần III: {exam.part3Count || 2} câu
                </span>
                <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg">
                  Phần IV: {exam.part4Count || 1} câu
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onStartExam(exam.id)}
                className="w-full md:w-auto px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
              >
                <span>Vào thi thử ngay</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {exams.length === 0 && !loading && (
          <div className="bg-white border-2 border-slate-100 rounded-3xl p-12 text-center space-y-4">
            <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-base">Chưa có đề thi thử cho Lớp {selectedGrade}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Bạn có thể nhập ngay một đề thi thử từ tệp Word hoặc PDF bằng công cụ tự động nhận diện 4 phần.
            </p>
            <button
              type="button"
              onClick={onOpenImportModal}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-full text-xs font-bold hover:bg-blue-700 transition shadow-md shadow-blue-500/20"
            >
              Nhập đề thi thử từ Word/PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockExamView;
