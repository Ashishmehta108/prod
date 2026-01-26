import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Warning2, Home } from "iconsax-react";
import { api } from "@renderer/api/client";
import StockStatus from "@renderer/components/StockPaginated";
import {
  DashboardData,
} from "@renderer/types/Dashboard.types";
import { DashboardGridSkeleton } from "../components/Skeleton";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      api.get<DashboardData>("/dashboard"),
      new Promise((resolve) => setTimeout(resolve, 800)),
    ])
      .then(([res]) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleRipple = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const ripple = document.createElement("span");
    const rect = card.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.position = "absolute";
    ripple.style.borderRadius = "50%";
    ripple.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
    ripple.style.pointerEvents = "none";
    ripple.style.animation = "ripple-effect 0.6s ease-out";

    card.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  if (loading) {
    return <DashboardGridSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto">
            <Warning2 size={24} className="text-neutral-400" variant="Bulk" />
          </div>
          <p className="text-sm font-medium text-neutral-600">
            No data available
          </p>
          <p className="text-xs text-neutral-500">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-neutral-50/50 px-6 py-6 md:px-8 md:py-7">
      <style>{`
        @keyframes ripple-effect {
          to {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs">
          <Home size={14} className="text-neutral-400" variant="Bold" />
          <span className="text-neutral-400">/</span>
          <span className="text-neutral-600 font-medium">Dashboard</span>
        </nav>

        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-[28px] font-semibold text-neutral-900 tracking-tight leading-none">
            Dashboard Overview
          </h1>
          <p className="text-[13.5px] text-neutral-500 leading-relaxed">
            Monitor your inventory status and key performance metrics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2w gap-5">
          {/* Total Products Card */}
          <div
            className="group relative overflow-hidden bg-white rounded-2xl border border-neutral-200/80 p-7 cursor-pointer transition-all duration-300 hover:shadow-md hover:shadow-neutral-200/50 hover:border-neutral-300 hover:bg-neutral-50/30"
            onClick={handleRipple}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center ring-1 ring-neutral-200/60 group-hover:bg-neutral-200/50 transition-colors duration-300">
                    <Box
                      size={20}
                      className="text-neutral-600"
                      variant="Bulk"
                    />
                  </div>
                  <span className="text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.1em] leading-none">
                    Total Products
                  </span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[36px] font-semibold text-neutral-900 tracking-tight leading-none">
                    {data.totalProducts}
                  </p>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Active inventory items
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Card */}
          <div
            className="group relative overflow-hidden bg-white rounded-2xl border border-neutral-200/80 p-7 cursor-pointer transition-all duration-300 hover:shadow-md hover:shadow-amber-100/50 hover:border-amber-200 hover:bg-amber-50/20"
            onClick={(e) => {
              handleRipple(e);
              navigate("/low-stock");
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center ring-1 ring-amber-100/70 group-hover:bg-amber-100/50 transition-colors duration-300">
                    <Warning2
                      size={20}
                      className="text-amber-600"
                      variant="Bulk"
                    />
                  </div>
                  <span className="text-[10.5px] font-semibold text-neutral-500 uppercase tracking-[0.1em] leading-none">
                    Low Stock
                  </span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[36px] font-semibold text-amber-600 tracking-tight leading-none">
                    {data.lowStockCount}
                  </p>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Below minimum threshold
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <StockStatus
          data={{
            products: data.products.map((p) => ({
              id: p.id,
              name: p.name,
              minStock: p.minStock,
              currentStock: p.currentStock,
            })),
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
