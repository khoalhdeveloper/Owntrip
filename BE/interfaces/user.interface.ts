import { Document } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  email: string;
  password?: string;
  displayName: string;
  balance: number;
  points: number;
  role: 'user' | 'admin';
  otp?: string;
  otpExpires?: Date;
  isVerified: boolean;
}