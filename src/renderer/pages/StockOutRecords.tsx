import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import {
    Upload,
    Package,
    Search,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Trash2,
    Loader2,
    Filter,
    Download,
    X
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatDateIST, formatDateForInput, inputDateToISOIST, inputDateToEndOfDayIST, getISTDateString } from "../utils/dateUtils";

import { TableSkeleton } from "../components/Skeleton";
import Ripple from "../components/shared/Ripple";

interface StockOutRecord {
    _id: string;
    productId: { _id: string; name: string; image?: string; unit?: string };
    quantity: number;
    department?: string;
    issuedBy?: string;
    issuedTo?: string;
    purpose?: string;
    date: string;
    remainingStock?: number;
}

interface StockOutForm {
    productId: string;
    quantity: number | string;
    department: string;
    issuedBy: string;
    issuedTo: string;
    purpose: string;
    date?: string;
}

const EditStockOutModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    record: StockOutRecord | null;
    onSuccess: () => void;
}> = ({ isOpen, onClose, record, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<StockOutForm>({
        productId: "",
        quantity: "",
        department: "",
        issuedBy: "",
        issuedTo: "",
        purpose: "",
        date: ""
    });
    const [deptSuggestions, setDeptSuggestions] = useState<string[]>([]);
    const [showDeptList, setShowDeptList] = useState(false);

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const res = await api.get("/stock-out/departments");
                setDeptSuggestions(res.data);
            } catch (err) {
                console.error("Failed to fetch suggestions", err);
            }
        };
        fetchSuggestions();
    }, []);

    useEffect(() => {

        if (record) {
            setForm({
                productId: record.productId._id,
                quantity: record.quantity,
                department: record.department || "",
                issuedBy: record.issuedBy || "",
                issuedTo: record.issuedTo || "",
                purpose: record.purpose || "",
                date: formatDateForInput(record.date)
            });
        }
    }, [record]);

    if (!isOpen || !record) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (Number(form.quantity) <= 0) {
            toast.error("Quantity must be greater than zero");
            return;
        }
        setLoading(true);
        try {
            await api.put(`/stock-out/${record._id}`, {
                ...form,
                date: form.date ? inputDateToISOIST(form.date) : undefined,
            });
            toast.success("Record updated successfully");
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to update record");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-neutral-100 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 bg-neutral-50/50 border-b border-neutral-100">
                    <div>
                        <h3 className="text-base font-bold text-neutral-900">Edit Stock Out</h3>
                        <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">{record.productId.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
                        <X size={18} className="text-neutral-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">Quantity</label>
                            <input
                                type="number"
                                required
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 focus:border-neutral-400 transition-all shadow-inner-subtle"
                                value={form.quantity}
                                onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 relative">
                                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">Department</label>
                                <input
                                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 focus:border-neutral-400 transition-all shadow-sm"
                                    value={form.department}
                                    onFocus={() => setShowDeptList(true)}
                                    onBlur={() => setTimeout(() => setShowDeptList(false), 200)}
                                    onChange={(e) => { setForm(f => ({ ...f, department: e.target.value })); setShowDeptList(true); }}
                                />
                                {showDeptList && deptSuggestions.length > 0 && (
                                    <div className="absolute z-[110] w-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-48 overflow-auto animate-in fade-in slide-in-from-top-1 duration-200">
                                        {deptSuggestions
                                            .filter(s => s.toLowerCase().includes(form.department.toLowerCase()))
                                            .map(s => (
                                                <div
                                                    key={s}
                                                    className="px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 cursor-pointer transition-colors border-b border-neutral-50 last:border-0"
                                                    onMouseDown={() => { setForm(f => ({ ...f, department: s })); setShowDeptList(false); }}
                                                >
                                                    {s}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>

                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">Issued To</label>
                                <input
                                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 focus:border-neutral-400 transition-all shadow-sm"
                                    value={form.issuedTo}
                                    onChange={(e) => setForm(f => ({ ...f, issuedTo: e.target.value }))}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">Issued By</label>
                                <input
                                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 focus:border-neutral-400 transition-all shadow-sm"
                                    value={form.issuedBy}
                                    onChange={(e) => setForm(f => ({ ...f, issuedBy: e.target.value }))}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">Purpose / Remarks</label>
                                <textarea
                                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 focus:border-neutral-400 transition-all shadow-sm resize-none"
                                    rows={2}
                                    value={form.purpose}
                                    onChange={(e) => setForm(f => ({ ...f, purpose: e.target.value }))}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 focus:border-neutral-400 transition-all shadow-sm"
                                    value={form.date}
                                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white border border-neutral-200 text-neutral-500 text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-neutral-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="relative overflow-hidden flex-1 px-4 py-3 bg-neutral-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            <Ripple color="rgba(255, 255, 255, 0.1)" />
                            {loading ? <Loader2 size={14} className="animate-spin" /> : "Update Record"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StockOutRecords: React.FC = () => {
    const navigate = useNavigate();
    const [records, setRecords] = useState<StockOutRecord[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [deptOptions, setDeptOptions] = useState<string[]>([]);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<StockOutRecord | null>(null);

    // Export loading
    const [exportLoading, setExportLoading] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [filters, setFilters] = useState({
        search: "",
        department: "",
        dateFrom: "",
        dateTo: "",
    });

    const load = async () => {
        try {
            setDataLoading(true);
            const [recRes, depRes] = await Promise.all([
                api.get("/stock-out", {
                    params: {
                        search: filters.search || undefined,
                        department: filters.department || undefined,
                        dateFrom: filters.dateFrom ? inputDateToISOIST(filters.dateFrom) : undefined,
                        dateTo: filters.dateTo ? inputDateToEndOfDayIST(filters.dateTo) : undefined,
                        page: currentPage,
                        limit: itemsPerPage,
                    }
                }),
                api.get("/stock-out/departments")
            ]);
            setRecords(recRes.data.data);
            setTotalPages(recRes.data.meta?.totalPages || 1);
            setTotalRecords(recRes.data.meta?.total || 0);
            setDeptOptions(depRes.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load records");
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage === 1) {
                load();
            } else {
                setCurrentPage(1);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [filters.search, filters.department, filters.dateFrom, filters.dateTo]);

    useEffect(() => {
        load();
    }, [currentPage, itemsPerPage]);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            await api.delete(`/stock-out/${id}`);
            toast.success("Record deleted");
            load();
        } catch (err) {
            toast.error("Failed to delete record");
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // ─── CSV Export: fetches ALL matching records via dedicated export endpoint ─
    const handleExportCSV = async () => {
        try {
            setExportLoading(true);
            const res = await api.get("/stock-out/export", {
                params: {
                    search: filters.search || undefined,
                    department: filters.department || undefined,
                    dateFrom: filters.dateFrom || undefined,
                    dateTo: filters.dateTo || undefined,
                },
            });
            const allRecords: StockOutRecord[] = res.data?.data || [];

            if (allRecords.length === 0) {
                toast.info("No records to export.");
                return;
            }

            const headers = [
                "Product Name",
                "Quantity",
                "Department",
                "Issued To",
                "Issued By",
                "Purpose",
                "Date",
            ];

            const rows = allRecords.map((item) => [
                item.productId?.name || "",
                item.quantity.toString(),
                item.department || "",
                item.issuedTo || "",
                item.issuedBy || "",
                item.purpose || "",
                new Date(item.date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
            ]);

            const csvContent = [
                headers.join(","),
                ...rows.map((row) =>
                    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
                ),
            ].join("\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            const dateStr = getISTDateString();
            link.setAttribute("href", url);
            link.setAttribute("download", `stock-out-records-${dateStr}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success(`Exported ${allRecords.length} records successfully!`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to export records");
        } finally {
            setExportLoading(false);
        }
    };

    // ── build/download helpers shared by both export variants ──
    const buildStockOutCSV = (items: StockOutRecord[]) => {
        const headers = ["Product Name", "Quantity", "Department", "Issued To", "Issued By", "Purpose", "Date"];
        const rows = items.map((item) => [
            item.productId?.name || "",
            item.quantity.toString(),
            item.department || "",
            item.issuedTo || "",
            item.issuedBy || "",
            item.purpose || "",
            new Date(item.date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
        ]);
        return [
            headers.join(","),
            ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
        ].join("\n");
    };

    const downloadCSV = (csv: string, filename: string) => {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = filename;
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Export ONLY the current page (instant, from in-memory records)
    const handleExportPage = () => {
        if (!records.length) return;
        const dateStr = getISTDateString();
        downloadCSV(buildStockOutCSV(records), `stock-out-page${currentPage}-${dateStr}.csv`);
        toast.success(`Exported ${records.length} records from page ${currentPage}`);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Stock Out Records</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Review historical inventory issuances and consumption</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Export This Page */}
                    <button
                        onClick={handleExportPage}
                        disabled={dataLoading || records.length === 0}
                        title="Export current page only"
                        className="relative overflow-hidden inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 text-sm font-semibold rounded-xl hover:bg-neutral-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={16} />
                        This Page
                        <Ripple />
                    </button>

                    {/* Export All */}
                    <button
                        onClick={handleExportCSV}
                        disabled={exportLoading || dataLoading || totalRecords === 0}
                        title="Export all matching records"
                        className="relative overflow-hidden inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {exportLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Download size={16} />
                        )}
                        {exportLoading ? "Exporting..." : "Export All"}
                        <Ripple color="rgba(255,255,255,0.15)" />
                    </button>
                </div>
            </div>

            {/* Filters Strip */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[240px] relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by part name, recipient or purpose..."
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-400 transition-all text-sm"
                        value={filters.search}
                        onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            className="pl-9 pr-8 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:outline-none text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-all shadow-sm"
                            value={filters.department}
                            onChange={(e) => setFilters(f => ({ ...f, department: e.target.value }))}
                        >
                            <option value="">All Departments</option>
                            {deptOptions.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    <input
                        type="date"
                        className="px-3 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:outline-none text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-all shadow-sm"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                    />
                    <span className="text-neutral-400 font-bold">to</span>
                    <input
                        type="date"
                        className="px-3 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-xl focus:outline-none text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-all shadow-sm"
                        value={filters.dateTo}
                        onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                    />

                    <button
                        onClick={() => setFilters({ search: "", department: "", dateFrom: "", dateTo: "" })}
                        className="text-xs font-bold text-neutral-400 hover:text-neutral-900 uppercase tracking-widest px-2"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto min-h-[400px]">
                    {dataLoading ? (
                        <div className="p-6"><TableSkeleton cols={7} rows={8} /></div>
                    ) : records.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-neutral-50 flex items-center justify-center mb-4 border border-neutral-100">
                                <Package size={32} className="text-neutral-200" />
                            </div>
                            <h4 className="text-base font-semibold text-neutral-900">No records found</h4>
                            <p className="text-sm text-neutral-500 mt-1 max-w-[200px]">Adjust your filters to see more results.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr className="bg-neutral-50/50">
                                    <th className="py-4 px-6 text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">Product</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">Quantity</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">Dept</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">To</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">By</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">Purpose</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">Date</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {records.map((r) => (
                                    <tr key={r._id} className="group hover:bg-neutral-50/50 transition-colors">
                                        <td
                                            className="py-4 px-6 cursor-pointer group/item"
                                            onClick={() => navigate(`/products/${r.productId?._id}`)}
                                        >
                                            <div className="flex items-center gap-3">
                                                {r.productId?.image ? (
                                                    <img src={`http://localhost:4000${r.productId.image}`} className="w-10 h-10 rounded-xl object-cover border border-neutral-200 shadow-sm" alt="" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center border border-neutral-200">
                                                        <Package size={16} className="text-neutral-400" />
                                                    </div>
                                                )}
                                                <span className="text-sm font-semibold text-neutral-900 group-hover/item:text-blue-600 transition-colors">{r.productId?.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-bold border border-red-100">
                                                -{r.quantity}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-neutral-600 font-medium">{r.department || "—"}</td>
                                        <td className="py-4 px-6 text-sm text-neutral-600 font-medium">{r.issuedTo || "—"}</td>
                                        <td className="py-4 px-6 text-sm text-neutral-600 font-medium">{r.issuedBy || "—"}</td>
                                        <td className="py-4 px-6 text-xs text-neutral-400 font-medium">{r.purpose || "—"}</td>
                                        <td className="py-4 px-6 text-xs text-neutral-500 font-medium">{formatDate(r.date)}</td>

                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => { setSelectedRecord(r); setIsEditModalOpen(true); }}
                                                    className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-white hover:border-neutral-200 rounded-xl border border-transparent transition-all"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(r._id)}
                                                    className="p-2 text-neutral-400 hover:text-red-500 hover:bg-white hover:border-neutral-200 rounded-xl border border-transparent transition-all"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Strip */}
                <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/30 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest tabular-nums font-mono">
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalRecords)}-{Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} Records
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative overflow-hidden p-2 rounded-xl border border-neutral-200 bg-white disabled:opacity-30 hover:bg-neutral-50 transition-colors shadow-sm active:scale-95"
                        >
                            <ChevronLeft size={16} />
                            <Ripple />
                        </button>
                        <div className="flex gap-1.5 mx-2">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={`min-w-[32px] h-8 text-[11px] font-bold rounded-lg transition-all ${currentPage === i + 1 ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500 hover:bg-white border border-transparent hover:border-neutral-200'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative overflow-hidden p-2 rounded-xl border border-neutral-200 bg-white disabled:opacity-30 hover:bg-neutral-50 transition-colors shadow-sm active:scale-95"
                        >
                            <ChevronRight size={16} />
                            <Ripple />
                        </button>
                    </div>
                </div>
            </div>

            <EditStockOutModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setSelectedRecord(null); }}
                record={selectedRecord}
                onSuccess={load}
            />
        </div>
    );
};

export default StockOutRecords;
