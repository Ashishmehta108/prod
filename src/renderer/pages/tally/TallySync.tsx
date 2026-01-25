import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api } from "../../api/client";
import {
    RotateCw,
    CheckCircle2,
    AlertCircle,
    Clock,
    Package,
    Hash,
    Database,
    ArrowRight,
    Filter,
    CheckSquare,
    Square,
    RefreshCw,
    RefreshCcw,
    Cloud,
    ChevronRight,
    Activity
} from "lucide-react";

interface WeightRecord {
    _id: string;
    rollNo: string;
    netWeight: number;
    weightUnit: string;
    recordedAt: string;
    tallySyncStatus: string;
    productId: { name: string };
    tallySyncError?: string;
}

const TallySync: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [syncingAll, setSyncingAll] = useState(false);
    const [records, setRecords] = useState<WeightRecord[]>([]);
    const [statusFilter, setStatusFilter] = useState("pending");

    useEffect(() => {
        fetchRecords();
    }, [statusFilter]);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/tally/vouchers?status=${statusFilter}`);
            if (res.data.success) {
                setRecords(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch records");
        } finally {
            setLoading(false);
        }
    };

    const handleSyncAll = async () => {
        setSyncingAll(true);
        try {
            const res = await api.post("/tally/sync-all");
            if (res.data.success) {
                toast.success(res.data.message);
                fetchRecords();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Sync all failed");
        } finally {
            setSyncingAll(false);
        }
    };

    const handleSyncSingle = async (id: string) => {
        try {
            const res = await api.post("/tally/sync-voucher", { recordId: id });
            if (res.data.success) {
                toast.success("Sync successful");
                fetchRecords();
            } else {
                toast.error(res.data.message || "Tally error");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Connection error");
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'synced':
                return {
                    label: 'Synced',
                    className: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
                    icon: <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                };
            case 'failed':
                return {
                    label: 'Failed',
                    className: 'bg-rose-50 text-rose-700 border border-rose-100',
                    icon: <AlertCircle size={12} />
                };
            default:
                return {
                    label: 'Pending',
                    className: 'bg-amber-50 text-amber-700 border border-amber-100',
                    icon: <Clock size={12} />
                };
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">

                            <h1 className="text-3xl font-semibold text-stone-900 tracking-tight">Sync Management</h1>
                        </div>
                        <p className="text-sm text-stone-500 font-normal">Coordinate production volume with Tally stock journals</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-white border border-stone-300 rounded-lg p-1">
                            {["pending", "failed", "synced"].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-4 py-2 rounded-md text-xs font-medium capitalize transition-all ${statusFilter === s
                                        ? 'bg-stone-800 text-white shadow-sm'
                                        : 'text-stone-600 hover:text-stone-900'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleSyncAll}
                            disabled={syncingAll || records.length === 0}
                            className="h-11 px-6 bg-stone-800 hover:bg-stone-900 text-white rounded-lg flex items-center justify-center gap-2.5 text-sm font-medium transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {syncingAll ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                            {syncingAll ? "Syncing..." : "Sync all"}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Main Table */}
                    <div className="lg:col-span-12">
                        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-stone-50 border-b border-stone-200">
                                            <th className="px-6 py-4 text-xs font-semibold text-stone-600">Record details</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-stone-600 text-right">Weight</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-stone-600">Recorded</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-stone-600">Status</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-stone-600 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-24 text-center">
                                                    <RefreshCw size={28} className="animate-spin text-stone-300 mx-auto" />
                                                    <p className="mt-4 text-sm font-medium text-stone-400">Loading records...</p>
                                                </td>
                                            </tr>
                                        ) : records.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-24 text-center">
                                                    <div className="h-14 w-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <CheckCircle2 size={28} className="text-stone-400" />
                                                    </div>
                                                    <p className="text-sm font-medium text-stone-600">No records in queue</p>
                                                    <p className="text-xs text-stone-400 mt-1">All production records are synced</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            records.map((record) => {
                                                const statusConfig = getStatusConfig(record.tallySyncStatus);
                                                return (
                                                    <tr key={record._id} className="hover:bg-stone-50 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-semibold text-stone-900 tabular-nums">
                                                                        {record.rollNo}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-stone-500">
                                                                    {record.productId?.name || 'Stock item'}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="inline-flex items-baseline gap-1">
                                                                <span className="text-lg font-semibold text-stone-900 tabular-nums">
                                                                    {record.netWeight.toFixed(2)}
                                                                </span>
                                                                <span className="text-xs font-medium text-stone-500">
                                                                    {record.weightUnit}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-medium text-stone-700">
                                                                    {new Date(record.recordedAt).toLocaleDateString()}
                                                                </span>
                                                                <span className="text-xs text-stone-400">
                                                                    {new Date(record.recordedAt).toLocaleTimeString([], {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="relative group/tip">
                                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${statusConfig.className}`}>
                                                                    {statusConfig.icon}
                                                                    <span>{statusConfig.label}</span>
                                                                </div>
                                                                {record.tallySyncStatus === 'failed' && record.tallySyncError && (
                                                                    <div className="absolute bottom-full left-0 mb-2 p-3 bg-stone-900 text-white rounded-lg shadow-xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-20 w-64 pointer-events-none">
                                                                        <div className="text-xs font-semibold text-stone-400 mb-1">
                                                                            Error details
                                                                        </div>
                                                                        <p className="text-xs leading-relaxed">
                                                                            {record.tallySyncError}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => handleSyncSingle(record._id)}
                                                                className="h-9 w-9 inline-flex items-center justify-center bg-white hover:bg-stone-800 hover:text-white border border-stone-300 rounded-lg transition-all active:scale-95"
                                                                title="Sync this record"
                                                            >
                                                                <RefreshCw size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="lg:col-span-12 flex justify-between items-center px-6 py-4 bg-white border border-stone-200 rounded-lg">
                        <div className="flex items-center gap-2 text-stone-500">
                            <Database size={14} />
                            <span className="text-xs font-medium">Accounting integrity protocol v1.2</span>
                        </div>
                        <div className="flex items-center gap-2 text-stone-500">
                            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-xs font-medium">System healthy</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TallySync;