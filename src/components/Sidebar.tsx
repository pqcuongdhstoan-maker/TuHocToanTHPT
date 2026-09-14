import React from 'react';
import {
  Home,
  BookOpen,
  FileEdit,
  GraduationCap,
  Sparkles,
  BarChart3,
  Settings,
  UploadCloud,
  LogOut,
  Key,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  School,
  FileText,
  LineChart,
  Trophy,
  Flame,
} from 'lucide-react';
import { User } from '../types';

export type ActiveTab = 'home' | 'practice' | 'mock_exam' | 'graph' | 'arena' | 'ai_tutor' | 'stats' | 'admin';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSwitchDemoUser?: (role: 'teacher' | 'student') => void;
  onOpenImportModal: () => void;
  isMobileOpen?: boolean;
  mobileOpen?: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onOpenAuth,
  onLogout,
  onSwitchDemoUser,
  onOpenImportModal,
  isMobileOpen,
  mobileOpen,
  onCloseMobile,
}) => {
  const isMobile = isMobileOpen ?? mobileOpen ?? false;
  const isTeacherOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'teacher';

  const menuItems = [
    {
      id: 'home' as ActiveTab,
      label: 'TRANG CHỦ',
      icon: Home,
      iconColor: 'text-amber-500',
    },
    {
      id: 'practice' as ActiveTab,
      label: 'LUYỆN TẬP',
      icon: BookOpen,
      iconColor: 'text-blue-600',
    },
    {
      id: 'graph' as ActiveTab,
      label: 'ĐỒ THỊ HÀM SỐ',
      icon: LineChart,
      iconColor: 'text-emerald-500',
      badge: 'D3',
    },
    {
      id: 'arena' as ActiveTab,
      label: 'ĐẤU TRƯỜNG 60S',
      icon: Trophy,
      iconColor: 'text-amber-500',
      badge: 'Game',
    },
    {
      id: 'mock_exam' as ActiveTab,
      label: 'THI THỬ',
      icon: FileEdit,
      iconColor: 'text-rose-500',
    },
    {
      id: 'stats' as ActiveTab,
      label: 'THỐNG KÊ',
      icon: BarChart3,
      iconColor: 'text-indigo-500',
    },
    {
      id: 'ai_tutor' as ActiveTab,
      label: 'TRỢ LÝ AI',
      icon: Sparkles,
      iconColor: 'text-sky-500',
      badge: 'Gemini',
    },
    ...(isTeacherOrAdmin
      ? [
          {
            id: 'admin' as ActiveTab,
            label: 'QUẢN TRỊ',
            icon: Settings,
            iconColor: 'text-slate-600',
          },
        ]
      : []),
  ];

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-white border-r border-slate-100 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top Branding Section */}
        <div>
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-blue-500/25">
                B
              </div>
              <div className="overflow-hidden">
                <h1 className="font-extrabold text-base text-slate-900 leading-tight tracking-tight uppercase">
                  BEEDEMY
                </h1>
                <p className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 mt-0.5">
                  <School className="w-3 h-3 shrink-0" /> THPT Đức Hòa • Thầy Cường
                </p>
              </div>
            </div>

            <div className="mt-3 bg-blue-50/80 border border-blue-100 rounded-xl p-2.5">
              <p className="text-[11px] text-blue-950 font-bold">
                Tự học Toán THPT 10 • 11 • 12
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-blue-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                <span>Chuẩn SGK Kết nối tri thức</span>
              </div>
            </div>
          </div>

          {/* Navigation Links (Matching Image 1, 2, 3, 4) */}
          <nav className="p-3 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold tracking-wide transition-all group ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-blue-700' : item.iconColor
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold uppercase ${
                          isActive
                            ? 'bg-blue-200/70 text-blue-800'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {/* Active dot indicator on the right side from screenshot */}
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}

            {/* Login item if not logged in (Matching screenshot item ĐĂNG NHẬP) */}
            {!currentUser && (
              <button
                onClick={() => {
                  onOpenAuth();
                  onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold tracking-wide text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-amber-500 transition-transform group-hover:scale-110" />
                  <span>ĐĂNG NHẬP</span>
                </div>
              </button>
            )}

            {/* Quick Action: Word/PDF Import Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  onOpenImportModal();
                  onCloseMobile();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 hover:bg-blue-100/80 text-blue-700 border border-blue-200/70 rounded-2xl text-xs font-bold transition shadow-2xs"
              >
                <UploadCloud className="w-4 h-4 text-blue-600" />
                <span>Nhập đề từ Word / PDF</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom Section: Footer Links & User Profile (Matching Screenshot 3) */}
        <div className="p-4 border-t border-slate-100 bg-white space-y-3">
          {/* User Status Bar */}
          {currentUser ? (
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {currentUser.fullName}
                  </p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    {currentUser.role === 'admin' || currentUser.role === 'teacher' ? (
                      <span className="text-blue-600 font-semibold">Giáo viên</span>
                    ) : (
                      <span>Lớp {currentUser.className || '12A1'}</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Đăng xuất"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition"
            >
              <Key className="w-4 h-4" />
              <span>Đăng nhập tài khoản</span>
            </button>
          )}

          {/* Demo account quick switcher */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 px-1 flex items-center justify-between">
              <span>Đổi vai trò:</span>
              <span className="text-[9px] text-blue-600 font-bold">1-Click</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => onSwitchDemoUser?.('student')}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium text-center transition ${
                  currentUser?.role === 'student'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Học sinh
              </button>
              <button
                type="button"
                onClick={() => onSwitchDemoUser?.('teacher')}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium text-center transition ${
                  isTeacherOrAdmin
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Giáo viên
              </button>
            </div>
          </div>

          {/* Footer links from Screenshot 3 */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-[11px] text-slate-400 font-medium">
            <a href="#about" onClick={(e) => e.preventDefault()} className="hover:text-slate-600 transition">
              Về chúng tôi
            </a>
            <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-slate-600 transition">
              Điều khoản
            </a>
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-slate-600 transition">
              Bảo mật
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
