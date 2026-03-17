import React, { useEffect, useState } from "react";
import { z } from "zod";
import { api } from "../api/client";
import { getTodayISTForInput, inputDateToISOIST } from "../utils/dateUtils";
import {
  Package,
  ArrowUp,
  SearchCode,
  Calendar,
  Building2,
  User,
  Info,
  Loader2,
  Plus
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

interface StockOutItemForm {
  productId: string;
  quantity: string;
}

interface StockOutForm {
  items: StockOutItemForm[];
  department: string;
  issuedBy: string;
  issuedTo: string;
  purpose: string;
  date: string;
}

const stockOutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1, "Product selection is required"),
    quantity: z.string().min(1, "Quantity is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Quantity must be a positive number",
    }),
  })).min(1, "At least one item is required"),
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
  const [activeRowIndex, setActiveRowIndex] = useState<number>(0);
  const [stockByProductId, setStockByProductId] = useState<Record<string, number>>({});
  const [unitByProductId, setUnitByProductId] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof StockOutForm, string>>>({});

  const { user } = useAuth();

  const [form, setForm] = useState<StockOutForm>({
    items: [{ productId: "", quantity: "" }],
    department: "",
    issuedBy: user?.username || "",
    issuedTo: "",
    purpose: "",
    date: getTodayISTForInput(),
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

  const updateForm = (key: keyof Omit<StockOutForm, "items">, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const updateItem = (idx: number, patch: Partial<StockOutItemForm>) => {
    setForm((f) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], ...patch };
      return { ...f, items };
    });
  };

  const handleProductChange = (idx: number, value: string) => {
    updateItem(idx, { productId: value });
    if (!value) return;
    api.get(`/products/${value}`)
      .then((res) => {
        const stock = res.data.currentStock ?? 0;
        const unit = res.data.unit ?? "";
        setStockByProductId((m) => ({ ...m, [value]: stock }));
        setUnitByProductId((m) => ({ ...m, [value]: unit }));
      })
      .catch((err) => {
        console.error("Failed to fetch product stock:", err);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = stockOutSchema.safeParse(form);

    if (!result.success) {
      const headerErrors: Partial<Record<keyof StockOutForm, string>> = {};
      result.error.issues.forEach((issue) => {
        const path0 = issue.path[0];
        if (typeof path0 === "string") {
          const key = path0 as keyof StockOutForm;
          if (key !== "items" && !headerErrors[key]) {
            headerErrors[key] = issue.message;
          }
        }
      });
      setErrors(headerErrors);
      toast.error("Please fix the validation errors");
      return;
    }

    // Quick client-side stock check (best-effort)
    for (const it of form.items) {
      if (!it.productId) continue;
      const stock = stockByProductId[it.productId];
      if (stock !== undefined && Number(it.quantity) > stock) {
        toast.error(`Insufficient stock for selected item. Only ${stock} available.`);
        return;
      }
    }

    setLoading(true);
    setErrors({});

    const stockOutPromise = api.post("/stock-out/bulk", {
      department: form.department,
      issuedBy: form.issuedBy,
      issuedTo: form.issuedTo,
      purpose: form.purpose,
      date: inputDateToISOIST(form.date),
      items: form.items.map((it) => ({ productId: it.productId, quantity: Number(it.quantity) })),
    });

    toast.promise(stockOutPromise, {
      loading: 'Recording stock out...',
      success: () => {
        setForm({
          items: [{ productId: "", quantity: "" }],
          department: "",
          issuedBy: user?.username || "",
          issuedTo: "",
          purpose: "",
          date: getTodayISTForInput(),
        });
        setStockByProductId({});
        setUnitByProductId({});
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

  const addRow = () => setForm((f) => ({ ...f, items: [...f.items, { productId: "", quantity: "" }] }));
  const removeRow = (idx: number) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

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
            {/* Items Section (multiple rows) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  <Package size={13} className="text-neutral-500" />
                  Items <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addRow}
                  className="h-9 px-3 border border-neutral-300 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 flex items-center gap-2"
                >
                  <Plus size={14} />
                  Add Row
                </button>
              </div>

              <div className="space-y-3">
                {form.items.map((it, idx) => {
                  const stock = it.productId ? stockByProductId[it.productId] : undefined;
                  const unit = it.productId ? unitByProductId[it.productId] : "";
                  const isRowInsufficient = stock !== undefined && it.quantity !== "" && Number(it.quantity) > stock;
                  return (
                    <div key={idx} className="grid grid-cols-1 lg:grid-cols-12 gap-3 bg-neutral-50 border border-neutral-200 p-3">
                      <div className="lg:col-span-7 space-y-1">
                        <div className="flex">
                          <div className="relative flex-1">
                            <select
                              className="w-full h-10 appearance-none bg-white border border-neutral-300 px-3 pr-8 text-sm text-neutral-900 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors"
                              value={it.productId}
                              onChange={(e) => handleProductChange(idx, e.target.value)}
                            >
                              <option value="">Select product</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name.length > 45 ? p.name.substring(0, 45) + '…' : p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setActiveRowIndex(idx); setIsSearchModalOpen(true); }}
                            className="h-10 w-10 border border-neutral-300 bg-white hover:bg-neutral-50 hover:border-neutral-400 transition-colors flex items-center justify-center active:scale-98 flex-shrink-0"
                            title="Search product"
                          >
                            <SearchCode size={18} className="text-neutral-600" />
                          </button>
                        </div>
                        {stock !== undefined && it.productId && (
                          <div className="px-3 py-2 bg-white border border-neutral-300 flex items-center justify-between text-xs">
                            <span className="text-neutral-600 uppercase tracking-wider font-medium">
                              Stock Available
                            </span>
                            <span className="text-neutral-900 font-semibold">
                              {stock} {unit}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="lg:col-span-4 space-y-1">
                        <input
                          type="number"
                          className={`w-full h-10 bg-white border ${isRowInsufficient ? 'border-red-500' : 'border-neutral-300'} px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors`}
                          placeholder="Quantity"
                          value={it.quantity}
                          onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                        />
                        {isRowInsufficient && (
                          <div className="px-3 py-2 bg-neutral-800 border border-neutral-900 text-xs text-white">
                            <span className="uppercase tracking-wider font-medium">
                              Insufficient stock - only {stock} available
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="lg:col-span-1 flex items-start justify-end">
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          disabled={form.items.length === 1}
                          className="h-10 w-10 border border-neutral-300 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          title="Remove row"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
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
              disabled={loading}
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
        </form >
      </div >

      <ProductSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelect={(id) => handleProductChange(activeRowIndex, id)}
      />
    </div >
  );
};

export default StockOut;