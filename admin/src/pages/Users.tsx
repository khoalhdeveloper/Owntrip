import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, CheckCircle2, XCircle, Loader2, UserPlus, AlertTriangle } from 'lucide-react';
import api from '../lib/axios';

interface User {
  _id: string;
  userId: string;
  email: string;
  displayName?: string;
  image?: string;
  role: string;
  isVerified: boolean;
  points: number;
  createdAt: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // === Modal: Thêm mới ===
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState('user');

  // === Modal: Chỉnh sửa ===
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState('user');

  // === Modal: Xác nhận xóa ===
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      if (res.data?.success) setUsers(res.data.data);
    } catch (err: any) {
      setError('Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  // --- Thêm người dùng ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setIsAdding(true);
    try {
      const res = await api.post('/users', { email: newEmail, password: newPassword, displayName: newDisplayName, role: newRole });
      if (res.data?.success) {
        setIsAddModalOpen(false);
        setNewEmail(''); setNewPassword(''); setNewDisplayName(''); setNewRole('user');
        fetchUsers();
      }
    } catch (err: any) {
      setAddError(err.response?.data?.message || 'Lỗi kết nối đến máy chủ');
    } finally {
      setIsAdding(false);
    }
  };

  // --- Mở modal sửa ---
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditDisplayName(user.displayName || '');
    setEditRole(user.role);
    setEditError('');
    setIsEditModalOpen(true);
  };

  // --- Cập nhật người dùng ---
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError('');
    setIsEditing(true);
    try {
      const res = await api.put(`/users/${editingUser.userId}`, { displayName: editDisplayName, role: editRole });
      if (res.data?.success) {
        // Cập nhật tại chỗ, không cần reload toàn bộ
        setUsers(prev => prev.map(u => u.userId === editingUser.userId ? { ...u, displayName: editDisplayName, role: editRole } : u));
        setIsEditModalOpen(false);
      }
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Lỗi kết nối đến máy chủ');
    } finally {
      setIsEditing(false);
    }
  };

  // --- Mở modal xác nhận xóa ---
  const openDeleteModal = (user: User) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  // --- Xóa người dùng ---
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/users/${deletingUser.userId}`);
      if (res.data?.success) {
        setUsers(prev => prev.filter(u => u.userId !== deletingUser.userId));
        setIsDeleteModalOpen(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xóa thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.displayName && u.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const roleColors: Record<string, string> = {
    admin: 'bg-indigo-100 text-indigo-700',
    hotel_owner: 'bg-amber-100 text-amber-700',
    user: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý người dùng</h1>
          <p className="text-gray-500 text-sm mt-1">Xem và quản lý tất cả các tài khoản trên hệ thống</p>
        </div>
        <button
          onClick={() => { setAddError(''); setIsAddModalOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-500/30"
        >
          <UserPlus className="w-4 h-4" />
          Thêm người dùng
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative max-w-xs w-full group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
            />
          </div>
          <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Tổng cộng: {filteredUsers.length}</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
              <p className="text-sm">Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center text-red-500 font-medium">{error}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">Không tìm thấy người dùng nào.</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-3.5 font-semibold">Người dùng</th>
                  <th className="px-6 py-3.5 font-semibold">Vai trò</th>
                  <th className="px-6 py-3.5 font-semibold">Points</th>
                  <th className="px-6 py-3.5 font-semibold">Xác thực</th>
                  <th className="px-6 py-3.5 font-semibold">Ngày tham gia</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map(user => (
                  <tr key={user._id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=random&size=80`}
                          alt={user.displayName}
                          className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm"
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user.displayName || 'Chưa cập nhật'}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors[user.role] || roleColors.user}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
                        {user.points?.toLocaleString() || 0} pts
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isVerified ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs font-medium">Đã xác minh</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <XCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Chưa xác minh</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(user)}
                          title="Chỉnh sửa"
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(user)}
                          title="Xóa người dùng"
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ====== Modal Thêm người dùng ====== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Thêm người dùng mới</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {addError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-medium">{addError}</div>}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Tên hiển thị</label>
                <input type="text" required value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} placeholder="Nguyễn Văn A" className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Email</label>
                <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@example.com" className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Mật khẩu</label>
                <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Ít nhất 6 ký tự" className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Phân quyền</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm outline-none transition-all">
                  <option value="user">User — Người dùng thường</option>
                  <option value="hotel_owner">Hotel Owner — Chủ khách sạn</option>
                  <option value="admin">Admin — Quản trị viên</option>
                </select>
              </div>
              <div className="pt-3 flex gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors">Hủy</button>
                <button type="submit" disabled={isAdding} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm disabled:opacity-70 transition-all shadow-lg shadow-blue-500/25">
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== Modal Chỉnh sửa ====== */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Chỉnh sửa người dùng</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editingUser.email}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              {editError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-medium">{editError}</div>}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Tên hiển thị</label>
                <input type="text" required value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Phân quyền</label>
                <select value={editRole} onChange={e => setEditRole(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm outline-none transition-all">
                  <option value="user">User — Người dùng thường</option>
                  <option value="hotel_owner">Hotel Owner — Chủ khách sạn</option>
                  <option value="admin">Admin — Quản trị viên</option>
                </select>
              </div>
              <div className="pt-3 flex gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors">Hủy</button>
                <button type="submit" disabled={isEditing} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm disabled:opacity-70 transition-all shadow-lg shadow-blue-500/25">
                  {isEditing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== Modal Xác nhận Xóa ====== */}
      {isDeleteModalOpen && deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h2>
              <p className="text-sm text-gray-500 mb-1">Bạn có chắc chắn muốn xóa tài khoản của</p>
              <p className="text-sm font-semibold text-gray-900 mb-4">
                {deletingUser.displayName || deletingUser.email}
              </p>
              <p className="text-xs text-red-500 bg-red-50 rounded-xl p-2.5 mb-5">
                ⚠️ Hành động này không thể hoàn tác!
              </p>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors">
                  Hủy
                </button>
                <button onClick={handleDeleteUser} disabled={isDeleting} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm disabled:opacity-70 transition-all shadow-lg shadow-red-500/25">
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xóa người dùng'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
