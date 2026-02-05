import { Schema, model } from 'mongoose';
import { IReview } from '../interfaces/review.interface';
import { generateCustomId } from '../utils/idGenerator';
import Hotel from './hotel.model';

const reviewSchema = new Schema<IReview>({
  reviewId: { type: String, unique: true },
  userId: { type: String, required: true, ref: 'User' },
  targetId: { type: String, required: true, index: true },
  targetType: { 
    type: String, 
    enum: ['hotel', 'itinerary'], 
    required: true 
  },
  rating: { type: Number, required: true, min: 1, max: 10 },
  criteria: {
    cleanliness: { type: Number, default: 0 },
    service: { type: Number, default: 0 },
    facilities: { type: Number, default: 0 },
    valueForMoney: { type: Number, default: 0 }
  },
  comment: { type: String, required: true },
  images: [String]
}, { timestamps: true, versionKey: false });

// Tự động tạo ReviewId00x
reviewSchema.pre<IReview>('save', async function(next) {
  if (this.isNew) {
    this.reviewId = await generateCustomId(model('Review'), 'ReviewId', 'reviewId');
  }
  
});

// Logic tự động tính toán lại điểm Dashboard cho Khách sạn sau khi có Review mới
reviewSchema.post<IReview>('save', async function() {
  const ReviewModel = model('Review');
  
  // Tính toán trung bình các tiêu chí
  const stats = await ReviewModel.aggregate([
    { $match: { targetId: this.targetId } },
    {
      $group: {
        _id: "$targetId",
        avgScore: { $avg: "$rating" },
        avgClean: { $avg: "$criteria.cleanliness" },
        avgService: { $avg: "$criteria.service" },
        avgFacilities: { $avg: "$criteria.facilities" },
        count: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0 && this.targetType === 'hotel') {
    // Cập nhật ngược lại bảng Hotel để hiển thị Dashboard nhanh hơn
    await Hotel.findOneAndUpdate(
      { hotelId: this.targetId },
      {
        "reviewSummary.score": stats[0].avgScore,
        "reviewSummary.count": stats[0].count,
        "reviewSummary.cleanliness": stats[0].avgClean,
        "reviewSummary.service": stats[0].avgService,
        "reviewSummary.facilities": stats[0].avgFacilities
      }
    );
  }
});

export default model<IReview>('Review', reviewSchema);