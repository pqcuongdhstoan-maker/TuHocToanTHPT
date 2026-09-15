import React, { useState, useEffect } from 'react';
import { User, GradeLevel, Chapter, Lesson } from './types';
import Sidebar, { ActiveTab } from './components/Sidebar';
import { Menu, Key } from 'lucide-react';
import WordPdfImportModal from './components/WordPdfImportModal';
import ExamTakingView from './components/ExamTakingView';
import AuthModal from './components/AuthModal';
import FunctionGraphPlotter from './components/FunctionGraphPlotter';
import MathArenaModal from './components/MathArenaModal';
import ApiKeyModal from './components/ApiKeyModal';
import { clientDataService } from './services/clientDataService';
import { geminiClientService } from './services/geminiClientService';
import { authService } from './services/authService';
import LoginPage from './components/LoginPage';

import HomeView from './views/HomeView';
import PracticeView from './views/PracticeView';
import MockExamView from './views/MockExamView';
import AiTutorView from './views/AiTutorView';
import StatsView from './views/StatsView';
import AdminView from './views/AdminView';

export default function App() {
  // Navigation & Screen state
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(12);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);

  // User & Auth state (Mandatory login enforced)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isArenaModalOpen, setIsArenaModalOpen] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('beedemy_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('beedemy_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Cross-view context passing (e.g. ask AI about a specific question from exam view)
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(undefined);

  // Global chapters & lessons for modal binding
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    async function initAuth() {
      try {
        const user = await authService.checkSession();
        if (user) {
          setCurrentUser(user);
          if (user.role === 'admin') {
            setActiveTab('admin');
          }
        }
      } catch (err) {
        console.warn('Initial session check warning:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    }
    initAuth();

    async function loadCurriculum() {
      try {
        const [cData, lData] = await Promise.all([
          clientDataService.getChapters(),
          clientDataService.getLessons(),
        ]);
        setAllChapters(cData || []);
        setAllLessons(lData || []);
      } catch (err) {
        console.warn('Initial curriculum load warning:', err);
      }
    }
    loadCurriculum();

    // Guide user to set Gemini API key if missing (AI_INSTRUCTIONS.md Section 2)
    if (!geminiClientService.hasApiKey()) {
      setIsApiKeyModalOpen(true);
    }
  }, []);

  // Handlers
  const handleStartExam = (examId: string) => {
    setActiveExamId(examId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromExam = () => {
    setActiveExamId(null);
  };

  const handleAskAiAboutQuestion = (questionText: string) => {
    setAiInitialPrompt(`Thầy hãy hướng dẫn em cách giải chi tiết câu hỏi sau: \n\n${questionText}`);
    setActiveExamId(null);
    setActiveTab('ai_tutor');
  };

  const handleImportSuccess = (createdExam: any) => {
    // Navigate to the created exam or practice tab
    if (createdExam?.type === 'mock_exam') {
      setActiveTab('mock_exam');
    } else {
      setActiveTab('practice');
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('home');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    setCurrentUser(null);
    setActiveTab('home');
  };

  // 1. Loading screen while checking authentication session
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#f0f4f3] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-[#0f5132] text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-[#0f5132]/25 animate-pulse mb-4">
          B
        </div>
        <div className="text-base font-extrabold text-slate-800 tracking-tight">TỰ HỌC TOÁN THPT</div>
        <div className="text-xs text-slate-500 mt-1 font-medium">Đang kiểm tra phiên làm việc...</div>
      </div>
    );
  }

  // 2. Unauthenticated Gate: Render dedicated standalone login page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex font-sans antialiased">
      {/* Fixed Desktop & Slide-out Mobile Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'arena') {
            setIsArenaModalOpen(true);
          } else {
            setActiveTab(tab);
            setActiveExamId(null);
          }
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onSwitchDemoUser={async (role) => {
          try {
            const res = await authService.login({
              identifier: role === 'teacher' ? 'admin' : 'student1',
              password: 'password123',
            });
            setCurrentUser(res.user);
            if (role === 'teacher') {
              setActiveTab('admin');
            } else {
              setActiveTab('home');
            }
          } catch (err) {
            console.error('Demo switch login error:', err);
          }
        }}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        selectedGrade={selectedGrade}
        onSelectGrade={(grade) => setSelectedGrade(grade)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Mobile-only header (Desktop navbar completely removed as requested) */}
        <div className="lg:hidden p-3 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition"
            aria-label="Mở thực đơn"
          >
            <Menu className="w-5 h-5 text-slate-800" />
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">Beedemy</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              Lớp {selectedGrade}
            </span>
            <button
              type="button"
              onClick={() => setIsApiKeyModalOpen(true)}
              className="p-1.5 rounded-xl text-rose-600 bg-rose-50 border border-rose-200"
              title="API Key"
            >
              <Key className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-white">
          {activeExamId ? (
            <ExamTakingView
              examId={activeExamId}
              currentUser={currentUser}
              onBack={handleBackFromExam}
              onAskAiAboutQuestion={handleAskAiAboutQuestion}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeView
                  currentUser={currentUser}
                  selectedGrade={selectedGrade}
                  onSelectGrade={setSelectedGrade}
                  onNavigateTab={setActiveTab}
                  onStartExam={handleStartExam}
                  onOpenImportModal={() => setIsImportModalOpen(true)}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  onOpenArena={() => setIsArenaModalOpen(true)}
                />
              )}

              {activeTab === 'practice' && (
                <PracticeView
                  selectedGrade={selectedGrade}
                  onSelectGrade={setSelectedGrade}
                  onStartExam={handleStartExam}
                  onOpenImportModal={() => setIsImportModalOpen(true)}
                />
              )}

              {activeTab === 'graph' && (
                <div className="max-w-6xl mx-auto space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase text-blue-600 block">D3.JS VISUALIZATION</span>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Khảo Sát Đồ Thị Tương Tác</h1>
                    <p className="text-xs text-slate-500 mt-1">Trực quan hóa hình học Parabol, Hàm bậc 3 và Tiệm cận hàm phân thức</p>
                  </div>
                  <FunctionGraphPlotter grade={selectedGrade} />
                </div>
              )}

              {activeTab === 'arena' && (
                <div className="max-w-3xl mx-auto py-12 text-center space-y-6">
                  <div className="p-8 sm:p-12 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border-2 border-blue-200 rounded-3xl space-y-4 shadow-sm">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Đấu Trường Toán Học 60s</h2>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                      Thử thách phản xạ tính nhẩm và nhớ công thức toán học nhanh trong 60 giây!
                    </p>
                    <button
                      onClick={() => setIsArenaModalOpen(true)}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-blue-500/25 transition"
                    >
                      BẮT ĐẦU CHIẾN NGAY 🚀
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'mock_exam' && (
                <MockExamView
                  selectedGrade={selectedGrade}
                  onSelectGrade={setSelectedGrade}
                  onStartExam={handleStartExam}
                  onOpenImportModal={() => setIsImportModalOpen(true)}
                />
              )}

              {activeTab === 'ai_tutor' && (
                <AiTutorView
                  currentUser={currentUser}
                  selectedGrade={selectedGrade}
                  initialQuestion={aiInitialPrompt}
                  onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
                />
              )}

              {activeTab === 'stats' && (
                <StatsView currentUser={currentUser} />
              )}

              {activeTab === 'admin' && (
                currentUser?.role === 'admin' ? (
                  <AdminView
                    currentUser={currentUser}
                    onOpenImportModal={() => setIsImportModalOpen(true)}
                  />
                ) : (
                  <div className="max-w-md mx-auto py-16 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl font-black">
                      ✕
                    </div>
                    <h2 className="text-xl font-black text-slate-800">Không có quyền truy cập</h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Khu vực Quản Trị chỉ dành riêng cho Giáo viên / Quản trị viên. Vui lòng liên hệ Thầy Phan Quốc Cường nếu cần cấp quyền.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('home')}
                      className="px-6 py-2.5 bg-[#0f5132] hover:bg-[#0a3d25] text-white font-bold rounded-xl text-xs transition shadow-sm"
                    >
                      Về Trang Chủ
                    </button>
                  </div>
                )
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-100 bg-white py-6 px-4 sm:px-8 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <span className="font-extrabold text-slate-900">BEEDEMY • TỰ HỌC TOÁN THPT</span> — Giáo viên:{' '}
              <span className="font-bold text-blue-700">Phan Quốc Cường</span> • Trường:{' '}
              <span className="font-semibold text-slate-800">THPT Đức Hòa</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Định hướng GDPT 2018 • Sách Kết nối tri thức với cuộc sống • Chuẩn cấu trúc 4 Phần thi
            </div>
          </div>
        </footer>
      </div>

      {/* Global Word / PDF 4-Part Import Modal */}
      <WordPdfImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        chapters={allChapters}
        lessons={allLessons}
        initialGrade={selectedGrade}
        onImportSuccess={handleImportSuccess}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />

      {/* Math Arena 60s Gamification Modal */}
      <MathArenaModal
        isOpen={isArenaModalOpen}
        onClose={() => setIsArenaModalOpen(false)}
        currentUser={currentUser}
        selectedGrade={selectedGrade}
      />

      {/* Model & Gemini API Key Settings Modal (AI_INSTRUCTIONS.md Section 2) */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </div>
  );
}
