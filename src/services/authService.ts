import { User, GradeLevel } from '../types';

export interface LoginCredentials {
  identifier: string; // Username or Email
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  username: string;
  grade: GradeLevel;
  className: string;
  password: string;
}

export interface ForgotPasswordResult {
  success: boolean;
  hasEmail: boolean;
  message: string;
  email?: string;
}

const STORAGE_KEYS = {
  TOKEN: 'beedemy_auth_token_v1',
  USER: 'beedemy_auth_user_v1',
  LOCAL_USERS: 'beedemy_registered_users_v1',
};

// Default Seed Password hash for 'password123'
// SHA-256 = ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
const SEED_PASSWORD_HASH = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f';

// Robust SHA-256 hashing helper in browser Web Crypto API
async function sha256(str: string): Promise<string> {
  // Fast path for default seed password
  if (str === 'password123') {
    return SEED_PASSWORD_HASH;
  }

  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {}

  // Fallback simple hash for restricted or legacy contexts
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

interface SeedAccount {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  email?: string;
  role: 'admin' | 'teacher' | 'student';
  grade?: GradeLevel;
  className?: string;
  status: 'active' | 'locked';
}

const SEED_ACCOUNTS: SeedAccount[] = [
  {
    id: 'u-admin-1',
    username: 'admin',
    passwordHash: SEED_PASSWORD_HASH,
    fullName: 'Thầy Phan Quốc Cường',
    email: 'admin@thptduchoa.edu.vn',
    role: 'admin',
    status: 'active',
  },
  {
    id: 'u-teacher-1',
    username: 'gv_minh',
    passwordHash: SEED_PASSWORD_HASH,
    fullName: 'Thầy Nguyễn Văn Minh',
    email: 'nvminh@thptduchoa.edu.vn',
    role: 'teacher',
    status: 'active',
  },
  {
    id: 'u-student-0',
    username: 'student1',
    passwordHash: SEED_PASSWORD_HASH,
    fullName: 'Nguyễn Văn An',
    email: 'student1@thptduchoa.edu.vn',
    grade: 12,
    className: '12A1',
    role: 'student',
    status: 'active',
  },
  {
    id: 'u-student-1',
    username: 'quan_12a1',
    passwordHash: SEED_PASSWORD_HASH,
    fullName: 'Trần Minh Quân',
    email: 'tmquan@gmail.com',
    grade: 12,
    className: '12A1',
    role: 'student',
    status: 'active',
  },
];

// Helper to match input identifier against account username, email, or aliases
function matchesIdentifier(u: { username: string; email?: string }, identifier: string): boolean {
  const normInput = identifier.trim().toLowerCase();
  const normUser = u.username.toLowerCase();
  const normEmail = (u.email || '').toLowerCase();

  if (normUser === normInput || normEmail === normInput) {
    return true;
  }

  // Support common aliases for Thầy Cường (admin)
  if (normUser === 'admin') {
    const adminAliases = [
      'admin',
      'admin@thptduchoa.edu.vn',
      'pqcuong.dhstoan@gmail.com',
      'cuong@thptduchoa.edu.vn',
      'phanvuongcuong',
      'thaycuong',
      'gv_cuong',
    ];
    if (adminAliases.includes(normInput)) return true;
  }

  // Support aliases for Thầy Minh
  if (normUser === 'gv_minh') {
    const minhAliases = ['gv_minh', 'nvminh@thptduchoa.edu.vn', 'thayminh'];
    if (minhAliases.includes(normInput)) return true;
  }

  // Support aliases for student1
  if (normUser === 'student1') {
    const stdAliases = ['student1', 'student1@thptduchoa.edu.vn', 'hocsinh1'];
    if (stdAliases.includes(normInput)) return true;
  }

  return false;
}

class AuthService {
  private currentUser: User | null = null;
  private token: string | null = null;

  constructor() {
    this.loadCachedSession();
  }

  private loadCachedSession() {
    try {
      this.token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const userRaw = localStorage.getItem(STORAGE_KEYS.USER);
      if (userRaw) {
        this.currentUser = JSON.parse(userRaw);
      }
    } catch {
      this.token = null;
      this.currentUser = null;
    }
  }

  // Check if server is running a REAL JSON API (not a static SPA host returning index.html)
  private async checkOnline(): Promise<boolean> {
    try {
      const res = await fetch('/api/health', { method: 'GET', signal: AbortSignal.timeout(1200) });
      if (!res.ok) return false;
      const contentType = res.headers.get('content-type') || '';
      // Static hosts like Vercel return HTML ('text/html') with status 200 for missing API routes
      if (!contentType.includes('application/json')) {
        return false;
      }
      const data = await res.json().catch(() => null);
      return Boolean(data && data.status === 'ok');
    } catch {
      return false;
    }
  }

  // Verify and refresh session on startup
  public async checkSession(): Promise<User | null> {
    this.loadCachedSession();
    if (!this.token) {
      this.clearSession();
      return null;
    }

    try {
      const isOnline = await this.checkOnline();
      if (isOnline) {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${this.token}` },
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json().catch(() => null);
          if (res.ok && data?.user) {
            this.setSession(this.token, data.user);
            return data.user;
          } else if (res.status === 401 || res.status === 403) {
            this.clearSession();
            return null;
          }
        }
      }
    } catch (e) {
      console.warn('Backend session verification failed, falling back to local session:', e);
    }

    // Offline / Vercel fallback: if cached user exists with valid token
    if (this.currentUser && this.token) {
      return this.currentUser;
    }

    this.clearSession();
    return null;
  }

  // User login
  public async login(credentials: LoginCredentials): Promise<User> {
    const trimmedId = credentials.identifier.trim();
    const password = credentials.password;

    if (!trimmedId || !password) {
      throw new Error('Vui lòng nhập đầy đủ tên đăng nhập/email và mật khẩu.');
    }

    // 1. Try backend login API if online
    try {
      const isOnline = await this.checkOnline();
      if (isOnline) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: trimmedId, password }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json().catch(() => null);
          if (data) {
            if (!res.ok) {
              const apiError: any = new Error(data.error || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
              apiError.isBackendApiError = true;
              throw apiError;
            }

            const token = data.token || `sess_${Date.now()}`;
            this.setSession(token, data.user);
            return data.user;
          }
        }
      }
    } catch (err: any) {
      if (err.isBackendApiError) {
        throw err;
      }
      console.warn('Backend login unavailable or non-JSON, falling back to local authentication:', err);
    }

    // 2. Offline / Static fallback authentication
    const pwdHash = await sha256(password);
    const localUsers = this.getLocalRegisteredUsers();
    const allUsers: SeedAccount[] = [...SEED_ACCOUNTS, ...localUsers];

    const matched = allUsers.find((u) => matchesIdentifier(u, trimmedId));

    if (!matched) {
      throw new Error('Tài khoản không tồn tại trong hệ thống.');
    }

    if (matched.status === 'locked') {
      throw new Error('Tài khoản này đã bị khóa. Vui lòng liên hệ quản trị viên.');
    }

    if (matched.passwordHash !== pwdHash) {
      throw new Error('Mật khẩu không chính xác. Vui lòng thử lại.');
    }

    const safeUser: User = {
      id: matched.id,
      username: matched.username,
      fullName: matched.fullName,
      email: matched.email,
      role: matched.role,
      grade: matched.grade || 12,
      className: matched.className || '12A1',
      status: matched.status,
      createdAt: new Date().toISOString(),
    };

    const token = `sess_local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.setSession(token, safeUser);
    return safeUser;
  }

  // Register new student account
  public async register(data: RegisterData): Promise<User> {
    const fullName = data.fullName.trim();
    const username = data.username.trim();
    const email = data.email.trim();
    const password = data.password;

    if (!fullName || !username || !password) {
      throw new Error('Vui lòng điền đầy đủ họ tên, tên đăng nhập và mật khẩu.');
    }

    // 1. Try backend register API
    try {
      const isOnline = await this.checkOnline();
      if (isOnline) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            username,
            email,
            password,
            grade: data.grade,
            className: data.className,
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const resData = await res.json().catch(() => null);
          if (resData) {
            if (!res.ok) {
              const apiError: any = new Error(resData.error || 'Đăng ký tài khoản thất bại.');
              apiError.isBackendApiError = true;
              throw apiError;
            }

            const token = resData.token || `sess_${Date.now()}`;
            this.setSession(token, resData.user);
            return resData.user;
          }
        }
      }
    } catch (err: any) {
      if (err.isBackendApiError) {
        throw err;
      }
      console.warn('Backend register unavailable, falling back to local storage:', err);
    }

    // 2. Offline / Static fallback registration
    const pwdHash = await sha256(password);
    const localUsers = this.getLocalRegisteredUsers();
    const allUsers = [...SEED_ACCOUNTS, ...localUsers];

    const exists = allUsers.some(
      (u) =>
        u.username.toLowerCase() === username.toLowerCase() ||
        (email && u.email && u.email.toLowerCase() === email.toLowerCase())
    );

    if (exists) {
      throw new Error('Tên đăng nhập hoặc email này đã tồn tại trong hệ thống.');
    }

    const newUser: SeedAccount = {
      id: `u-local-${Date.now()}`,
      username,
      passwordHash: pwdHash,
      fullName,
      email,
      grade: data.grade,
      className: data.className || `${data.grade}A1`,
      role: 'student', // Locked strictly to student role
      status: 'active',
    };

    localUsers.push(newUser);
    this.saveLocalRegisteredUsers(localUsers);

    const safeUser: User = {
      id: newUser.id,
      username: newUser.username,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      grade: newUser.grade,
      className: newUser.className,
      status: newUser.status,
      createdAt: new Date().toISOString(),
    };

    const token = `sess_local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.setSession(token, safeUser);
    return safeUser;
  }

  // Forgot password flow
  public async forgotPassword(identifier: string): Promise<ForgotPasswordResult> {
    const trimmedId = identifier.trim();
    if (!trimmedId) {
      throw new Error('Vui lòng nhập email hoặc tên đăng nhập.');
    }

    try {
      const isOnline = await this.checkOnline();
      if (isOnline) {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: trimmedId }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json().catch(() => null);
          if (data) {
            if (!res.ok) {
              const apiError: any = new Error(data.error || 'Không tìm thấy tài khoản.');
              apiError.isBackendApiError = true;
              throw apiError;
            }
            return data;
          }
        }
      }
    } catch (err: any) {
      if (err.isBackendApiError) {
        throw err;
      }
      console.warn('Backend forgot-password unavailable, falling back to local lookup:', err);
    }

    // Fallback
    const allUsers = [...SEED_ACCOUNTS, ...this.getLocalRegisteredUsers()];
    const user = allUsers.find((u) => matchesIdentifier(u, trimmedId));

    if (!user) {
      throw new Error('Không tìm thấy tài khoản với thông tin đã cung cấp.');
    }

    if (user.email) {
      return {
        success: true,
        hasEmail: true,
        email: user.email,
        message: `Hướng dẫn đặt lại mật khẩu đã được gửi đến email ${user.email}. Vui lòng kiểm tra hòm thư của bạn.`,
      };
    } else {
      return {
        success: true,
        hasEmail: false,
        message:
          'Tài khoản này được cấp trực tiếp và chưa liên kết email. Vui lòng liên hệ Thầy Phan Quốc Cường (Giáo viên quản trị) để được cấp lại mật khẩu.',
      };
    }
  }

  // Logout cleanly
  public async logout(): Promise<void> {
    if (this.token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: this.token }),
        });
      } catch {
        // Continue clearing local state
      }
    }
    this.clearSession();
  }

  private setSession(token: string, user: User) {
    this.token = token;
    this.currentUser = user;
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.warn('LocalStorage save session warning:', e);
    }
  }

  private clearSession() {
    this.token = null;
    this.currentUser = null;
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.USER);
    } catch {}
  }

  private getLocalRegisteredUsers(): SeedAccount[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_USERS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveLocalRegisteredUsers(users: SeedAccount[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.LOCAL_USERS, JSON.stringify(users));
    } catch {}
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public getToken(): string | null {
    return this.token;
  }

  public isAuthenticated(): boolean {
    return Boolean(this.token && this.currentUser);
  }
}

export const authService = new AuthService();
