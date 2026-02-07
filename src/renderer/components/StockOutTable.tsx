import { api } from "@renderer/api/client";
import { useEffect, useState } from "react";
import { formatFullDate as formatDateUtil } from "@renderer/utils/dateUtils";


interface Props {
    productId: string;
    unit: string;
}

interface StockOutItem {
    _id: string;
    date: string;
    department?: string;
    issuedBy?: string;
    issuedTo?: string;
    purpose?: string;
    quantity: number;
    remainingStock?: number;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

const StockOutTable = ({ productId, unit }: Props) => {
    const [items, setItems] = useState<StockOutItem[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [currentStock, setCurrentStock] = useState<number | null>(null);

    // Filter states
    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState("");
    const [issuedBy, setIssuedBy] = useState("");
    const [issuedTo, setIssuedTo] = useState("");
    const [purpose, setPurpose] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [sortBy, setSortBy] = useState("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    useEffect(() => {
        fetchCurrentStock();
    }, [productId]);

    useEffect(() => {
        fetchStockOut();
    }, [productId, page, sortBy, sortOrder, currentStock]);

    const fetchCurrentStock = async () => {
        try {
            const res = await api.get(`/products/${productId}`);
            setCurrentStock(res.data.currentStock || 0);
        } catch (error) {
            console.error("Failed to fetch current stock:", error);
            setCurrentStock(null);
        }
    };

    const fetchStockOut = async () => {
        setLoading(true);
        try {
            const params: any = { page, limit: 10, sortBy, sortOrder };

            if (search) params.search = search;
            if (department) params.department = department;
            if (issuedBy) params.issuedBy = issuedBy;
            if (issuedTo) params.issuedTo = issuedTo;
            if (purpose) params.purpose = purpose;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const res = await api.get(`/products/${productId}/stock-out`, { params });
            const fetchedItems = res.data.items || [];

            // Calculate remaining stock for each item
            if (currentStock !== null) {
                // Items are already sorted by the backend
                // For DESC order (newest first): 
                // - First item is newest, remaining stock = currentStock (after this transaction)
                // - Second item: remaining = currentStock + firstItem.quantity
                // - etc.
                let accumulatedQuantity = 0;
                const itemsWithStock = fetchedItems.map((item: StockOutItem) => {
                    // Calculate remaining stock after this transaction
                    const remainingStock = currentStock + accumulatedQuantity;
                    // Accumulate this item's quantity for next items (which are older)
                    accumulatedQuantity += item.quantity;

                    return {
                        ...item,
                        remainingStock,
                    };
                });

                setItems(itemsWithStock);
            } else {
                setItems(fetchedItems);
            }

            setPagination(res.data.pagination);
        } catch (error) {
            console.error("Failed to fetch stock-out records:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchStockOut();
    };


    const formatFullDate = (date: string) => {
        return formatDateUtil(date);
    };
    const handleClearFilters = () => {
        setSearch("");
        setDepartment("");
        setIssuedBy("");
        setIssuedTo("");
        setPurpose("");
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
                        placeholder="Search department, issued by/to, purpose..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-3 py-2 border rounded-md"
                    />
                    <input
                        type="text"
                        placeholder="Filter by department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="px-3 py-2 border rounded-md"
                    />
                    <input
                        type="text"
                        placeholder="Filter by issued by"
                        value={issuedBy}
                        onChange={(e) => setIssuedBy(e.target.value)}
                        className="px-3 py-2 border rounded-md"
                    />
                    <input
                        type="text"
                        placeholder="Filter by issued to"
                        value={issuedTo}
                        onChange={(e) => setIssuedTo(e.target.value)}
                        className="px-3 py-2 border rounded-md"
                    />
                    <input
                        type="text"
                        placeholder="Filter by purpose"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
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
                                onClick={() => handleSort("department")}
                            >
                                Department <SortIcon field="department" />
                            </th>
                            <th
                                className="px-4 py-2 text-left cursor-pointer hover:bg-gray-200"
                                onClick={() => handleSort("issuedTo")}
                            >
                                Issued To <SortIcon field="issuedTo" />
                            </th>
                            <th
                                className="px-4 py-2 text-left cursor-pointer hover:bg-gray-200"
                                onClick={() => handleSort("issuedBy")}
                            >
                                Issued By <SortIcon field="issuedBy" />
                            </th>
                            <th
                                className="px-4 py-2 text-left cursor-pointer hover:bg-gray-200"
                                onClick={() => handleSort("purpose")}
                            >
                                Purpose <SortIcon field="purpose" />
                            </th>
                            <th
                                className="px-4 py-2 text-left cursor-pointer hover:bg-gray-200"
                                onClick={() => handleSort("quantity")}
                            >
                                Quantity <SortIcon field="quantity" />
                            </th>
                            <th className="px-4 py-2 text-left">Remaining Stock</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                    No stock-out records found
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item._id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-2">
                                        {formatFullDate(item.date)}
                                    </td>
                                    <td className="px-4 py-2">{item.department || "-"}</td>
                                    <td className="px-4 py-2">{item.issuedTo || "-"}</td>
                                    <td className="px-4 py-2">{item.issuedBy || "-"}</td>

                                    <td className="px-4 py-2">{item.purpose || "-"}</td>
                                    <td className="px-4 py-2 text-red-600 font-semibold">
                                        -{item.quantity} {unit}
                                    </td>
                                    <td className="px-4 py-2">
                                        {item.remainingStock !== undefined ? (
                                            <span className="px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
                                                {item.remainingStock} {unit}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
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

export default StockOutTable;