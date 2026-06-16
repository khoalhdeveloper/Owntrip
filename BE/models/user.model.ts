import { Schema, model } from 'mongoose';
import { IUser } from '../interfaces/user.interface';
import { generateCustomId } from '../utils/idGenerator';
import bcrypt from 'bcrypt';


const userSchema = new Schema<IUser>({
  userId: { type: String, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  image: { type: String },
  avatarFrame: { type: String },
  unlockedCheckinFrameIds: [{ type: Schema.Types.ObjectId, ref: 'Frame' }],
  phone: { type: String },
  balance: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin', 'hotel_owner', 'creator'], default: 'user' },
  creatorSubscriptionEndsAt: { type: Date },
  otp: { type: String },
  otpExpires: { type: Date },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false });


userSchema.pre<IUser>('save', async function() {
  if (this.isNew) {
   
    this.userId = await generateCustomId(model('User'), 'UserId', 'userId');
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
});

export default model<IUser>('User', userSchema);
