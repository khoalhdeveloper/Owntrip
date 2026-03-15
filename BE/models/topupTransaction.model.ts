import { Schema, model, Document } from 'mongoose';

export interface ITopupTransaction extends Document {
  txnRef: string;
  userId: string;
  amount: number;
  pointsEarned: number;
  responseCode: string;
  source: 'ipn' | 'return';
  status: 'success' | 'failed';
}

const topupTransactionSchema = new Schema<ITopupTransaction>(
  {
    txnRef: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    pointsEarned: { type: Number, required: true },
    responseCode: { type: String, required: true },
    source: { type: String, enum: ['ipn', 'return'], required: true },
    status: { type: String, enum: ['success', 'failed'], required: true }
  },
  { timestamps: true, versionKey: false }
);

export default model<ITopupTransaction>('TopupTransaction', topupTransactionSchema);
