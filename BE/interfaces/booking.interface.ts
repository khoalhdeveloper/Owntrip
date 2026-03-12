import { Document } from 'mongoose';

export interface IBooking extends Document {
  bookingId: string;
  userId: string;              // Liên kết với User
  hotelId: string;             // Liên kết với Hotel
  roomTypeId: string;          // Loại phòng đã đặt
  checkIn: Date;
  checkOut: Date;
  nights: number;              // Số đêm lưu trú
  roomCount: number;           // Số lượng phòng đặt
  totalPrice: number;          // Tổng tiền thanh toán
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show';
  guestInfo: {
    fullName: string;
    phone: string;
    email: string;
    specialRequests?: string;  // Yêu cầu đặc biệt (giường đôi, tầng cao...)
  };
  paymentMethod: 'balance' | 'credit_card' | 'bank_transfer';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  cancellationReason?: string;
  cancelledAt?: Date;
  refundAmount?: number;
}
