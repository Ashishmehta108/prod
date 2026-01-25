import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api } from "../api/client";
import {
  Weight,
  Monitor,
  Printer,
  Package,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Truck,
  Database,
  Search,
  ChevronDown
} from "lucide-react";

interface Product {
  id: string;
  _id?: string;
  name: string;
  category?: string;
}

interface Port {
  path: string;
  manufacturer?: string;
}

const WeightEntry: React.FC = () => {
  // --- UI State ---
  const [loading, setLoading] = useState(false);
  const [readingScale, setReadingScale] = useState(false);
  const [ports, setPorts] = useState<Port[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // --- Form State ---
  const [selectedPort, setSelectedPort] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [grossWeight, setGrossWeight] = useState<number | "">("");
  const [tareWeight, setTareWeight] = useState<number | "">("");
  const [printerName, setPrinterName] = useState("TSC_TTP_244_PRO");
  const [manualMode, setManualMode] = useState(false);

  // --- Search State ---
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // --- Derived State ---
  const netWeight = useMemo(() => {
    if (typeof grossWeight === "number" && typeof tareWeight === "number") {
      return Math.max(0, grossWeight - tareWeight);
    }
    return 0;
  }, [grossWeight, tareWeight]);

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  // --- Initial Data ---
  useEffect(() => {
    fetchPorts();
    fetchProducts();
  }, []);

  const fetchPorts = async () => {
    try {
      const res = await api.get("/weight/ports");
      if (res.data.success) {
        setPorts(res.data.data);
        if (res.data.data.length > 0) setSelectedPort(res.data.data[0].path);
      }
    } catch (err) {
      console.error("Failed to fetch ports");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      const data = res.data.data || res.data;
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products");
    }
  };

  // --- Actions ---
  const handleReadScale = async () => {
    if (!selectedPort) {
      toast.error("Select a scale port");
      return;
    }

    setReadingScale(true);
    try {
      const res = await api.post("/weight/read", { path: selectedPort });
      if (res.data.success) {
        const value = res.data.data.parsed.value;
        setGrossWeight(value);
        toast.success(`Weight captured: ${value} kg`);
      } else {
        toast.error(res.data.error || "Scale read failed");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Scale connection timed out");
    } finally {
      setReadingScale(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProductId) return toast.error("Select a product");
    if (typeof grossWeight !== "number" || grossWeight <= 0) return toast.error("Invalid gross weight");
    if (typeof tareWeight !== "number" || tareWeight < 0) return toast.error("Invalid tare weight");
    if (grossWeight < tareWeight) return toast.error("Gross weight cannot be less than tare weight");

    setLoading(true);
    const savePromise = api.post("/weight/records", {
      productId: selectedProductId,
      grossWeight,
      tareWeight,
      weightSource: manualMode ? "manual" : "scale",
      printerName
    });

    toast.promise(savePromise, {
      loading: "Saving...",
      success: (res) => {
        setGrossWeight("");
        setTareWeight("");
        setSelectedProductId("");
        setProductSearch("");
        return res.data.printError || "Saved & label printed";
      },
      error: (err) => err.response?.data?.error || "Failed to save record"
    });

    try { await savePromise; } catch (e) { } finally { setLoading(false); }
  };

  const inputBase = "h-11 w-full rounded-lg border border-neutral-200 bg-white px-4 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all";
  const labelBase = "text-xs font-medium text-neutral-600 mb-2 block";

  return (
    <div className="min-h-screen bg-neutral-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-neutral-900">Weight management</h1>
            <p className="text-sm text-neutral-500">Capture weights and print production labels</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-neutral-200 px-4 py-2 rounded-lg flex items-center gap-2.5">
              <div className={`h-2 w-2 rounded-full ${ports.length > 0 ? 'bg-green-500' : 'bg-neutral-300'}`} />
              <span className="text-xs font-medium text-neutral-600">
                {ports.length} {ports.length === 1 ? 'scale' : 'scales'} active
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Form Side */}
          <div className="lg:col-span-5 space-y-6">

            {/* 1. Device Config */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
                <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600">
                  <Monitor size={18} />
                </div>
                <h2 className="font-medium text-neutral-900">Port configuration</h2>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className={labelBase}>Select scale port</label>
                  <div className="relative">
                    <select
                      value={selectedPort}
                      onChange={(e) => setSelectedPort(e.target.value)}
                      className={`${inputBase} appearance-none pr-10`}
                    >
                      <option value="">Choose a port...</option>
                      {ports.map(p => (
                        <option key={p.path} value={p.path}>{p.path} {p.manufacturer ? `(${p.manufacturer})` : ''}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelBase}>Printer path</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={printerName}
                      onChange={(e) => setPrinterName(e.target.value)}
                      className={inputBase}
                      placeholder="e.g. TSC_TTP_244"
                    />
                    <Printer size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Product Search */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
                <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600">
                  <Package size={18} />
                </div>
                <h2 className="font-medium text-neutral-900">Product selection</h2>
              </div>

              <div className="relative space-y-4">
                <div className="space-y-2">
                  <label className={labelBase}>Search inventory</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      className={inputBase}
                      placeholder="Type name or code..."
                    />
                    <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                  </div>

                  <AnimatePresence>
                    {showProductDropdown && productSearch && (
                      <motion.ul
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-50 w-full mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden max-h-56 overflow-y-auto"
                      >
                        {filteredProducts.map(p => (
                          <li
                            key={p.id || p._id}
                            onClick={() => {
                              setSelectedProductId(p.id || p._id || "");
                              setProductSearch(p.name);
                              setShowProductDropdown(false);
                            }}
                            className="px-4 py-3 hover:bg-neutral-50 cursor-pointer transition-colors border-b border-neutral-100 last:border-0"
                          >
                            <span className="text-sm font-medium text-neutral-900 block">{p.name}</span>
                            <span className="text-xs text-neutral-500">{p.category || 'General'}</span>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                {selectedProductId && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-neutral-700">Product selected</span>
                    </div>
                    <button onClick={() => { setSelectedProductId(""); setProductSearch("") }} className="text-xs font-medium text-neutral-500 hover:text-neutral-700 underline">Clear</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Weight Entry Side */}
          <div className="lg:col-span-7 space-y-6">

            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">

              <div className="divide-y divide-neutral-100">

                {/* Gross Weight Capture */}
                <div className="p-8 lg:p-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 space-y-4 w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-neutral-500">Step 1: Gross weight</span>
                      <button onClick={() => setManualMode(!manualMode)} className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${manualMode ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                        {manualMode ? 'Manual' : 'Auto scale'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        readOnly={!manualMode}
                        value={grossWeight}
                        onChange={(e) => setGrossWeight(parseFloat(e.target.value) || "")}
                        className={`w-full text-6xl font-semibold text-neutral-900 bg-transparent py-4 tabular-nums outline-none ${manualMode ? 'border-b-2 border-dashed border-neutral-300' : ''}`}
                        placeholder="0.00"
                      />
                      <span className="absolute right-0 bottom-6 text-neutral-300 font-medium text-2xl">kg</span>
                    </div>
                  </div>

                  <button
                    onClick={handleReadScale}
                    disabled={readingScale || manualMode}
                    className="h-24 w-full md:w-44 flex flex-col items-center justify-center gap-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white disabled:bg-neutral-100 disabled:text-neutral-400 transition-all font-medium text-sm"
                  >
                    {readingScale ? <Loader2 size={22} className="animate-spin" /> : <Weight size={22} />}
                    {readingScale ? 'Reading...' : 'Read scale'}
                  </button>
                </div>

                {/* Tare Weight Entry */}
                <div className="p-8 lg:p-10 bg-neutral-50/50 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 space-y-4 w-full">
                    <span className="text-xs font-medium text-neutral-500">Step 2: Tare weight</span>
                    <div className="relative">
                      <input
                        type="number"
                        value={tareWeight}
                        onChange={(e) => setTareWeight(parseFloat(e.target.value) || "")}
                        className="w-full text-6xl font-semibold text-neutral-900 bg-transparent py-4 tabular-nums outline-none border-b-2 border-transparent focus:border-neutral-200 transition-colors"
                        placeholder="0.00"
                      />
                      <span className="absolute right-0 bottom-6 text-neutral-300 font-medium text-2xl">kg</span>
                    </div>
                  </div>
                  <div className="w-full md:w-44 p-6 border-2 border-dashed border-neutral-200 rounded-lg flex flex-col items-center gap-2 text-neutral-400">
                    <Truck size={24} strokeWidth={1.5} />
                    <span className="text-xs font-medium text-center">Container weight</span>
                  </div>
                </div>

                {/* Net Final Result */}
                <div className="p-8 lg:p-10 bg-white flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-neutral-900 rounded-xl flex items-center justify-center text-white">
                      <ArrowRight size={28} />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-neutral-500 block mb-1">Net weight</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-semibold text-neutral-900 tabular-nums">{netWeight.toFixed(2)}</span>
                        <span className="text-xl font-medium text-neutral-400">kg</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={loading || !selectedProductId || !grossWeight}
                    className="w-full md:w-64 h-20 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg flex flex-col items-center justify-center gap-2 font-medium text-sm transition-all disabled:bg-neutral-100 disabled:text-neutral-400"
                  >
                    {loading ? <Loader2 size={22} className="animate-spin" /> : <Printer size={22} />}
                    {loading ? 'Processing...' : 'Save & print label'}
                  </button>
                </div>
              </div>
            </div>

            {/* Status Footer */}
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-2 text-neutral-400">
                <Database size={14} />
                <span className="text-xs font-medium">Secure recording</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-400">
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                <span className="text-xs font-medium">Printer ready</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightEntry;