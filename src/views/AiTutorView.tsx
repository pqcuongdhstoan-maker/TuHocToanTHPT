import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  HelpCircle,
  BookOpen,
  School,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { GradeLevel, User } from '../types';
import MathView from '../components/MathView';
import MathToolbar from '../components/MathToolbar';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  time: string;
}

interface AiTutorViewProps {
  currentUser: User | null;
  selectedGrade: GradeLevel;
  initialQuestion?: string;
}

export const AiTutorView: React.FC<AiTutorViewProps> = ({
  currentUser,
  selectedGrade,
  initialQuestion,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: `Chào em! Thầy là **Trợ lý AI Toán học của Thầy Phan Quốc Cường (THPT Đức Hòa)**.

Thầy ở đây để đồng hành cùng em trong chương trình **Toán lớp ${selectedGrade} (Sách Kết nối tri thức với cuộc sống)**.
Em đang gặp khó khăn ở bài toán, định lí hay công thức nào? Cứ hỏi thầy nhé, thầy sẽ gợi ý từng bước tư duy giúp em hiểu sâu và nhớ lâu!`,
      time: 'Bây giờ',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>(initialQuestion || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showMathToolbar, setShowMathToolbar] = useState<boolean>(false);
  const [tutoringMode, setTutoringMode] = useState<'socratic' | 'error_checker' | 'formula_quiz'>('socratic');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const promptSuggestions = [
    {
      title: 'Khảo sát hàm số',
      text: 'Thầy hãy hướng dẫn em cách tìm các đường tiệm cận đứng, ngang và tiệm cận xiên của hàm số $y = \\frac{x^2 - 2x + 3}{x - 1}$.',
    },
    {
      title: 'Cực trị hàm số',
      text: 'Làm thế nào để phân biệt điểm cực đại, điểm cực tiểu của hàm số thông qua dấu của đạo hàm $f\'(x)$?',
    },
    {
      title: 'Tọa độ Oxyz',
      text: 'Cho điểm $M(1; 2; 3)$ và mặt phẳng $(P): 2x - y + 2z - 5 = 0$. Hãy giải thích công thức tính khoảng cách từ $M$ đến $(P)$.',
    },
    {
      title: 'Bất phương trình 10',
      text: 'Cách biểu diễn miền nghiệm của hệ bất phương trình bậc nhất hai ẩn trên mặt phẳng tọa độ $Oxy$.',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Prepare history for Gemini API
      const history = messages
        .filter((m) => m.id !== 'welcome-1')
        .map((m) => ({ role: m.role, text: m.text }));

      let promptToSend = text;
      if (tutoringMode === 'socratic') {
        promptToSend = `[CHẾ ĐỘ SƠ-CRÁT - GỢI Ý TỪNG BƯỚC]: Thầy hãy đóng vai gia sư Socratic. Không đưa ra ngay đáp số cuối cùng mà hãy đặt câu hỏi gợi mở hoặc gợi ý bước tư duy đầu tiên: ${text}`;
      } else if (tutoringMode === 'error_checker') {
        promptToSend = `[CHẾ ĐỘ BẮT LỖI SAI BÀI LÀM]: Dưới đây là bài làm / các bước biến đổi của em. Thầy hãy kiểm tra xem em bị sai ở bước nào và giải thích rõ nguyên nhân: ${text}`;
      } else if (tutoringMode === 'formula_quiz') {
        promptToSend = `[CHẾ ĐỘ ĐỐ VUI CÔNG THỨC]: Thầy hãy đố em một câu hỏi ngắn về công thức quan trọng của Toán ${selectedGrade}: ${text}`;
      }

      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptToSend,
          grade: selectedGrade,
          lessonTitle: `Toán THPT Lớp ${selectedGrade}`,
          history,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi kết nối Trợ lý AI');

      const modelMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: data.reply,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `⚠️ Rất tiếc, đã có lỗi kết nối với máy chủ AI: ${err.message}. Em hãy thử kiểm tra lại khóa API hoặc gửi lại câu hỏi nhé.`,
        time: 'Lỗi',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm('Em có muốn xóa toàn bộ lịch sử trao đổi này để bắt đầu chủ đề mới không?')) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'model',
          text: `Đã làm mới cuộc hội thoại! Em muốn hỏi về phần kiến thức nào trong chương trình Toán ${selectedGrade}?`,
          time: 'Bây giờ',
        },
      ]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                Gemini 3.8 Flash
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Toán Lớp {selectedGrade} • GDPT 2018
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              Trợ lý AI Toán học - Thầy Phan Quốc Cường (THPT Đức Hòa)
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearChat}
          className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition flex items-center gap-1.5 text-xs font-semibold"
          title="Làm mới đoạn hội thoại"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Làm mới</span>
        </button>
      </div>

      {/* 3 Pedagogical Tutoring Modes */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between flex-wrap gap-2 shadow-2xs">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">
          Chế độ hướng dẫn của Thầy:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setTutoringMode('socratic')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              tutoringMode === 'socratic'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>💡 Gợi ý từng bước (Socratic)</span>
          </button>
          <button
            type="button"
            onClick={() => setTutoringMode('error_checker')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              tutoringMode === 'error_checker'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>🔍 Bắt lỗi bài giải</span>
          </button>
          <button
            type="button"
            onClick={() => setTutoringMode('formula_quiz')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              tutoringMode === 'formula_quiz'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>⚡ Đố vui công thức</span>
          </button>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
          Gợi ý câu hỏi phổ biến:
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {promptSuggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(item.text)}
              className="px-3.5 py-2 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-2xl text-xs text-slate-700 font-medium transition shadow-2xs whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span>{item.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs flex flex-col min-h-[520px] max-h-[650px] overflow-hidden">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
          {messages.map((msg) => {
            const isModel = msg.role === 'model';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isModel ? '' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                    isModel
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isModel ? 'B' : currentUser?.fullName?.charAt(0) || 'E'}
                </div>

                {/* Content Bubble */}
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isModel
                      ? 'bg-slate-50 border border-slate-200/80 text-slate-900 rounded-tl-xs shadow-2xs'
                      : 'bg-blue-600 text-white rounded-tr-xs shadow-sm font-medium'
                  }`}
                >
                  <MathView text={msg.text} />
                  <span
                    className={`block text-[10px] mt-2 ${
                      isModel ? 'text-slate-400' : 'text-blue-200 text-right'
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-xl">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
                B
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-xs text-xs text-slate-600 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>Thầy đang tư duy lời giải và soạn công thức...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar with MathToolbar toggle */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
          {showMathToolbar && (
            <MathToolbar
              onInsert={(formula) => {
                setInputPrompt((prev) => prev + ' ' + formula);
              }}
            />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMathToolbar(!showMathToolbar)}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold border transition flex items-center gap-1.5 shrink-0 ${
                showMathToolbar
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Chèn công thức</span>
            </button>

            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Nhập câu hỏi hoặc công thức Toán em cần giải đáp..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />

            <button
              type="button"
              disabled={isLoading || !inputPrompt.trim()}
              onClick={() => handleSendMessage()}
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl transition shadow-md shadow-blue-500/20 shrink-0"
              title="Gửi câu hỏi"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiTutorView;
