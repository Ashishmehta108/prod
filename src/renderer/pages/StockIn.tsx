
import React, { useEffect, useState } from "react";
import { z } from "zod";
import { api } from "../api/client";
import { getTodayISTForInput, inputDateToISOIST } from "../utils/dateUtils";
import {
  Package,
  Plus,
  SearchCode,
  Calendar,
  Building2,
  FileText,
  MapPin,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import EmptyProductsState from "@renderer/components/EmptyState";
import { ProductSearchModal } from "../components/ProductSearchModal";
import Ripple from "../components/shared/Ripple";

interface ProductOption {
  id: string;
  name: string;
}

interface StockInForm {
  productId: string;
  quantity: string;
  supplier: string;
  invoiceNo: string;
  location: string;
  date: string;
}

const stockInSchema = z.object({
  productId: z.string().min(1, "Product selection is required"),
  quantity: z.string().min(1, "Quantity is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Quantity must be a positive number",
  }),
  supplier: z.string().trim().min(1, "Supplier name is required"),
  invoiceNo: z.string().trim().min(1, "Invoice/Reference number is required"),
  location: z.string().trim().min(1, "Storage location is required"),
  date: z.string().min(1, "Transaction date is required"),
});

const StockIn: React.FC = () => {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [supplierSuggestions, setSupplierSuggestions] = useState<string[]>([]);
  const [showSupplierList, setShowSupplierList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedProductStock, setSelectedProductStock] = useState<number | null>(null);
  const [selectedProductUnit, setSelectedProductUnit] = useState<string>("");
  const [errors, setErrors] = useState<Partial<Record<keyof StockInForm, string>>>({});

  const [form, setForm] = useState<StockInForm>({
    productId: "",
    quantity: "",
    supplier: "",
    invoiceNo: "",
    location: "",
    date: getTodayISTForInput(),
  });

  const load = async () => {
    try {
      setDataLoading(true);
      const [prodRes, freqRes] = await Promise.all([
        api.get("/products"),
        api.get("/stock-in/frequent"),
      ]);
      setProducts(prodRes.data.data || prodRes.data);
      setSupplierSuggestions(freqRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateForm = (key: keyof StockInForm, value: string) => {
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

    const result = stockInSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof StockInForm, string>> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof StockInForm;
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Please fix the validation errors");
      return;
    }

    setLoading(true);
    setErrors({});

    const stockInPromise = api.post("/stock-in", {
      ...form,
      date: inputDateToISOIST(form.date),
      quantity: Number(form.quantity)
    });

    toast.promise(stockInPromise, {
      loading: 'Recording stock in...',
      success: () => {
        setForm({
          productId: "",
          quantity: "",
          supplier: "",
          invoiceNo: "",
          location: "",
          date: getTodayISTForInput(),
        });
        setSelectedProductStock(null);
        setSelectedProductUnit("");
        return 'Stock in recorded successfully';
      },
      error: (err) => err.response?.data?.error || 'Failed to record stock in',
    });

    try {
      await stockInPromise;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (products.length === 0 && !dataLoading) {
    return <EmptyProductsState />
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight mb-1">
          Stock In
        </h1>
        <p className="text-sm text-neutral-500">
          Record incoming inventory and update stock levels
        </p>
      </div>

      {/* Main Form Container */}
      <div className="bg-white border border-neutral-300">
        {/* Form Header */}
        <div className="border-b border-neutral-300 bg-neutral-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-neutral-900 flex items-center justify-center">
              <Plus size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">New Receipt Entry</h2>
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
                <div className="flex">
                  <div className="relative flex-1">
                    <select
                      className={`w-full h-10 appearance-none bg-neutral-50 border-y border-l ${errors.productId ? 'border-red-500' : 'border-neutral-300'} px-3 pr-8 text-sm text-neutral-900 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors`}
                      value={form.productId}
                      onChange={(e) => handleProductChange(e.target.value)}
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
                    onClick={() => setIsSearchModalOpen(true)}
                    className={`h-10 w-10 border ${errors.productId ? 'border-red-500' : 'border-neutral-300'} bg-white hover:bg-neutral-50 hover:border-neutral-400 transition-colors flex items-center justify-center active:scale-98 flex-shrink-0`}
                  >
                    <SearchCode size={18} className="text-neutral-600" />
                  </button>
                </div>
                {errors.productId && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.productId}</p>}
                {selectedProductStock !== null && form.productId && (
                  <div className=" w-full px-3 py-2 bg-neutral-100 border border-neutral-300 flex items-center justify-between text-xs">
                    <span className="text-neutral-600 uppercase tracking-wider font-medium">
                      Current Stock
                    </span>
                    <span className="text-neutral-900 font-semibold">
                      {selectedProductStock} {selectedProductUnit}
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  <Plus size={13} className="text-neutral-500" />
                  Quantity to Add <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className={`w-full h-10 bg-neutral-50 border ${errors.quantity ? 'border-red-500' : 'border-neutral-300'} px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors`}
                  placeholder="Enter quantity"
                  value={form.quantity}
                  onChange={(e) => updateForm("quantity", e.target.value)}
                />
                {errors.quantity ? (
                  <p className="text-[10px] text-red-500 font-medium ml-1">{errors.quantity}</p>
                ) : (
                  <p className="text-xs text-neutral-500">
                    Stock levels will increase by this amount
                  </p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-neutral-200" />

            {/* Supplier & Invoice Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Supplier */}
              <div className="space-y-2 relative">
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  <Building2 size={13} className="text-neutral-500" />
                  Supplier <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full h-10 bg-neutral-50 border ${errors.supplier ? 'border-red-500' : 'border-neutral-300'} px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors`}
                  placeholder="Enter or search supplier"
                  value={form.supplier}
                  onFocus={() => setShowSupplierList(true)}
                  onBlur={() => setTimeout(() => setShowSupplierList(false), 200)}
                  onChange={(e) => { updateForm("supplier", e.target.value); setShowSupplierList(true); }}
                />
                {errors.supplier && <p className="text-[10px] text-red-500 font-medium ml-1 mt-1">{errors.supplier}</p>}
                {showSupplierList && supplierSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-300 max-h-48 overflow-auto">
                    {supplierSuggestions
                      .filter(s => s.toLowerCase().includes(form.supplier.toLowerCase()))
                      .map(s => (
                        <div
                          key={s}
                          className="px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 cursor-pointer transition-colors"
                          onMouseDown={() => { updateForm("supplier", s); setShowSupplierList(false); }}
                        >
                          {s}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Invoice */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  <FileText size={13} className="text-neutral-500" />
                  Invoice / Reference <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full h-10 bg-neutral-50 border ${errors.invoiceNo ? 'border-red-500' : 'border-neutral-300'} px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors`}
                  placeholder="INV-000-000"
                  value={form.invoiceNo}
                  onChange={(e) => updateForm("invoiceNo", e.target.value)}
                />
                {errors.invoiceNo && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.invoiceNo}</p>}
              </div>
            </div>

            {/* Location & Date Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Location */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  <MapPin size={13} className="text-neutral-500" />
                  Storage Location <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full h-10 bg-neutral-50 border ${errors.location ? 'border-red-500' : 'border-neutral-300'} px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors`}
                  placeholder="e.g. Rack A, Bin 4"
                  value={form.location}
                  onChange={(e) => updateForm("location", e.target.value)}
                />
                {errors.location && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.location}</p>}
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
                  <Plus size={18} />
                  <span className="text-sm font-medium uppercase tracking-wider">
                    Record Stock In
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

export default StockIn;