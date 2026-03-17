import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Package,
  TrendingUp,
  AlertCircle,
  X,
  Pencil,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@renderer/api/client";
import StockInTable from "@renderer/components/StockInTable";
import StockOutTable from "@renderer/components/StockOutTable";

interface ProductDetail {
  id: string;
  name: string;
  category?: string;
  unit: string;
  minStock: number;
  image?: string | null;
  refIds: string[];
  machineName?: string | null;
  currentStock: number;
  totalIn: number;
  totalOut: number;
  storageLocation?: string | null; 
}

// ── Page-level skeleton ───────────────────────────────────────────────────────
const PageSkeleton = () => (
  <div className="min-h-screen bg-neutral-50 p-6 md:p-8 animate-pulse">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="h-8 w-48 bg-neutral-200 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="aspect-square w-full bg-neutral-100 rounded-lg mb-6" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 bg-neutral-100 rounded-lg" />
              <div className="h-16 bg-neutral-100 rounded-lg" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-3">
            <div className="h-4 w-32 bg-neutral-100 rounded" />
            <div className="h-10 bg-neutral-100 rounded" />
            <div className="h-10 bg-neutral-100 rounded" />
          </div>
        </div>
        <div className="lg:col-span-8 space-y-4">
          <div className="h-32 bg-neutral-100 rounded-xl" />
          <div className="h-96 bg-white rounded-xl border border-neutral-200" />
        </div>
      </div>
    </div>
  </div>
);

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: "green" | "red";
}) => (
  <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center gap-3">
    <div
      className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${
        color === "green" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
      }`}
    >
      <Icon size={15} />
    </div>
    <div>
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="text-lg font-semibold text-neutral-900">{value}</p>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const ProductDetail = () => {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"all" | "stock_in" | "stock_out">("all");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<ProductDetail>(`/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch product", err);
        setProduct(null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <PageSkeleton />;

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-neutral-400" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">Product not found</h3>
          <p className="text-sm text-neutral-500 mb-6">
            This product doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/products")}
            className="px-4 py-2 bg-[#1B2B4B] hover:bg-[#162240] text-white text-sm font-medium rounded-lg transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const isLowStock = product.currentStock < product.minStock;
  const stockPercent = Math.min(
    Math.round((product.currentStock / Math.max(product.minStock, 1)) * 100),
    100
  );

  return (
    <div className="min-h-screen bg-neutral-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 hover:bg-white rounded-lg transition-colors border border-neutral-200 text-neutral-500 hover:text-neutral-800"
              >
                <ArrowLeft size={16} />
              </button>
              <nav className="flex items-center gap-1.5 text-xs font-medium text-neutral-400">
                <span
                  className="hover:text-neutral-700 cursor-pointer transition-colors"
                  onClick={() => navigate("/products")}
                >
                  Products
                </span>
                <span>/</span>
                <span className="text-neutral-600">{product.category || "General"}</span>
              </nav>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
           
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                isLowStock
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-green-50 text-green-700 border-green-200"
              }`}
            >
              {isLowStock ? "Low Stock" : "In Stock"}
            </span>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Left Sidebar ── */}
          <div className="lg:col-span-4 space-y-5">

            {/* Product image + stats */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <div
                className={`aspect-square w-full bg-neutral-50 rounded-lg overflow-hidden mb-5 flex items-center justify-center relative group ${
                  product.image ? "cursor-zoom-in" : ""
                }`}
                onClick={() => product.image && setIsFullscreen(true)}
              >
                {product.image ? (
                  <img
                    src={`http://localhost:4000${product.image}`}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <Package size={48} className="text-neutral-300" />
                )}
                <div className="absolute top-2.5 right-2.5 bg-white px-2 py-0.5 rounded-md text-xs font-semibold text-neutral-600 border border-neutral-200 shadow-sm">
                  {product.unit}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Total Received"
                  value={product.totalIn}
                  icon={ArrowDownToLine}
                  color="green"
                />
                <StatCard
                  label="Total Issued"
                  value={product.totalOut}
                  icon={ArrowUpFromLine}
                  color="red"
                />
              </div>
            </div>

            {/* Product details */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-900">Product Details</h3>

              <div className="divide-y divide-neutral-100">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-xs font-medium text-neutral-500">Machine</span>
                  <span className="text-xs font-medium text-neutral-800">
                    {product.machineName || "Manual Entry"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-xs font-medium text-neutral-500">Min. Stock Level</span>
                  <span className="text-xs font-semibold text-red-600">
                    {product.minStock} {product.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-xs font-medium text-neutral-500">Category</span>
                  <span className="text-xs font-medium text-neutral-800">
                    {product.category || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
  <span className="text-xs font-medium text-neutral-500">Storage Location</span>
  <span className="text-xs font-medium text-neutral-800">
    {product.storageLocation || "—"}
  </span>
</div>
              </div>

              {product.refIds.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-2">Reference IDs</p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.refIds.map((refId, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-neutral-100 text-neutral-700 text-xs font-mono font-medium rounded border border-neutral-200"
                      >
                        {refId}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Content ── */}
          <div className="lg:col-span-8 space-y-5">

            {/* Stock level card */}
            <div
              className={`p-5 rounded-xl border ${
                isLowStock ? "bg-red-50 border-red-200" : "bg-white border-neutral-200"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p
                    className={`text-xs font-medium mb-1 ${
                      isLowStock ? "text-red-500" : "text-neutral-500"
                    }`}
                  >
                    Current Stock Level
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold text-neutral-900">
                      {product.currentStock}
                    </span>
                    <span className="text-sm font-medium text-neutral-500">{product.unit}s</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {isLowStock ? (
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold">
                      <AlertCircle size={14} />
                      Restock Required
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-[#1B2B4B] text-white rounded-lg text-xs font-semibold">
                      <TrendingUp size={14} />
                      Stock Level Good
                    </div>
                  )}
                  <span className="text-xs text-neutral-400">
                    Min. threshold: {product.minStock} {product.unit}
                  </span>
                </div>
              </div>

              {/* Stock progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
                  <span>0</span>
                  <span>{product.minStock} (min)</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isLowStock ? "bg-red-500" : "bg-green-500"
                    }`}
                    style={{ width: `${stockPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Activity History */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              {/* Tab header */}
              <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">Activity History</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">All stock movements for this product</p>
                </div>

                <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
                  {(
                    [
                      { key: "all", label: "All" },
                      { key: "stock_in", label: "Received" },
                      { key: "stock_out", label: "Issued" },
                    ] as const
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        activeTab === key
                          ? key === "stock_in"
                            ? "bg-green-500 text-white"
                            : key === "stock_out"
                            ? "bg-red-500 text-white"
                            : "bg-[#1B2B4B] text-white"
                          : "text-neutral-500 hover:text-neutral-800"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content — kept mounted to preserve filter state */}
              <div className="p-5 space-y-8">
                <div className={activeTab === "stock_out" ? "hidden" : ""}>
                  {activeTab === "all" && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <h4 className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        Stock In Records
                      </h4>
                    </div>
                  )}
                  <StockInTable productId={id!} unit={product.unit} />
                </div>

                <div className={activeTab === "stock_in" ? "hidden" : ""}>
                  {activeTab === "all" && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <h4 className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                        Stock Out Records
                      </h4>
                    </div>
                  )}
                  <StockOutTable
                    productId={id!}
                    unit={product.unit}
                    currentStock={product.currentStock}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fullscreen image overlay ── */}
      {isFullscreen && product?.image && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(false);
            }}
          >
            <X size={20} />
          </button>
          <img
            src={`http://localhost:4000${product.image}`}
            alt={product.name}
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default ProductDetail;