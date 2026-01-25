import mongoose, { Schema, Document } from "mongoose";

export interface IWeightRecord extends Document {
    productId: mongoose.Types.ObjectId;
    grossWeight: number;
    tareWeight: number;
    netWeight: number;
    weightUnit: string;
    weightSource: "scale" | "manual";
    rollNo?: string;
    recordedBy: mongoose.Types.ObjectId;
    recordedAt: Date;

    // Tally Integration Fields
    tallySyncStatus: "pending" | "synced" | "failed" | "ignored";
    tallyVoucherId?: string;
    tallyLastSyncAttempt?: Date;
    tallySyncError?: string;
}

const WeightRecordSchema: Schema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    grossWeight: { type: Number, required: true },
    tareWeight: { type: Number, required: true },
    netWeight: { type: Number, required: true },
    weightUnit: { type: String, default: "kg" },
    weightSource: { type: String, enum: ["scale", "manual"], default: "scale" },
    rollNo: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recordedAt: { type: Date, default: Date.now },

    // Tally Sync
    tallySyncStatus: {
        type: String,
        enum: ["pending", "synced", "failed", "ignored"],
        default: "pending"
    },
    tallyVoucherId: { type: String },
    tallyLastSyncAttempt: { type: Date },
    tallySyncError: { type: String }
});

export const WeightRecord = mongoose.model<IWeightRecord>("WeightRecord", WeightRecordSchema);
