import { Document } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  email: string;
  password?: string;
  displayName: string;
  image?: string;
  balance: number;
  points: number;
  role: 'user' | 'admin' | 'hotel_owner';
  otp?: string;
  otpExpires?: Date;
  isVerified: boolean;
}