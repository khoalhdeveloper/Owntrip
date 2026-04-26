import { Users, Map, DollarSign, TrendingUp, MoreHorizontal, ArrowUpRight } from 'lucide-react';

const stats = [
  { name: 'Tổng người dùng', value: '12,480', change: '+12%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
  { name: 'Chuyến đi tháng này', value: '840', change: '+5%', icon: Map, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { name: 'Doanh thu', value: '$45,200', change: '+18%', icon: DollarSign, color: 'text-violet-600', bg: 'bg-violet-100' },
  { name: 'Tỷ lệ chuyển đổi', value: '4.6%', change: '+2%', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100' },
];

const recentBookings = [
  { id: '#BK1234', user: 'Nguyễn Văn A', destination: 'Đà Nẵng - Hội An', date: '26/04/2026', amount: '$340', status: 'Hoàn thành' },
  { id: '#BK1235', user: 'Trần Thị B', destination: 'Phú Quốc', date: '25/04/2026', amount: '$520', status: 'Đang xử lý' },
  { id: '#BK1236', user: 'Lê Văn C', destination: 'Nha Trang', date: '24/04/2026', amount: '$280', status: 'Hoàn thành' },
  { id: '#BK1237', user: 'Phạm Thị D', destination: 'Sapa', date: '23/04/2026', amount: '$190', status: 'Hủy' },
];

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard tổng quan</h1>
          <p className="text-gray-500 mt-2 text-sm">Chào mừng trở lại! Dưới đây là tình hình hoạt động hôm nay.</p>
        </div>
        <button className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-gray-900/20 flex items-center gap-2">
          Tải báo cáo
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-2xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-medium">
                <ArrowUpRight className="w-3 h-3" />
                {stat.change}
              </div>
            </div>
            <div className="mt-5">
              <h3 className="text-gray-500 text-sm font-medium">{stat.name}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-1 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart mock */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Doanh thu theo tháng</h2>
              <p className="text-sm text-gray-500">So với cùng kỳ năm trước</p>
            </div>
            <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {/* Mock bars */}
            {[40, 70, 45, 90, 65, 85, 100, 60, 50, 80, 55, 75].map((height, i) => (
              <div key={i} className="w-full bg-blue-50 rounded-t-lg relative group">
                <div 
                  className="absolute bottom-0 w-full bg-blue-600 rounded-t-lg group-hover:bg-blue-500 transition-colors"
                  style={{ height: `${height}%` }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs font-medium text-gray-400 px-1">
            <span>T1</span><span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span>
            <span>T7</span><span>T8</span><span>T9</span><span>T10</span><span>T11</span><span>T12</span>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Đặt chỗ gần đây</h2>
            <button className="text-blue-600 text-sm font-medium hover:underline">Xem tất cả</button>
          </div>
          <div className="space-y-6">
            {recentBookings.map((booking, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">
                    {booking.user.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{booking.user}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{booking.destination}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{booking.amount}</p>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block",
                    booking.status === 'Hoàn thành' ? "bg-emerald-100 text-emerald-700" :
                    booking.status === 'Đang xử lý' ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  )}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Chú ý: Cần thêm import cn. Tôi sẽ import trực tiếp ở đây.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
