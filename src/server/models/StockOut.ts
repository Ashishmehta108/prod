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

// Middleware to sync stockQuantity in Product model
StockOutSchema.pre("save", async function (next) {
  if (!this.isNew) {
    const oldRecord = await mongoose.model("StockOut").findById(this._id).lean();
    if (oldRecord) {
      (this as any)._oldQuantity = (oldRecord as any).quantity;
    }
  }
  next();
});

StockOutSchema.post("save", async function (doc) {
  const Product = mongoose.model("Product");
  const oldQty = (doc as any)._oldQuantity || 0;
  const diff = doc.quantity - oldQty;

  if (diff !== 0) {
    await Product.findByIdAndUpdate(doc.productId, {
      $inc: { stockQuantity: -diff }, // Note the negative diff for StockOut
    });
  }
});

StockOutSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    const Product = mongoose.model("Product");
    await Product.findByIdAndUpdate(doc.productId, {
      $inc: { stockQuantity: doc.quantity }, // Add back to stock on delete
    });
  }
});

export const StockOut = mongoose.model<IStockOut>("StockOut", StockOutSchema);
