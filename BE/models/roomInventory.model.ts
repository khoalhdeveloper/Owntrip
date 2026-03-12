import { Schema, model } from 'mongoose';
import { IRoomInventory } from '../interfaces/inventory.interface';

const roomInventorySchema = new Schema<IRoomInventory>({
  hotelId: { 
    type: String, 
    required: true, 
    index: true // Đánh index để tìm kiếm theo khách sạn nhanh hơn
  },
  roomTypeId: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  totalInventory: { 
    type: Number, 
    required: true,
    min: 0 
  },
  bookedCount: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  priceAtDate: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['available', 'full', 'maintenance'], 
    default: 'available' 
  }
}, { 
  timestamps: true, versionKey: false
});


roomInventorySchema.index({ hotelId: 1, roomTypeId: 1, date: 1 }, { unique: true });

export default model<IRoomInventory>('RoomInventory', roomInventorySchema);