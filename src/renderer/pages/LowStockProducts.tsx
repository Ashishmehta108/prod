import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, ExportSquare, Warning2, Home, Gallery } from "iconsax-react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { api } from "@renderer/api/client";
import { ProductListItem } from "src/utils/types/product.types";
import { Skeleton } from "../components/Skeleton";
import { toast } from "sonner";
import Ripple from "../components/shared/Ripple";
import { getISTDateString } from "../utils/dateUtils";

const ITEMS_PER_PAGE = 15;

const LowStockProducts: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalOutOfStock, setTotalOutOfStock] = useState(0);

  useEffect(() => {
    loadProducts(currentPage);
  }, [currentPage]);

  const loadProducts = async (page: number) => {
    try {
      setLoading(true);
      const res = await api.get("/products", {
        params: {
          minStockOnly: true,
          page,
          limit: ITEMS_PER_PAGE,
        },
      });
      const data = res.data;
      const items: ProductListItem[] = Array.isArray(data) ? data : data?.data || [];
      setProducts(items);

      if (data?.meta) {
        setTotalPages(data.meta.totalPages || 1);
        setTotalRecords(data.meta.total || 0);
      }

      // Fetch out-of-stock count separately only on first load
      if (page === 1) {
        try {
          const oos = await api.get("/products", {
            params: { outOfStock: true, limit: 1, page: 1 },
          });
          setTotalOutOfStock(oos.data?.meta?.total ?? 0);
        } catch {
          // fallback: count from current page
          setTotalOutOfStock(items.filter((p) => p.currentStock <= 0).length);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load low stock products");
    } finally {
      setLoading(false);
    }
  };

  // ─── Excel Export: fetches ALL data via dedicated export endpoint ─────────
  const handleExportCSV = async () => {
    try {
      setExportLoading(true);
      const res = await api.get("/products/low-stock/export");
      const allProducts: ProductListItem[] = res.data?.data || [];

      if (allProducts.length === 0) {
        toast.info("No low stock products to export.");
        return;
      }

      const headers = [
        "Product Name",
        "Category",
        "Machine Name",
        "Current Stock",
        "Min Stock",
        "Unit",
        "Status",
        "Ref IDs",
      ];

      const rows = allProducts.map((p) => [
        p.name,
        p.category || "",
        p.machineName || "",
        p.currentStock.toString(),
        p.minStock.toString(),
        p.unit,
        p.currentStock <= 0 ? "Out of Stock" : "Low Stock",
        p.refIds?.join(", ") || "",
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
      link.setAttribute("download", `low-stock-products-${dateStr}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allProducts.length} products successfully!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to export products");
    } finally {
      setExportLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getPageNumbers = () => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | "...")[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) rangeWithDots.push(1, "...");
    else rangeWithDots.push(1);

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) rangeWithDots.push("...", totalPages);
    else if (totalPages > 1) rangeWithDots.push(totalPages);

    return rangeWithDots;
  };

  const getStockBadge = (product: ProductListItem) => {
    if (product.currentStock <= 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200/60">
          Out of stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-200/60 text-neutral-700">
        Low
      </span>
    );
  };

  const truncateRefIds = (refIds: string[], maxLength: number = 30) => {
    const joined = refIds.join(", ");
    if (joined.length <= maxLength) return joined;
    return joined.substring(0, maxLength) + "...";
  };

  return (
    <div className="min-h-full bg-neutral-50 px-6 py-6 md:px-8 md:py-7">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
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
          <span className="text-neutral-600 font-medium">Low Stock Products</span>
        </nav>

        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
                Low Stock Products
              </h1>
              <p className="text-sm text-neutral-500">
                Products that have reached or fallen below minimum stock level
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={exportLoading || loading || totalRecords === 0}
              className="relative overflow-hidden inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Ripple color="rgba(255,255,255,0.15)" />
              {exportLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ExportSquare size={18} variant="Outline" />
              )}
              {exportLoading ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        {loading && currentPage === 1 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-neutral-200/70 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <Skeleton className="w-16 h-4" />
                </div>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Low Stock Items */}
            <div className="bg-white border border-neutral-200/70 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center border border-neutral-200/60">
                  <Warning2
                    size={20}
                    className="text-neutral-600"
                    variant="Outline"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-semibold text-neutral-900 tracking-tight">
                  {totalRecords}
                </p>
                <p className="text-xs text-neutral-500">Total Low Stock Items</p>
              </div>
            </div>

            {/* Out of Stock Items */}
            <div className="bg-white border border-neutral-200/70 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center border border-neutral-200/60">
                  <Box
                    size={20}
                    className="text-neutral-600"
                    variant="Outline"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-semibold text-neutral-900 tracking-tight">
                  {totalOutOfStock}
                </p>
                <p className="text-xs text-neutral-500">Out of Stock Items</p>
              </div>
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6">
              <div className="w-full space-y-4">
                <div className="flex space-x-4 border-b border-neutral-200/60 pb-4">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                  ))}
                </div>
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <div
                    key={i}
                    className="flex space-x-4 py-4 border-b border-neutral-100 last:border-0"
                  >
                    {Array.from({ length: 7 }).map((_, j) => (
                      <Skeleton key={j} className="h-4 flex-1" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-neutral-200/60">
                <Box size={32} className="text-neutral-300" variant="Outline" />
              </div>
              <h3 className="text-base font-medium text-neutral-900 mb-1">
                No low stock products
              </h3>
              <p className="text-sm text-neutral-500">
                All products are currently above their minimum stock levels
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200/60">
                      <th className="px-5 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Machine Name
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Current Stock
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Min Stock
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Ref IDs
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/60">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-neutral-50/70 transition-colors cursor-pointer"
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {product.image ? (
                              <img
                                src={
                                  product.image.startsWith("http")
                                    ? product.image
                                    : `http://localhost:4000${product.image}`
                                }
                                alt={product.name}
                                className="w-10 h-10 rounded-xl object-cover border border-neutral-200/60 shadow-sm"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-200/60">
                                <Gallery
                                  size={16}
                                  className="text-neutral-300"
                                  variant="Outline"
                                />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-neutral-900">
                                {product.name}
                              </div>
                              <div className="mt-1">{getStockBadge(product)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-neutral-700">
                          {product.category || "—"}
                        </td>
                        <td className="px-5 py-4 text-sm text-neutral-700">
                          {product.machineName || "—"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm font-semibold text-neutral-900">
                            {product.currentStock}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm text-neutral-500">
                            {product.minStock}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-neutral-700">
                          {product.unit}
                        </td>
                        <td className="px-5 py-4">
                          {product.refIds && product.refIds.length > 0 ? (
                            <div
                              className="text-sm text-neutral-600 max-w-xs truncate"
                              title={product.refIds.join(", ")}
                            >
                              {truncateRefIds(product.refIds)}
                            </div>
                          ) : (
                            <span className="text-sm text-neutral-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Strip */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/30 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest tabular-nums font-mono">
                    Showing{" "}
                    {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalRecords)}
                    –{Math.min(currentPage * ITEMS_PER_PAGE, totalRecords)} of{" "}
                    {totalRecords} Products
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
                      {getPageNumbers().map((page, i) =>
                        page === "..." ? (
                          <span
                            key={`dots-${i}`}
                            className="min-w-[32px] h-8 flex items-center justify-center text-[11px] text-neutral-400"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page as number)}
                            className={`min-w-[32px] h-8 text-[11px] font-bold rounded-lg transition-all ${currentPage === page
                              ? "bg-neutral-900 text-white shadow-md"
                              : "text-neutral-500 hover:bg-white border border-transparent hover:border-neutral-200"
                              }`}
                          >
                            {page}
                          </button>
                        )
                      )}
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LowStockProducts;
