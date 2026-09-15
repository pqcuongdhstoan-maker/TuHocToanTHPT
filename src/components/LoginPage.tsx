import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  Mail,
  School,
  GraduationCap,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  HelpCircle,
} from 'lucide-react';
import { User, GradeLevel } from '../types';
import { authService } from '../services/authService';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // Register form state
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regGrade, setRegGrade] = useState<GradeLevel>(12);
  const [regClassName, setRegClassName] = useState<string>('12A1');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

  // Status & Feedback
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);
  const [forgotIdentifier, setForgotIdentifier] = useState<string>('');
  const [forgotResult, setForgotResult] = useState<{ hasEmail: boolean; message: string } | null>(null);
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const [socialModalProvider, setSocialModalProvider] = useState<'Google' | 'Facebook' | 'Zalo' | null>(null);

  // Handle Login Submit
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!loginIdentifier.trim()) {
      setError('Vui lòng nhập email hoặc tên đăng nhập.');
      return;
    }
    if (!loginPassword) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.login({
        identifier: loginIdentifier.trim(),
        password: loginPassword,
      });
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regFullName.trim()) {
      setError('Vui lòng nhập họ và tên.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (!regUsername.trim()) {
      setError('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu đã nhập.');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.register({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        username: regUsername.trim(),
        grade: regGrade,
        className: regClassName.trim() || `${regGrade}A1`,
        password: regPassword,
      });
      setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển hướng vào hệ thống...');
      setTimeout(() => {
        onLoginSuccess(user);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Đăng ký không thành công. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Quick Login for Demo / Pre-seeded accounts
  const handleQuickLogin = (uname: string, pass: string) => {
    setLoginIdentifier(uname);
    setLoginPassword(pass);
    setActiveTab('login');
    setError(null);
    setTimeout(() => {
      setLoading(true);
      authService
        .login({ identifier: uname, password: pass })
        .then((user) => {
          onLoginSuccess(user);
        })
        .catch((err) => {
          setError(err.message || 'Đăng nhập thất bại.');
        })
        .finally(() => {
          setLoading(false);
        });
    }, 100);
  };

  // Handle Forgot Password
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotResult(null);

    if (!forgotIdentifier.trim()) {
      setForgotError('Vui lòng nhập email hoặc tên đăng nhập.');
      return;
    }

    setForgotLoading(true);
    try {
      const result = await authService.forgotPassword(forgotIdentifier.trim());
      setForgotResult(result);
    } catch (err: any) {
      setForgotError(err.message || 'Không tìm thấy tài khoản.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Social Auth Click Handler (enforces official configuration)
  const handleSocialClick = (provider: 'Google' | 'Facebook' | 'Zalo') => {
    // Check if official client ID/app ID exists in import.meta.env
    const isGoogleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
    const isFacebookConfigured = Boolean(import.meta.env.VITE_FACEBOOK_APP_ID);
    const isZaloConfigured = Boolean(import.meta.env.VITE_ZALO_APP_ID);

    if (provider === 'Google' && isGoogleConfigured) {
      // Official Google OAuth redirect / popup would trigger here
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(window.location.origin)}&scope=email%20profile`;
      return;
    }

    if (provider === 'Facebook' && isFacebookConfigured) {
      window.location.href = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${import.meta.env.VITE_FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(window.location.origin)}`;
      return;
    }

    if (provider === 'Zalo' && isZaloConfigured) {
      window.location.href = `https://oauth.zaloapp.com/v4/permission?app_id=${import.meta.env.VITE_ZALO_APP_ID}&redirect_uri=${encodeURIComponent(window.location.origin)}`;
      return;
    }

    // Provider not configured yet -> Show setup instruction modal
    setSocialModalProvider(provider);
  };

  return (
    <div className="min-h-screen bg-[#f0f4f3] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800 font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Brand Header */}
      <div className="text-center mb-6 space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-black text-[#0f5132] tracking-tight uppercase">
          TỰ HỌC TOÁN THPT
        </h1>
        <p className="text-sm sm:text-base font-semibold text-slate-600">
          Giáo viên: Phan Quốc Cường
        </p>
      </div>

      {/* Main Container Card (Max width ~560px as specified) */}
      <div className="w-full max-w-[560px] bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-300/40 p-6 sm:p-9 transition-all">
        {/* 1. Google Login Button */}
        <button
          type="button"
          onClick={() => handleSocialClick('Google')}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl border border-slate-300/90 shadow-2xs transition active:scale-[0.99] group"
        >
          {/* Google 4-Color SVG Logo */}
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span className="truncate">Đăng nhập bằng Google</span>
        </button>

        {/* Secondary Social Login Buttons: Facebook & Zalo */}
        <div className="grid grid-cols-2 gap-2.5 mt-2.5">
          <button
            type="button"
            onClick={() => handleSocialClick('Facebook')}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-2xs transition"
          >
            {/* Facebook Blue SVG */}
            <svg className="w-4 h-4 text-[#1877F2] shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Facebook</span>
          </button>

          <button
            type="button"
            onClick={() => handleSocialClick('Zalo')}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-2xs transition"
          >
            {/* Zalo Blue Badge */}
            <div className="w-4 h-4 rounded-sm bg-[#0068FF] text-white flex items-center justify-center font-black text-[9px] shrink-0">
              Z
            </div>
            <span>Zalo</span>
          </button>
        </div>

        {/* Divider with "hoặc" */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-slate-400 font-semibold tracking-wider">
              hoặc
            </span>
          </div>
        </div>

        {/* Two Tabs: Đăng nhập & Đăng ký */}
        <div className="flex rounded-2xl bg-slate-100 p-1 mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all text-center ${
              activeTab === 'login'
                ? 'bg-[#0f5132] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-extrabold transition-all text-center ${
              activeTab === 'register'
                ? 'bg-[#0f5132] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Error / Success Feedback */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-start gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: ĐĂNG NHẬP */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Identifier Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email hoặc tên đăng nhập
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="admin, student1, hoặc email..."
                  required
                  autoFocus
                  disabled={loading}
                  className="w-full px-3.5 py-3 pl-10 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0f5132] focus:ring-2 focus:ring-emerald-100 transition"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotIdentifier(loginIdentifier);
                    setIsForgotModalOpen(true);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn..."
                  required
                  disabled={loading}
                  className="w-full px-3.5 py-3 pl-10 pr-10 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0f5132] focus:ring-2 focus:ring-emerald-100 transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  title={showLoginPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Big Submit Button with bottom shadow */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#0f5132] hover:bg-[#0c4327] text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/25 hover:shadow-xl hover:shadow-emerald-950/30 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>ĐANG ĐĂNG NHẬP...</span>
                </>
              ) : (
                <span>ĐĂNG NHẬP</span>
              )}
            </button>

            {/* Quick Demo Accounts Helper Box */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                <span>Tài khoản mẫu (1-Click thử nghiệm):</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'password123')}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-left transition group"
                >
                  <div className="text-xs font-black text-slate-800 group-hover:text-emerald-800">
                    Thầy Cường
                  </div>
                  <div className="text-[10px] text-slate-500">Quản trị viên</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('gv_minh', 'password123')}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-left transition group"
                >
                  <div className="text-xs font-black text-slate-800 group-hover:text-emerald-800">
                    Thầy Minh
                  </div>
                  <div className="text-[10px] text-slate-500">Giáo viên</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('student1', 'password123')}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 text-left transition group"
                >
                  <div className="text-xs font-black text-slate-800 group-hover:text-emerald-800">
                    Nguyễn Văn An
                  </div>
                  <div className="text-[10px] text-slate-500">Học sinh 12A1</div>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: ĐĂNG KÝ */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="VD: Trần Minh Quân"
                required
                disabled={loading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0f5132] focus:ring-2 focus:ring-emerald-100 transition"
              />
            </div>

            {/* Email & Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Địa chỉ Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="hocsinh@gmail.com"
                  required
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0f5132] focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên đăng nhập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="VD: minhquan12a1"
                  required
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0f5132] focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>
            </div>

            {/* Grade & Class Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Khối lớp
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {([10, 11, 12] as GradeLevel[]).map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => {
                        setRegGrade(grade);
                        setRegClassName(`${grade}A1`);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition text-center ${
                        regGrade === grade
                          ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                          : 'text-slate-600'
                      }`}
                    >
                      Lớp {grade}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên lớp học
                </label>
                <input
                  type="text"
                  value={regClassName}
                  onChange={(e) => setRegClassName(e.target.value)}
                  placeholder="VD: 12A1, 12A2..."
                  required
                  disabled={loading}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0f5132] focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 pr-9 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0f5132] focus:ring-2 focus:ring-emerald-100 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Xác nhận mật khẩu <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  required
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0f5132] focus:ring-2 focus:ring-emerald-100 transition"
                />
              </div>
            </div>

            {/* Role Notice */}
            <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-2.5 text-[11px] text-blue-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Tài khoản tự đăng ký mặc định được cấp quyền <strong>Học sinh</strong>.</span>
            </div>

            {/* Submit Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#0f5132] hover:bg-[#0c4327] text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/25 hover:shadow-xl hover:shadow-emerald-950/30 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-3"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>ĐANG TẠO TÀI KHOẢN...</span>
                </>
              ) : (
                <span>TẠO TÀI KHOẢN</span>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer copyright */}
      <div className="mt-8 text-center text-xs text-slate-500">
        <p>© 2026 Tự Học Toán THPT • THPT Đức Hòa • GDPT 2018 Kết Nối Tri Thức</p>
      </div>

      {/* MODAL: Quên Mật Khẩu */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 relative animate-in fade-in duration-150">
            <button
              type="button"
              onClick={() => {
                setIsForgotModalOpen(false);
                setForgotResult(null);
                setForgotError(null);
              }}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2 font-black">
                <HelpCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Khôi phục mật khẩu
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhập email hoặc tên đăng nhập để tìm lại mật khẩu của bạn
              </p>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                {forgotError}
              </div>
            )}

            {forgotResult ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                    forgotResult.hasEmail
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <p className="font-bold text-sm mb-1">
                    {forgotResult.hasEmail ? 'Đã tìm thấy tài khoản!' : 'Tài khoản cấp nội bộ'}
                  </p>
                  <p>{forgotResult.message}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setForgotResult(null);
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                >
                  Đã hiểu và Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email hoặc Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="VD: hocsinh@gmail.com hoặc quan_12a1"
                    required
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0f5132] focus:ring-2 focus:ring-emerald-100 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 bg-[#0f5132] hover:bg-[#0c4327] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {forgotLoading ? 'Đang kiểm tra...' : 'Tìm lại mật khẩu'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Hướng Dẫn Cấu Hình Mạng Xã Hội */}
      {socialModalProvider && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 relative animate-in fade-in duration-150">
            <button
              type="button"
              onClick={() => setSocialModalProvider(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Cấu hình Đăng nhập {socialModalProvider}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Theo quy định bảo mật, tính năng này chỉ hoạt động khi trường đã thiết lập mã xác thực chính thức.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 space-y-2 leading-relaxed">
              <p className="font-bold text-slate-900">Các bước thiết lập cần thực hiện:</p>
              {socialModalProvider === 'Google' && (
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>Truy cập Google Cloud Console ➔ APIs & Services ➔ Credentials.</li>
                  <li>Tạo OAuth 2.0 Client ID loại Web Application.</li>
                  <li>Thêm domain website vào Authorized JavaScript origins.</li>
                  <li>Gán biến môi trường: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">VITE_GOOGLE_CLIENT_ID</code>.</li>
                </ol>
              )}
              {socialModalProvider === 'Facebook' && (
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>Truy cập developers.facebook.com ➔ Tạo ứng dụng mới.</li>
                  <li>Thiết lập Facebook Login for Web.</li>
                  <li>Gán biến môi trường: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">VITE_FACEBOOK_APP_ID</code>.</li>
                </ol>
              )}
              {socialModalProvider === 'Zalo' && (
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>Truy cập developers.zalo.me ➔ Đăng ký ứng dụng Zalo Login.</li>
                  <li>Cấu hình Callback URL và phân quyền.</li>
                  <li>Gán biến môi trường: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">VITE_ZALO_APP_ID</code>.</li>
                </ol>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSocialModalProvider(null)}
              className="w-full mt-4 py-2.5 bg-[#0f5132] hover:bg-[#0c4327] text-white rounded-xl text-xs font-bold transition"
            >
              Đã hiểu, quay lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
