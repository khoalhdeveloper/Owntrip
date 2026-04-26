import { Schema, model } from 'mongoose';

const notificationSchema = new Schema({
  userId: { type: String, required: true, ref: 'User' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

export default model('Notification', notificationSchema);
