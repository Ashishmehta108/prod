import { api } from "@renderer/api/client";
import { Box, Gallery, Personalcard } from "iconsax-react";
import { Plus, SquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductListItem } from "src/utils/types/product.types";
import { toast } from "sonner";


export default function ProductForm() {
  const [refIdInput, setRefIdInput] = useState("");
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const load = () => {
    Promise.all([
      api.get<ProductListItem[]>("/products"),
      api.get("/categories")
    ])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.data);
        setCategories(catRes.data);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    load();
  }, []);
  const [form, setForm] = useState({
    name: "",
    category: "",
    image: null as any, // Changed from "" to null
    unit: "",
    minStock: "",
    refIds: [] as string[],
    machineName: "",
  });

  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setForm((f) => ({ ...f, image: file }));
  };

  const handleSubmit = () => {
    if (!form.name) {
      toast.error("Product name is required");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("category", form.category);
    formData.append("unit", form.unit);
    formData.append("minStock", form.minStock.toString());
    formData.append("machineName", form.machineName || "");
    formData.append("refIds", JSON.stringify(form.refIds));

    if (form.image instanceof File) {
      formData.append("image", form.image);
    }

    const createPromise = api.post("/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });


    toast.promise(createPromise, {
      loading: 'Creating product...',
      success: () => {
        setForm({
          name: "",
          category: "",
          unit: "pcs",
          minStock: "",
          image: null,
          machineName: "",
          refIds: [],
        });

        setRefIdInput("");
        load();
        return 'Product created successfully';
      },
      error: (err) => err.response?.data?.error || 'Failed to create product',
    });

    createPromise.finally(() => setLoading(false));
  };

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
  return (
    <div className="bg-white container max-w-4xl mx-auto border border-gray-200 rounded-xl shadow-sm">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center">
          <SquarePlus size={22} className="text-gray-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900">
            Add New Product
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Create a new inventory item
          </p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Product Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Personalcard size={16} className="text-gray-500" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Product Information
            </span>
          </div>

          {/* NAME */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              className="form-input w-full  bg-neutral-50 text-neutral-900 border border-gray-200 rounded-lg px-4 py-2.5 text-sm transition-all"
              placeholder="Enter product name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* CATEGORY */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              className="form-input w-full bg-neutral-50 text-neutral-900 border border-gray-200 rounded-lg px-4 py-2.5 text-sm transition-all"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100"></div>

        {/* Reference IDs Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Reference IDs
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Add Reference IDs
            </label>

            {/* Pills Display */}
            {form.refIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {form.refIds.map((refId, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-md border border-gray-200"
                  >
                    <span className="font-medium">{refId}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({
                          ...f,
                          refIds: f.refIds.filter((_, i) => i !== index),
                        }));
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input Field */}
            <div className="flex gap-2">
              <input
                className="form-input flex-1 bg-neutral-50 text-neutral-900 border border-gray-200 rounded-lg px-4 py-2.5 text-sm transition-all"
                placeholder="Enter ref ID and press Enter"
                value={refIdInput}
                onChange={(e) => setRefIdInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const trimmed = refIdInput.trim();
                    if (trimmed && !form.refIds.includes(trimmed)) {
                      setForm((f) => ({
                        ...f,
                        refIds: [...f.refIds, trimmed],
                      }));
                      setRefIdInput("");
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const trimmed = refIdInput.trim();
                  if (trimmed && !form.refIds.includes(trimmed)) {
                    setForm((f) => ({
                      ...f,
                      refIds: [...f.refIds, trimmed],
                    }));
                    setRefIdInput("");
                  }
                }}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Add
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-1.5">
              Press Enter or click Add to include multiple reference IDs
            </p>
          </div>
        </div>
        {/* Image Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Gallery size={16} className="text-gray-500" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Product Image
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
              {form.image ? (
                <img
                  src={form.image instanceof File ? URL.createObjectURL(form.image) : form.image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Gallery size={24} className="text-gray-300" />
              )}
            </div>


            <div className="flex-1">
              <label className="upload-btn cursor-pointer inline-flex items-center gap-2 bg-gray-50 px-4 py-2.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100">
                <Plus size={14} />
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
              <p className="text-xs text-gray-400 mt-2">PNG, JPG up to 5MB</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100"></div>

        {/* Stock Details Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Box size={16} className="text-gray-500" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Stock Details
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Unit Type
              </label>
              <input
                className="form-input w-full  bg-neutral-50 text-neutral-900 border border-gray-200 rounded-lg px-4 py-2.5 text-sm transition-all"
                placeholder="pcs, kg, L"
                value={form.unit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unit: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Min Stock Alert
              </label>
              <input
                type="number"
                className="form-input w-full  bg-neutral-50 text-neutral-900 border border-gray-200 rounded-lg px-4 py-2.5 text-sm transition-all"
                placeholder="0"
                value={form.minStock}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minStock: e.target.value }))
                }
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            You'll be notified when stock falls below minimum
          </p>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="button"
          disabled={loading}
          onClick={(e) => {
            handleRipple(e);
            handleSubmit();
          }}
          className="submit-btn relative overflow-hidden w-full bg-gray-900 text-white text-sm font-semibold py-3.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {loading ? (
            <div className="flex items-center gap-2 justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving Product...
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-center">
              <Plus size={18} />
              Add Product
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
