import React, { useEffect, useState } from "react";
import { ArrowLeft, Package, TrendingUp, AlertCircle } from "lucide-react";
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
}

const ProductDetail = () => {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"all" | "stock_in" | "stock_out">("all");

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm font-medium">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Product not found</h3>
          <p className="text-gray-500 text-sm mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate("/products")}
            className="px-5 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const isLowStock = product.currentStock < product.minStock;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-200"
              >
                <ArrowLeft size={18} className="text-gray-600" />
              </button>
              <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <span>Products</span>
                <span>/</span>
                <span className="text-gray-700">{product.category || "General"}</span>
              </nav>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm">
              Edit Product
            </button>
            <div className={`px-3 py-1.5 rounded-lg font-medium text-xs ${isLowStock
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
              }`}>
              {isLowStock ? "Low Stock" : "In Stock"}
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Product Visual */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="aspect-square w-full bg-gray-50 rounded-lg overflow-hidden mb-6 flex items-center justify-center relative group">
                {product.image ? (
                  <img
                    src={`http://localhost:4000${product.image}`}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <Package size={56} className="text-gray-300" />
                )}
                <div className="absolute top-3 right-3 bg-white px-2.5 py-1 rounded-md text-xs font-medium text-gray-700 border border-gray-200 shadow-sm">
                  {product.unit}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-1">Total Received</p>
                  <p className="text-xl font-semibold text-gray-900">{product.totalIn}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-1">Total Issued</p>
                  <p className="text-xl font-semibold text-gray-900">{product.totalOut}</p>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h3 className="text-base font-semibold text-gray-900">
                Product Details
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Machine</span>
                  <span className="text-sm font-medium text-gray-900">{product.machineName || "Manual Entry"}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Min. Stock Level</span>
                  <span className="text-sm font-semibold text-red-600">{product.minStock} {product.unit}</span>
                </div>
              </div>

              {product.refIds.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-gray-500 mb-2">Reference IDs</p>
                  <div className="flex flex-wrap gap-2">
                    {product.refIds.map((refId, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-100">
                        {refId}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Stock Status */}
            <div className={`p-6 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-6 ${isLowStock
                ? "bg-red-50 border-red-200"
                : "bg-green-50 border-green-200"
              }`}>
              <div className="text-center md:text-left">
                <p className={`text-xs font-medium mb-2 ${isLowStock ? "text-red-600" : "text-green-600"}`}>
                  Current Stock Level
                </p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-5xl font-bold text-gray-900">
                    {product.currentStock}
                  </h2>
                  <span className="text-lg font-medium text-gray-600">
                    {product.unit}s
                  </span>
                </div>
              </div>

              <div>
                {isLowStock ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium shadow-sm text-sm">
                    <AlertCircle size={18} />
                    Restock Required
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm">
                    <TrendingUp size={18} />
                    Stock Level Good
                  </div>
                )}
              </div>
            </div>

            {/* Activity History with Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Activity History</h3>
                    <p className="text-sm text-gray-500">All stock movements</p>
                  </div>

                  <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200">
                    <button
                      onClick={() => setActiveTab("all")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "all" ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveTab("stock_in")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "stock_in" ? 'bg-green-500 text-white' : 'text-gray-600 hover:text-green-600'
                        }`}
                    >
                      Received
                    </button>
                    <button
                      onClick={() => setActiveTab("stock_out")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "stock_out" ? 'bg-red-500 text-white' : 'text-gray-600 hover:text-red-600'
                        }`}
                    >
                      Issued
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {(activeTab === "all" || activeTab === "stock_in") && (
                  <div className={activeTab !== "stock_in" ? "mb-8" : ""}>
                    {activeTab === "all" && (
                      <h4 className="text-sm font-semibold text-gray-900 mb-4">Stock In Records</h4>
                    )}
                    <StockInTable productId={id!} unit={product.unit} />
                  </div>
                )}

                {(activeTab === "all" || activeTab === "stock_out") && (
                  <div>
                    {activeTab === "all" && (
                      <h4 className="text-sm font-semibold text-gray-900 mb-4">Stock Out Records</h4>
                    )}
                    <StockOutTable productId={id!} unit={product.unit} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;