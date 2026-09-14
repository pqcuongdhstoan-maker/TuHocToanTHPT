import React from 'react';
import { Menu, Sparkles, UploadCloud, Bell, BookOpen } from 'lucide-react';
import { User, GradeLevel } from '../types';

interface NavbarProps {
  onToggleMobile: () => void;
  currentUser: User | null;
  selectedGrade: GradeLevel;
  onSelectGrade: (grade: GradeLevel) => void;
  onOpenImportModal: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobile,
  currentUser,
  selectedGrade,
  onSelectGrade,
  onOpenImportModal,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Brand & Grade selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobile}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            aria-label="Mở thực đơn"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mini brand icon visible on mobile / desktop header */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs shadow-blue-500/30">
              B
            </div>
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">
              Beedemy
            </span>
          </div>

          {/* Grade selection pills */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl">
            {([10, 11, 12] as GradeLevel[]).map((grade) => (
              <button
                key={grade}
                onClick={() => onSelectGrade(grade)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedGrade === grade
                    ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lớp {grade}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium border-l border-slate-200 pl-3">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>SGK Kết nối tri thức</span>
          </div>
        </div>

        {/* Right: Actions (Word/PDF, AI Badge, Action Button from Image 5) */}
        <div className="flex items-center gap-2.5">
          {/* Quick Word/PDF import */}
          <button
            onClick={onOpenImportModal}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100/80 text-blue-700 border border-blue-200/70 rounded-xl text-xs font-bold transition"
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            <span>Nhập đề Word/PDF</span>
          </button>

          {/* AI Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50/70 border border-blue-200/60 rounded-xl text-[11px] font-bold text-blue-700">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="hidden sm:inline">AI Gemini 3.8</span>
          </div>

          {/* User Account / "Vào học ngay" button from Image 5 */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500">
                  {currentUser.role === 'admin' || currentUser.role === 'teacher' ? 'Giáo viên' : `Học sinh ${currentUser.className || '12A1'}`}
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition shadow-md shadow-blue-500/20"
            >
              Vào học ngay
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
