import { api } from "@renderer/api/client";
import { useEffect, useState } from "react";
import { formatFullDate as formatDateUtil } from "@renderer/utils/dateUtils";



interface Props {
    productId: string;
    unit: string;
}

interface StockInItem {
    _id: string;
    date: string;
    supplier?: string;
    invoiceNo?: string;
    location?: string;
    quantity: number;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

const StockInTable = ({ productId, unit }: Props) => {
    const [items, setItems] = useState<StockInItem[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const formatFullDate = (date: string) => {
        return formatDateUtil(date);
    };

    const formatMonthYear = (date: string) => {
        return new Date(date).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
        });
    };

    // Filter states
    const [search, setSearch] = useState("");
    const [supplier, setSupplier] = useState("");
    const [location, setLocation] = useState("");
    const [invoiceNo, setInvoiceNo] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [sortBy, setSortBy] = useState("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    useEffect(() => {
        fetchStockIn();
    }, [productId, page, sortBy, sortOrder]);

    const fetchStockIn = async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 10, sortBy, sortOrder };

            if (search) params.search = search;
            if (supplier) params.supplier = supplier;
            if (location) params.location = location;
            if (invoiceNo) params.invoiceNo = invoiceNo;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const res = await api.get(`/products/${productId}/stock-in`, { params });
            setItems(res.data.items);
            setPagination(res.data.pagination);
        } catch (error) {
            console.error("Failed to fetch stock-in records:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchStockIn();
    };

    const handleClearFilters = () => {
        setSearch("");
        setSupplier("");
        setLocation("");
        setInvoiceNo("");
        setStartDate("");
        setEndDate("");
        setPage(1);
    };

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("desc");
        }
        setPage(1);
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortBy !== field) return <span className="text-gray-400">⇅</span>;
        return sortOrder === "asc" ? <span>↑</span> : <span>↓</span>;
    };

    return (
        <div className="space-y-4">
            {/* Search and Filters */}
            <form onSubmit={handleSearch} className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <input
                        type="text"
                        placeholder="Search invoice, supplier, location..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-3 py-2 border rounded-md"
                    />
                    <input
                        type="text"
                        placeholder="Filter by supplier"
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                        className="px-3 py-2 border rounded-md"
                    />
                    <input
                        type="text"
                        placeholder="Filter by location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="px-3 py-2 border rounded-md"
                    />
                    <input
                        type="text"
                        placeholder="Filter by invoice number"
                        value={invoiceNo}
                        onChange={(e) => setInvoiceNo(e.target.value)}
                        className="px-3 py-2 border rounded-md"
                    />
                    <input
                        type="date"
                        placeholder="Start date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-2 border rounded-md"
                    />
                    <input
                        type="date"
                        placeholder="End date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-2 border rounded-md"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Apply Filters
                    </button>
                    <button
                        type="button"
                        onClick={handleClearFilters}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                        Clear Filters
                    </button>
                </div>
            </form>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th
                                className="px-4 py-2 text-left cursor-pointer hover:bg-gray-200"
                                onClick={() => handleSort("date")}
                            >
                                Date <SortIcon field="date" />
                            </th>
                            <th
                                className="px-4 py-2 text-left cursor-pointer hover:bg-gray-200"
                                onClick={() => handleSort("supplier")}
                            >
                                Supplier <SortIcon field="supplier" />
                            </th>
                            <th
                                className="px-4 py-2 text-left cursor-pointer hover:bg-gray-200"
                                onClick={() => handleSort("invoiceNo")}
                            >
                                Invoice <SortIcon field="invoiceNo" />
                            </th>
                            <th
                                className="px-4 py-2 text-left cursor-pointer hover:bg-gray-200"
                                onClick={() => handleSort("location")}
                            >
                                Location <SortIcon field="location" />
                            </th>
                            <th
                                className="px-4 py-2 text-left cursor-pointer hover:bg-gray-200"
                                onClick={() => handleSort("quantity")}
                            >
                                Quantity <SortIcon field="quantity" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    No stock-in records found
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item._id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-2">
                                        {formatFullDate(item.date)}

                                    </td>
                                    <td className="px-4 py-2">{item.supplier || "-"}</td>
                                    <td className="px-4 py-2">{item.invoiceNo || "-"}</td>
                                    <td className="px-4 py-2">{item.location || "-"}</td>
                                    <td className="px-4 py-2 text-green-600 font-semibold">
                                        +{item.quantity} {unit}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                    <div className="text-sm text-gray-700">
                        Showing {items.length} of {pagination.total} results
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(page - 1)}
                            disabled={!pagination.hasPrevPage}
                            className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPage(page + 1)}
                            disabled={!pagination.hasNextPage}
                            className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockInTable;