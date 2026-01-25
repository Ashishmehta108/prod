import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { SearchNormal, Clock, Logout, CloseCircle } from "iconsax-react";
import { useSearch } from "../context/SearchContext";
import { ShimmerItem } from "./shared/Shimmer";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Cpu, Box, Layout, ArrowRight, CornerDownLeft } from "lucide-react";
import Skeleton from "./Skeleton";

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { searchQuery, setSearchQuery, clearSearch } = useSearch();

  const [online, setOnline] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Health check
  useEffect(() => {
    const check = () => {
      api
        .get("/health")
        .then(() => setOnline(true))
        .catch(() => setOnline(false));
    };

    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, []);

  // Search API
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    const delayTimer = setTimeout(() => {
      api
        .get("/products/search", { params: { q: debouncedSearchQuery } })
        .then((res) => {
          setSearchResults(res.data);
          setShowResults(true);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }, 350); // ← delay before fetching

    return () => clearTimeout(delayTimer);
  }, [debouncedSearchQuery]);

  // Close dropdown outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".search-container")) setShowResults(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Ripple logout effect
  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement("span");
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    ripple.classList.add("ripple");

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const handleResultClick = (id: string) => {
    navigate(`/products/${id}`);
    clearSearch();
    setShowResults(false);
  };

  return (
    <>
      <style>{`
        .ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(239,68,68,0.3);
          transform: scale(0);
          animation: ripple-animation 0.6s ease-out;
          pointer-events: none;
        }
        @keyframes ripple-animation {
          to { transform: scale(2); opacity: 0; }
        }
      `}</style>

      <header className="h-16 flex items-center justify-between px-6 bg-erp-surface border-b border-erp-border relative z-50">
        {/* LEFT SECTION */}
        <div className="flex items-center gap-4">
          <h1 className="text-base font-semibold text-neutral-900">
            Inventory Overview
          </h1>
        </div>

        {/* SEARCH SECTION */}
        <div className="flex-1 flex justify-center px-8 search-container">
          <div className="w-full max-w-md relative">
            <div className="relative group">
              <SearchNormal
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-erp-text-secondary z-10"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                placeholder="Search products..."
                className="
                  w-full bg-neutral-100 border border-neutral-100 rounded-lg
                  pl-10 pr-10 py-2 text-sm text-neutral-900
                  placeholder:text-erp-text-secondary
                  focus:outline-none focus:bg-neutral-50 focus:border-neutral-200
                  transition-all duration-200
                "
              />

              {searchQuery && (
                <button
                  onClick={() => {
                    clearSearch();
                    setShowResults(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900"
                >
                  <CloseCircle size={18} />
                </button>
              )}


              {/* 
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )} */}
            </div>

            {/* SEARCH RESULTS */}
            <AnimatePresence>
              {showResults && searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-full mt-2 w-full bg-neutral-50 border border-erp-border rounded-lg overflow-hidden z-[100]"
                >
                  {/* SEARCHING STATE */}
                  {isSearching && (
                    <div className="p-4 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between px-1">
                        <Skeleton className="h-3 w-28 rounded-md" />
                        <Skeleton className="h-3 w-12 rounded-md" />
                      </div>

                      {/* List */}
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="flex gap-4 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors"
                          >
                            <Skeleton className="w-14 h-14 rounded-xl" />

                            <div className="flex-1 space-y-2 py-1">
                              <Skeleton className="h-4 w-3/4 rounded-md" />
                              <Skeleton className="h-3 w-1/2 rounded-md opacity-70" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}


                  {/* RESULTS LIST */}
                  {!isSearching && searchResults.length > 0 && (
                    <div className="p-2.5 max-h-[480px] overflow-y-auto custom-scrollbar bg-white">
                      <div className="flex items-center justify-between px-3 py-2 mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                          Quick Search Results
                        </span>
                        <span className="text-[10px] font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100/50">
                          {searchResults.length} Match{searchResults.length !== 1 ? 'es' : ''}
                        </span>
                      </div>

                      <div className="grid gap-1.5">
                        {searchResults.map((product, idx) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="group flex items-center gap-4 p-3 hover:bg-neutral-50 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:border-neutral-100/80 active:scale-[0.995]"
                            onClick={() => handleResultClick(product.id)}
                          >
                            {/* Product Visual */}
                            <div className="relative w-14 h-14 rounded-xl bg-white border border-neutral-100 overflow-hidden flex-shrink-0 flex items-center justify-center transition-all duration-300">
                              {product.image ? (
                                <img src={product.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
                                  <Package size={20} className="text-neutral-300 group-hover:text-neutral-400 group-hover:scale-110 transition-all" />
                                </div>
                              )}
                              {product.currentStock <= product.minStock && (
                                <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full translate-x-1/3 -translate-y-1/3 shadow-sm" />
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="text-[13px] font-bold text-gray-900 truncate tracking-tight">
                                  {product.name}
                                </h4>
                                {product.machineName && (
                                  <div className="flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100/60 uppercase">
                                    <Cpu size={10} strokeWidth={2.5} />
                                    {product.machineName}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Layout size={10} className="text-gray-400" />
                                  <span className="text-[11px] text-gray-500 truncate font-medium">
                                    {product.category || 'Standard'}
                                  </span>
                                </div>
                                <span className="text-gray-200 font-light">|</span>
                                <div className="flex items-center gap-1.5">
                                  <Box size={10} className="text-gray-400" />
                                  <span className={`text-[11px] font-bold ${product.currentStock <= product.minStock ? 'text-red-500' : 'text-emerald-600'
                                    }`}>
                                    {product.currentStock} {product.unit}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Action Hint */}
                            <div className="flex items-center gap-3 transition-all duration-300">

                              <div className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center">
                                <ArrowRight size={14} strokeWidth={3} className="text-white" />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* EMPTY STATE */}
                  {!isSearching && searchResults.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-6 py-12 text-center bg-white"
                    >
                      <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 bg-neutral-50 rounded-2xl rotate-6 animate-pulse" />
                        <div className="absolute inset-0 bg-neutral-100/50 rounded-2xl -rotate-6" />
                        <div className="relative w-full h-full flex items-center justify-center bg-white border border-neutral-200 rounded-2xl shadow-sm">
                          <SearchNormal size={24} className="text-neutral-300" />
                        </div>
                      </div>
                      <h3 className="text-[14px] font-bold text-gray-900 mb-1">No matches found</h3>
                      <p className="text-xs text-gray-500 max-w-[200px] mx-auto leading-relaxed">
                        We couldn't find any products matching your current search.
                      </p>
                    </motion.div>
                  )}

                  {/* FOOTER */}
                  <div className="bg-erp-surface-muted border-t border-erp-border px-4 py-2 flex justify-between items-center text-[10px] text-erp-text-secondary">
                    <span>Press ESC to close</span>
                    <span>ERP System v1.0</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* {showResults && searchQuery && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 px-2 py-1">
                    {searchResults.length} result
                    {searchResults.length !== 1 && "s"}
                  </div>

                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="px-3 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer"
                      onClick={() => handleResultClick(product.id)}
                    >
                      <div className="flex justify-between">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </div>
                          <span className="text-xs text-gray-500">
                            Stock: {product.currentStock} {product.unit}
                          </span>
                        </div>

                        {product.currentStock < product.minStock && (
                          <span className="px-2 py-0.5 text-xs font-medium text-orange-600 bg-orange-50 rounded">
                            Low
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )} */}
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-erp-text-secondary">
            <Clock size={14} />
            <span>{today}</span>
          </div>

          <div className="flex items-center gap-3 pl-6 border-l border-erp-border">
            <div className="text-right">
              <div className="text-sm font-semibold text-neutral-900">
                {user?.username}
              </div>
              <div className="text-[11px] text-erp-text-secondary font-medium">{user?.email}</div>
            </div>

            <button
              onClick={(e) => {
                logout();
              }}
              className="
                w-9 h-9 border border-erp-border rounded-lg
                flex items-center justify-center text-erp-text-secondary
                hover:bg-erp-surface-muted hover:text-neutral-900
                transition-colors duration-150
              "
            >
              <Logout size={16} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Topbar;
