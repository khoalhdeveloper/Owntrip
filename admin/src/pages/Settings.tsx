import { useState, useEffect } from 'react';
import { 
  User, Lock, Trophy, Info, Save, Loader2, 
  CheckCircle2, AlertCircle, Shield, Database, 
  Cpu, HardDrive, RefreshCw
} from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'points' | 'system'>('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile State
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [imageUrl, setImageUrl] = useState(user?.image || '');

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Points Config State
  const [pointsConfig, setPointsConfig] = useState({
    points_per_vnpay_1000: 1,
    points_daily_login: 10,
    points_review_bonus: 50,
  });

  // System Info State
  const [systemInfo, setSystemInfo] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'points') fetchPointsConfig();
    if (activeTab === 'system') fetchSystemInfo();
  }, [activeTab]);

  const fetchPointsConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/system/config');
      if (res.data?.success) setPointsConfig(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      setLoading(true);
      const res = await api.get('/system/info');
      if (res.data?.success) setSystemInfo(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await api.put(`/users/updateProfile/${user.userId}`, { displayName, image: imageUrl });
      if (res.data?.success) {
        setSuccess('Cập nhật hồ sơ thành công!');
        // Cập nhật auth context nếu cần (ở đây giả định login function cập nhật local storage)
        const updatedUser = { ...user, displayName, image: imageUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // Bạn có thể cần một hàm reloadUser trong AuthContext để mượt hơn
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!user) return;
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await api.put(`/users/updatePassword/${user.userId}`, { oldPassword, newPassword });
      if (res.data?.success) {
        setSuccess('Đổi mật khẩu thành công!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePointsConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await api.post('/system/config', pointsConfig);
      if (res.data?.success) {
        setSuccess('Cập nhật cấu hình điểm thành công!');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi cập nhật cấu hình');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cài đặt hệ thống</h1>
        <p className="text-gray-500 text-sm mt-1">Quản lý tài khoản cá nhân và cấu hình ứng dụng</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-1">
          {[
            { id: 'profile',  label: 'Hồ sơ Admin', icon: User },
            { id: 'password', label: 'Mật khẩu',    icon: Lock },
            { id: 'points',   label: 'Cấu hình Điểm', icon: Trophy },
            { id: 'system',   label: 'Thông tin hệ thống', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSuccess('');
                  setError('');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden min-h-[400px]">
          <div className="p-6">
            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">{success}</span>
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="max-w-md space-y-5">
                <div className="flex flex-col items-center gap-4 mb-6">
                  <div className="relative group">
                    <img 
                      src={imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'Admin')}&background=random&size=128`}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md group-hover:opacity-75 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded-md">Ảnh hồ sơ</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Tên hiển thị</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">URL ảnh đại diện</label>
                  <input 
                    type="url" 
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Email (Không thể đổi)</label>
                  <input 
                    type="email" 
                    disabled
                    value={user?.email}
                    className="w-full px-4 py-2.5 bg-gray-100 border border-transparent rounded-xl text-sm text-gray-500"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition-all disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Lưu thay đổi
                </button>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handleUpdatePassword} className="max-w-md space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Mật khẩu hiện tại</label>
                  <input 
                    type="password" 
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Mật khẩu mới</label>
                  <input 
                    type="password" 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Xác nhận mật khẩu mới</label>
                  <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm transition-all outline-none"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition-all disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Cập nhật mật khẩu
                </button>
              </form>
            )}

            {/* Points Config Tab */}
            {activeTab === 'points' && (
              <form onSubmit={handleUpdatePointsConfig} className="max-w-md space-y-5">
                <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-sm mb-4">
                  <div className="flex gap-2">
                    <Trophy className="w-5 h-5 shrink-0" />
                    <p>Các thiết lập này sẽ áp dụng toàn hệ thống cho việc tích lũy và sử dụng Points.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Points mỗi 1,000 VND nạp</label>
                  <input 
                    type="number" 
                    value={pointsConfig.points_per_vnpay_1000}
                    onChange={(e) => setPointsConfig(p => ({ ...p, points_per_vnpay_1000: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Thưởng đăng nhập hàng ngày</label>
                  <input 
                    type="number" 
                    value={pointsConfig.points_daily_login}
                    onChange={(e) => setPointsConfig(p => ({ ...p, points_daily_login: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Thưởng viết đánh giá</label>
                  <input 
                    type="number" 
                    value={pointsConfig.points_review_bonus}
                    onChange={(e) => setPointsConfig(p => ({ ...p, points_review_bonus: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm transition-all outline-none"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold transition-all disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Cập nhật cấu hình
                </button>
              </form>
            )}

            {/* System Info Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-gray-900">Nền tảng</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{systemInfo?.platform || '--'}</p>
                    <p className="text-xs text-gray-500 mt-1">Node {systemInfo?.nodeVersion}</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                        <Database className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-gray-900">Database</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{systemInfo?.dbStatus || '--'}</p>
                    <p className="text-xs text-gray-500 mt-1">MongoDB Atlas</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                        <RefreshCw className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-gray-900">Thời gian chạy</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{systemInfo?.uptime || '--'}</p>
                    <p className="text-xs text-gray-500 mt-1">Kể từ lần khởi động cuối</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-gray-900">Phiên bản</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{systemInfo?.version || '1.0.0'}</p>
                    <p className="text-xs text-gray-500 mt-1">Owntrip Admin API</p>
                  </div>
                </div>

                <div className="p-4 border border-dashed border-gray-200 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3 text-gray-600">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Bảo mật hệ thống</span>
                  </div>
                  <ul className="text-xs text-gray-500 space-y-2">
                    <li className="flex items-center gap-2">• Sử dụng JWT Token xác thực mọi yêu cầu.</li>
                    <li className="flex items-center gap-2">• Phân quyền chặt chẽ giữa Admin và Staff.</li>
                    <li className="flex items-center gap-2">• Dữ liệu nhạy cảm được mã hóa trước khi lưu trữ.</li>
                  </ul>
                </div>

                <button 
                  onClick={fetchSystemInfo}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Làm mới trạng thái
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
