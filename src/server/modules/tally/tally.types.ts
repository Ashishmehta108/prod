export interface TallyVoucherData {
    rollNo: string;
    itemName: string;
    quantity: number;
    unit: string;
    date: string;
    grossWeight: number;
    tareWeight: number;
    narration: string;
}

export interface TallySyncResult {
    success: boolean;
    message: string;
    voucherId?: string;
    xmlSent?: string;
    responseRaw?: string;
}
