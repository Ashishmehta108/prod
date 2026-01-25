import mongoose, { Document, Schema } from "mongoose";
import { IProduct } from "./Product";

export interface IStockOut extends Document {
  productId: IProduct["_id"];
  quantity: number;
  department?: string;
  issuedBy?: string;
  issuedTo?: string;
  purpose?: string;
  date: Date;
}

const StockOutSchema = new Schema<IStockOut>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    department: { type: String },
    issuedBy: { type: String },
    issuedTo: { type: String },  
    purpose: { type: String },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const StockOut = mongoose.model<IStockOut>("StockOut", StockOutSchema);
