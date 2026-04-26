import { useState, useEffect } from 'react';
import {
  Search, Plus, Edit2, Trash2, Loader2, XCircle, AlertTriangle,
  Eye, EyeOff, Frame, Sparkles, Tag, ImageIcon
} from 'lucide-react';
import api from '../lib/axios';

interface AvatarItem {
  _id: string;
  itemId: string;
  name: string;
  type: 'frame' | 'avatar';
  imageUrl: string;
  previewUrl?: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isActive: boolean;
  description?: string;
  createdAt: string;
}

const RARITY_CONFIG = {
  common:    { label: 'Common',    color: 'bg-gray-100 text-gray-600',       dot: 'bg-gray-400' },
  rare:      { label: 'Rare',      color: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500' },
  epic:      { label: 'Epic',      color: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-500' },
  legendary: { label: 'Legendary', color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400' },
};

const TYPE_CONFIG = {
  frame:  { label: 'Khung ảnh', icon: Frame,    color: 'bg-indigo-50 text-indigo-700' },
  avatar: { label: 'Avatar',    icon: Sparkles, color: 'bg-pink-50 text-pink-700' },
};

const EMPTY_FORM = {
  name: '', type: 'frame' as 'frame' | 'avatar', imageUrl: '',
  previewUrl: '', price: 0, rarity: 'common' as AvatarItem['rarity'],
  description: '', isActive: true,
};

export default function AvatarShop() {
  const [items, setItems] = useState<AvatarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'frame' | 'avatar'>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');

  // === Modal Thêm/Sửa ===
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingItem, setEditingItem] = useState<AvatarItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // === Modal Xóa ===
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingItem, setDeletingItem] = useState<AvatarItem | null>(null);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/avatar-items');
      if (res.data?.success) setItems(res.data.data);
    } catch {
      setError('Lỗi khi tải danh sách item');
    } finally {
      setLoading(false);
    }
  };

  // --- Mở form Thêm ---
  const openAddForm = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setIsFormOpen(true);
  };

  // --- Mở form Sửa ---
  const openEditForm = (item: AvatarItem) => {
    setEditingItem(item);
    setForm({
      name: item.name, type: item.type, imageUrl: item.imageUrl,
      previewUrl: item.previewUrl || '', price: item.price,
      rarity: item.rarity, description: item.description || '', isActive: item.isActive
    });
    setFormError('');
    setIsFormOpen(true);
  };

  // --- Submit form ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      if (editingItem) {
        const res = await api.put(`/avatar-items/${editingItem.itemId}`, form);
        if (res.data?.success) {
          setItems(prev => prev.map(i => i.itemId === editingItem.itemId ? res.data.data : i));
          setIsFormOpen(false);
        }
      } else {
        const res = await api.post('/avatar-items', form);
        if (res.data?.success) {
          setItems(prev => [res.data.data, ...prev]);
          setIsFormOpen(false);
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Toggle active ---
  const handleToggle = async (item: AvatarItem) => {
    try {
      const res = await api.patch(`/avatar-items/${item.itemId}/toggle`);
      if (res.data?.success) {
        setItems(prev => prev.map(i => i.itemId === item.itemId ? res.data.data : i));
      }
    } catch {
      alert('Không thể cập nhật trạng thái');
    }
  };

  // --- Xóa ---
  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/avatar-items/${deletingItem.itemId}`);
      if (res.data?.success) {
        setItems(prev => prev.filter(i => i.itemId !== deletingItem.itemId));
        setIsDeleteOpen(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xóa thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || i.type === filterType;
    const matchRarity = filterRarity === 'all' || i.rarity === filterRarity;
    return matchSearch && matchType && matchRarity;
  });

  const stats = {
    total: items.length,
    active: items.filter(i => i.isActive).length,
    frames: items.filter(i => i.type === 'frame').length,
    avatars: items.filter(i => i.type === 'avatar').length,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Avatar Shop</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý khung ảnh và avatar độc quyền để bán cho người dùng</p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-purple-500/30"
        >
          <Plus className="w-4 h-4" />
          Thêm item mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng item', value: stats.total, color: 'from-blue-500 to-blue-600' },
          { label: 'Đang bán',  value: stats.active, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Khung ảnh', value: stats.frames, color: 'from-indigo-500 to-indigo-600' },
          { label: 'Avatar',    value: stats.avatars, color: 'from-pink-500 to-pink-600' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-lg`}>
            <p className="text-white/70 text-xs font-medium">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3 bg-gray-50/50">
          <div className="relative flex-1 min-w-48 group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
            />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none text-gray-700 cursor-pointer">
            <option value="all">Tất cả loại</option>
            <option value="frame">Khung ảnh</option>
            <option value="avatar">Avatar</option>
          </select>
          <select value={filterRarity} onChange={e => setFilterRarity(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none text-gray-700 cursor-pointer">
            <option value="all">Tất cả Rarity</option>
            <option value="common">Common</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
          </select>
          <span className="text-sm text-gray-500 font-medium ml-auto">Hiển thị: {filtered.length}</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin mr-3 text-purple-500" />
              <span className="text-sm">Đang tải dữ liệu...</span>
            </div>
          ) : error ? (
            <div className="py-20 text-center text-red-500">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">Không tìm thấy item nào.</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-3.5 font-semibold">Item</th>
                  <th className="px-6 py-3.5 font-semibold">Loại</th>
                  <th className="px-6 py-3.5 font-semibold">Rarity</th>
                  <th className="px-6 py-3.5 font-semibold">Giá (Points)</th>
                  <th className="px-6 py-3.5 font-semibold">Trạng thái</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(item => {
                  const typeConf = TYPE_CONFIG[item.type];
                  const rarityConf = RARITY_CONFIG[item.rarity];
                  const TypeIcon = typeConf.icon;
                  return (
                    <tr key={item._id} className="hover:bg-purple-50/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-300" /></div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                            {item.description && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{item.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${typeConf.color}`}>
                          <TypeIcon className="w-3 h-3" />
                          {typeConf.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${rarityConf.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${rarityConf.dot}`}></span>
                          {rarityConf.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md flex items-center gap-1 w-fit">
                          <Tag className="w-3 h-3" />
                          {item.price.toLocaleString()} pts
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggle(item)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            item.isActive
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {item.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          {item.isActive ? 'Đang bán' : 'Đã ẩn'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEditForm(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setDeletingItem(item); setIsDeleteOpen(true); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ====== Modal Thêm/Sửa ====== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
              <h2 className="text-lg font-bold text-gray-900">
                {editingItem ? 'Chỉnh sửa item' : 'Thêm item mới'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{formError}</div>}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Tên item *</label>
                  <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Khung Rồng Vàng" className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-purple-500 focus:bg-white rounded-xl text-sm outline-none transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Loại *</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-purple-500 focus:bg-white rounded-xl text-sm outline-none transition-all">
                    <option value="frame">Khung ảnh (Frame)</option>
                    <option value="avatar">Avatar độc quyền</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Rarity *</label>
                  <select value={form.rarity} onChange={e => setForm(f => ({ ...f, rarity: e.target.value as any }))} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-purple-500 focus:bg-white rounded-xl text-sm outline-none transition-all">
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">URL ảnh chính *</label>
                  <input type="url" required value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-purple-500 focus:bg-white rounded-xl text-sm outline-none transition-all" />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">URL ảnh preview (tùy chọn)</label>
                  <input type="url" value={form.previewUrl} onChange={e => setForm(f => ({ ...f, previewUrl: e.target.value }))} placeholder="https://... (ảnh demo nhỏ hơn)" className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-purple-500 focus:bg-white rounded-xl text-sm outline-none transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Giá (Points) *</label>
                  <input type="number" required min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-purple-500 focus:bg-white rounded-xl text-sm outline-none transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Trạng thái</label>
                  <select value={form.isActive ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'true' }))} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-purple-500 focus:bg-white rounded-xl text-sm outline-none transition-all">
                    <option value="true">Đang bán (Active)</option>
                    <option value="false">Tạm ẩn (Hidden)</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Mô tả</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Mô tả ngắn về item này..." className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-purple-500 focus:bg-white rounded-xl text-sm outline-none transition-all resize-none" />
                </div>

                {/* Preview ảnh */}
                {form.imageUrl && (
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Xem trước</label>
                    <div className="flex items-center gap-3">
                      <img src={form.imageUrl} alt="preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100 shadow-sm" onError={e => (e.currentTarget.style.display = 'none')} />
                      <p className="text-xs text-gray-400">Ảnh sẽ hiển thị như trên trong cửa hàng</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 flex gap-3">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl text-sm disabled:opacity-70 transition-all shadow-lg shadow-purple-500/30">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingItem ? 'Lưu thay đổi' : 'Tạo item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== Modal Xóa ====== */}
      {isDeleteOpen && deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h2>
              <p className="text-sm text-gray-500 mb-1">Bạn muốn xóa item</p>
              <p className="text-sm font-bold text-gray-900 mb-4">"{deletingItem.name}"</p>
              <p className="text-xs text-red-500 bg-red-50 rounded-xl p-2.5 mb-5">⚠️ Hành động này không thể hoàn tác!</p>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleteOpen(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors">Hủy</button>
                <button onClick={handleDelete} disabled={isDeleting} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm disabled:opacity-70 transition-all">
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
