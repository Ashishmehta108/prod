import { api } from "@renderer/api/client";
import { useEffect, useRef, useState } from "react";
import {
  formatFullDate as formatDateUtil,
  inputDateToISOIST,
  inputDateToEndOfDayIST,
} from "@renderer/utils/dateUtils";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  SlidersHorizontal,
  X,
  InboxIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
  rate?: number;
  amount?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="border-b border-neutral-100">
    {[...Array(7)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div
          className="h-3.5 bg-neutral-100 rounded animate-pulse"
          style={{ width: `${50 + (i * 19) % 45}%` }}
        />
      </td>
    ))}
  </tr>
);

// ── Sort icon ─────────────────────────────────────────────────────────────────
const SortIcon = ({
  field,
  sortBy,
  sortOrder,
}: {
  field: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}) => {
  if (sortBy !== field)
    return <ChevronsUpDown size={13} className="text-neutral-400 inline ml-1" />;
  return sortOrder === "asc" ? (
    <ChevronUp size={13} className="text-[#1B2B4B] inline ml-1" />
  ) : (
    <ChevronDown size={13} className="text-[#1B2B4B] inline ml-1" />
  );
};

// ── Pagination helpers ────────────────────────────────────────────────────────
function getPageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

// ── Main component ────────────────────────────────────────────────────────────
const StockInTable = ({ productId, unit }: Props) => {
  const [items, setItems] = useState<StockInItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [supplier, setSupplier] = useState("");
  const [location, setLocation] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchStockIn();
  }, [productId, page, sortBy, sortOrder]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchStockIn();
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchStockIn = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 10, sortBy, sortOrder };
      if (search) params.search = search;
      if (supplier) params.supplier = supplier;
      if (location) params.location = location;
      if (invoiceNo) params.invoiceNo = invoiceNo;
      if (startDate) params.startDate = inputDateToISOIST(startDate);
      if (endDate) params.endDate = inputDateToEndOfDayIST(endDate);

      const res = await api.get(`/products/${productId}/stock-in`, { params });
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error("Failed to fetch stock-in records:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setPage(1);
    fetchStockIn();
  };

  const clearFilters = () => {
    setSupplier("");
    setLocation("");
    setInvoiceNo("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  // Active filter chips
  const activeFilters: ActiveFilter[] = [
    ...(supplier ? [{ key: "supplier", label: "Supplier", value: supplier }] : []),
    ...(location ? [{ key: "location", label: "Location", value: location }] : []),
    ...(invoiceNo ? [{ key: "invoiceNo", label: "Invoice", value: invoiceNo }] : []),
    ...(startDate ? [{ key: "startDate", label: "From", value: startDate }] : []),
    ...(endDate ? [{ key: "endDate", label: "To", value: endDate }] : []),
  ];

  const removeFilter = (key: string) => {
    const map: Record<string, () => void> = {
      supplier: () => setSupplier(""),
      location: () => setLocation(""),
      invoiceNo: () => setInvoiceNo(""),
      startDate: () => setStartDate(""),
      endDate: () => setEndDate(""),
    };
    map[key]?.();
    setPage(1);
  };

  const thClass =
    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 cursor-pointer select-none hover:text-neutral-800 transition-colors whitespace-nowrap";

  return (
    <div className="space-y-3">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search invoice, supplier, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-8 py-2 text-sm border border-neutral-200 rounded-lg bg-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            filtersOpen || activeFilters.length > 0
              ? "bg-[#1B2B4B] text-white border-[#1B2B4B]"
              : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
          }`}
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeFilters.length > 0 && (
            <span className="flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-white text-[#1B2B4B] rounded-full">
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Active filter chips ── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-full border border-neutral-200"
            >
              <span className="text-neutral-400">{f.label}:</span>
              {f.value}
              <button
                onClick={() => removeFilter(f.key)}
                className="text-neutral-400 hover:text-neutral-700 ml-0.5"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          <button
            onClick={clearFilters}
            className="text-xs text-neutral-400 hover:text-neutral-700 underline transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Collapsible filter panel ── */}
      {filtersOpen && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: "Supplier", value: supplier, set: setSupplier, placeholder: "e.g. Tata Steel" },
              { label: "Location", value: location, set: setLocation, placeholder: "e.g. Warehouse B" },
              { label: "Invoice No.", value: invoiceNo, set: setInvoiceNo, placeholder: "e.g. INV-2024-001" },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label} className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">{label}</label>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300 transition"
                />
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-500">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-500">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300 transition"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-[#1B2B4B] hover:bg-[#162240] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              {[
                { label: "Date", field: "date" },
                { label: "Supplier", field: "supplier" },
                { label: "Invoice", field: "invoiceNo" },
                { label: "Location", field: "location" },
                { label: "Quantity", field: "quantity" },
                { label: "Rate", field: "rate" },
                { label: "Amount", field: "amount" },
              ].map(({ label, field }) => (
                <th key={field} className={thClass} onClick={() => handleSort(field)}>
                  {label}
                  <SortIcon field={field} sortBy={sortBy} sortOrder={sortOrder} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <InboxIcon className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-neutral-500">No stock-in records found</p>
                  {activeFilters.length > 0 && (
                    <p className="text-xs text-neutral-400 mt-1">
                      Try adjusting or clearing your filters
                    </p>
                  )}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-neutral-700 whitespace-nowrap">
                    {formatDateUtil(item.date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700">
                    {item.supplier || <span className="text-neutral-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700 font-mono">
                    {item.invoiceNo || <span className="text-neutral-300 font-sans">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700">
                    {item.location || <span className="text-neutral-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-xs font-semibold border border-green-100">
                      +{item.quantity} {unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700">
                    {item.rate ? `₹${item.rate}` : <span className="text-neutral-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700 font-semibold">
                    {item.amount ? `₹${item.amount}` : <span className="text-neutral-300">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-neutral-500">
            Showing <span className="font-medium text-neutral-700">{items.length}</span> of{" "}
            <span className="font-medium text-neutral-700">{pagination.total}</span> records
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!pagination.hasPrevPage}
              className="p-1.5 rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>

            {getPageRange(pagination.page, pagination.totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="px-2 text-xs text-neutral-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`min-w-[30px] h-[30px] text-xs font-medium rounded-md border transition-colors ${
                    pagination.page === p
                      ? "bg-[#1B2B4B] text-white border-[#1B2B4B]"
                      : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNextPage}
              className="p-1.5 rounded-md border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockInTable;