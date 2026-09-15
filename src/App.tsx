import React, { useState, useEffect } from 'react';
import { User, GradeLevel, Chapter, Lesson } from './types';
import Sidebar, { ActiveTab } from './components/Sidebar';
import Navbar from './components/Navbar';
import WordPdfImportModal from './components/WordPdfImportModal';
import ExamTakingView from './components/ExamTakingView';
import AuthModal from './components/AuthModal';
import FunctionGraphPlotter from './components/FunctionGraphPlotter';
import MathArenaModal from './components/MathArenaModal';
import ApiKeyModal from './components/ApiKeyModal';
import { clientDataService } from './services/clientDataService';
import { geminiClientService } from './services/geminiClientService';

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

  // User state
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'user-std-1',
    username: 'student1',
    fullName: 'Nguyễn Văn An',
    role: 'student',
    grade: 12,
    className: '12A1',
    school: 'THPT Đức Hòa',
  });

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

  const handleLogout = () => {
    setCurrentUser(null);
  };

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
        onSwitchDemoUser={(role) => {
          if (role === 'teacher') {
            setCurrentUser({
              id: 'u-admin-1',
              username: 'admin',
              fullName: 'Thầy Phan Quốc Cường',
              role: 'admin',
              grade: 12,
              className: 'GV',
              status: 'active',
              createdAt: new Date().toISOString(),
            });
          } else {
            setCurrentUser({
              id: 'user-std-1',
              username: 'student1',
              fullName: 'Nguyễn Văn An',
              role: 'student',
              grade: selectedGrade,
              className: `${selectedGrade}A1`,
              status: 'active',
              createdAt: new Date().toISOString(),
            });
          }
        }}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Sticky Top Navbar */}
        <Navbar
          onToggleMobile={() => setIsMobileOpen(!isMobileOpen)}
          currentUser={currentUser}
          selectedGrade={selectedGrade}
          onSelectGrade={(grade) => {
            setSelectedGrade(grade);
          }}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        />

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
                <AdminView
                  currentUser={currentUser}
                  onOpenImportModal={() => setIsImportModalOpen(true)}
                />
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
