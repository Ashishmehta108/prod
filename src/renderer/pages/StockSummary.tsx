import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Package, X, SearchCode, ChevronLeft, ChevronRight, FileDown, Download } from "lucide-react";
import { Home, Calendar, TrendUp, TrendDown, MinusCirlce } from "iconsax-react";
import { api } from "@renderer/api/client";
import { ProductListItem } from "src/utils/types/product.types";
import { Skeleton } from "../components/Skeleton";
import { ProductSearchModal } from "../components/ProductSearchModal";
import { toast } from "sonner";
import Ripple from "../components/shared/Ripple";
import { getTodayISTForInput, inputDateToISOIST, inputDateToEndOfDayIST } from "../utils/dateUtils";

interface StockSummaryItem {
  productId: string;
  productName: string;
  image?: string;
  unit: string;
  totalStockInInRange: number;
  totalStockOutInRange: number;
  currentAvailableStock: number;
}

const StockSummary: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [summaryData, setSummaryData] = useState<StockSummaryItem[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    // Use IST date so midnight window doesn't shift the default date
    const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
    return istDate.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => {
    return getTodayISTForInput();
  });
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProductName, setSelectedProductName] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);

  const totals = React.useMemo(() => {
    const totalStockIn = summaryData.reduce((sum, item) => sum + item.totalStockInInRange, 0);
    const totalStockOut = summaryData.reduce((sum, item) => sum + item.totalStockOutInRange, 0);
    const netMovement = totalStockIn - totalStockOut;
    return { totalStockIn, totalStockOut, netMovement };
  }, [summaryData]);
  const totalPages = Math.ceil(summaryData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = useMemo(() => {
    return summaryData.slice(startIndex, endIndex);
  }, [summaryData, startIndex, endIndex]);
  useEffect(() => {
    setCurrentPage(1);
  }, [summaryData.length]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showMax = 5;

    if (totalPages <= showMax) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data.map((c: any) => c.name));
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      const data = res.data.data || res.data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  const fetchSummary = async () => {
    if (!fromDate || !toDate) {
      return;
    }

    try {
      setLoading(true);
      const params: any = {
        from: inputDateToISOIST(fromDate),
        to: inputDateToEndOfDayIST(toDate),
      };

      if (selectedProductId) {
        params.productId = selectedProductId;
      }

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      const res = await api.get<StockSummaryItem[]>("/stock/summary", { params });
      setSummaryData(res.data);
    } catch (err: any) {
      console.error("Failed to fetch stock summary:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSummary();
  };

  const handleClearFilters = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
    setFromDate(istDate.toISOString().split("T")[0]);
    setToDate(getTodayISTForInput());
    setSelectedProductId("");
    setSelectedProductName("");
    setSelectedCategory("");
    setTimeout(() => fetchSummary(), 100);
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find((p) => p.id === productId);
    if (product) {
      setSelectedProductName(product.name);
    }
  };

  const handleClearProduct = () => {
    setSelectedProductId("");
    setSelectedProductName("");
  };

  // ── CSV helpers ──────────────────────────────────────────────────
  const buildSummaryCSV = (items: StockSummaryItem[]) => {
    const headers = ["Product Name", "Unit", "Stock In (Range)", "Stock Out (Range)", "Current Stock", "Status"];
    const rows = items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      const minStock = product?.minStock || 0;
      const status = item.currentAvailableStock <= 0 ? "Out of Stock" : item.currentAvailableStock <= minStock ? "Low Stock" : "Healthy";
      return [
        item.productName,
        item.unit,
        item.totalStockInInRange.toString(),
        item.totalStockOutInRange.toString(),
        item.currentAvailableStock.toString(),
        status,
      ];
    });
    return [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
  };

  const downloadSummaryCSV = (csv: string, filename: string) => {
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

  // Export only this page's rows (paginatedData slice)
  const handleExportPage = () => {
    if (!paginatedData.length) return;
    const dateRange = `${fromDate}_to_${toDate}`;
    downloadSummaryCSV(buildSummaryCSV(paginatedData), `stock-summary-page${currentPage}-${dateRange}.csv`);
    toast.success(`Exported ${paginatedData.length} rows from page ${currentPage}`);
  };

  // Export ALL rows regardless of pagination
  const handleExportAll = () => {
    if (!summaryData.length) return;
    const categorySuffix = selectedCategory ? `-${selectedCategory.replace(/\s+/g, "_")}` : "";
    const dateRange = `${fromDate}_to_${toDate}`;
    downloadSummaryCSV(buildSummaryCSV(summaryData), `stock-summary${categorySuffix}-${dateRange}.csv`);
    toast.success(`Exported ${summaryData.length} products`);
  };

  const getStockBadge = (item: StockSummaryItem) => {
    // Find product to get minStock
    const product = products.find((p) => p.id === item.productId);
    const minStock = product?.minStock || 0;

    if (item.currentAvailableStock <= 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200/60">
          Out of stock
        </span>
      );
    }
    if (item.currentAvailableStock <= minStock) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
          Low stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200/60">
        Healthy
      </span>
    );
  };

  return (
    <>
      <div className="min-h-full bg-neutral-50/50 px-6 py-6 md:px-8 md:py-7">
        <div className="max-w-[1400px] mx-auto space-y-8">

          <nav className="flex items-center gap-2 text-xs">
            <Home
              size={14}
              className="text-neutral-400 cursor-pointer hover:text-neutral-600 transition-colors"
              variant="Bold"
              onClick={() => navigate("/")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate("/");
                }
              }}
            />
            <span className="text-neutral-400">/</span>
            <span className="text-neutral-600 font-medium">Stock Summary</span>
          </nav>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-[28px] font-semibold text-neutral-900 tracking-tight leading-none">
                Stock Summary
              </h1>
              <p className="text-[13.5px] text-neutral-500 leading-relaxed">
                Track stock movement within a selected time period
              </p>
            </div>
            {summaryData.length > 0 && (
              <div className="flex items-center gap-2">
                {/* Export This Page */}
                <button
                  onClick={handleExportPage}
                  disabled={loading || paginatedData.length === 0}
                  title="Export current page only"
                  className="relative overflow-hidden inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 text-sm font-medium rounded-xl hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <Ripple />
                  <FileDown size={16} />
                  This Page
                </button>

                {/* Export All */}
                <button
                  onClick={handleExportAll}
                  disabled={loading || summaryData.length === 0}
                  title="Export all rows (all pages)"
                  className="relative overflow-hidden inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <Ripple color="rgba(255,255,255,0.15)" />
                  <Download size={16} />
                  Export All ({summaryData.length})
                </button>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-neutral-200/80 shadow-sm p-6">
            <form onSubmit={handleApplyFilter} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                    <Calendar size={12} className="text-neutral-400" variant="Outline" />
                    <span>From Date</span>
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:border-neutral-300 text-neutral-900 transition-all"
                    required
                  />
                </div>

                {/* To Date */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                    <Calendar size={12} className="text-neutral-400" variant="Outline" />
                    <span>To Date</span>
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:border-neutral-300 text-neutral-900 transition-all"
                    required
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                    <Package size={12} className="text-neutral-400" />
                    <span>Category (Optional)</span>
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:border-neutral-300 text-neutral-900 transition-all appearance-none"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Filter */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                    <Package size={12} className="text-neutral-400" />
                    <span>Product (Optional)</span>
                  </label>
                  <div className="flex gap-2">
                    {selectedProductId ? (
                      <div className="flex-1 flex items-center justify-between px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg">
                        <span className="text-sm text-neutral-900 font-medium truncate">
                          {selectedProductName}
                        </span>
                        <button
                          type="button"
                          onClick={handleClearProduct}
                          className="ml-2 p-1 hover:bg-neutral-200 rounded transition-colors"
                          title="Clear product selection"
                        >
                          <X size={16} className="text-neutral-500" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1 px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-500">
                        All Products
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsSearchModalOpen(true)}
                      className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100 hover:border-neutral-300 transition-all"
                      title="Search products"
                    >
                      <SearchCode size={20} className="text-neutral-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Apply Filter
                </button>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-5 py-2.5 bg-neutral-100 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </form>
          </div>

          {/* Summary Cards */}
          {summaryData.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Total Stock In */}
              <div className="bg-white rounded-xl border border-neutral-200/80 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200/60">
                    <TrendUp size={20} className="text-slate-600" variant="Outline" />
                  </div>
                  <span className="text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.1em]">
                    Total Stock In
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[32px] font-semibold text-neutral-900 tracking-tight leading-none">
                    {totals.totalStockIn.toLocaleString()}
                  </p>
                  <p className="text-xs text-neutral-500">In selected period</p>
                </div>
              </div>

              {/* Total Stock Out */}
              <div className="bg-white rounded-xl border border-neutral-200/80 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200/60">
                    <TrendDown size={20} className="text-slate-600" variant="Outline" />
                  </div>
                  <span className="text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.1em]">
                    Total Stock Out
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[32px] font-semibold text-neutral-900 tracking-tight leading-none">
                    {totals.totalStockOut.toLocaleString()}
                  </p>
                  <p className="text-xs text-neutral-500">In selected period</p>
                </div>
              </div>

              {/* Net Movement */}
              <div className="bg-white rounded-xl border border-neutral-200/80 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200/60">
                    <MinusCirlce size={20} className="text-slate-600" variant="Outline" />
                  </div>
                  <span className="text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.1em]">
                    Net Movement
                  </span>
                </div>
                <div className="space-y-1">
                  <p
                    className={`text-[32px] font-semibold tracking-tight leading-none ${totals.netMovement >= 0 ? "text-slate-700" : "text-red-600"
                      }`}
                  >
                    {totals.netMovement >= 0 ? "+" : ""}
                    {totals.netMovement.toLocaleString()}
                  </p>
                  <p className="text-xs text-neutral-500">Stock In − Stock Out</p>
                </div>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="bg-white rounded-xl border border-neutral-200/80 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-6">
                <div className="w-full space-y-4">
                  <div className="flex space-x-4 border-b border-neutral-200/60 pb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 flex-1" />
                    ))}
                  </div>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex space-x-4 py-4 border-b border-neutral-100 last:border-0"
                    >
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Skeleton key={j} className="h-4 flex-1" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : summaryData.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-neutral-200/60">
                  <Package size={32} className="text-neutral-300" />
                </div>
                <h3 className="text-base font-medium text-neutral-900 mb-1">
                  No stock movement found
                </h3>
                <p className="text-sm text-neutral-500">
                  {fromDate && toDate
                    ? `No stock movement found in this period. Try adjusting your date range.`
                    : "Select a date range and click 'Apply Filter' to view stock summary."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200/60 sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Stock In (Range)
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Stock Out (Range)
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Current Stock
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/60">
                    {paginatedData.map((item) => (
                      <tr
                        key={item.productId}
                        className="hover:bg-neutral-50/70 transition-colors"
                      >
                        <td
                          className="px-5 py-4 cursor-pointer group/item"
                          onClick={() => navigate(`/products/${item.productId}`)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 flex-shrink-0 border border-neutral-200/60 rounded-lg overflow-hidden bg-neutral-50 shadow-sm transition-transform group-hover/item:scale-105">
                              {item.image ? (
                                <img
                                  src={`http://localhost:4000${item.image}`}
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                  <Package size={20} />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-neutral-900 group-hover/item:text-blue-600 transition-colors">
                                {item.productName}
                              </div>
                              <div className="mt-1">{getStockBadge(item)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-neutral-700">
                          {item.unit}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm font-semibold text-neutral-900">
                            {item.totalStockInInRange.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm font-semibold text-neutral-900">
                            {item.totalStockOutInRange.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm font-semibold text-neutral-900">
                            {item.currentAvailableStock.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {summaryData.length > 0 && totalPages > 1 && (
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
                      {startIndex + 1}-{Math.min(endIndex, summaryData.length)} of {summaryData.length}
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
            )}
          </div>
        </div>
      </div>

      {/* Product Search Modal */}
      <ProductSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelect={handleProductSelect}
      />
    </>
  );
};

export default StockSummary;
