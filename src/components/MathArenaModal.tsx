import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Trophy,
  Flame,
  Clock,
  Zap,
  RotateCcw,
  Award,
  CheckCircle2,
  AlertCircle,
  Play,
} from 'lucide-react';
import MathView from './MathView';
import { GradeLevel, User } from '../types';

interface MathArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  selectedGrade: GradeLevel;
}

interface ArenaQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const ARENA_QUESTIONS: Record<GradeLevel, ArenaQuestion[]> = {
  10: [
    {
      id: 'a10-1',
      prompt: 'Đỉnh của parabol $y = x^2 - 4x + 3$ có hoành độ là?',
      options: ['x = 2', 'x = -2', 'x = 4', 'x = 1'],
      correctAnswer: 'x = 2',
      explanation: 'Hoành độ đỉnh $x = -b / (2a) = 4 / 2 = 2$.',
    },
    {
      id: 'a10-2',
      prompt: 'Mệnh đề phủ định của mệnh đề "$\\forall x \\in \\mathbb{R}, x^2 > 0$" là gì?',
      options: ['$\\exists x \\in \\mathbb{R}, x^2 \\le 0$', '$\\forall x \\in \\mathbb{R}, x^2 \\le 0$', '$\\exists x \\in \\mathbb{R}, x^2 < 0$', '$\\forall x \\in \\mathbb{R}, x^2 < 0$'],
      correctAnswer: '$\\exists x \\in \\mathbb{R}, x^2 \\le 0$',
      explanation: 'Phủ định của $\\forall$ là $\\exists$, phủ định của $>$ là $\\le$.',
    },
    {
      id: 'a10-3',
      prompt: 'Tập hợp $A = [1; 5)$ và $B = (2; 7]$. Giao $A \\cap B$ là khoảng/đoạn nào?',
      options: ['(2; 5)', '[1; 7]', '[2; 5)', '(1; 7)'],
      correctAnswer: '(2; 5)',
      explanation: 'Các phần tử vừa thuộc $[1; 5)$ vừa thuộc $(2; 7]$ là khoảng $(2; 5)$.',
    },
    {
      id: 'a10-4',
      prompt: 'Cho tam giác $ABC$. Vectơ tổng $\\vec{AB} + \\vec{BC}$ bằng vectơ nào?',
      options: ['$\\vec{AC}$', '$\\vec{CA}$', '$\\vec{BA}$', '$\\vec{0}$'],
      correctAnswer: '$\\vec{AC}$',
      explanation: 'Theo quy tắc 3 điểm: $\\vec{AB} + \\vec{BC} = \\vec{AC}$.',
    },
    {
      id: 'a10-5',
      prompt: 'Biệt thức $\\Delta$ của phương trình $x^2 - 6x + 5 = 0$ bằng bao nhiêu?',
      options: ['16', '20', '-16', '36'],
      correctAnswer: '16',
      explanation: '$\\Delta = (-6)^2 - 4(1)(5) = 36 - 20 = 16$.',
    },
  ],
  11: [
    {
      id: 'a11-1',
      prompt: 'Đạo hàm của hàm số $y = \\sin x$ là gì?',
      options: ['$\\cos x$', '$-\\cos x$', '$\\tan x$', '$-\\sin x$'],
      correctAnswer: '$\\cos x$',
      explanation: '$(\\sin x)\' = \\cos x$.',
    },
    {
      id: 'a11-2',
      prompt: 'Giá trị của $\\cos(\\pi/3)$ bằng bao nhiêu?',
      options: ['1/2', '$\\sqrt{3}/2$', '$\\sqrt{2}/2$', '1'],
      correctAnswer: '1/2',
      explanation: '$\\cos 60^\\circ = \\cos(\\pi/3) = 1/2$.',
    },
    {
      id: 'a11-3',
      prompt: 'Cho cấp số cộng có $u_1 = 3$ và công sai $d = 2$. Số hạng $u_2$ bằng:',
      options: ['5', '6', '7', '1'],
      correctAnswer: '5',
      explanation: '$u_2 = u_1 + d = 3 + 2 = 5$.',
    },
    {
      id: 'a11-4',
      prompt: 'Đạo hàm của hàm số $y = x^4$ là:',
      options: ['$4x^3$', '$3x^4$', '$4x$', '$x^3$'],
      correctAnswer: '$4x^3$',
      explanation: '$(x^n)\' = n x^{n-1} \\Rightarrow (x^4)\' = 4x^3$.',
    },
    {
      id: 'a11-5',
      prompt: 'Giới hạn $\\lim_{n \\to +\\infty} \\frac{2n + 1}{n + 3}$ bằng:',
      options: ['2', '1', '1/3', '$+\\infty$'],
      correctAnswer: '2',
      explanation: 'Chia cả tử và mẫu cho $n$ được giới hạn bằng $2/1 = 2$.',
    },
  ],
  12: [
    {
      id: 'a12-1',
      prompt: 'Tiệm cận đứng của đồ thị hàm số $y = \\frac{2x - 1}{x - 3}$ là đường thẳng:',
      options: ['x = 3', 'x = -3', 'y = 2', 'y = -1/3'],
      correctAnswer: 'x = 3',
      explanation: 'Nghiệm mẫu số $x - 3 = 0 \\Leftrightarrow x = 3$.',
    },
    {
      id: 'a12-2',
      prompt: 'Họ nguyên hàm của hàm số $f(x) = e^x$ là:',
      options: ['$e^x + C$', '$x e^x + C$', '$-e^x + C$', '$e^{x+1} + C$'],
      correctAnswer: '$e^x + C$',
      explanation: '$\\int e^x dx = e^x + C$.',
    },
    {
      id: 'a12-3',
      prompt: 'Trong không gian $Oxyz$, mặt phẳng $(P): 2x - y + 3z - 4 = 0$ có một VTPT là:',
      options: ['(2; -1; 3)', '(2; 1; 3)', '(-2; 1; 3)', '(2; -1; -4)'],
      correctAnswer: '(2; -1; 3)',
      explanation: 'Hệ số trước $x, y, z$ là $(2; -1; 3)$.',
    },
    {
      id: 'a12-4',
      prompt: 'Hàm số $y = x^3 - 3x$ có bao nhiêu điểm cực trị?',
      options: ['2 điểm', '1 điểm', '0 điểm', '3 điểm'],
      correctAnswer: '2 điểm',
      explanation: '$y\' = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$ (2 nghiệm đổi dấu).',
    },
    {
      id: 'a12-5',
      prompt: 'Tích phân $\\int_0^1 2x dx$ có giá trị bằng:',
      options: ['1', '2', '0', '1/2'],
      correctAnswer: '1',
      explanation: '$[x^2]_0^1 = 1^2 - 0 = 1$.',
    },
  ],
};

export const MathArenaModal: React.FC<MathArenaModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  selectedGrade,
}) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'gameover'>('intro');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  const questions = ARENA_QUESTIONS[selectedGrade] || ARENA_QUESTIONS[12];
  const currentQ = questions[currentIndex % questions.length];

  // Highscore in LocalStorage
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(`arena_high_${selectedGrade}`) || '0');
    } catch {
      return 0;
    }
  });

  // Start game handler
  const handleStartGame = () => {
    setGameState('playing');
    setTimeLeft(60);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerCorrect(null);
  };

  // Timer loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('gameover');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Handle Answer selection
  const handleSelectOption = (opt: string) => {
    if (selectedOption !== null || gameState !== 'playing') return;

    setSelectedOption(opt);
    const correct = opt === currentQ.correctAnswer;
    setIsAnswerCorrect(correct);

    if (correct) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
      setCorrectCount((c) => c + 1);

      // Score formula: 100 base + combo bonus
      const bonus = Math.min(newCombo * 20, 100);
      setScore((s) => s + 100 + bonus);
    } else {
      setCombo(0);
    }

    // Delay 500ms then next question
    setTimeout(() => {
      setSelectedOption(null);
      setIsAnswerCorrect(null);
      setCurrentIndex((idx) => idx + 1);
    }, 450);
  };

  // Update Highscore on game over
  useEffect(() => {
    if (gameState === 'gameover') {
      if (score > highScore) {
        setHighScore(score);
        try {
          localStorage.setItem(`arena_high_${selectedGrade}`, String(score));
        } catch {}
      }
    }
  }, [gameState, score, highScore, selectedGrade]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-2 border-slate-100 relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* SCREEN 1: INTRO */}
        {gameState === 'intro' && (
          <div className="text-center space-y-6 py-4">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20 animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>

            <div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full uppercase tracking-wider">
                Toán Lớp {selectedGrade} • Đấu Trường Tốc Độ
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                ĐẤU TRƯỜNG TOÁN HỌC 60S
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                Thử thách phản xạ tính nhẩm và nhớ công thức toán học trong 60 giây! Trả lời liên tiếp để kích hoạt <b>Combo x2, x3</b> điểm số.
              </p>
            </div>

            {/* Highscore stat */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-slate-600">Kỷ lục của bạn:</span>
              <span className="font-extrabold text-blue-700 text-sm">{highScore} điểm</span>
            </div>

            <div>
              <button
                type="button"
                onClick={handleStartGame}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/30 transition flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>BẮT ĐẦU CHIẾN NGAY 🚀</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2: PLAYING */}
        {gameState === 'playing' && (
          <div className="space-y-6">
            {/* Top Bar: Timer, Score, Combo */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              {/* Timer */}
              <div className="flex items-center gap-1.5 text-xs font-black">
                <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-rose-600 animate-spin' : 'text-blue-600'}`} />
                <span className={`text-base font-black ${timeLeft <= 10 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
                  {timeLeft}s
                </span>
              </div>

              {/* Combo Streak */}
              {combo >= 2 && (
                <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-black animate-pulse">
                  <Flame className="w-4 h-4 fill-amber-500" />
                  <span>COMBO x{combo}!</span>
                </div>
              )}

              {/* Current Score */}
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Điểm</span>
                <span className="text-xl font-black text-blue-600">{score}</span>
              </div>
            </div>

            {/* Question Box */}
            <div className="min-h-[90px] flex items-center justify-center text-center p-4 bg-slate-50/80 border border-slate-200 rounded-2xl">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                <MathView text={currentQ.prompt} />
              </h3>
            </div>

            {/* Options List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                let btnStyle = 'bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50 text-slate-800';

                if (isSelected) {
                  if (isAnswerCorrect) {
                    btnStyle = 'bg-emerald-500 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300';
                  } else {
                    btnStyle = 'bg-rose-500 text-white border-rose-600 shadow-md ring-2 ring-rose-300';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`p-4 rounded-2xl border-2 text-xs sm:text-sm font-bold transition-all text-center ${btnStyle}`}
                  >
                    <MathView text={opt} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SCREEN 3: GAMEOVER */}
        {gameState === 'gameover' && (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">HẾT GIỜ!</span>
              <h2 className="text-3xl font-black text-slate-900 mt-1">
                KẾT QUẢ THỬ THÁCH
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Tổng điểm</span>
                <div className="text-xl font-black text-blue-600">{score}</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Đúng</span>
                <div className="text-xl font-black text-emerald-600">{correctCount} câu</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Max Combo</span>
                <div className="text-xl font-black text-amber-600">{maxCombo}x</div>
              </div>
            </div>

            {score >= highScore && score > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-800">
                🎉 CHÚC MỪNG! Bạn vừa lập KỶ LỤC ĐIỂM SỐ MỚI của bản thân!
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleStartGame}
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>CHƠI LẠI</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MathArenaModal;
