import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, CheckCircle2, Star, Loader2, Building2, AlertTriangle, XCircle, MapPin, UserCog } from 'lucide-react';
import api from '../lib/axios';

interface Room {
  roomTypeId: string;
  name: string;
  basePrice: number;
  capacity: number;
}

interface Hotel {
  _id: string;
  hotelId: string;
  name: string;
  starRating: number;
  address: {
    fullAddress: string;
    city: string;
  };
  images: string[];
  description: string;
  amenities: string[];
  rooms: Room[];
  reviewSummary: {
    score: number;
    count: number;
  };
  ownerId?: string;
  createdAt: string;
}

interface Owner {
  userId: string;
  email: string;
  displayName?: string;
  image?: string;
  role: string;
}

export default function Hotels() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // === Modal: Chỉnh sửa ===
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState('');
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editStarRating, setEditStarRating] = useState(4);
  const [editDescription, setEditDescription] = useState('');

  // === Modal: Xác nhận xóa ===
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingHotel, setDeletingHotel] = useState<Hotel | null>(null);

  // === Modal: Gán chủ sở hữu ===
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assigningHotel, setAssigningHotel] = useState<Hotel | null>(null);
  const [ownerList, setOwnerList] = useState<Owner[]>([]);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [loadingOwners, setLoadingOwners] = useState(false);

  useEffect(() => { fetchHotels(); }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hotels');
      if (res.data?.success) setHotels(res.data.data);
    } catch (err: any) {
      setError('Lỗi khi tải danh sách khách sạn');
    } finally {
      setLoading(false);
    }
  };

  // --- Mở modal sửa ---
  const openEditModal = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setEditName(hotel.name);
    setEditCity(hotel.address?.city || '');
    setEditAddress(hotel.address?.fullAddress || '');
    setEditStarRating(hotel.starRating || 4);
    setEditDescription(hotel.description || '');
    setEditError('');
    setIsEditModalOpen(true);
  };

  // --- Cập nhật khách sạn ---
  const handleUpdateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHotel) return;
    setEditError('');
    setIsEditing(true);
    try {
      const res = await api.patch(`/hotels/${editingHotel.hotelId}`, {
        name: editName,
        starRating: editStarRating,
        description: editDescription,
        address: { ...editingHotel.address, city: editCity, fullAddress: editAddress }
      });
      if (res.data?.success) {
        setHotels(prev => prev.map(h =>
          h.hotelId === editingHotel.hotelId
            ? { ...h, name: editName, starRating: editStarRating, description: editDescription, address: { ...h.address, city: editCity, fullAddress: editAddress } }
            : h
        ));
        setIsEditModalOpen(false);
      }
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Lỗi kết nối đến máy chủ');
    } finally {
      setIsEditing(false);
    }
  };

  // --- Mở modal xóa ---
  const openDeleteModal = (hotel: Hotel) => {
    setDeletingHotel(hotel);
    setIsDeleteModalOpen(true);
  };

  // --- Xóa khách sạn ---
  const handleDeleteHotel = async () => {
    if (!deletingHotel) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/hotels/${deletingHotel.hotelId}`);
      if (res.data?.success) {
        setHotels(prev => prev.filter(h => h.hotelId !== deletingHotel.hotelId));
        setIsDeleteModalOpen(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xóa thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Mở modal gán chủ ---
  const openAssignModal = async (hotel: Hotel) => {
    setAssigningHotel(hotel);
    setSelectedOwner(null);
    setOwnerSearch('');
    setAssignError('');
    setIsAssignModalOpen(true);
    setLoadingOwners(true);
    try {
      const res = await api.get('/users');
      if (res.data?.success) {
        // Chỉ hiện users có role hotel_owner
        setOwnerList(res.data.data.filter((u: Owner) => u.role === 'hotel_owner'));
      }
    } catch {
      setAssignError('Không thể tải danh sách Hotel Owner');
    } finally {
      setLoadingOwners(false);
    }
  };

  // --- Gán chủ sở hữu ---
  const handleAssignOwner = async () => {
    if (!assigningHotel || !selectedOwner) return;
    setIsAssigning(true);
    setAssignError('');
    try {
      const res = await api.post('/hotels/assign-owner', {
        hotelId: assigningHotel.hotelId,
        ownerId: selectedOwner.userId
      });
      if (res.data?.success) {
        setHotels(prev => prev.map(h =>
          h.hotelId === assigningHotel.hotelId ? { ...h, ownerId: selectedOwner.userId } : h
        ));
        setIsAssignModalOpen(false);
      }
    } catch (err: any) {
      setAssignError(err.response?.data?.message || 'Gán quyền thất bại');
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredOwners = ownerList.filter(o =>
    o.email.toLowerCase().includes(ownerSearch.toLowerCase()) ||
    (o.displayName && o.displayName.toLowerCase().includes(ownerSearch.toLowerCase()))
  );

  const filteredHotels = hotels.filter(h =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (h.address?.city && h.address.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  const renderStars = (count: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < count ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý khách sạn</h1>
          <p className="text-gray-500 text-sm mt-1">Xem và quản lý toàn bộ khách sạn trên nền tảng Owntrip</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
          <Building2 className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-gray-900">{hotels.length}</span> khách sạn
        </div>
      </div>

      {/* Grid / Table toggle — hiển thị dạng Grid Card */}
      <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative max-w-xs w-full group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc thành phố..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
            />
          </div>
          <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Hiển thị: {filteredHotels.length}</span>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
              <p className="text-sm">Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center text-red-500 font-medium">{error}</div>
          ) : filteredHotels.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">Không tìm thấy khách sạn nào.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredHotels.map(hotel => (
                <div key={hotel._id} className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 overflow-hidden flex flex-col">
                  {/* Thumbnail */}
                  <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {hotel.images && hotel.images.length > 0 ? (
                      <img
                        src={hotel.images[0]}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    {/* Star badge */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow-sm">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-gray-800">{hotel.starRating}</span>
                    </div>
                    {/* Rooms badge */}
                    <div className="absolute top-3 right-3 bg-blue-600/90 backdrop-blur-sm text-white rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm">
                      {hotel.rooms?.length || 0} loại phòng
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-1">{hotel.name}</h3>
                      {renderStars(hotel.starRating)}
                    </div>

                    {hotel.address?.city && (
                      <div className="flex items-start gap-1.5 text-gray-500">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-400" />
                        <span className="text-xs leading-snug line-clamp-2">{hotel.address.fullAddress || hotel.address.city}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-gray-500">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{hotel.reviewSummary?.count || 0} đánh giá</span>
                      </div>
                      {hotel.reviewSummary?.score > 0 && (
                        <div className="flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <span>★ {hotel.reviewSummary.score.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {/* Min Price */}
                    {hotel.rooms && hotel.rooms.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Giá từ: <span className="font-bold text-blue-600 text-sm">
                          {Math.min(...hotel.rooms.map(r => r.basePrice || 0)).toLocaleString('vi-VN')}₫
                        </span>/đêm
                      </div>
                    )}

                    {/* Owner badge */}
                    <div className="text-xs">
                      {hotel.ownerId ? (
                        <span className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full font-medium">
                          <UserCog className="w-3 h-3" />
                          {hotel.ownerId}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                          Chưa có chủ
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-auto pt-3 border-t border-gray-50 flex gap-2">
                      <button
                        onClick={() => openEditModal(hotel)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Sửa
                      </button>
                      <button
                        onClick={() => openAssignModal(hotel)}
                        title="Gán chủ sở hữu"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                      >
                        <UserCog className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(hotel)}
                        title="Xóa khách sạn"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ====== Modal Chỉnh sửa ====== */}
      {isEditModalOpen && editingHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Chỉnh sửa khách sạn</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editingHotel.hotelId}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateHotel} className="p-6 space-y-4">
              {editError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{editError}</div>}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Tên khách sạn</label>
                <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm outline-none transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Thành phố</label>
                  <input type="text" value={editCity} onChange={e => setEditCity(e.target.value)} placeholder="Hà Nội" className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Số sao</label>
                  <select value={editStarRating} onChange={e => setEditStarRating(Number(e.target.value))} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm outline-none transition-all">
                    {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s} sao</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Địa chỉ đầy đủ</label>
                <input type="text" value={editAddress} onChange={e => setEditAddress(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm outline-none transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Mô tả</label>
                <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm outline-none transition-all resize-none" />
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
      {isDeleteModalOpen && deletingHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h2>
              <p className="text-sm text-gray-500 mb-1">Bạn muốn xóa khách sạn</p>
              <p className="text-sm font-semibold text-gray-900 mb-2">{deletingHotel.name}</p>
              <p className="text-xs text-red-500 bg-red-50 rounded-xl p-2.5 mb-5">
                ⚠️ Toàn bộ Inventory phòng cũng sẽ bị xóa. Không thể hoàn tác!
              </p>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors">Hủy</button>
                <button onClick={handleDeleteHotel} disabled={isDeleting} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm disabled:opacity-70 transition-all">
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xóa khách sạn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== Modal Gán chủ sở hữu ====== */}
      {isAssignModalOpen && assigningHotel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Gán chủ sở hữu</h2>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{assigningHotel.name}</p>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {assignError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{assignError}</div>
              )}

              {/* Tìm kiếm */}
              <div className="relative group">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc email..."
                  value={ownerSearch}
                  onChange={e => setOwnerSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm outline-none transition-all"
                />
              </div>

              {/* Danh sách hotel_owner */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {loadingOwners ? (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-500" />
                    <span className="text-sm">Đang tải...</span>
                  </div>
                ) : filteredOwners.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    {ownerList.length === 0
                      ? 'Chưa có tài khoản Hotel Owner nào trong hệ thống.'
                      : 'Không tìm thấy kết quả phù hợp.'}
                  </div>
                ) : (
                  filteredOwners.map(owner => (
                    <button
                      key={owner.userId}
                      type="button"
                      onClick={() => setSelectedOwner(owner)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        selectedOwner?.userId === owner.userId
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <img
                        src={owner.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(owner.displayName || owner.email)}&background=random&size=80`}
                        alt={owner.displayName}
                        className="w-10 h-10 rounded-full object-cover border border-white shadow-sm shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{owner.displayName || 'Chưa cập nhật'}</p>
                        <p className="text-xs text-gray-500 truncate">{owner.email}</p>
                      </div>
                      {selectedOwner?.userId === owner.userId && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Selected preview */}
              {selectedOwner && (
                <div className="bg-blue-50 rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <p className="text-sm text-blue-700 font-medium">
                    Đã chọn: <span className="font-bold">{selectedOwner.displayName || selectedOwner.email}</span>
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAssignOwner}
                  disabled={isAssigning || !selectedOwner}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm disabled:opacity-60 transition-all shadow-lg shadow-indigo-500/25"
                >
                  {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><UserCog className="w-4 h-4" /> Xác nhận gán</>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
