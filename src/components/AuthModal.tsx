import React, { useState } from 'react';
import { X, LogIn, UserPlus, Sparkles, Check, School, Shield } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [className, setClassName] = useState<string>('12A1');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const bodyData = isRegister
        ? { username, password, fullName, role, className }
        : { username, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Thao tác không thành công');

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (uname: string, pass: string) => {
    setUsername(uname);
    setPassword(pass);
    setIsRegister(false);
    setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: uname, password: pass }),
        });
        const data = await res.json();
        if (res.ok) {
          onLoginSuccess(data.user);
          onClose();
        }
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 relative animate-in fade-in duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#0f5132] text-white flex items-center justify-center mx-auto mb-2 shadow-sm shadow-[#0f5132]/25 font-black text-lg">
            T
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập hệ thống'}
          </h2>
          <p className="text-xs text-slate-500">
            TỰ HỌC TOÁN THPT • THPT Đức Hòa
          </p>
        </div>

        {/* Quick Demo Credentials */}
        <div className="mb-4 p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl space-y-2 text-xs">
          <span className="font-extrabold text-blue-900 flex items-center gap-1.5 text-[11px] uppercase">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Tài khoản dùng thử nhanh:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('teacher', 'admin123')}
              className="px-3 py-2 bg-white hover:bg-blue-100/70 border border-blue-200 rounded-xl font-bold text-blue-900 text-left transition shadow-2xs text-[11px]"
            >
              👨‍🏫 Thầy Cường (GV)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('student1', '123456')}
              className="px-3 py-2 bg-white hover:bg-blue-100/70 border border-blue-200 rounded-xl font-bold text-blue-900 text-left transition shadow-2xs text-[11px]"
            >
              🎓 Nguyễn An (12A1)
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {isRegister && (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên đầy đủ *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="Ví dụ: Nguyễn Văn An"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vai trò</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="student">Học sinh</option>
                    <option value="teacher">Giáo viên</option>
                  </select>
                </div>

                {role === 'student' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lớp</label>
                    <input
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      placeholder="12A1"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tên đăng nhập *</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              placeholder="Tên tài khoản hoặc email"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Mật khẩu *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              placeholder="Mật khẩu bảo mật"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
          >
            {loading ? (
              <span>Đang xử lý...</span>
            ) : isRegister ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Hoàn tất đăng ký</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle switch between Login & Register */}
        <div className="mt-4 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          {isRegister ? (
            <span>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="font-bold text-blue-600 hover:underline"
              >
                Đăng nhập ngay
              </button>
            </span>
          ) : (
            <span>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="font-bold text-blue-600 hover:underline"
              >
                Đăng ký tài khoản học sinh
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
