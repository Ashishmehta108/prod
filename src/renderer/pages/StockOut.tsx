import React, { useEffect, useState } from "react";
import { z } from "zod";
import { api } from "../api/client";
import {
  Package,
  ArrowUp,
  SearchCode,
  Calendar,
  Building2,
  User,
  Info,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import EmptyProductsState from "@renderer/components/EmptyState";
import { ProductSearchModal } from "../components/ProductSearchModal";
import Ripple from "../components/shared/Ripple";
import { useAuth } from "../context/AuthContext";

interface ProductOption {
  id: string;
  name: string;
}

interface StockOutForm {
  productId: string;
  quantity: string;
  department: string;
  issuedBy: string;
  issuedTo: string;
  purpose: string;
  date: string;
}

const stockOutSchema = z.object({
  productId: z.string().min(1, "Product selection is required"),
  quantity: z.string().min(1, "Quantity is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Quantity must be a positive number",
  }),
  department: z.string().trim().min(1, "Department is required"),
  issuedBy: z.string().trim().min(1, "Issuer name is required"),
  issuedTo: z.string().trim().min(1, "Recipient name is required"),
  purpose: z.string().trim().min(1, "Purpose/Remarks is required"),
  date: z.string().min(1, "Transaction date is required"),
});

const StockOut: React.FC = () => {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [deptSuggestions, setDeptSuggestions] = useState<string[]>([]);
  const [showDeptList, setShowDeptList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedProductStock, setSelectedProductStock] = useState<number | null>(null);
  const [selectedProductUnit, setSelectedProductUnit] = useState<string>("");
  const [errors, setErrors] = useState<Partial<Record<keyof StockOutForm, string>>>({});

  const { user } = useAuth();

  const [form, setForm] = useState<StockOutForm>({
    productId: "",
    quantity: "",
    department: "",
    issuedBy: user?.username || "",
    issuedTo: "",
    purpose: "",
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user?.username && !form.issuedBy) {
      setForm(f => ({ ...f, issuedBy: user.username }));
    }
  }, [user]);

  const load = async () => {
    try {
      setDataLoading(true);
      const [prodRes, depRes] = await Promise.all([
        api.get("/products"),
        api.get("/stock-out/departments"),
      ]);
      setProducts(prodRes.data.data || prodRes.data);
      setDeptSuggestions(depRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateForm = (key: keyof StockOutForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleProductChange = (value: string) => {
    updateForm("productId", value);
    if (!value) {
      setSelectedProductStock(null);
      setSelectedProductUnit("");
      return;
    }
    api.get(`/products/${value}`)
      .then((res) => {
        setSelectedProductStock(res.data.currentStock ?? null);
        setSelectedProductUnit(res.data.unit ?? "");
      })
      .catch((err) => {
        console.error("Failed to fetch product stock:", err);
        setSelectedProductStock(null);
        setSelectedProductUnit("");
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = stockOutSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof StockOutForm, string>> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof StockOutForm;
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Please fix the validation errors");
      return;
    }

    if (selectedProductStock !== null && Number(form.quantity) > selectedProductStock) {
      setErrors(prev => ({ ...prev, quantity: `Insufficient stock. Only ${selectedProductStock} available.` }));
      toast.error(`Insufficient stock. Only ${selectedProductStock} available.`);
      return;
    }

    setLoading(true);
    setErrors({});

    const stockOutPromise = api.post("/stock-out", {
      ...form,
      quantity: Number(form.quantity)
    });

    toast.promise(stockOutPromise, {
      loading: 'Recording stock out...',
      success: () => {
        setForm({
          productId: "",
          quantity: "",
          department: "",
          issuedBy: user?.username || "",
          issuedTo: "",
          purpose: "",
          date: new Date().toISOString().split('T')[0],
        });
        setSelectedProductStock(null);
        setSelectedProductUnit("");
        load();
        return 'Stock out recorded successfully';
      },
      error: (err) => err.response?.data?.error || 'Failed to record stock out',
    });
    try {
      await stockOutPromise;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (products.length === 0 && !dataLoading) {
    return <EmptyProductsState />
  }

  const isOutOfStock = selectedProductStock !== null && selectedProductStock <= 0;
  const hasInsufficientStock = selectedProductStock !== null && Number(form.quantity) > selectedProductStock && form.quantity !== "";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight mb-1">
          Stock Out
        </h1>
        <p className="text-sm text-neutral-500">
          Record outgoing inventory and track departmental consumption
        </p>
      </div>

      {/* Main Form Container */}
      <div className="bg-white border border-neutral-300">
        {/* Form Header */}
        <div className="border-b border-neutral-300 bg-neutral-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-neutral-900 flex items-center justify-center">
              <ArrowUp size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">New Issuance Entry</h2>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mt-0.5">
                Inventory Operations
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Product & Quantity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Selection */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  <Package size={13} className="text-neutral-500" />
                  Product <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    className={`flex-1 h-10 bg-neutral-50 border ${errors.productId ? 'border-red-500' : 'border-neutral-300'} px-3 text-sm text-neutral-900 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors`}
                    value={form.productId}
                    onChange={(e) => handleProductChange(e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsSearchModalOpen(true)}
                    className={`h-10 w-10 border ${errors.productId ? 'border-red-500' : 'border-neutral-300'} bg-white hover:bg-neutral-50 hover:border-neutral-400 transition-colors flex items-center justify-center active:scale-98`}
                  >
                    <SearchCode size={18} className="text-neutral-600" />
                  </button>
                </div>
                {errors.productId && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.productId}</p>}
                {selectedProductStock !== null && form.productId && (
                  <div className={`px-3 py-2 border flex items-center justify-between text-xs ${isOutOfStock
                    ? 'bg-neutral-100 border-neutral-400'
                    : 'bg-neutral-100 border-neutral-300'
                    }`}>
                    <span className="text-neutral-600 uppercase tracking-wider font-medium">
                      Stock Available
                    </span>
                    <span className={`font-semibold ${isOutOfStock ? 'text-neutral-900' : 'text-neutral-900'
                      }`}>
                      {selectedProductStock} {selectedProductUnit}
                    </span>
                  </div>
                )}
                {isOutOfStock && (
                  <div className="px-3 py-2 bg-neutral-800 border border-neutral-900 text-xs text-white">
                    <span className="uppercase tracking-wider font-medium">
                      Out of stock - cannot issue
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  <ArrowUp size={13} className="text-neutral-500" />
                  Quantity to Issue <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className={`w-full h-10 bg-neutral-50 border ${errors.quantity ? 'border-red-500' : 'border-neutral-300'} px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors`}
                  placeholder="Enter quantity"
                  value={form.quantity}
                  onChange={(e) => updateForm("quantity", e.target.value)}
                />
                {errors.quantity && (
                  <div className="px-3 py-2 bg-neutral-800 border border-neutral-900 text-xs text-white">
                    <span className="uppercase tracking-wider font-medium">
                      {errors.quantity}
                    </span>
                  </div>
                )}
                {hasInsufficientStock && (
                  <div className="px-3 py-2 bg-neutral-800 border border-neutral-900 text-xs text-white">
                    <span className="uppercase tracking-wider font-medium">
                      Insufficient stock - only {selectedProductStock} available
                    </span>
                  </div>
                )}
                {!hasInsufficientStock && (
                  <p className="text-xs text-neutral-500">
                    Stock levels will decrease by this amount
                  </p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-200" />

            {/* Department & Recipient Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department */}
              <div className="space-y-2 relative">
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  <Building2 size={13} className="text-neutral-500" />
                  Target Department <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full h-10 bg-neutral-50 border ${errors.department ? 'border-red-500' : 'border-neutral-300'} px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors`}
                  placeholder="Enter or search department"
                  value={form.department}
                  onFocus={() => setShowDeptList(true)}
                  onBlur={() => setTimeout(() => setShowDeptList(false), 200)}
                  onChange={(e) => { updateForm("department", e.target.value); setShowDeptList(true); }}
                />
                {errors.department && <p className="text-[10px] text-red-500 font-medium ml-1 mt-1">{errors.department}</p>}
                {showDeptList && deptSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-300 max-h-48 overflow-auto">
                    {deptSuggestions
                      .filter(s => s.toLowerCase().includes(form.department.toLowerCase()))
                      .map(s => (
                        <div
                          key={s}
                          className="px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 cursor-pointer transition-colors"
                          onMouseDown={() => { updateForm("department", s); setShowDeptList(false); }}
                        >
                          {s}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Issued To */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  <User size={13} className="text-neutral-500" />
                  Issued To / Recipient <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full h-10 bg-neutral-50 border ${errors.issuedTo ? 'border-red-500' : 'border-neutral-300'} px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors`}
                  placeholder="Employee name or ID"
                  value={form.issuedTo}
                  onChange={(e) => updateForm("issuedTo", e.target.value)}
                />
                {errors.issuedTo && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.issuedTo}</p>}
              </div>

              {/* Issued By */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  <User size={13} className="text-neutral-500" />
                  Issued By / Issuer <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full h-10 bg-neutral-50 border ${errors.issuedBy ? 'border-red-500' : 'border-neutral-300'} px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors`}
                  placeholder="Issuer name"
                  value={form.issuedBy}
                  onChange={(e) => updateForm("issuedBy", e.target.value)}
                />
                {errors.issuedBy && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.issuedBy}</p>}
              </div>
            </div>

            {/* Purpose & Date Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Purpose */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  <Info size={13} className="text-neutral-500" />
                  Purpose / Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  className={`w-full bg-neutral-50 border ${errors.purpose ? 'border-red-500' : 'border-neutral-300'} px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors resize-none`}
                  placeholder="e.g. Maintenance Work, Project X"
                  value={form.purpose}
                  onChange={(e) => updateForm("purpose", e.target.value)}
                />
                {errors.purpose && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.purpose}</p>}
              </div>

              {/* Transaction Date */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  <Calendar size={13} className="text-neutral-500" />
                  Transaction Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className={`w-full h-10 bg-neutral-50 border ${errors.date ? 'border-red-500' : 'border-neutral-300'} px-3 text-sm text-neutral-900 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors`}
                  value={form.date}
                  onChange={(e) => updateForm("date", e.target.value)}
                />
                {errors.date && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.date}</p>}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 pt-6 border-t border-neutral-200">
            <button
              type="submit"
              disabled={loading || isOutOfStock}
              className="relative w-full h-12 bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden"
            >
              <Ripple color="rgba(255, 255, 255, 0.15)" />
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <ArrowUp size={18} />
                  <span className="text-sm font-medium uppercase tracking-wider">
                    Record Stock Out
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <ProductSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelect={(id) => handleProductChange(id)}
      />
    </div>
  );
};

export default StockOut;