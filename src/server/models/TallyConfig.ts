import mongoose, { Schema, Document } from "mongoose";

export interface ITallyConfig extends Document {
    tallyIp: string;
    tallyPort: number;
    companyName: string;
    defaultGodown: string;
    ledgerMappings: {
        stockLedger: string;
        expenseLedger: string;
        partyLedger: string;
    };
    autoSync: boolean;
    active: boolean;
    updatedAt: Date;
}

const TallyConfigSchema: Schema = new Schema({
    tallyIp: { type: String, default: "127.0.0.1" },
    tallyPort: { type: Number, default: 9000 },
    companyName: { type: String, required: true },
    defaultGodown: { type: String, default: "Main Location" },
    ledgerMappings: {
        stockLedger: { type: String, default: "Internal Consumption" },
        expenseLedger: { type: String, default: "Production Expenses" },
        partyLedger: { type: String, default: "Cash" },
    },
    autoSync: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now },
});

export const TallyConfig = mongoose.model<ITallyConfig>("TallyConfig", TallyConfigSchema);
