import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "../../api/client";
import {
    ReceiptText,
    Hash,
    Package,
    Calendar,
    ExternalLink,
    Search,
    CheckCircle2,
    Box,
    LayoutList,
    Clock,
    ArrowRight,
    TrendingUp,
    History
} from "lucide-react";
import { formatDateIST } from "../../utils/dateUtils";

interface Voucher {
    _id: string;
    rollNo: string;
    netWeight: number;
    weightUnit: string;
    recordedAt: string;
    recordedBy: { username: string };
    productId: { name: string; category: string };
    tallyVoucherId?: string;
    tallySyncStatus: string;
}

const TallyVouchers: React.FC = () => {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchVouchers();
    }, []);

    const fetchVouchers = async () => {
        setLoading(true);
        try {
            const res = await api.get("/tally/vouchers?status=synced");
            if (res.data.success) {
                setVouchers(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch vouchers");
        } finally {
            setLoading(false);
        }
    };

    const filtered = vouchers.filter(v =>
        v.rollNo.toLowerCase().includes(search.toLowerCase()) ||
        v.productId?.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-stone-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">

                            <h1 className="text-3xl font-semibold text-stone-900 tracking-tight">Sync History</h1>
                        </div>
                        <p className="text-sm text-stone-500 font-normal">Production data archived in Tally Prime</p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search roll or product..."
                            className="h-11 w-full rounded-lg border border-stone-300 bg-white px-11 text-sm text-stone-700 placeholder:text-stone-400 focus:ring-2 focus:ring-stone-200 focus:border-stone-400 outline-none transition-all"
                        />
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="bg-white border border-stone-200 p-5 rounded-xl shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 bg-stone-100 rounded-lg flex items-center justify-center text-stone-700">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-stone-500 mb-0.5">Total Synced</p>
                            <p className="text-2xl font-semibold text-stone-900 tabular-nums">{vouchers.length}</p>
                        </div>
                    </div>
                </div>

                {/* Grid of Vouchers */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-white border border-stone-200 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-stone-200 rounded-2xl p-24 text-center">
                        <Box size={48} className="text-stone-300 mx-auto mb-4" />
                        <p className="text-stone-400 font-medium text-sm">No sync history available</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(v => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={v._id}
                                className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-stone-300 transition-all group flex flex-col justify-between"
                            >
                                <div className="space-y-5">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-stone-500">Roll reference</span>
                                                <div className="h-4 w-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                                    <CheckCircle2 size={10} className="text-white" />
                                                </div>
                                            </div>
                                            <p className="text-lg font-semibold text-stone-900">{v.rollNo}</p>
                                        </div>
                                        <div className="h-11 w-11 bg-stone-100 rounded-lg flex items-center justify-center text-stone-600 group-hover:bg-stone-800 group-hover:text-white transition-all">
                                            <ReceiptText size={20} />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Package size={15} className="text-stone-400 flex-shrink-0" />
                                            <p className="text-sm font-medium text-stone-700 truncate">{v.productId?.name}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <LayoutList size={15} className="text-stone-400 flex-shrink-0" />
                                            <p className="text-xs font-medium text-stone-500">{v.productId?.category || 'Standard'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-5 border-t border-stone-100 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <span className="text-xs font-medium text-stone-500">Production volume</span>
                                            <div className="flex items-baseline gap-1.5">
                                                <p className="text-2xl font-semibold text-stone-900 tabular-nums">{v.netWeight.toFixed(2)}</p>
                                                <p className="text-xs font-medium text-stone-500">{v.weightUnit}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <Clock size={14} className="text-stone-300 mb-1" />
                                            <p className="text-xs font-medium text-stone-500">{formatDateIST(v.recordedAt)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 p-3.5 bg-stone-50 rounded-lg group-hover:bg-stone-100 transition-colors">
                                        <span className="text-xs font-medium text-stone-500">Ledger type</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-stone-700">Stock Journal</span>
                                            <ArrowRight size={14} className="text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};

export default TallyVouchers;