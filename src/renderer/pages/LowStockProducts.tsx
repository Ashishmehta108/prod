import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, ExportSquare, Warning2, Home, Gallery } from "iconsax-react";
import { api } from "@renderer/api/client";
import { ProductListItem } from "src/utils/types/product.types";
import { StatsSkeleton, Skeleton } from "../components/Skeleton";

const LowStockProducts: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const [res] = await Promise.all([
        api.get("/products", {
          params: {
            minStockOnly: true,
            limit: 1000, // Get all low stock products
          },
        }),
        new Promise((resolve) => setTimeout(resolve, 800)),
      ]);
      // Handle both paginated and non-paginated responses
      const data = res.data;
      setProducts(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Product Name",
      "Category",
      "Machine Name",
      "Current Stock",
      "Min Stock",
      "Unit",
      "Ref IDs",
    ];

    const rows = products.map((p) => [
      p.name,
      p.category || "",
      p.machineName || "",
      p.currentStock.toString(),
      p.minStock.toString(),
      p.unit,
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
    link.setAttribute("href", url);
    link.setAttribute("download", "low-stock-products.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalLowStock = products.length;
  const outOfStock = products.filter((p) => p.currentStock <= 0).length;

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
              disabled={loading || products.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ExportSquare size={18} variant="Outline" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        {loading ? (
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
                  {totalLowStock}
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
                  {outOfStock}
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
                {Array.from({ length: 5 }).map((_, i) => (
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
                      className="hover:bg-neutral-50/70 transition-colors"
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
          )}
        </div>
      </div>
    </div>
  );
};

export default LowStockProducts;
