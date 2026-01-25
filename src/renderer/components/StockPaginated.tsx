import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight2 } from "iconsax-react";

const ITEMS_PER_PAGE = 6;

const stockData: StockData = {
  products: [
    {
      id: "1",
      name: "Cable 2.5mm",
      minStock: 20,
      currentStock: 12,
    },
    {
      id: "2",
      name: "Switch 16A",
      minStock: 50,
      currentStock: 60,
    },
  ],
};

export interface Product {
  id: string;
  name: string;
  minStock: number;
  currentStock: number;
}
export interface StockData {
  products: Product[];
}
interface StockStatusProps {
  data: StockData;
}

export default function StockStatus({ data }: StockStatusProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = data.products.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(data.products.length / ITEMS_PER_PAGE);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-7 py-6 border-b border-neutral-200 bg-neutral-50/60">
        <h2 className="text-base font-semibold text-neutral-800">
          Stock Status
        </h2>
        <p className="text-xs text-neutral-500 mt-2">
          Current stock levels compared to minimum requirements
        </p>
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[520px] overflow-y-auto pr-1">
          {paginatedProducts.map((product) => {
            const isLowStock = product.currentStock < product.minStock;
            const stockPercentage = Math.min(
              (product.currentStock / product.minStock) * 100,
              100
            );

            return (
              <div
                key={product.id}
                onClick={() => navigate(`/products/${product.id}`)}
                className="group relative bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl p-5 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="flex flex-col gap-3">
                  {/* Title Row */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        isLowStock ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                    />
                    <p className="font-medium text-neutral-800 text-sm truncate">
                      {product.name}
                    </p>
                  </div>

                  {/* Min / Current */}
                  <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                    <span>
                      Min:{" "}
                      <span className="font-semibold text-neutral-700">
                        {product.minStock}
                      </span>
                    </span>
                    <span className="text-neutral-300">•</span>
                    <span>
                      Current:{" "}
                      <span
                        className={`font-semibold ${
                          isLowStock ? "text-amber-600" : "text-emerald-600"
                        }`}
                      >
                        {product.currentStock}
                      </span>
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isLowStock ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${stockPercentage}%` }}
                    />
                  </div>

                  {/* Status + Arrow */}
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-[10.5px] font-semibold ${
                        isLowStock
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      }`}
                    >
                      {isLowStock ? "Low Stock" : "In Stock"}
                    </span>

                    <ArrowRight2
                      size={16}
                      className="text-neutral-400 group-hover:text-neutral-600 group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-5 pt-3 border-t border-neutral-200">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 text-xs rounded-lg border bg-neutral-50 hover:bg-neutral-100 disabled:opacity-40"
          >
            Previous
          </button>

          <p className="text-xs text-neutral-500">
            Page {page} of {totalPages}
          </p>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 text-xs rounded-lg border bg-neutral-50 hover:bg-neutral-100 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
