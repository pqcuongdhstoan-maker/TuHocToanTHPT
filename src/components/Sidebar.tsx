import React, { useEffect, useState } from 'react';
import {
  School,
  UploadCloud,
  LogOut,
  ChevronLeft,
  ChevronRight,
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
  id: ActiveTab;
  label: string;
  iconUrl: string;
  badge?: string;
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

  // Hover-to-expand state: collapsed (Image 2) by default, expands (Image 1) on mouse hover
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('beedemy_sidebar_pinned') === 'true';
    }
    return false;
  });

  const isExpanded = isMobile || isPinned || isHovered;
  const isCollapsed = !isExpanded;

  const toggleCollapse = () => {
    setIsPinned((prev) => {
      const next = !prev;
      localStorage.setItem('beedemy_sidebar_pinned', String(next));
      return next;
    });
    if (onToggleCollapse) onToggleCollapse();
  };

  // Keyboard shortcut: Ctrl + B or Cmd + B to toggle sidebar pin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main navigation items
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

  const handleItemClick = (tabId: ActiveTab) => {
    onSelectTab(tabId);
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
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        className={`fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 ease-in-out select-none ${
          isMobile
            ? 'w-64 translate-x-0 shadow-2xl'
            : isExpanded
            ? 'w-64 translate-x-0 shadow-2xl shadow-slate-900/15'
            : 'w-20 translate-x-0'
        }`}
      >
        {/* Top Header, Grade Selector & Navigation Links */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          {/* Header Branding */}
          {isCollapsed && !isMobile ? (
            <div className="py-4 border-b border-slate-100 flex flex-col items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-[#0f5132] text-white flex items-center justify-center font-black text-xl shadow-md shadow-[#0f5132]/25">
                T
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
            </div>
          ) : (
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#0f5132] text-white flex items-center justify-center font-black text-xl shadow-md shadow-[#0f5132]/25 shrink-0">
                    T
                  </div>
                  <div className="overflow-hidden">
                    <h1 className="font-black text-sm text-slate-900 leading-tight tracking-tight uppercase truncate" title="Tự học toán THPT">
                      Tự học toán THPT
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <School className="w-3 h-3 text-[#0f5132] shrink-0" /> THPT Đức Hòa
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
            </div>
          )}

          {/* Navigation Links */}
          <nav className={isCollapsed && !isMobile ? 'p-2 space-y-2' : 'p-3 space-y-1.5'}>
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;

              if (isCollapsed && !isMobile) {
                // Collapsed item
                return (
                  <div key={item.id} className="relative group flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleItemClick(item.id)}
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

              // Expanded item
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item.id)}
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

            {/* Action: Lấy API key để sử dụng app */}
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

        {/* Bottom Section: User Profile & 1-Click Role Switcher (Matching media_1789459544282.png) */}
        <div className={`border-t border-slate-100 bg-white ${isCollapsed && !isMobile ? 'p-2 space-y-2' : 'p-3 space-y-2.5'}`}>
          {isCollapsed && !isMobile ? (
            <div className="flex flex-col items-center gap-2">
              {/* User Avatar */}
              <div className="relative group">
                <div
                  onClick={() => onSwitchDemoUser?.(isTeacherOrAdmin ? 'student' : 'teacher')}
                  className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-blue-500/25 cursor-pointer hover:scale-105 transition"
                >
                  {currentUser ? currentUser.fullName.charAt(0) : 'N'}
                </div>
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-50">
                  <p className="font-extrabold">{currentUser ? currentUser.fullName : 'Nguyễn Văn An'}</p>
                  <p className="text-[10px] text-blue-300 font-normal">
                    {isTeacherOrAdmin ? 'Giáo viên' : `Lớp ${currentUser?.className || '12A1'}`} • Bấm để đổi vai trò
                  </p>
                </div>
              </div>

              {/* 1-Click Role Pill */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => onSwitchDemoUser?.(isTeacherOrAdmin ? 'student' : 'teacher')}
                  className="w-10 h-8 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-xs border border-blue-200/70 flex items-center justify-center transition active:scale-95 shadow-2xs"
                  aria-label="Đổi vai trò 1-Click"
                >
                  {isTeacherOrAdmin ? 'GV' : 'HS'}
                </button>
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-50">
                  Đổi vai trò: Đang là {isTeacherOrAdmin ? 'Giáo viên' : 'Học sinh'} (1-Click)
                </div>
              </div>

              {/* Logout icon button */}
              {currentUser && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Đăng xuất"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Card 1: User Profile Card (Matching image 2 top card) */}
              <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-2xs">
                    {currentUser ? currentUser.fullName.charAt(0) : 'N'}
                  </div>
                  <div className="truncate">
                    <h4 className="font-extrabold text-sm text-slate-900 leading-tight truncate">
                      {currentUser ? currentUser.fullName : 'Nguyễn Văn An'}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                      {isTeacherOrAdmin
                        ? 'Giáo viên'
                        : `Lớp ${currentUser?.className || '12A1'}`}
                    </p>
                  </div>
                </div>
                {currentUser && (
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Đăng xuất"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition shrink-0"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Card 2: 1-Click Role Switcher (Matching image 2 bottom card) */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span className="text-slate-500 tracking-wider uppercase">
                    ĐỔI VAI TRÒ:
                  </span>
                  <span className="text-blue-600 font-black tracking-tight">
                    1-CLICK
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onSwitchDemoUser?.('student')}
                    className={`py-2.5 px-3 rounded-xl text-sm font-bold text-center transition ${
                      !isTeacherOrAdmin
                        ? 'bg-blue-600 text-white shadow-xs font-extrabold'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 font-medium'
                    }`}
                  >
                    Học sinh
                  </button>
                  <button
                    type="button"
                    onClick={() => onSwitchDemoUser?.('teacher')}
                    className={`py-2.5 px-3 rounded-xl text-sm font-bold text-center transition ${
                      isTeacherOrAdmin
                        ? 'bg-blue-600 text-white shadow-xs font-extrabold'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 font-medium'
                    }`}
                  >
                    Giáo viên
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
