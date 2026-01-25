import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  name: string;
  category?: string;
  unit: string;
  minStock: number;
  image?: string;
  refIds: string[];        // Added: Array of reference IDs
  machineName?: string;    // Added: Machine name field
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    category: { type: String },
    unit: { type: String, required: true },
    minStock: { type: Number, default: 0 },
    image: {
      type: String,
      default: null,
    },
    refIds: {
      type: [String],        // Array of strings
      default: [],           // Default to empty array
      index: true,           // Index for faster lookups
    },
    machineName: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);


ProductSchema.index({ category: 1 });
ProductSchema.index({ unit: 1 });
ProductSchema.index({ machineName: 1 });
ProductSchema.index({ createdAt: -1 });

ProductSchema.index(
  { name: "text", category: "text" },
  { background: true }
);

export const Product = mongoose.model<IProduct>("Product", ProductSchema);