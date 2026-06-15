import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronRight, 
  Star, 
  ShieldCheck, 
  Percent, 
  MapPin, 
  Sparkles,
  ArrowRight,
  Menu,
  X,
  Download
} from 'lucide-react';
import qrCodeImg from '../assets/qr-code.png';
import logoImg from '../assets/logo.png';
import Chatbot from '../components/Chatbot';

const QRCodeImg = ({ className = "w-full h-full object-contain rounded-lg" }: { className?: string }) => (
  <img 
    src={qrCodeImg} 
    alt="QR Code" 
    className={className}
  />
);


const ExpoBuildBadge = () => (
  <a 
    href="https://expo.dev/accounts/khoale3004/projects/owntrip/builds/36906c47-0020-45b8-bfbb-11186dee3365" 
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-3 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 border border-emerald-500 duration-200"
  >
    <Download className="w-6 h-6 text-white" />
    <div className="text-left leading-none">
      <p className="text-[10px] text-emerald-100 font-medium uppercase tracking-wider">Tải bản thử nghiệm</p>
      <p className="text-sm font-semibold mt-1 font-sans">Expo EAS Build</p>
    </div>
  </a>
);

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Scroll Animation Observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.15 });

    const elements = document.querySelectorAll('.reveal');
    elements.forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 selection:bg-emerald-500 selection:text-white relative font-sans">
      {/* Sleek Gradient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-slate-200/40 to-transparent"></div>
      </div>

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/75 border-b border-slate-100/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 group cursor-pointer animate-float">
              <img src={logoImg} alt="Owntrip Logo" className="h-16 sm:h-20 object-contain drop-shadow-md group-hover:scale-105 group-hover:drop-shadow-xl transition-all duration-300" />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
              <a href="#features" className="hover:text-emerald-600 transition-colors">Tính năng</a>
              <a href="#download" className="hover:text-emerald-600 transition-colors">Cách tải app</a>
              <a href="#about" className="hover:text-emerald-600 transition-colors">Về chúng tôi</a>
              <Link to="/faq" className="hover:text-emerald-600 transition-colors">FAQ</Link>
            </nav>

            {/* Header Login / Dashboard CTA */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                >
                  Kênh quản trị
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <Link 
                    to="/login"
                    className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Đăng nhập đối tác
                  </Link>
                  <button 
                    onClick={() => {
                      const element = document.getElementById('download');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl active:scale-[0.98] transition-all"
                  >
                    Tải App Ngay
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-100 bg-white/95 backdrop-blur-lg animate-in slide-in-from-top-4 duration-200">
            <div className="px-4 pt-2 pb-6 space-y-3">
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-semibold text-slate-700 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition-all"
              >
                Tính năng
              </a>
              <a 
                href="#download" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-semibold text-slate-700 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition-all"
              >
                Cách tải app
              </a>
              <a 
                href="#about" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-semibold text-slate-700 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition-all"
              >
                Về chúng tôi
              </a>
              <Link 
                to="/faq" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-semibold text-slate-700 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition-all"
              >
                Hỗ trợ (FAQ)
              </Link>
              <hr className="border-slate-100 my-2" />
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/dashboard');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-md"
                >
                  Kênh quản trị
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 text-center text-slate-700 font-semibold border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    Đăng nhập đối tác
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      const element = document.getElementById('download');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-3 text-center bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all"
                  >
                    Tải App Ngay
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden min-h-[100dvh] flex items-center bg-[#fafbfc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Copy */}
            <div className="text-left space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="inline-block">
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-emerald-200 shadow-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Ứng dụng du lịch số 1
                </span>
              </div>
              
              <div className="space-y-4 relative">
                {/* Decorative blob behind text */}
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-100/50 to-teal-50/50 blur-2xl -z-10 rounded-full animate-blob"></div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
                  OwnTrip: <br/>
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent drop-shadow-sm">Trợ lý du lịch thông minh.</span>
                </h1>
                <p className="text-lg text-slate-600 max-w-[45ch] leading-relaxed">
                  Bạn đã bao giờ tốn hàng giờ đồng hồ chỉ để tra cứu thông tin, đọc review ảo và đau đầu sắp xếp lịch trình? OwnTrip sinh ra để giải quyết tất cả.
                </p>
              </div>
              
              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-start gap-6 text-slate-500 text-sm">
                <div className="flex items-center gap-1.5 font-medium bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="text-slate-800 font-bold">4.9/5</span> Đánh giá
                </div>
                <div className="flex items-center gap-1.5 font-medium bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  Uy tín & Tin cậy
                </div>
              </div>

              {/* CTAs */}
              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => {
                    const element = document.getElementById('download');
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:from-emerald-700 hover:to-teal-600 px-8 py-4 rounded-2xl font-bold transition-all hover:-translate-y-1 active:scale-[0.98] shadow-xl shadow-emerald-600/30 text-center animate-pulse-glow"
                >
                  Tải App Ngay
                </button>
                <button className="bg-white/80 backdrop-blur-sm text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 px-8 py-4 rounded-2xl font-bold transition-all active:scale-[0.98] text-center shadow-sm">
                  Khám phá Tính năng
                </button>
              </div>
            </div>

            {/* Right Column: Visual Mockup */}
            <div className="relative flex justify-center lg:justify-end animate-in fade-in zoom-in-95 duration-1000 group">

              
              {/* Phone Mockup */}
              <div className="w-[300px] h-[646px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-900 ring-1 ring-slate-800 relative z-10 -rotate-2 group-hover:rotate-0 transition-transform duration-700">
                
                {/* Volume / Power Buttons */}
                <div className="absolute left-[-6px] top-28 w-[6px] h-10 bg-slate-900 rounded-l-md"></div>
                <div className="absolute left-[-6px] top-40 w-[6px] h-14 bg-slate-900 rounded-l-md"></div>
                <div className="absolute right-[-6px] top-32 w-[6px] h-16 bg-slate-900 rounded-r-md"></div>

                <div className="w-full h-full rounded-[38px] overflow-hidden bg-white relative">
                  <img src="/home.png" alt="Travel App Preview" className="w-full h-full object-cover object-top" />
                </div>
              </div>
              
              {/* Floating Element */}
              <div className="absolute -bottom-6 -left-6 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/50 z-20 flex items-center gap-3 animate-bounce" style={{animationDuration: '3s'}}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-400 flex items-center justify-center text-white shadow-inner">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Lên lịch trình tự động</p>
                  <p className="text-sm font-black text-slate-900">Nhanh chóng & Tiện lợi</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* SECTION 1: Check-in & Khung ảnh */}
      <section id="features" className="py-24 sm:py-32 relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <div className="space-y-12 reveal">
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Check-in thả ga, <br className="hidden sm:block" /> Nhận frame độc quyền
              </h2>
              
              <div className="space-y-8">
                {/* Item 1 */}
                <div className="flex gap-6 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Xác thực vị trí thông minh</h4>
                    <p className="text-slate-500 mt-2 leading-relaxed">Hệ thống tự động nhận diện GPS khi bạn ghé thăm các địa điểm. Không cần khai báo phức tạp.</p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex gap-6 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Mở khóa Frame giới hạn</h4>
                    <p className="text-slate-500 mt-2 leading-relaxed">Mỗi điểm đến là một thiết kế khung ảnh mang đậm dấu ấn văn hóa riêng. Sưu tầm ngay để làm phong phú nhật ký hành trình.</p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex gap-6 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform duration-300">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Lưu giữ & Chia sẻ một chạm</h4>
                    <p className="text-slate-500 mt-2 leading-relaxed">Xuất ảnh chất lượng cao hoặc chia sẻ trực tiếp lên mạng xã hội để khoe với hội bạn bè dễ dàng.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Phone Mockup (Checkin) */}
            <div className="relative flex justify-center lg:justify-end reveal reveal-delay-200">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl -z-10 animate-blob animation-delay-2000"></div>
              <div className="w-[300px] h-[646px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-900 ring-1 ring-slate-800 relative z-10">
                {/* Screen */}
                <div className="w-full h-full rounded-[38px] overflow-hidden bg-white relative">
                  <img src="/checkin.png" alt="Checkin Frame" className="w-full h-full object-cover object-[15%_top]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: BENTO GRID (Quản lý doanh thu) */}
      <section className="py-24 sm:py-32 relative bg-slate-50 overflow-hidden border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16 reveal">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Tối ưu hóa <span className="text-emerald-600">vận hành.</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-[65ch] mx-auto">
              Hệ thống công cụ mạnh mẽ giúp bạn nắm bắt mọi chỉ số quan trọng, kiểm soát phòng trống và gia tăng doanh thu ngay trên điện thoại.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 auto-rows-[280px]">
            {/* Cell 1: Large Feature */}
            <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between reveal reveal-delay-100 hover:shadow-md transition-shadow group cursor-default">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Kiểm soát phòng theo thời gian thực</h3>
                <p className="text-slate-500 max-w-md">Cập nhật nhanh chóng trạng thái phòng, nhận thông báo đặt phòng mới lập tức không độ trễ.</p>
              </div>
              <div className="flex justify-end opacity-50 group-hover:opacity-100 transition-opacity">
                 <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center">
                   <ArrowRight className="text-emerald-600 w-5 h-5" />
                 </div>
              </div>
            </div>

            {/* Cell 2: Stat card */}
            <div className="bg-emerald-600 text-white rounded-3xl p-8 shadow-lg shadow-emerald-600/20 flex flex-col justify-center relative overflow-hidden reveal reveal-delay-200 hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 right-0 p-6 opacity-20">
                <Percent className="w-24 h-24" />
              </div>
              <h4 className="text-5xl font-black mb-4">100%</h4>
              <p className="text-emerald-50 font-medium leading-relaxed">Báo cáo tự động chuẩn xác. Không cần sổ sách thủ công.</p>
            </div>

            {/* Cell 3: Small Card */}
            <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-lg flex flex-col justify-center reveal reveal-delay-100 hover:-translate-y-1 transition-transform">
               <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                 <Sparkles className="text-emerald-400 w-5 h-5"/> 
                 Kênh phản hồi 24/7
               </h4>
               <p className="text-slate-400 text-sm leading-relaxed">Giao tiếp trực tiếp với khách hàng và đội ngũ hỗ trợ OwnTrip mọi lúc mọi nơi.</p>
            </div>

            {/* Cell 4: Image/Map Visual */}
             <div className="md:col-span-2 bg-slate-200 rounded-3xl overflow-hidden relative reveal reveal-delay-300 group">
               <img src="https://picsum.photos/seed/owntrip-dashboard/800/400" alt="Dashboard stats" className="w-full h-full object-cover mix-blend-luminosity opacity-40 group-hover:mix-blend-normal group-hover:opacity-90 transition-all duration-700" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
               <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 shadow-xl max-w-sm">
                 <h4 className="text-lg font-bold text-slate-900">Chiến lược giá thông minh</h4>
                 <p className="text-slate-600 text-sm">Tự động đề xuất mức giá tối ưu theo mùa, giúp lấp đầy phòng trống.</p>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: TESTIMONIALS (Trải nghiệm thật) */}
      <section className="py-24 sm:py-32 relative bg-white overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-[60%] h-full bg-emerald-50/40 -skew-x-12 transform origin-top -z-10 rounded-bl-[100px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            
            {/* Left side: Heading */}
            <div className="lg:w-5/12 space-y-6 text-center lg:text-left reveal">
              <span className="inline-block bg-emerald-100 text-emerald-700 font-bold tracking-wider uppercase text-xs px-3 py-1 rounded-full">
                Cộng Đồng OwnTrip
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Trải Nghiệm NGười Dùng <br />
              </h2>
              <p className="text-slate-500 text-lg max-w-md mx-auto lg:mx-0 leading-relaxed">
                Hơn 100+ chuyến đi đã được lên kế hoạch dễ dàng. Xem cách các bạn trẻ khác đang tận hưởng mùa hè này cùng OwnTrip nhé.
              </p>
              
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-5">
                 <div className="flex -space-x-4">
                    <img className="w-12 h-12 rounded-full border-4 border-white object-cover shadow-sm" src="https://picsum.photos/seed/face11/100" alt="User" />
                    <img className="w-12 h-12 rounded-full border-4 border-white object-cover shadow-sm" src="https://picsum.photos/seed/face22/100" alt="User" />
                    <img className="w-12 h-12 rounded-full border-4 border-white object-cover shadow-sm" src="https://picsum.photos/seed/face33/100" alt="User" />
                    <div className="w-12 h-12 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm z-10">+100</div>
                 </div>
                 <div className="text-sm font-semibold text-slate-600">
                    Người dùng <br/> đang hoạt động
                 </div>
              </div>
            </div>

            {/* Right side: Dynamic Organic Collage */}
            <div className="lg:w-7/12 w-full relative h-[650px] sm:h-[750px] lg:h-[650px] reveal reveal-delay-200">
              
              {/* Card 1 - Main Review with Trip Photo */}
              <div className="absolute top-0 left-0 w-[90%] sm:w-[75%] lg:w-[65%] bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl border border-slate-100 z-20 hover:-translate-y-1 transition-transform duration-500">
                <div className="flex gap-4 items-center mb-5">
                  <img src="https://picsum.photos/seed/face44/150" alt="Avatar" className="w-14 h-14 rounded-full object-cover border border-slate-100" />
                  <div>
                    <h5 className="font-bold text-slate-900 text-lg leading-tight">Lan Anh</h5>
                    <div className="flex text-amber-400 text-xs mt-1">
                      <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
                    </div>
                  </div>
                </div>
                <p className="text-slate-700 font-medium mb-6 text-base sm:text-lg leading-relaxed">
                  "Lần đầu tiên đi Đà Lạt cùng hội bạn mà không cãi nhau vụ đi đâu ăn gì. App gợi ý lịch trình siêu đỉnh, chưa kể săn được frame ảnh độc quyền khoe story cháy máy!"
                </p>
                <div className="w-full h-40 sm:h-48 rounded-2xl overflow-hidden shadow-inner group">
                   <img src="https://picsum.photos/seed/dalat/600/300" alt="Chuyến đi Đà Lạt" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              </div>

              {/* Card 2 - Floating Dark Card in Background */}
              <div className="absolute top-32 right-[-2%] sm:right-0 lg:right-[-10%] w-[65%] sm:w-[50%] bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl border border-slate-800 z-10 rotate-6 opacity-95 blur-[0.5px] hover:blur-none hover:opacity-100 hover:rotate-0 hover:z-30 transition-all duration-500 cursor-default">
                <div className="flex gap-3 items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold border border-slate-600">L</div>
                  <div>
                    <h5 className="font-bold text-slate-100 text-sm">L</h5>
                    <span className="text-emerald-400 text-xs font-medium">Check-in tại Phú Quốc</span>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  "Thiết kế giao diện siêu đẹp, nhìn cái là muốn pack đồ đi chơi liền. Highly recommend cho mấy bà đam mê sống ảo nha!"
                </p>
              </div>

              {/* Card 3 - Overlapping Bottom Right */}
              <div className="absolute bottom-4 right-4 sm:right-10 lg:right-0 w-[85%] sm:w-[70%] lg:w-[60%] bg-white/95 backdrop-blur-lg p-6 sm:p-8 rounded-[2rem] shadow-2xl border border-slate-100 z-30 hover:-translate-y-2 transition-transform duration-500">
                <div className="flex gap-4 items-center mb-4">
                  <img src="https://picsum.photos/seed/face55/150" alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-slate-100" />
                  <div>
                    <h5 className="font-bold text-slate-900">Ngọc Thy</h5>
                    <div className="flex text-amber-400 text-xs mt-1">
                      <Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 text-slate-200 fill-current" />
                    </div>
                  </div>
                </div>
                <p className="text-slate-700 font-medium text-sm sm:text-base leading-relaxed">
                  "Tìm được hotel sát biển giảm giá 30% đúng dịp lễ nhờ OwnTrip. Lúc check-in còn được tích điểm hạng thành viên. App Việt làm quá chỉn chu!"
                </p>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-emerald-500 rounded-full shadow-lg flex items-center justify-center text-white">
                  👍
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* HOW TO DOWNLOAD SECTION */}
      <section id="download" className="py-20 sm:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left side: Guide description */}
            <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
              <div className="space-y-4">
                <h2 className="text-xs uppercase tracking-widest text-emerald-600 font-extrabold">Cách thức tải ứng dụng</h2>
                <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-none">
                  Chỉ 3 bước đơn giản để bắt đầu chuyến hành trình
                </h3>
                <p className="text-base text-slate-500 max-w-2xl mx-auto lg:mx-0">
                  Ứng dụng Owntrip đã có sẵn trên các kho ứng dụng lớn. Tương thích tốt với hầu hết thiết bị di động hiện nay.
                </p>
              </div>

              {/* Step list */}
              <div className="space-y-6 max-w-xl mx-auto lg:mx-0 text-left">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Quét mã QR hoặc Nhấn link tải</h4>
                    <p className="text-sm text-slate-500 mt-1">
                      Mở ứng dụng Camera trên điện thoại và quét mã QR ở phía trên, hoặc nhấn trực tiếp vào nút tải App Store / Google Play.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Cài đặt ứng dụng lên thiết bị</h4>
                    <p className="text-sm text-slate-500 mt-1">
                      Nhấn "Tải về" / "Cài đặt" trên giao diện chợ ứng dụng và chờ đợi thiết bị tự động cài đặt trong vài giây.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Lập kế hoạch & Nhận voucher chào mừng</h4>
                    <p className="text-sm text-slate-500 mt-1">
                      Tạo tài khoản mới, lên lịch trình chuyến đi đầu tiên và nhận ngay ưu đãi đặt phòng đặc quyền chào mừng thành viên mới!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Mock QR + Downloads big card */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-100 text-center space-y-8 relative">
              <div className="absolute top-[-10px] right-[-10px] w-12 h-12 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
              
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-slate-900">Tải ngay ứng dụng miễn phí</h4>
                <p className="text-sm text-slate-500">Owntrip hỗ trợ tốt nhất trên iOS 14.0+ và Android 8.0+</p>
              </div>

              {/* Huge QR Code Box */}
              <div className="w-48 h-48 bg-slate-50 rounded-2xl p-4 mx-auto flex items-center justify-center border border-slate-100 shadow-inner group">
                <QRCodeImg />
              </div>

              <div className="flex flex-wrap gap-4 justify-center items-center">

                <ExpoBuildBadge />
              </div>

              <p className="text-xs text-slate-400">Phiên bản hiện tại: v2.4.0 • Cập nhật gần nhất: Hôm qua</p>
            </div>

          </div>
        </div>
      </section>

      {/* CALL TO ACTION FOR HOTEL PARTNERS */}
      <section className="bg-slate-900 text-white py-16 sm:py-20 relative overflow-hidden">
        {/* Glowing visual grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none animate-blob animation-delay-4000"></div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          <div className="w-20 h-20 rounded-2xl bg-white p-2 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <img src={logoImg} alt="Owntrip Logo" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Bạn là Chủ Khách Sạn / Đối Tác Kinh Doanh?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Truy cập vào hệ thống quản lý phòng, theo dõi đơn đặt của khách, quản lý doanh thu và cấu hình giá phòng nhanh chóng trên kênh quản trị dành riêng cho chủ khách sạn.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
            {isAuthenticated ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                Vào trang quản lý của bạn
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <Link 
                  to="/login"
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  Đăng nhập Kênh Đối Tác
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Hệ thống đăng ký đối tác mới đang được nâng cấp. Vui lòng liên hệ Hotline: 1900 6868.');
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl font-bold text-sm transition-all"
                >
                  Đăng ký hợp tác mới
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="about" className="bg-slate-950 text-slate-400 py-12 sm:py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Upper row: brand + links */}
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <img src={logoImg} alt="Owntrip Logo" className="h-10 object-contain bg-white p-1 rounded-lg" />
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
                Owntrip là nền tảng lập kế hoạch du lịch thông minh và đặt phòng trực tuyến hàng đầu. Chúng tôi giúp bạn dễ dàng tự thiết kế lịch trình hành trình và kết nối với các điểm lưu trú tuyệt vời nhất.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 md:col-span-7">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Sản Phẩm</h4>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li><a href="#" className="hover:text-emerald-500 transition-colors">Tải ứng dụng Owntrip</a></li>
                  <li><a href="/login" className="hover:text-emerald-500 transition-colors">Kênh chủ khách sạn</a></li>
                  <li><a href="#" className="hover:text-emerald-500 transition-colors">Tích lũy điểm thưởng</a></li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Hỗ Trợ</h4>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li><span className="font-semibold text-slate-400">Hotline:</span> 1900 6868</li>
                  <li><span className="font-semibold text-slate-400">Email:</span> support@owntrip.vn</li>
                  <li><Link to="/faq" className="hover:text-emerald-500 transition-colors">Câu hỏi thường gặp (FAQ)</Link></li>
                  <li><a href="#" className="hover:text-emerald-500 transition-colors">Điều khoản dịch vụ</a></li>
                </ul>
              </div>
            </div>
          </div>

          <hr className="border-slate-900" />

          {/* Lower row: copy status */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <span>© 2026 Owntrip Co., Ltd. Tất cả quyền lợi được bảo lưu.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:underline">Chính sách bảo mật</a>
              <span>•</span>
              <a href="#" className="hover:underline">Giải quyết tranh chấp</a>
            </div>
          </div>

        </div>
      </footer>

      <Chatbot />
        </div>
  );
}
