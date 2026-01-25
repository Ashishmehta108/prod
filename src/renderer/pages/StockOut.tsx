import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/shared/Card";
import { api } from "../api/client";
import { Upload, Package, Building, User, Users, FileText, Plus, Search, X, SearchCode, ChevronLeft, ChevronRight } from "lucide-react";
import EmptyProductsState from "@renderer/components/EmptyState";
import { ProductSearchModal } from "../components/ProductSearchModal";

interface ProductOption {
  id: string;
  name: string;
}

interface StockOutRecord {
  _id: string;
  productId: { _id: string; name: string; image?: string };
  quantity: number;
  department?: string;
  issuedBy?: string;
  issuedTo?: string;
  purpose?: string;
  date: string;
}

interface StockOutForm {
  productId: string;
  quantity: number | string;
  department: string;
  issuedBy: string;
  issuedTo: string;
  purpose: string;
}

import { toast } from "sonner";

import { TableSkeleton } from "../components/Skeleton";

const StockOut: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [records, setRecords] = useState<StockOutRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [departments, setDepartments] = useState<string[]>([]);

  const [filters, setFilters] = useState({
    search: "",
    department: "",
    dateFrom: "",
    dateTo: "",
  });

  const [form, setForm] = useState<StockOutForm>({
    productId: "",
    quantity: "",
    department: "",
    issuedBy: "",
    issuedTo: "",
    purpose: "",
  });

  const load = async () => {
    try {
      setDataLoading(true);
      const [prodRes, recRes, depRes] = await Promise.all([
        api.get("/products"),
        api.get("/stock-out", {
          params: {
            search: filters.search || undefined,
            department: filters.department || undefined,
            dateFrom: filters.dateFrom || undefined,
            dateTo: filters.dateTo || undefined,
            page: currentPage,
            limit: itemsPerPage,
          }
        }),
        api.get("/stock-out/departments")
      ]);
      setProducts(prodRes.data.data || prodRes.data);
      setRecords(recRes.data.data);
      setTotalPages(recRes.data.meta?.totalPages || 1);
      setTotalRecords(recRes.data.meta?.total || recRes.data.data.length);
      setDepartments(depRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        load();
      } else {
        setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search, filters.department, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    load();
  }, [currentPage, itemsPerPage]);

  const updateForm = (key: keyof StockOutForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.productId || !form.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    const stockOutPromise = api.post("/stock-out", {
      ...form,
      quantity: Number(form.quantity),
    });

    toast.promise(stockOutPromise, {
      loading: 'Recording stock out...',
      success: () => {
        setForm({
          productId: "",
          quantity: "",
          department: "",
          issuedBy: "",
          issuedTo: "",
          purpose: "",
        });
        load();
        return 'Stock out recorded successfully';
      },
      error: (err) => err.response?.data?.error || 'Failed to record stock out',
    });

    stockOutPromise.finally(() => setLoading(false));
  };

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add('ripple');

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

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
  if (products.length == 0) {
    return <EmptyProductsState />
  }

  return (
    <>
      <style>{`
        .ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: scale(0);
          animation: ripple-animation 0.6s ease-out;
          pointer-events: none;
        }
        
        @keyframes ripple-animation {
          to {
            transform: scale(2);
            opacity: 0;
          }
        }

        .table-row {
          transition: background-color 0.1s ease;
        }

        .table-row:hover {
          background-color: var(--erp-surface-muted);
          cursor: pointer;
        }

        .table-row:nth-child(even) {
          background-color: rgba(249, 250, 251, 0.5);
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,0.9fr] gap-4">
        {/* Stock Out Records */}
        <div className="bg-erp-surface border border-erp-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-erp-border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-erp-surface-muted flex items-center justify-center border border-erp-border">
                  <Upload size={18} className="text-erp-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">Stock Out Records</h3>
                  <p className="text-[11px] text-erp-text-secondary font-medium">
                    {totalRecords} {totalRecords === 1 ? 'record' : 'records'} total
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    className="pl-9 pr-3 py-1.5 text-xs bg-erp-surface-muted border border-erp-border rounded focus:outline-none focus:border-erp-accent transition-all w-full md:w-48 text-neutral-900 placeholder:text-erp-text-secondary"
                    value={filters.search}
                    onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                  />
                </div>

                <div className="relative">
                  <select
                    className="px-3 py-1.5 text-xs bg-erp-surface-muted border border-erp-border rounded focus:outline-none focus:border-erp-accent text-neutral-900 appearance-none pr-8"
                    value={filters.department}
                    onChange={(e) => setFilters(f => ({ ...f, department: e.target.value }))}
                  >
                    <option value="">All Departments</option>
                    {departments.map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                  <Building size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                  />
                  {(filters.search || filters.department || filters.dateFrom || filters.dateTo) && (
                    <button
                      onClick={() => setFilters({ search: "", department: "", dateFrom: "", dateTo: "" })}
                      className="p-1.5 text-erp-text-secondary hover:text-neutral-900 hover:bg-erp-surface-muted rounded transition-colors"
                      title="Clear filters"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-0">
            <div className="max-h-[520px] overflow-y-auto">
              {dataLoading ? (
                <div className="p-4"><TableSkeleton cols={6} rows={8} /></div>
              ) : records.length === 0 ? (
                <div className="text-center py-20 bg-erp-surface">
                  <div className="w-12 h-12 rounded bg-erp-surface-muted flex items-center justify-center mx-auto mb-3 border border-erp-border">
                    <Upload size={24} className="text-erp-accent-muted" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-900">No stock out records</p>
                  <p className="text-xs text-erp-text-secondary mt-1">Record your first issued item</p>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-erp-text-secondary border-b border-erp-border bg-erp-surface-muted/50">
                      <th className="py-3 px-4 text-center font-bold w-12">Img</th>
                      <th className="py-3 px-4 text-left font-bold">Product</th>
                      <th className="py-3 px-4 text-left font-bold">Quantity</th>
                      <th className="py-3 px-4 text-left font-bold">Department</th>
                      <th className="py-3 px-4 text-left font-bold">Issued By</th>
                      <th className="py-3 px-4 text-left font-bold">Issued To</th>
                      <th className="py-3 px-4 text-left font-bold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr
                        key={r._id}
                        className="table-row border-b border-erp-border last:border-0"
                        onClick={() => r.productId?._id && navigate(`/products/${r.productId._id}`)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center">
                            {r.productId?.image ? (
                              <img
                                src={`http://localhost:4000${r.productId.image}`}
                                alt={r.productId.name}
                                className="w-8 h-8 rounded border border-erp-border object-cover bg-white"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-erp-surface-muted flex items-center justify-center border border-erp-border">
                                <Package size={14} className="text-erp-text-secondary" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-semibold text-neutral-900 tracking-tight">
                            {r.productId?.name}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-white text-neutral-900 text-[10px] font-bold border border-erp-border">
                            -{r.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-medium text-erp-text-secondary">{r.department || "-"}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-medium text-erp-text-secondary">{r.issuedBy || "-"}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-medium text-erp-text-secondary">{r.issuedTo || "-"}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-medium text-erp-text-secondary">
                            {new Date(r.date).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!dataLoading && records.length > 0 && totalPages > 1 && (
              <div className="px-5 py-3 border-t border-erp-border bg-erp-surface-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-erp-text-secondary font-medium">Rows per page:</span>
                    <select
                      className="px-2 py-1 text-[11px] bg-erp-surface border border-erp-border rounded focus:outline-none focus:border-erp-accent text-neutral-900"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-erp-text-secondary font-medium">
                      {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded hover:bg-erp-surface border border-erp-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Previous page"
                      >
                        <ChevronLeft size={14} className="text-neutral-900" />
                      </button>

                      {getPageNumbers().map((page, idx) => (
                        page === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-erp-text-secondary">...</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page as number)}
                            className={`min-w-[28px] h-7 px-2 text-[11px] font-medium rounded transition-colors ${currentPage === page
                              ? 'bg-neutral-900 text-white'
                              : 'hover:bg-erp-surface border border-erp-border text-neutral-900'
                              }`}
                          >
                            {page}
                          </button>
                        )
                      ))}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded hover:bg-erp-surface border border-erp-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

        {/* Add Stock Out Form */}
        <div className="bg-erp-surface border border-erp-border rounded-lg overflow-hidden h-fit">
          <div className="px-5 py-4 border-b border-erp-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-erp-surface-muted flex items-center justify-center border border-erp-border">
                <Plus size={18} className="text-erp-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Add Stock Out</h3>
                <p className="text-[11px] text-erp-text-secondary font-medium">Record issued inventory</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Product */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-erp-text-secondary uppercase tracking-wider mb-2">
                  <Package size={12} className="text-erp-accent-muted" />
                  <span>Product</span>
                </label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 bg-erp-surface-muted border border-erp-border rounded px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:bg-erp-surface focus:border-erp-accent transition-colors"
                    value={form.productId}
                    onChange={(e) => updateForm("productId", e.target.value)}
                    required
                  >
                    <option value="">Select a product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsSearchModalOpen(true)}
                    className="p-2 bg-erp-surface-muted border border-erp-border rounded hover:bg-erp-accent/10 hover:border-erp-accent hover:text-erp-accent transition-all group"
                    title="Search products by ID"
                  >
                    <SearchCode size={20} />
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-erp-text-secondary uppercase tracking-wider mb-2">
                  <span>Quantity</span>
                </label>
                <input
                  type="number"
                  className="w-full bg-erp-surface-muted border border-erp-border rounded px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:bg-erp-surface focus:border-erp-accent transition-colors"
                  placeholder="Enter quantity to issue"
                  value={form.quantity}
                  onChange={(e) => updateForm("quantity", e.target.value)}
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-erp-text-secondary uppercase tracking-wider mb-2">
                  <Building size={12} className="text-erp-accent-muted" />
                  <span>Department</span>
                </label>
                <input
                  className="w-full bg-erp-surface-muted border border-erp-border rounded px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:bg-erp-surface focus:border-erp-accent transition-colors"
                  placeholder="e.g. Production, Maintenance"
                  value={form.department}
                  onChange={(e) => updateForm("department", e.target.value)}
                />
              </div>

              {/* Issued By */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-erp-text-secondary uppercase tracking-wider mb-2">
                  <User size={12} className="text-erp-accent-muted" />
                  <span>Issued By</span>
                </label>
                <input
                  className="w-full bg-erp-surface-muted border border-erp-border rounded px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:bg-erp-surface focus:border-erp-accent transition-colors"
                  placeholder="Name of issuer"
                  value={form.issuedBy}
                  onChange={(e) => updateForm("issuedBy", e.target.value)}
                />
              </div>

              {/* Issued To */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-erp-text-secondary uppercase tracking-wider mb-2">
                  <Users size={12} className="text-erp-accent-muted" />
                  <span>Issued To</span>
                </label>
                <input
                  className="w-full bg-erp-surface-muted border border-erp-border rounded px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:bg-erp-surface focus:border-erp-accent transition-colors"
                  placeholder="Name of recipient"
                  value={form.issuedTo}
                  onChange={(e) => updateForm("issuedTo", e.target.value)}
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-erp-text-secondary uppercase tracking-wider mb-2">
                  <FileText size={12} className="text-erp-accent-muted" />
                  <span>Purpose</span>
                </label>
                <input
                  className="w-full bg-erp-surface-muted border border-erp-border rounded px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:bg-erp-surface focus:border-erp-accent transition-colors"
                  placeholder="Reason for issuing"
                  value={form.purpose}
                  onChange={(e) => updateForm("purpose", e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest py-3 rounded hover:bg-black active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.0 h-3.0 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Record Stock Out</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      <ProductSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelect={(id) => updateForm("productId", id)}
      />
    </>
  );
};

export default StockOut;