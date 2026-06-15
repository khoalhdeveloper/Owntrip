import { useState } from 'react';
import { ChevronDown, MessageCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

type FAQItem = {
  question: string;
  answer: string;
};

const faqs: FAQItem[] = [
  {
    question: 'Làm thế nào để tải ứng dụng OwnTrip?',
    answer: 'Bạn có thể tải ứng dụng OwnTrip miễn phí trên cả App Store (cho thiết bị iOS) và Google Play (cho thiết bị Android). Bạn cũng có thể quét mã QR ở trang chủ để tải nhanh.',
  },
  {
    question: 'Tính năng Lên lịch trình tự động (Instant Plan) hoạt động như thế nào?',
    answer: 'Chỉ cần bạn nhập điểm đến, ngày đi và sở thích (ví dụ: thích đi cafe, thích không gian yên tĩnh, hay đi khám phá), AI của OwnTrip sẽ tự động phân tích và tạo ra một lịch trình tối ưu nhất cho bạn trong vài giây.',
  },
  {
    question: 'Làm sao để nhận Frame ảnh độc quyền khi check-in?',
    answer: 'Khi bạn đến đúng địa điểm được gợi ý trên ứng dụng, hệ thống sẽ tự động nhận diện GPS của bạn. Nút "Check-in" sẽ sáng lên và bạn có thể chụp ảnh để nhận ngay Frame thiết kế độc quyền của địa điểm đó.',
  },
  {
    question: 'Làm sao để đăng ký trở thành đối tác khách sạn trên OwnTrip?',
    answer: 'Hiện tại hệ thống đăng ký đối tác mới đang được nâng cấp. Bạn có thể nhấn vào nút "Đăng nhập Kênh Đối Tác" trên trang chủ để truy cập Dashboard nếu đã có tài khoản, hoặc liên hệ Hotline 1900 6868 để được hỗ trợ mở tài khoản mới.',
  },
  {
    question: 'Tôi gặp sự cố khi đặt phòng, làm sao để liên hệ bộ phận hỗ trợ?',
    answer: 'Bạn có thể sử dụng Chatbot ở góc dưới màn hình, hoặc liên hệ trực tiếp qua số Hotline 1900 6868 và Email: support@owntrip.vn. Đội ngũ CSKH của chúng tôi hoạt động 24/7 để hỗ trợ bạn.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-orange-500 selection:text-white font-sans relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 w-[60%] h-full bg-orange-50/40 -skew-x-12 transform origin-top -z-10 rounded-bl-[100px] animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -z-10 animate-blob animation-delay-2000"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/75 border-b border-slate-100/80 transition-all duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-orange-600 font-semibold transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Quay lại trang chủ
            </Link>
            <div className="text-xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              OwnTrip FAQ
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center space-y-4 mb-16 animate-in slide-in-from-bottom-4 duration-700">
          <span className="inline-block bg-orange-100 text-orange-700 font-bold tracking-wider uppercase text-xs px-3 py-1 rounded-full">
            Trung tâm hỗ trợ
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Các câu hỏi <br className="sm:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">thường gặp.</span>
          </h1>
          <p className="text-slate-500 text-lg">
            Khám phá cách OwnTrip giúp chuyến đi của bạn dễ dàng hơn.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4 animate-in slide-in-from-bottom-8 duration-700 delay-150">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className={`bg-white border transition-all duration-300 overflow-hidden ${
                  isOpen 
                    ? 'border-orange-200 shadow-lg shadow-orange-500/5 rounded-2xl' 
                    : 'border-slate-200 hover:border-orange-200 rounded-2xl hover:shadow-md'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none group"
                >
                  <span className={`font-bold text-lg transition-colors ${isOpen ? 'text-orange-600' : 'text-slate-800 group-hover:text-orange-600'}`}>
                    {faq.question}
                  </span>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-orange-100 text-orange-600 rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600'}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>
                <div 
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-slate-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Still need help CTA */}
        <div className="mt-16 bg-slate-900 rounded-[2rem] p-8 sm:p-12 text-center text-white relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700 delay-300 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <MessageCircle className="w-48 h-48" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-md border border-white/20">
              <MessageCircle className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Vẫn cần hỗ trợ?</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Nếu bạn không tìm thấy câu trả lời, đừng ngần ngại liên hệ với chúng tôi. Đội ngũ OwnTrip luôn sẵn sàng lắng nghe.
              </p>
            </div>
            <a 
              href="https://www.facebook.com/profile.php?id=61587290766019"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold px-8 py-3 rounded-xl transition-all hover:-translate-y-1 shadow-lg shadow-orange-500/20 active:scale-95"
            >
              Liên hệ bộ phận CSKH
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
