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

// SHA-256 hashing helper in browser Web Crypto API
async function sha256(str: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback simple hash for older environments
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }
}

// Default Seed Accounts for static Vercel / offline fallback
// password123 sha-256 = ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
const SEED_PASSWORD_HASH = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f';

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
    email: 'pqcuong.dhstoan@gmail.com',
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

  // Check if server is running
  private async checkOnline(): Promise<boolean> {
    try {
      const res = await fetch('/api/health', { method: 'GET', signal: AbortSignal.timeout(1200) });
      return res.ok;
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

        if (res.ok) {
          const data = await res.json();
          this.setSession(this.token, data.user);
          return data.user;
        } else {
          // Token invalid or expired
          this.clearSession();
          return null;
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

    // 1. Try backend login API
    try {
      const isOnline = await this.checkOnline();
      if (isOnline) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: trimmedId, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
        }

        const token = data.token || `sess_${Date.now()}`;
        this.setSession(token, data.user);
        return data.user;
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError')) {
        throw err;
      }
    }

    // 2. Offline / Static fallback authentication
    const pwdHash = await sha256(password);
    const localUsers = this.getLocalRegisteredUsers();
    const allUsers: SeedAccount[] = [...SEED_ACCOUNTS, ...localUsers];

    const matched = allUsers.find(
      (u) =>
        u.username.toLowerCase() === trimmedId.toLowerCase() ||
        (u.email && u.email.toLowerCase() === trimmedId.toLowerCase())
    );

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

        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.error || 'Đăng ký tài khoản thất bại.');
        }

        const token = resData.token || `sess_${Date.now()}`;
        this.setSession(token, resData.user);
        return resData.user;
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError')) {
        throw err;
      }
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
        const data = await res.json();
        if (res.ok) {
          return data;
        }
      }
    } catch {}

    // Fallback
    const allUsers = [...SEED_ACCOUNTS, ...this.getLocalRegisteredUsers()];
    const user = allUsers.find(
      (u) =>
        u.username.toLowerCase() === trimmedId.toLowerCase() ||
        (u.email && u.email.toLowerCase() === trimmedId.toLowerCase())
    );

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
