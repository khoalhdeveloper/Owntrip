import { Schema, model } from 'mongoose';
import { IAvatarItem } from '../interfaces/avatarItem.interface';
import { generateCustomId } from '../utils/idGenerator';

const avatarItemSchema = new Schema<IAvatarItem>({
  itemId: { type: String, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['frame', 'avatar'], required: true },
  imageUrl: { type: String, required: true },
  previewUrl: { type: String },
  price: { type: Number, required: true, default: 0 },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
  isActive: { type: Boolean, default: true },
  description: { type: String },
}, { timestamps: true, versionKey: false });

avatarItemSchema.pre<IAvatarItem>('save', async function () {
  if (this.isNew) {
    this.itemId = await generateCustomId(model('AvatarItem'), 'ItemId', 'itemId');
  }
});

export default model<IAvatarItem>('AvatarItem', avatarItemSchema);
