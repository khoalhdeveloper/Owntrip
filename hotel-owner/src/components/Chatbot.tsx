import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Message = {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
};

// ==========================================
// CẤU HÌNH API VÀ LUẬT CHO AI Ở ĐÂY
// ==========================================
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ""; 

const SYSTEM_PROMPT = `Bạn là trợ lý ảo CSKH thân thiện của OwnTrip. 
Nhiệm vụ của bạn:
# Cấu trúc Trợ lý ảo OwnTrip

## Vai trò
Bạn là chuyên gia tư vấn hỗ trợ khách hàng của OwnTrip nền tảng du lịch thông minh, giúp người dùng lập kế hoạch, khám phá, đặt dịch vụ và tối ưu hóa trải nghiệm du lịch.

## Ngôn ngữ & Thái độ
- Luôn trả lời bằng tiếng Việt.
- Xưng hô: "Mình" (bạn) và gọi khách hàng là "bạn".
- Thái độ: Lịch sự, chuyên nghiệp, hỗ trợ nhiệt tình.
- Phong cách: Ngắn gọn, súc tích, đi thẳng vào vấn đề.

## Kiến thức cốt lõi (Tính năng hệ thống)
1. **Instant Plan:** Tự động tạo lịch trình tối ưu dựa trên địa điểm và thời gian mong muốn.
2. **Bán kế hoạch:** Người dùng có thể chia sẻ và kinh doanh các lịch trình du lịch cá nhân hóa cho cộng đồng.
3. **Bản đồ (Map):** Hỗ trợ điều hướng và tìm kiếm địa điểm, nhà hàng, khách sạn trực quan.
4. **GPS-verified Reviews:** Đánh giá địa điểm chỉ được xác thực khi người dùng thực sự có mặt tại nơi đó qua GPS.
5. **Đặt phòng (Booking):** Tìm kiếm và đặt phòng khách sạn, homestay trực tiếp, đồng bộ với lịch trình.

## Quy tắc phản hồi & Giới hạn
- **Phạm vi nội dung:** Chỉ giải đáp các câu hỏi liên quan đến tính năng, dịch vụ và hỗ trợ sử dụng ứng dụng OwnTrip.
- **Từ chối chủ đề ngoài:** Nếu khách hàng đặt câu hỏi về các vấn đề không liên quan đến ứng dụng hoặc chủ đề du lịch (ví dụ: chính trị, tin tức xã hội, tư vấn đời sống, hoặc các chủ đề lạc đề khác), hãy từ chối một cách lịch sự.
    - *Câu từ chối gợi ý:* "Chào bạn, rất xin lỗi nhưng mình chỉ hỗ trợ các thông tin liên quan đến ứng dụng OwnTrip. Bạn có cần mình hỗ trợ gì về lịch trình, đặt phòng hay các tính năng của app không?"
- Luôn ưu tiên trình bày câu trả lời theo các bước ngắn gọn, dễ thực hiện.

## Ví dụ mẫu
- Khách: "Tại sao thời tiết hôm nay lại nóng thế?"
- Trợ lý: "Chào bạn, rất xin lỗi nhưng mình chỉ có thể hỗ trợ các thông tin liên quan đến ứng dụng OwnTrip. Bạn có cần mình hỗ trợ tìm khách sạn hoặc lên lịch trình cho chuyến đi của bạn không?"

- Khách: "Tôi muốn mua một lịch trình du lịch Đà Lạt, làm sao để tìm?"
- Trợ lý: "Chào bạn, bạn hãy truy cập mục 'Kế hoạch cộng đồng' trên ứng dụng, lọc theo từ khóa 'Đà Lạt' để xem các lịch trình được chia sẻ và tiến hành mua gói kế hoạch phù hợp với nhu cầu nhé!"`;
// ==========================================

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Chào bạn! Mình là trợ lý ảo OwnTrip. Mình có thể giúp gì cho bạn hôm nay?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue('');

    // --- BẮT ĐẦU PHẦN GỌI API ---
    if (!GEMINI_API_KEY) {
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Vui lòng điền VITE_GEMINI_API_KEY trong file .env để kích hoạt tính năng AI nhé!',
          timestamp: new Date(),
        }]);
      }, 500);
      return;
    }

    try {
      // Hiển thị trạng thái đang trả lời
      setMessages((prev) => [...prev, { id: 'loading', sender: 'bot', text: 'Đang suy nghĩ...', timestamp: new Date() }]);

      // Chuẩn bị lịch sử tin nhắn cho API (chuẩn Gemini)
      // Loại bỏ tin nhắn đầu tiên (chào mừng) vì Gemini yêu cầu cuộc hội thoại bắt đầu từ 'user'
      const apiMessages = messages
        .filter(m => m.id !== '1') // id='1' là câu chào mặc định
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));
      // Thêm tin nhắn hiện tại của user
      apiMessages.push({ role: 'user', parts: [{ text: newUserMessage.text }] });

      // Gửi request lên Google Gemini API (dùng gemini-1.5-flash)
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: { text: SYSTEM_PROMPT }
          },
          contents: apiMessages,
          generationConfig: {
            temperature: 0.7,
          }
        })
      });

      const data = await response.json();
      
      // Xóa tin nhắn "Đang suy nghĩ..."
      setMessages((prev) => prev.filter(m => m.id !== 'loading'));

      if (data.candidates && data.candidates.length > 0) {
        const botReply = data.candidates[0].content.parts[0].text;
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          sender: 'bot',
          text: botReply,
          timestamp: new Date(),
        }]);
      } else {
        throw new Error(data.error?.message || "Không nhận được phản hồi hợp lệ từ Gemini API");
      }
    } catch (error) {
      console.error(error);
      // Xóa tin nhắn "Đang suy nghĩ..." nếu có lỗi
      setMessages((prev) => prev.filter(m => m.id !== 'loading'));
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        sender: 'bot',
        text: 'Xin lỗi, hệ thống AI đang gặp sự cố. Bạn vui lòng kiểm tra lại API Key hoặc thử lại sau nhé!',
        timestamp: new Date(),
      }]);
    }
    // --- KẾT THÚC PHẦN GỌI API ---
    
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-emerald-600"></div>
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-1">
                  OwnTrip Assistant <Sparkles className="w-3 h-3 text-amber-300" />
                </h3>
                <p className="text-xs text-emerald-100 font-medium">Trực tuyến</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-emerald-600" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-sm'
                      : 'bg-white border border-slate-100 shadow-sm text-slate-700 rounded-tl-sm'
                  }`}
                >
                  <ReactMarkdown 
                    components={{
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                      a: ({node, ...props}) => <a className="text-emerald-500 hover:underline" target="_blank" rel="noreferrer" {...props} />,
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 bg-slate-50 rounded-full px-4 py-2 border border-slate-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400 py-1"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          isOpen ? 'bg-slate-900 scale-90' : 'bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-1'
        } text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 animate-pulse-glow z-50`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
      </button>
    </div>
  );
}
