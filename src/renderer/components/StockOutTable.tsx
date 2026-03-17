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
  currentStock?: number | null; // pass from parent to avoid re-fetch
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
          style={{ width: `${55 + (i * 17) % 40}%` }}
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
const StockOutTable = ({ productId, unit, currentStock: currentStockProp }: Props) => {
  const [items, setItems] = useState<StockOutItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [internalStock, setInternalStock] = useState<number | null>(null);

  // Use prop if provided, else fall back to internally fetched value
  const currentStock = currentStockProp ?? internalStock;

  // Filter states
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [issuedBy, setIssuedBy] = useState("");
  const [issuedTo, setIssuedTo] = useState("");
  const [purpose, setPurpose] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Debounce ref for search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch current stock only if not passed as prop
  useEffect(() => {
    if (currentStockProp !== undefined) return;
    api
      .get(`/products/${productId}`)
      .then((res) => setInternalStock(res.data.currentStock ?? 0))
      .catch(() => setInternalStock(null));
  }, [productId, currentStockProp]);

  useEffect(() => {
    fetchStockOut();
  }, [productId, page, sortBy, sortOrder]);

  // Debounced search trigger
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchStockOut();
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchStockOut = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 10, sortBy, sortOrder };
      if (search) params.search = search;
      if (department) params.department = department;
      if (issuedBy) params.issuedBy = issuedBy;
      if (issuedTo) params.issuedTo = issuedTo;
      if (purpose) params.purpose = purpose;
      if (startDate) params.startDate = inputDateToISOIST(startDate);
      if (endDate) params.endDate = inputDateToEndOfDayIST(endDate);

      const res = await api.get(`/products/${productId}/stock-out`, { params });
      const fetched: StockOutItem[] = res.data.items || [];

      if (currentStock !== null && currentStock !== undefined && sortBy === "date" && sortOrder === "desc") {
        let acc = 0;
        setItems(
          fetched.map((item) => {
            const remainingStock = currentStock + acc;
            acc += item.quantity;
            return { ...item, remainingStock };
          })
        );
      } else {
        setItems(fetched);
      }

      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to fetch stock-out records:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setPage(1);
    fetchStockOut();
  };

  const clearFilters = () => {
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
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  // Active filter chips (excluding search — that's inline)
  const activeFilters: ActiveFilter[] = [
    ...(department ? [{ key: "department", label: "Dept", value: department }] : []),
    ...(issuedBy ? [{ key: "issuedBy", label: "Issued By", value: issuedBy }] : []),
    ...(issuedTo ? [{ key: "issuedTo", label: "Issued To", value: issuedTo }] : []),
    ...(purpose ? [{ key: "purpose", label: "Purpose", value: purpose }] : []),
    ...(startDate ? [{ key: "startDate", label: "From", value: startDate }] : []),
    ...(endDate ? [{ key: "endDate", label: "To", value: endDate }] : []),
  ];

  const removeFilter = (key: string) => {
    const map: Record<string, () => void> = {
      department: () => setDepartment(""),
      issuedBy: () => setIssuedBy(""),
      issuedTo: () => setIssuedTo(""),
      purpose: () => setPurpose(""),
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
            placeholder="Search department, issued by/to, purpose…"
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
              { label: "Department", value: department, set: setDepartment, placeholder: "e.g. Maintenance" },
              { label: "Issued By", value: issuedBy, set: setIssuedBy, placeholder: "e.g. Ramesh Kumar" },
              { label: "Issued To", value: issuedTo, set: setIssuedTo, placeholder: "e.g. Machine A" },
              { label: "Purpose", value: purpose, set: setPurpose, placeholder: "e.g. Repair" },
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
                { label: "Department", field: "department" },
                { label: "Issued To", field: "issuedTo" },
                { label: "Issued By", field: "issuedBy" },
                { label: "Purpose", field: "purpose" },
                { label: "Quantity", field: "quantity" },
              ].map(({ label, field }) => (
                <th key={field} className={thClass} onClick={() => handleSort(field)}>
                  {label}
                  <SortIcon field={field} sortBy={sortBy} sortOrder={sortOrder} />
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 whitespace-nowrap">
                Remaining
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <InboxIcon className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-neutral-500">No stock-out records found</p>
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
                    {item.department || <span className="text-neutral-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700">
                    {item.issuedTo || <span className="text-neutral-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700">
                    {item.issuedBy || <span className="text-neutral-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-700 max-w-[180px] truncate">
                    {item.purpose || <span className="text-neutral-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs font-semibold border border-red-100">
                      −{item.quantity} {unit}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.remainingStock !== undefined ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-xs font-semibold border border-green-100">
                        {item.remainingStock} {unit}
                      </span>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
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

export default StockOutTable;