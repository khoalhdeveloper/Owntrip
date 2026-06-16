import { useState, useEffect, useRef } from 'react';
import {
  Plus, Edit2, Trash2, Loader2, XCircle, AlertTriangle,
  Eye, EyeOff, ImageIcon, Upload, LayoutGrid, Film
} from 'lucide-react';
import api from '../lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Frame {
  _id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  category: string;
  unlockType?: 'free' | 'mission';
  layoutType: 'single' | 'filmstrip-4';
  slotsCount: number;
  isActive: boolean;
  order: number;
  createdAt: string;
}

type CategoryType = 'general' | 'holiday' | 'seasonal' | 'city';
type LayoutType   = 'single' | 'filmstrip-4';
type UnlockType   = 'free' | 'mission';

// ─── Config ───────────────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<CategoryType, { label: string; color: string }> = {
  general:  { label: 'Chung',   color: 'bg-gray-100 text-gray-600' },
  holiday:  { label: 'Lễ hội',  color: 'bg-red-100 text-red-600' },
  seasonal: { label: 'Mùa vụ',  color: 'bg-amber-100 text-amber-700' },
  city:     { label: 'Thành phố', color: 'bg-blue-100 text-blue-700' },
};

const LAYOUT_CONFIG: Record<LayoutType, { label: string; icon: typeof LayoutGrid; color: string }> = {
  'single':      { label: '1 ô',      icon: LayoutGrid, color: 'bg-indigo-50 text-indigo-700' },
  'filmstrip-4': { label: '4 ô film', icon: Film,       color: 'bg-purple-50 text-purple-700' },
};

const UNLOCK_CONFIG: Record<UnlockType, { label: string; color: string }> = {
  free:    { label: 'Miễn phí',     color: 'bg-emerald-50 text-emerald-700' },
  mission: { label: 'Quà mission',  color: 'bg-fuchsia-50 text-fuchsia-700' },
};

const EMPTY_FORM = {
  name: '',
  category: 'general' as CategoryType,
  unlockType: 'free' as UnlockType,
  layoutType: 'single' as LayoutType,
  slotsCount: 1,
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Frames() {
  const [frames, setFrames]       = useState<Frame[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // Filter
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterActive,   setFilterActive]   = useState('all');

  // Modal thêm/sửa
  const [isFormOpen,    setIsFormOpen]    = useState(false);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [formError,     setFormError]     = useState('');
  const [editingFrame,  setEditingFrame]  = useState<Frame | null>(null);
  const [form,          setForm]          = useState(EMPTY_FORM);

  // Upload ảnh
  const fileInputRef                      = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile]   = useState<File | null>(null);
  const [previewUrl,   setPreviewUrl]     = useState('');
  const [fileError,    setFileError]      = useState('');

  // Modal xóa
  const [isDeleteOpen,  setIsDeleteOpen]  = useState(false);
  const [isDeleting,    setIsDeleting]    = useState(false);
  const [deletingFrame, setDeletingFrame] = useState<Frame | null>(null);

  useEffect(() => { fetchFrames(); }, []);

  // Dọn preview URL khi unmount tránh memory leak
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const fetchFrames = async () => {
    try {
      setLoading(true);
      const res = await api.get('/frames/admin');
      if (res.data?.success) setFrames(res.data.frames);
    } catch {
      setError('Lỗi khi tải danh sách frame');
    } finally {
      setLoading(false);
    }
  };

  // ─── Mở form Thêm ──────────────────────────────────────────────────────────
  const openAddForm = () => {
    setEditingFrame(null);
    setForm(EMPTY_FORM);
    setSelectedFile(null);
    setPreviewUrl('');
    setFileError('');
    setFormError('');
    setIsFormOpen(true);
  };

  // ─── Mở form Sửa ───────────────────────────────────────────────────────────
  const openEditForm = (frame: Frame) => {
    setEditingFrame(frame);
    setForm({
      name:       frame.name,
      category:   frame.category as CategoryType,
      unlockType: (frame.unlockType || 'free') as UnlockType,
      layoutType: frame.layoutType,
      slotsCount: frame.slotsCount,
    });
    setSelectedFile(null);
    setPreviewUrl(frame.thumbnailUrl || frame.imageUrl);
    setFileError('');
    setFormError('');
    setIsFormOpen(true);
  };

  // ─── Chọn file PNG ─────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate PNG
    if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) {
      setFileError('Chỉ chấp nhận file PNG');
      setSelectedFile(null);
      setPreviewUrl(editingFrame?.thumbnailUrl || editingFrame?.imageUrl || '');
      return;
    }

    setFileError('');
    setSelectedFile(file);
    // Tạo preview URL tạm thời
    const objUrl = URL.createObjectURL(file);
    setPreviewUrl(objUrl);
  };

  // ─── Tự động set slotsCount theo layoutType ────────────────────────────────
  const handleLayoutChange = (layout: LayoutType) => {
    setForm(f => ({
      ...f,
      layoutType: layout,
      slotsCount: layout === 'filmstrip-4' ? 4 : 1,
    }));
  };

  // ─── Submit form ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validate: tạo mới phải có file
    if (!editingFrame && !selectedFile) {
      setFileError('Vui lòng chọn file PNG cho frame');
      return;
    }

    setIsSubmitting(true);
    try {
      // Dùng FormData vì có file upload
      const formData = new FormData();
      formData.append('name',       form.name);
      formData.append('category',   form.category);
      formData.append('unlockType', form.unlockType);
      formData.append('layoutType', form.layoutType);
      formData.append('slotsCount', String(form.slotsCount));
      if (selectedFile) formData.append('image', selectedFile);

      if (editingFrame) {
        const res = await api.put(`/frames/${editingFrame._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data?.success) {
          setFrames(prev => prev.map(f => f._id === editingFrame._id ? res.data.frame : f));
          setIsFormOpen(false);
        }
      } else {
        const res = await api.post('/frames', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data?.success) {
          setFrames(prev => [res.data.frame, ...prev]);
          setIsFormOpen(false);
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Toggle active ─────────────────────────────────────────────────────────
  const handleToggle = async (frame: Frame) => {
    try {
      const res = await api.patch(`/frames/${frame._id}/toggle`);
      if (res.data?.success) {
        setFrames(prev => prev.map(f => f._id === frame._id ? res.data.frame : f));
      }
    } catch {
      alert('Không thể cập nhật trạng thái');
    }
  };

  // ─── Xóa ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingFrame) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/frames/${deletingFrame._id}`);
      if (res.data?.success) {
        setFrames(prev => prev.filter(f => f._id !== deletingFrame._id));
        setIsDeleteOpen(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xóa thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Filter ────────────────────────────────────────────────────────────────
  const filtered = frames.filter(f => {
    const matchCat    = filterCategory === 'all' || f.category === filterCategory;
    const matchActive =
      filterActive === 'all'      ? true :
      filterActive === 'active'   ? f.isActive :
      !f.isActive;
    return matchCat && matchActive;
  });

  const stats = {
    total:    frames.length,
    active:   frames.filter(f => f.isActive).length,
    single:   frames.filter(f => f.layoutType === 'single').length,
    filmstrip:frames.filter(f => f.layoutType === 'filmstrip-4').length,
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Khung hình Check-in</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý frame ảnh hiển thị trong chức năng check-in</p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-teal-500/30"
        >
          <Plus className="w-4 h-4" />
          Thêm frame mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tổng frame',  value: stats.total,     color: 'from-blue-500 to-blue-600' },
          { label: 'Đang hiển thị', value: stats.active,  color: 'from-emerald-500 to-emerald-600' },
          { label: 'Kiểu 1 ô',   value: stats.single,    color: 'from-indigo-500 to-indigo-600' },
          { label: 'Kiểu film',  value: stats.filmstrip,  color: 'from-purple-500 to-purple-600' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white shadow-lg`}>
            <p className="text-white/70 text-xs font-medium">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Grid */}
      <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">

        {/* Filter bar */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3 bg-gray-50/50">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none text-gray-700 cursor-pointer"
          >
            <option value="all">Tất cả danh mục</option>
            <option value="general">Chung</option>
            <option value="holiday">Lễ hội</option>
            <option value="seasonal">Mùa vụ</option>
            <option value="city">Thành phố</option>
          </select>

          <select
            value={filterActive}
            onChange={e => setFilterActive(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none text-gray-700 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hiển thị</option>
            <option value="inactive">Đã ẩn</option>
          </select>

          <span className="text-sm text-gray-500 font-medium ml-auto">Hiển thị: {filtered.length}</span>
        </div>

        {/* Grid content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin mr-3 text-teal-500" />
              <span className="text-sm">Đang tải dữ liệu...</span>
            </div>
          ) : error ? (
            <div className="py-20 text-center text-red-500">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">Không tìm thấy frame nào.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(frame => {
                const catConf    = CATEGORY_CONFIG[frame.category as CategoryType] ?? CATEGORY_CONFIG.general;
                const layoutConf = LAYOUT_CONFIG[frame.layoutType];
                const unlockConf = UNLOCK_CONFIG[(frame.unlockType || 'free') as UnlockType];
                const LayoutIcon = layoutConf.icon;
                return (
                  <div
                    key={frame._id}
                    className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-square bg-gray-50 overflow-hidden">
                      {frame.thumbnailUrl || frame.imageUrl ? (
                        <img
                          src={frame.thumbnailUrl || frame.imageUrl}
                          alt={frame.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-gray-200" />
                        </div>
                      )}
                      {/* Overlay actions */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => openEditForm(frame)}
                          className="p-2 bg-white rounded-full text-blue-600 hover:bg-blue-50 shadow-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setDeletingFrame(frame); setIsDeleteOpen(true); }}
                          className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 shadow-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-semibold text-gray-900 truncate" title={frame.name}>
                        {frame.name}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${catConf.color}`}>
                          {catConf.label}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${layoutConf.color}`}>
                          <LayoutIcon className="w-3 h-3" />
                          {layoutConf.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${unlockConf.color}`}>
                          {unlockConf.label}
                        </span>
                      </div>
                      {/* Toggle active */}
                      <button
                        onClick={() => handleToggle(frame)}
                        className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          frame.isActive
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {frame.isActive
                          ? <><Eye className="w-3.5 h-3.5" /> Đang hiển thị</>
                          : <><EyeOff className="w-3.5 h-3.5" /> Đã ẩn</>
                        }
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ====== Modal Thêm/Sửa ====== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editingFrame ? 'Chỉnh sửa frame' : 'Thêm frame mới'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                  {formError}
                </div>
              )}

              {/* Tên frame */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Tên frame *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Khung Tết Nguyên Đán"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-teal-500 focus:bg-white rounded-xl text-sm outline-none transition-all"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Danh mục</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as CategoryType }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-teal-500 focus:bg-white rounded-xl text-sm outline-none transition-all"
                >
                  <option value="general">Chung (General)</option>
                  <option value="holiday">Lễ hội (Holiday)</option>
                  <option value="seasonal">Mùa vụ (Seasonal)</option>
                  <option value="city">Thành phố (City)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Cách mở khóa</label>
                <select
                  value={form.unlockType}
                  onChange={e => setForm(f => ({ ...f, unlockType: e.target.value as UnlockType }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-teal-500 focus:bg-white rounded-xl text-sm outline-none transition-all"
                >
                  <option value="free">Miễn phí - ai cũng dùng được</option>
                  <option value="mission">Quà mission - chỉ hiện sau khi nhận thưởng</option>
                </select>
              </div>

              {/* Layout Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Kiểu bố cục</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['single', 'filmstrip-4'] as LayoutType[]).map(lt => {
                    const conf = LAYOUT_CONFIG[lt];
                    const Icon = conf.icon;
                    return (
                      <button
                        key={lt}
                        type="button"
                        onClick={() => handleLayoutChange(lt)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          form.layoutType === lt
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{conf.label}</span>
                        <span className="ml-auto text-xs text-gray-400">
                          {lt === 'single' ? '1 ô' : '4 ô'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upload ảnh PNG */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Ảnh frame PNG {!editingFrame && '*'}
                </label>

                {/* Drop zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 transition-all ${
                    fileError
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-200 bg-gray-50 hover:border-teal-400 hover:bg-teal-50/30'
                  }`}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="w-28 h-28 object-contain rounded-lg border border-gray-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <p className="text-sm text-gray-500">
                    {selectedFile
                      ? <span className="text-teal-600 font-medium">{selectedFile.name}</span>
                      : <><span className="text-teal-600 font-medium">Nhấn để chọn file</span> hoặc kéo thả vào đây</>
                    }
                  </p>
                  <p className="text-xs text-gray-400">Chỉ chấp nhận PNG • Tối đa 10MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
                {editingFrame && !selectedFile && (
                  <p className="text-xs text-gray-400">Để trống nếu không muốn đổi ảnh</p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-xl text-sm disabled:opacity-70 transition-all shadow-lg shadow-teal-500/30"
                >
                  {isSubmitting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : (editingFrame ? 'Lưu thay đổi' : 'Tạo frame')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== Modal Xóa ====== */}
      {isDeleteOpen && deletingFrame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h2>
              <p className="text-sm text-gray-500 mb-1">Bạn muốn xóa frame</p>
              <p className="text-sm font-bold text-gray-900 mb-4">"{deletingFrame.name}"</p>
              <p className="text-xs text-red-500 bg-red-50 rounded-xl p-2.5 mb-5">
                ⚠️ Ảnh sẽ bị xóa khỏi Cloudinary và không thể khôi phục!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm disabled:opacity-70 transition-all"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xóa frame'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
