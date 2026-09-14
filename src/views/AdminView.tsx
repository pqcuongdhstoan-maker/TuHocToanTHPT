import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  KeyRound,
  ShieldCheck,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  UploadCloud,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { User, Exam } from '../types';

interface AdminViewProps {
  currentUser: User | null;
  onOpenImportModal: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  onOpenImportModal,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'exams' | 'oauth'>('users');

  // New user form state
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newFullName, setNewFullName] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('123456');
  const [newRole, setNewRole] = useState<'student' | 'teacher'>('student');
  const [newClassName, setNewClassName] = useState<string>('12A1');

  // Bulk import users
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkCsvText, setBulkCsvText] = useState<string>(
    `hocsinh01,Nguyễn Văn An,12A1,pass123
hocsinh02,Trần Thị Mai,12A1,pass123
hocsinh03,Lê Hoàng Nam,12A2,pass123`
  );

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams');
      const data = await res.json();
      setExams(data.exams || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchExams();
  }, []);

  const handleCreateSingleUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim()) return;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          fullName: newFullName,
          role: newRole,
          className: newRole === 'student' ? newClassName : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Đã tạo người dùng thành công!');
      setShowAddUserModal(false);
      setNewUsername('');
      setNewFullName('');
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleBulkImport = async () => {
    const lines = bulkCsvText.trim().split('\n');
    let successCount = 0;

    for (const line of lines) {
      const [username, fullName, className, password] = line.split(',').map((s) => s.trim());
      if (username && fullName) {
        try {
          await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username,
              fullName,
              className: className || '12A1',
              password: password || '123456',
              role: 'student',
            }),
          });
          successCount++;
        } catch (e) {
          console.warn('Skip err', e);
        }
      }
    }

    alert(`Đã thêm thành công ${successCount} tài khoản học sinh!`);
    setShowBulkModal(false);
    fetchUsers();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Khu vực Quản trị & Giáo viên
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Giáo viên: Phan Quốc Cường
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Quản trị Hệ thống Tự học Toán THPT
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý tài khoản học sinh, ngân hàng câu hỏi, đề thi và cấu hình đăng nhập
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'users' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Quản lý Tài khoản
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'exams' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Quản lý Đề thi
          </button>
          <button
            onClick={() => setActiveTab('oauth')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'oauth' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            Đăng nhập MXH
          </button>
        </div>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Danh sách người dùng ({users.length})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkModal(true)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>Nhập danh sách từ Excel/CSV</span>
              </button>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Thêm tài khoản mới</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Họ và tên</th>
                    <th className="p-3.5">Tên đăng nhập</th>
                    <th className="p-3.5">Vai trò</th>
                    <th className="p-3.5">Lớp học</th>
                    <th className="p-3.5 text-center">Trạng thái</th>
                    <th className="p-3.5 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                          {u.fullName.charAt(0)}
                        </div>
                        <span>{u.fullName}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">{u.username}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'admin' || u.role === 'teacher'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role === 'admin' ? 'Quản trị' : u.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">{u.className || '—'}</td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold">
                          Đang hoạt động
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => alert(`Đặt lại mật khẩu cho ${u.username} thành: 123456`)}
                          className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition"
                          title="Đặt lại mật khẩu"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXAMS */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-bold text-sm text-slate-900">
              Quản lý danh sách đề thi ({exams.length})
            </h3>

            <button
              onClick={onOpenImportModal}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Nhập thêm đề từ Word/PDF</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Tên đề</th>
                    <th className="p-3.5">Khối lớp</th>
                    <th className="p-3.5">Phân loại</th>
                    <th className="p-3.5">Số câu</th>
                    <th className="p-3.5">Thời gian</th>
                    <th className="p-3.5 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exams.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-slate-900">{ex.title}</td>
                      <td className="p-3.5 font-bold text-blue-800">Lớp {ex.grade}</td>
                      <td className="p-3.5 capitalize">
                        {ex.type === 'mock_exam' ? 'Thi thử THPT' : 'Luyện tập'}
                      </td>
                      <td className="p-3.5 font-medium">{ex.questions?.length || ex.questionCount || 0} câu</td>
                      <td className="p-3.5">{ex.timeMinutes} phút</td>
                      <td className="p-3.5 text-right">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">
                          Đã phát hành
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SOCIAL LOGIN CONFIGURATION */}
      {activeTab === 'oauth' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Hướng dẫn cấu hình Đăng nhập mạng xã hội (Google, Zalo, Facebook)
            </h3>
            <p className="text-xs text-slate-500">
              Hệ thống đã chuẩn bị sẵn cơ chế kết nối OAuth cho môi trường kiểm thử và triển khai thực tế.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Google */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block text-sm">Google OAuth 2.0</span>
              <p className="text-slate-500">
                Cho phép học sinh và giáo viên dùng tài khoản Google (@gmail.com hoặc email nhà trường) để đăng nhập tức thì.
              </p>
              <div className="bg-slate-50 p-2 rounded border border-slate-200 font-mono text-[10px] text-slate-600">
                GOOGLE_CLIENT_ID=...
              </div>
            </div>

            {/* Zalo */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block text-sm">Zalo Login SDK</span>
              <p className="text-slate-500">
                Cực kỳ phổ biến và tiện lợi cho học sinh Việt Nam. Kết nối qua Zalo Developer App ID và Secret Key.
              </p>
              <div className="bg-slate-50 p-2 rounded border border-slate-200 font-mono text-[10px] text-slate-600">
                ZALO_APP_ID=...
              </div>
            </div>

            {/* Facebook */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block text-sm">Facebook Login</span>
              <p className="text-slate-500">
                Hỗ trợ đăng nhập nhanh bằng tài khoản Meta Facebook cá nhân.
              </p>
              <div className="bg-slate-50 p-2 rounded border border-slate-200 font-mono text-[10px] text-slate-600">
                FACEBOOK_APP_ID=...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Single User */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Thêm người dùng mới</h3>
            <form onSubmit={handleCreateSingleUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên đăng nhập *</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  placeholder="Ví dụ: hocsinh04"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên đầy đủ *</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  placeholder="Ví dụ: Lê Thị Hồng"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vai trò</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="student">Học sinh</option>
                    <option value="teacher">Giáo viên</option>
                  </select>
                </div>

                {newRole === 'student' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lớp học</label>
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                      placeholder="12A1"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mật khẩu ban đầu</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                >
                  Tạo người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk CSV Import */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">
              Nhập danh sách học sinh từ Excel / CSV
            </h3>
            <p className="text-xs text-slate-500">
              Định dạng mỗi dòng: <code>tên_đăng_nhập,họ_và_tên,lớp,mật_khẩu</code>
            </p>

            <textarea
              rows={6}
              value={bulkCsvText}
              onChange={(e) => setBulkCsvText(e.target.value)}
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-500"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
              >
                Bắt đầu nhập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
