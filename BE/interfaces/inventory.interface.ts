import { Document } from 'mongoose';

export interface IRoomInventory extends Document {
  hotelId: string;        // Liên kết với HotelId00x
  roomTypeId: string;     // ID loại phòng (Deluxe, Suite...)
  date: Date;             // Ngày cụ thể trong lịch
  totalInventory: number; // Tổng số phòng khách sạn có cho loại này
  bookedCount: number;    // Số lượng phòng đã bị khách đặt
  priceAtDate: number;    // Giá bán riêng cho ngày này (Dynamic Pricing)
  status: 'available' | 'full' | 'maintenance'; // Trạng thái kho phòng
}