// ─── IST OFFSET ──────────────────────────────────────────────────────────────
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/**
 * Returns today's date in IST as a YYYY-MM-DD string.
 * Safe to use as the value for <input type="date">.
 * Fixes: new Date().toISOString().split('T')[0] which returns UTC date.
 */
export const getTodayISTForInput = (): string => {
    const now = new Date();
    const istDate = new Date(now.getTime() + IST_OFFSET_MS);
    return istDate.toISOString().split("T")[0];
};

/**
 * Converts a YYYY-MM-DD string (from <input type="date">) into an ISO string
 * that represents IST midnight — safe to send as a date-range boundary to the backend.
 * e.g. "2026-02-26" → "2026-02-25T18:30:00.000Z"  (IST midnight = UTC 18:30 prev day)
 */
export const inputDateToISOIST = (yyyymmdd: string): string => {
    if (!yyyymmdd) return "";
    // Treat the date as IST midnight (start of day)
    const [year, month, day] = yyyymmdd.split("-").map(Number);
    const istMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - IST_OFFSET_MS);
    return istMidnight.toISOString();
};

/**
 * Converts a YYYY-MM-DD string to an ISO string representing IST 23:59:59.999 (end of that day).
 * Use for the "to" / "dateTo" boundary of date range filters.
 * e.g. "2026-02-26" → "2026-02-26T18:29:59.999Z"  (IST 23:59:59 = UTC 18:29:59)
 */
export const inputDateToEndOfDayIST = (yyyymmdd: string): string => {
    if (!yyyymmdd) return "";
    const [year, month, day] = yyyymmdd.split("-").map(Number);
    // Next IST midnight minus 1 ms = end of current IST day
    const nextISTMidnight = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0) - IST_OFFSET_MS);
    return new Date(nextISTMidnight.getTime() - 1).toISOString();
};


/**
 * Formats any date value to DD-MM-YYYY string in IST timezone.
 * Use for display in tables and CSV exports.
 */
export const formatDateIST = (dateString: string | Date): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).split("/").join("-");
};

/**
 * Returns today's IST date as DD-MM-YYYY.
 * Use for CSV filenames.
 */
export const getISTDateString = (): string => {
    return formatDateIST(new Date());
};

/**
 * Converts a stored date (ISO string or Date from MongoDB) back to YYYY-MM-DD
 * in IST, so it can be used as the value prop in <input type="date"> for edit modals.
 */
export const formatDateForInput = (dateString: string | Date): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const istDate = new Date(date.getTime() + IST_OFFSET_MS);
    return istDate.toISOString().split("T")[0];
};

// ─── LEGACY (kept for backward compat, now IST-aware) ────────────────────────
export const formatDate = (dateString: string | Date): string => {
    return formatDateIST(dateString);
};

export const formatFullDate = (dateString: string | Date): string => {
    return formatDateIST(dateString);
};
