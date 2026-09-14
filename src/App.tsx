import React, { useState, useEffect } from 'react';
import { User, GradeLevel, Chapter, Lesson } from './types';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import WordPdfImportModal from './components/WordPdfImportModal';
import ExamTakingView from './components/ExamTakingView';
import AuthModal from './components/AuthModal';

import HomeView from './views/HomeView';
import PracticeView from './views/PracticeView';
import MockExamView from './views/MockExamView';
import AiTutorView from './views/AiTutorView';
import StatsView from './views/StatsView';
import AdminView from './views/AdminView';

export default function App() {
  // Navigation & Screen state
  const [activeTab, setActiveTab] = useState<
    'home' | 'practice' | 'mock_exam' | 'ai_tutor' | 'stats' | 'admin'
  >('home');
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
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Cross-view context passing (e.g. ask AI about a specific question from exam view)
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(undefined);

  // Global chapters & lessons for modal binding
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    async function loadCurriculum() {
      try {
        const [cRes, lRes] = await Promise.all([
          fetch('/api/curriculum/chapters'),
          fetch('/api/curriculum/lessons'),
        ]);
        const cData = await cRes.json();
        const lData = await lRes.json();
        setAllChapters(cData.chapters || []);
        setAllLessons(lData.lessons || []);
      } catch (err) {
        console.warn('Initial curriculum load warning:', err);
      }
    }
    loadCurriculum();
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
          setActiveTab(tab);
          setActiveExamId(null); // Return from active exam when navigating
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0 transition-all">
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
    </div>
  );
}
