import { Document } from "mongoose";

export interface IPlace extends Document {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}