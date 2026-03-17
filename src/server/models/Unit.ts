import mongoose, { Document, Schema } from "mongoose";

export interface IUnit extends Document {
  name: string;
  description?: string;
  isActive: boolean;
}

const UnitSchema = new Schema<IUnit>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UnitSchema.index({ name: 1 }, { unique: true });
UnitSchema.index({ isActive: 1 });

export const Unit = mongoose.model<IUnit>("Unit", UnitSchema);

