import mongoose, { Document, Schema } from "mongoose";
import { IProduct } from "./Product";

export interface IStockIn extends Document {
  productId: IProduct["_id"];
  quantity: number;
  supplier?: string;
  invoiceNo?: string;
  location?: string;
  date: Date;
}

const StockInSchema = new Schema<IStockIn>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    supplier: { type: String },
    invoiceNo: { type: String },
    location: { type: String },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const StockIn = mongoose.model<IStockIn>("StockIn", StockInSchema);
