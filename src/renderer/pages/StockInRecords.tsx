import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import {
    Download,
    Package,
    Search,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Trash2,
    Loader2,
    Filter,
    X,
    Building2
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatDateIST, formatDateForInput, inputDateToISOIST, inputDateToEndOfDayIST, getISTDateString } from "../utils/dateUtils";

import { TableSkeleton } from "../components/Skeleton";
import Ripple from "../components/shared/Ripple";

interface StockInRecord {
    _id: string;
    productId: { _id: string; name: string; image?: string };
    quantity: number;
    supplier?: string;
    invoiceNo?: string;
    location?: string;
    date: string;
}

interface StockInForm {
    productId: string;
    quantity: number | string;
    supplier: string;
    invoiceNo: string;
    location: string;
    date?: string;
}

const EditStockInModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    record: StockInRecord | null;
    onSuccess: () => void;
}> = ({ isOpen, onClose, record, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<StockInForm>({
        productId: "",
        quantity: "",
        supplier: "",
        invoiceNo: "",
        location: "",
        date: ""
    });
    const [supplierSuggestions, setSupplierSuggestions] = useState<string[]>([]);
    const [showSupplierList, setShowSupplierList] = useState(false);

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const res = await api.get("/stock-in/frequent");
                setSupplierSuggestions(res.data);
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
                supplier: record.supplier || "",
                invoiceNo: record.invoiceNo || "",
                location: record.location || "",
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
            await api.put(`/stock-in/${record._id}`, {
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
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-neutral-100 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 bg-neutral-50/50 border-b border-neutral-100">
                    <div>
                        <h3 className="text-base font-bold text-neutral-900">Edit Stock In</h3>
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
                                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">Supplier</label>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input
                                        className="w-full bg-white border border-neutral-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 focus:border-neutral-400 transition-all shadow-sm"
                                        placeholder="Search or enter supplier..."
                                        value={form.supplier}
                                        onFocus={() => setShowSupplierList(true)}
                                        onBlur={() => setTimeout(() => setShowSupplierList(false), 200)}
                                        onChange={(e) => { setForm(f => ({ ...f, supplier: e.target.value })); setShowSupplierList(true); }}
                                    />
                                </div>
                                {showSupplierList && supplierSuggestions.length > 0 && (
                                    <div className="absolute z-[110] w-full mt-1 bg-white border border-neutral-300 rounded-xl shadow-xl max-h-48 overflow-auto animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="px-3 py-2 bg-neutral-50/50 border-b border-neutral-100 text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center justify-between">
                                            <span>Frequent Suppliers</span>
                                            <Building2 size={12} className="opacity-50" />
                                        </div>
                                        {supplierSuggestions
                                            .filter(s => !form.supplier || s.toLowerCase().includes(form.supplier.toLowerCase()) || form.supplier === record.supplier)
                                            .map(s => (
                                                <div
                                                    key={s}
                                                    className="px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 cursor-pointer transition-colors border-b border-neutral-50 last:border-0"
                                                    onMouseDown={() => { setForm(f => ({ ...f, supplier: s })); setShowSupplierList(false); }}
                                                >
                                                    {s}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">Invoice No</label>
                                <input
                                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 focus:border-neutral-400 transition-all shadow-sm"
                                    value={form.invoiceNo}
                                    onChange={(e) => setForm(f => ({ ...f, invoiceNo: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">Location</label>
                                <input
                                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 focus:border-neutral-400 transition-all shadow-sm"
                                    value={form.location}
                                    onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 ml-1">Date</label>
                            <input
                                type="date"
                                className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-900/5 focus:border-neutral-400 transition-all shadow-sm"
                                value={form.date}
                                onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                            />
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
            </div >
        </div >
    );
};

const StockInRecords: React.FC = () => {
    const navigate = useNavigate();
    const [records, setRecords] = useState<StockInRecord[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [locations, setLocations] = useState<string[]>([]);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<StockInRecord | null>(null);

    // Export state
    const [exportLoading, setExportLoading] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [filters, setFilters] = useState({
        search: "",
        location: "",
        dateFrom: "",
        dateTo: "",
    });

    // Track if page change is in progress to preserve scroll position
    const isPaginatingRef = React.useRef(false);

    const load = async () => {
        // Save the main scroll container's scroll position before loading
        const mainEl = document.querySelector("main") as HTMLElement | null;
        const savedScrollTop = isPaginatingRef.current ? mainEl?.scrollTop ?? 0 : 0;

        try {
            setDataLoading(true);
            const [recRes, locRes] = await Promise.all([
                api.get("/stock-in", {
                    params: {
                        search: filters.search || undefined,
                        location: filters.location || undefined,
                        dateFrom: filters.dateFrom ? inputDateToISOIST(filters.dateFrom) : undefined,
                        dateTo: filters.dateTo ? inputDateToEndOfDayIST(filters.dateTo) : undefined,
                        page: currentPage,
                        limit: itemsPerPage,
                    }
                }),
                api.get("/stock-in/locations")
            ]);
            setRecords(recRes.data.data);
            setTotalPages(recRes.data.meta?.totalPages || 1);
            setTotalRecords(recRes.data.meta?.total || 0);
            setLocations(locRes.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load records");
        } finally {
            setDataLoading(false);
            // Restore scroll position after data loads in (next tick so DOM has updated)
            if (isPaginatingRef.current && mainEl) {
                requestAnimationFrame(() => {
                    mainEl.scrollTop = savedScrollTop;
                });
            }
            isPaginatingRef.current = false;
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
    }, [filters.search, filters.location, filters.dateFrom, filters.dateTo]);

    useEffect(() => {
        load();
    }, [currentPage, itemsPerPage]);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            await api.delete(`/stock-in/${id}`);
            toast.success("Record deleted");
            load();
        } catch (err) {
            toast.error("Failed to delete record");
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            isPaginatingRef.current = true;
            setCurrentPage(newPage);
        }
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const showMax = 5;
        if (totalPages <= showMax) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    // ── CSV helpers ──────────────────────────────────────────────────
    const buildStockInCSV = (items: StockInRecord[]) => {
        const headers = ["Product Name", "Quantity", "Supplier", "Invoice No", "Location", "Date"];
        const rows = items.map((item) => [
            item.productId?.name || "",
            item.quantity.toString(),
            item.supplier || "",
            item.invoiceNo || "",
            item.location || "",
            formatDateIST(item.date),
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

    // Export only the current page (instant)
    const handleExportPage = () => {
        if (!records.length) return;
        const dateStr = getISTDateString();
        downloadCSV(buildStockInCSV(records), `stock-in-page${currentPage}-${dateStr}.csv`);
        toast.success(`Exported ${records.length} records from page ${currentPage}`);
    };

    // Export ALL matching records via API
    const handleExportAll = async () => {
        try {
            setExportLoading(true);
            const res = await api.get("/stock-in/export", {
                params: {
                    search: filters.search || undefined,
                    location: filters.location || undefined,
                    dateFrom: filters.dateFrom || undefined,
                    dateTo: filters.dateTo || undefined,
                },
            });
            const allRecords: StockInRecord[] = res.data?.data || [];
            if (!allRecords.length) { toast.info("No records to export."); return; }
            const dateStr = getISTDateString();
            downloadCSV(buildStockInCSV(allRecords), `stock-in-all-${dateStr}.csv`);
            toast.success(`Exported ${allRecords.length} records successfully!`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to export records");
        } finally {
            setExportLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Stock In Records</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">View and manage historical inventory receipts</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Export This Page */}
                    <button
                        onClick={handleExportPage}
                        disabled={dataLoading || records.length === 0}
                        title="Export current page only"
                        className="relative overflow-hidden inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 text-sm font-semibold rounded-xl hover:bg-neutral-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Loader2 size={15} className="hidden" />
                        <Download size={15} />
                        This Page
                        <Ripple />
                    </button>

                    {/* Export ALL */}
                    <button
                        onClick={handleExportAll}
                        disabled={exportLoading || dataLoading || totalRecords === 0}
                        title="Export all records matching current filters"
                        className="relative overflow-hidden inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {exportLoading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                        {exportLoading ? "Exporting…" : "Export All"}
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
                        placeholder="Search by part name, supplier or invoice..."
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
                            value={filters.location}
                            onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))}
                        >
                            <option value="">All Locations</option>
                            {locations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
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
                        onClick={() => setFilters({ search: "", location: "", dateFrom: "", dateTo: "" })}
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
                                    <th className="py-4 px-6 text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">Supplier</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">Invoice</th>
                                    <th className="py-4 px-6 text-[11px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">Location</th>
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
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                                                +{r.quantity}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-neutral-600 font-medium">{r.supplier || "—"}</td>
                                        <td className="py-4 px-6 text-xs text-neutral-400 font-bold tabular-nums">{r.invoiceNo || "—"}</td>
                                        <td className="py-4 px-6 text-sm text-neutral-500 font-medium">{r.location || "—"}</td>
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
                <div className="px-5 py-4 border-t border-neutral-200/60 bg-neutral-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] text-neutral-600 font-medium">
                                Items per page:
                            </span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-2 py-1 text-[11px] bg-white border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-neutral-300 text-neutral-900"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-[11px] text-neutral-600 font-medium">
                                {Math.min((currentPage - 1) * itemsPerPage + 1, totalRecords)}–{Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords}
                            </span>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded hover:bg-neutral-200 border border-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Previous page"
                                >
                                    <ChevronLeft size={14} className="text-neutral-900" />
                                </button>

                                {getPageNumbers().map((page, idx) =>
                                    page === '...' ? (
                                        <span key={`ellipsis-${idx}`} className="px-2 text-neutral-500">...</span>
                                    ) : (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page as number)}
                                            className={`min-w-[28px] h-7 px-2 text-[11px] font-medium rounded transition-colors ${currentPage === page
                                                ? 'bg-neutral-900 text-white'
                                                : 'hover:bg-neutral-200 border border-neutral-200 text-neutral-900'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                )}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded hover:bg-neutral-200 border border-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Next page"
                                >
                                    <ChevronRight size={14} className="text-neutral-900" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <EditStockInModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setSelectedRecord(null); }}
                record={selectedRecord}
                onSuccess={load}
            />
        </div>
    );
};

export default StockInRecords;
