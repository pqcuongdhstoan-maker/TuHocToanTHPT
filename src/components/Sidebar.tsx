import React, { useEffect, useState } from 'react';
import {
  School,
  UploadCloud,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Key,
} from 'lucide-react';
import { User, GradeLevel } from '../types';
import { geminiClientService } from '../services/geminiClientService';

export type ActiveTab =
  | 'home'
  | 'practice'
  | 'mock_exam'
  | 'graph'
  | 'arena'
  | 'ai_tutor'
  | 'stats'
  | 'admin';

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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  selectedGrade?: GradeLevel;
  onSelectGrade?: (grade: GradeLevel) => void;
  onOpenApiKeyModal?: () => void;
}

interface MenuItem {
  id: ActiveTab | 'auth';
  label: string;
  iconUrl: string;
  badge?: string;
  isAuth?: boolean;
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
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
  selectedGrade = 12,
  onSelectGrade,
  onOpenApiKeyModal,
}) => {
  const isMobile = isMobileOpen ?? mobileOpen ?? false;
  const isTeacherOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'teacher';

  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  useEffect(() => {
    setHasApiKey(geminiClientService.hasApiKey());
  }, []);

  const [localCollapsed, setLocalCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('beedemy_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : localCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setLocalCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem('beedemy_sidebar_collapsed', String(next));
        return next;
      });
    }
  };

  // Keyboard shortcut: Ctrl + B or Cmd + B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse]);

  // Main navigation items matching the user's reference images
  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'TRANG CHỦ',
      iconUrl: '/icons/sidebar/home.png',
    },
    {
      id: 'practice',
      label: 'LUYỆN TẬP',
      iconUrl: '/icons/sidebar/practice.png',
    },
    {
      id: 'mock_exam',
      label: 'THI THỬ',
      iconUrl: '/icons/sidebar/mock_exam.png',
    },
    {
      id: 'stats',
      label: 'THỐNG KÊ',
      iconUrl: '/icons/sidebar/stats.png',
    },
    // If not logged in, display the Key item matching reference screenshot
    ...(!currentUser
      ? [
          {
            id: 'auth' as const,
            label: 'ĐĂNG NHẬP',
            iconUrl: '/icons/sidebar/auth.png',
            isAuth: true,
          },
        ]
      : []),
    {
      id: 'graph',
      label: 'ĐỒ THỊ HÀM SỐ',
      iconUrl: '/icons/sidebar/graph.png',
      badge: 'D3',
    },
    {
      id: 'arena',
      label: 'ĐẤU TRƯỜNG 60S',
      iconUrl: '/icons/sidebar/arena.png',
      badge: 'Game',
    },
    {
      id: 'ai_tutor',
      label: 'TRỢ LÝ AI',
      iconUrl: '/icons/sidebar/ai_tutor.png',
      badge: 'Gemini',
    },
    ...(isTeacherOrAdmin
      ? [
          {
            id: 'admin' as ActiveTab,
            label: 'QUẢN TRỊ',
            iconUrl: '/icons/sidebar/admin.png',
          },
        ]
      : []),
  ];

  const handleItemClick = (item: MenuItem) => {
    if (item.isAuth) {
      onOpenAuth();
    } else {
      onSelectTab(item.id as ActiveTab);
    }
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
        className={`fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 ease-in-out select-none ${
          isMobile
            ? 'w-64 translate-x-0 shadow-2xl'
            : isCollapsed
            ? 'w-20 -translate-x-full lg:translate-x-0'
            : 'w-64 -translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header, Grade Selector & Navigation Links */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          {/* Header Branding */}
          {isCollapsed && !isMobile ? (
            <div className="py-4 border-b border-slate-100 flex flex-col items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-blue-500/25">
                B
              </div>
              <button
                type="button"
                onClick={toggleCollapse}
                title="Mở rộng thanh bên (Ctrl+B)"
                aria-label="Mở rộng thanh bên"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Collapsed Grade Switcher */}
              <div className="relative group flex justify-center mt-1">
                <button
                  type="button"
                  onClick={() =>
                    onSelectGrade?.(
                      selectedGrade === 12 ? 10 : ((selectedGrade + 1) as GradeLevel)
                    )
                  }
                  className="px-2 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[11px] border border-blue-200/70 transition shadow-2xs active:scale-95"
                  aria-label="Đổi khối lớp"
                >
                  Lớp {selectedGrade}
                </button>
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-50">
                  Đang chọn Lớp {selectedGrade} (Bấm để đổi)
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-blue-500/25 shrink-0">
                    B
                  </div>
                  <div className="overflow-hidden">
                    <h1 className="font-extrabold text-base text-slate-900 leading-tight tracking-tight uppercase truncate">
                      BEEDEMY
                    </h1>
                    <p className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 mt-0.5 truncate">
                      <School className="w-3 h-3 shrink-0" /> THPT Đức Hòa
                    </p>
                  </div>
                </div>

                {/* Desktop Collapse Toggle Button */}
                <button
                  type="button"
                  onClick={toggleCollapse}
                  title="Thu gọn thanh bên (Ctrl+B)"
                  aria-label="Thu gọn thanh bên"
                  className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Grade Selector Pills */}
              <div className="mt-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1 flex items-center justify-between">
                  <span>Khối lớp</span>
                  <span className="text-blue-600 text-[10px]">SGK KNTT</span>
                </div>
                <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl">
                  {([10, 11, 12] as GradeLevel[]).map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => onSelectGrade?.(grade)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
                        selectedGrade === grade
                          ? 'bg-white text-blue-700 shadow-xs font-extrabold ring-1 ring-slate-200/80'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Lớp {grade}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className={isCollapsed && !isMobile ? 'p-2 space-y-2' : 'p-3 space-y-1.5'}>
            {menuItems.map((item) => {
              const isActive = !item.isAuth && activeTab === item.id;

              if (isCollapsed && !isMobile) {
                // Collapsed item matching media_1789458216667.png
                return (
                  <div key={item.id} className="relative group flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-[#e6f4ea] shadow-xs'
                          : 'hover:bg-slate-100/80 active:scale-95'
                      }`}
                      aria-label={item.label}
                    >
                      <img
                        src={item.iconUrl}
                        alt={item.label}
                        className="w-7 h-7 object-contain drop-shadow-xs transition-transform group-hover:scale-110"
                        loading="lazy"
                      />
                    </button>

                    {/* Floating Tooltip */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1 transition-all duration-150 z-50 flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase bg-blue-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }

              // Expanded item matching media_1789458225064.png
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-extrabold tracking-wide transition-all group ${
                    isActive
                      ? 'bg-[#e6f4ea] text-[#0a6640] shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={item.iconUrl}
                      alt={item.label}
                      className="w-7 h-7 object-contain shrink-0 drop-shadow-xs transition-transform group-hover:scale-110"
                      loading="lazy"
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase ${
                          isActive
                            ? 'bg-emerald-200/70 text-emerald-900'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {/* Active dot indicator on right side */}
                    {isActive && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0a6640] shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}

            {/* Quick Action: Word/PDF Import */}
            <div className="pt-2">
              {isCollapsed && !isMobile ? (
                <div className="relative group flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenImportModal();
                      onCloseMobile();
                    }}
                    className="w-12 h-12 rounded-2xl bg-blue-50 hover:bg-blue-100/80 text-blue-700 border border-blue-200/70 flex items-center justify-center transition shadow-2xs group"
                    aria-label="Nhập đề từ Word / PDF"
                  >
                    <UploadCloud className="w-5 h-5 text-blue-600 transition-transform group-hover:scale-110" />
                  </button>
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1 transition-all duration-150 z-50">
                    Nhập đề từ Word / PDF
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onOpenImportModal();
                    onCloseMobile();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 hover:bg-blue-100/80 text-blue-700 border border-blue-200/70 rounded-2xl text-xs font-bold transition shadow-2xs"
                >
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  <span>Nhập đề từ Word / PDF</span>
                </button>
              )}
            </div>

            {/* Action: Lấy API key để sử dụng app (AI_INSTRUCTIONS.md Section 2) */}
            <div className="pt-1">
              {isCollapsed && !isMobile ? (
                <div className="relative group flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenApiKeyModal?.();
                      setHasApiKey(geminiClientService.hasApiKey());
                    }}
                    className="w-12 h-12 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/90 flex items-center justify-center transition shadow-2xs group relative"
                    aria-label="Lấy API key để sử dụng app"
                  >
                    <Key className="w-5 h-5 text-rose-600 transition-transform group-hover:scale-110" />
                    <span
                      className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                        hasApiKey ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'
                      }`}
                    />
                  </button>
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1 transition-all duration-150 z-50 flex items-center gap-1.5">
                    <span>Lấy API key để sử dụng app</span>
                    <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onOpenApiKeyModal?.();
                    setHasApiKey(geminiClientService.hasApiKey());
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-rose-50 hover:bg-rose-100/90 border border-rose-200/90 text-rose-700 rounded-2xl text-xs font-extrabold transition shadow-2xs group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Key className="w-4 h-4 text-rose-600 group-hover:rotate-12 transition-transform shrink-0" />
                    <span className="truncate">Lấy API key để dùng app</span>
                  </div>
                  {hasApiKey ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Đã có API Key" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" title="Chưa có API Key" />
                  )}
                </button>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom Section: User Profile & Role Switcher */}
        <div className={`border-t border-slate-100 bg-white ${isCollapsed && !isMobile ? 'p-2 space-y-2' : 'p-4 space-y-3'}`}>
          {isCollapsed && !isMobile ? (
            <div className="flex flex-col items-center gap-2">
              {currentUser ? (
                <>
                  <div className="relative group">
                    <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/25 cursor-pointer">
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-50">
                      <p className="font-extrabold">{currentUser.fullName}</p>
                      <p className="text-[10px] text-blue-300 font-normal">
                        {isTeacherOrAdmin ? 'Giáo viên' : `Lớp ${currentUser.className || '12'}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onLogout}
                    title="Đăng xuất"
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onSwitchDemoUser?.(isTeacherOrAdmin ? 'student' : 'teacher')}
                  title={`Đổi vai trò (${isTeacherOrAdmin ? 'Học sinh' : 'Giáo viên'})`}
                  className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                >
                  <GraduationCap className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <>
              {/* User Status Bar */}
              {currentUser ? (
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {currentUser.fullName}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        {isTeacherOrAdmin ? (
                          <span className="text-blue-600 font-semibold">Giáo viên</span>
                        ) : (
                          <span>Lớp {currentUser.className || '12A1'}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Đăng xuất"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition"
                >
                  <img src="/icons/sidebar/auth.png" alt="Key" className="w-4 h-4 object-contain brightness-200" />
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

              {/* Footer links */}
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
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
