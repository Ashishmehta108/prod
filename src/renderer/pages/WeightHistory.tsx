import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import {
    History,
    Search,
    Filter,
    Printer,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Calendar,
    Package,
    Hash,
    Scale,
    Loader2,
    RefreshCw,
    Clock
} from "lucide-react";
import { toast } from "sonner";
import { formatDateIST } from "../utils/dateUtils";

interface Record {
    _id: string;
    rollNo: string;
    grossWeight: number;
    tareWeight: number;
    netWeight: number;
    weightUnit: string;
    weightSource: string;
    recordedAt: string;
    recordedBy?: { username: string };
    productId: { name: string; category?: string };
    tallySyncStatus: string;
}

const WeightHistory = () => {
    const [records, setRecords] = useState<Record[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [reprintingId, setReprintingId] = useState<string | null>(null);

    useEffect(() => {
        fetchRecords();
    }, [page]);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await api.get("/weight/records", {
                params: { page, limit: 12 }
            });
            if (res.data.success) {
                setRecords(res.data.data);
                setTotalPages(res.data.meta.totalPages);
                setTotal(res.data.meta.total);
            }
        } catch (err) {
            toast.error("Failed to fetch weight history");
        } finally {
            setLoading(false);
        }
    };

    const handleReprint = async (recordId: string) => {
        setReprintingId(recordId);
        try {
            const res = await api.post(`/weight/records/${recordId}/reprint`, {
                printerName: "TSC_TTP_244_PRO" // Default or could be from settings
            });
            if (res.data.success) {
                toast.success("Label sent to printer");
            }
        } catch (err) {
            toast.error("Reprint failed. Check printer connection.");
        } finally {
            setReprintingId(null);
        }
    };

    const filteredRecords = records.filter(r =>
        r.rollNo?.toLowerCase().includes(search.toLowerCase()) ||
        r.productId?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-neutral-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-200 pb-6">
                    <div className="space-y-1.5 text-neutral-900">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-semibold tracking-tight">Weight history</h1>
                        </div>
                        <p className="text-sm text-neutral-500">Monitor and manage historical production weight records</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search roll or product..."
                                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-10 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all"
                            />
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        </div>
                        <button
                            onClick={fetchRecords}
                            className="h-10 px-4 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 transition-all active:scale-[0.98]"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white border border-neutral-200 p-6 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3 text-neutral-500 mb-3">
                            <Scale size={18} />
                            <span className="text-xs font-medium uppercase tracking-wider">Total records</span>
                        </div>
                        <p className="text-2xl font-semibold text-neutral-900">{total}</p>
                    </div>
                    {/* Add more stats as needed */}
                </div>

                {/* Table/Card View */}
                <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-200">
                                    <th className="px-6 py-4 text-xs font-semibold text-neutral-600">Product details</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-neutral-600">Identification</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-neutral-600">Weights (kg)</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-neutral-600">Recorded</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-neutral-600 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {loading && page === 1 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-24 text-center">
                                            <Loader2 size={24} className="animate-spin text-neutral-300 mx-auto" />
                                            <p className="mt-4 text-sm font-medium text-neutral-400">Loading history...</p>
                                        </td>
                                    </tr>
                                ) : filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-24 text-center">
                                            <History size={32} className="text-neutral-200 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-neutral-600">No records found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((record) => (
                                        <tr key={record._id} className="hover:bg-neutral-50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-neutral-900">{record.productId?.name}</p>
                                                    <p className="text-xs text-neutral-500">{record.productId?.category || 'General'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded text-xs font-medium border border-neutral-200">
                                                        {record.rollNo || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs text-neutral-400">Gross</p>
                                                        <p className="text-sm font-medium text-neutral-700">{record.grossWeight.toFixed(2)}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs text-neutral-400">Tare</p>
                                                        <p className="text-sm font-medium text-neutral-700">{record.tareWeight.toFixed(2)}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs text-neutral-900 font-semibold uppercase tracking-tighter">Net</p>
                                                        <p className="text-base font-semibold text-neutral-900">{record.netWeight.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-neutral-700">{formatDateIST(record.recordedAt)}</span>
                                                    <span className="text-[11px] text-neutral-400">{new Date(record.recordedAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => handleReprint(record._id)}
                                                    disabled={reprintingId === record._id}
                                                    className="p-2 inline-flex items-center justify-center bg-white border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all active:scale-95 disabled:opacity-50"
                                                    title="Reprint label"
                                                >
                                                    {reprintingId === record._id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Printer size={16} />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/30">
                        <p className="text-xs font-medium text-neutral-500">
                            Showing <span className="text-neutral-900">{records.length}</span> of <span className="text-neutral-900">{total}</span> records
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-600 disabled:opacity-50 hover:bg-neutral-50"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 border border-neutral-200">
                                <span className="text-xs font-medium text-neutral-900">{page}</span>
                                <span className="text-xs text-neutral-400">/</span>
                                <span className="text-xs text-neutral-500">{totalPages}</span>
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-600 disabled:opacity-50 hover:bg-neutral-50"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default WeightHistory;
