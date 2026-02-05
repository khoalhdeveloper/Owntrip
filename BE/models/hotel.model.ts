import { Schema, model } from 'mongoose';
import { IHotel } from '../interfaces/hotel.interface';
import { generateCustomId } from '../utils/idGenerator';

const hotelSchema = new Schema<IHotel>({
  hotelId: { type: String, unique: true },
  name: { type: String, required: true },
  starRating: { type: Number, default: 4 },
  address: {
    fullAddress: String,
    city: String,
    coordinates: { lat: Number, lng: Number }
  },
  images: [String],
  rooms: [{
    roomTypeId: String,
    name: String,
    price: Number,
    capacity: Number,
    totalRooms: Number,
    availableRooms: Number
  }],
  reviewSummary: {
    score: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    cleanliness: { type: Number, default: 0 },
    service: { type: Number, default: 0 }
  }
}, { timestamps: true, versionKey: false });

hotelSchema.pre<IHotel>('save', async function() {
  if (this.isNew) {
    this.hotelId = await generateCustomId(model('Hotel'), 'HotelId', 'hotelId');
  }
});

export default model<IHotel>('Hotel', hotelSchema);