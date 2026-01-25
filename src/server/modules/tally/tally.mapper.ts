import { TallyVoucherData } from "./tally.types";

/**
 * Functional mapper to convert ERP Weight Records into Tally-ready structures.
 * Ensures strict data integrity and standardized narration formatting.
 */
export const mapWeightRecordToTally = (record: any): TallyVoucherData => {
    const product = record.productId;
    const productName =
        typeof product === "object" && product !== null
            ? product.name || "Unknown Item"
            : "Product Not Linked";

    const fmt = (v?: number) =>
        typeof v === "number" ? v.toFixed(2) : "0.00";

    const formatDateForTally = (date: Date): string => {
        const d = new Date(date);
        return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    };

    return {
        rollNo: record.rollNo || `ERP-${Date.now()}`,
        itemName: productName,
        quantity: record.netWeight > 0 ? record.netWeight : 0.001,
        unit: record.weightUnit || "kg",
        date: formatDateForTally(record.recordedAt || new Date()),
        grossWeight: record.grossWeight || 0,
        tareWeight: record.tareWeight || 0,
        narration: [
            `Roll No: ${record.rollNo || "NONE"}`,
            `Gross: ${fmt(record.grossWeight)}${record.weightUnit || "kg"}`,
            `Tare: ${fmt(record.tareWeight)}${record.weightUnit || "kg"}`,
            `Net: ${fmt(record.netWeight)}${record.weightUnit || "kg"}`,
            `Operator ID: ${record.recordedBy || "System"}`
        ].join(" | ")
    };
};

