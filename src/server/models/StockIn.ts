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

StockInSchema.pre("save", async function (next) {
  if (!this.isNew) {
    // If updating, fetch the old record to calculate the diff
    const oldRecord = await mongoose.model("StockIn").findById(this._id).lean();
    if (oldRecord) {
      (this as any)._oldQuantity = (oldRecord as any).quantity;
    }
  }
  next();
});

StockInSchema.post("save", async function (doc) {
  const Product = mongoose.model("Product");
  const oldQty = (doc as any)._oldQuantity || 0;
  const diff = doc.quantity - oldQty;

  if (diff !== 0) {
    await Product.findByIdAndUpdate(doc.productId, {
      $inc: { stockQuantity: diff },
    });
  }
});

StockInSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    const Product = mongoose.model("Product");
    await Product.findByIdAndUpdate(doc.productId, {
      $inc: { stockQuantity: -doc.quantity },
    });
  }
});

export const StockIn = mongoose.model<IStockIn>("StockIn", StockInSchema);
