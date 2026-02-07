import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Edit, Trash2, X, Plus, Save, QrCode, Download } from "lucide-react";
import { Gallery } from "iconsax-react";
import { api } from "@renderer/api/client";
import { ProductListItem } from "src/utils/types/product.types";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { ProductsPageSkeleton } from "../components/Skeleton";

const ProductsList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "superadmin";

    const [products, setProducts] = useState<ProductListItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [editForm, setEditForm] = useState({
        name: "",
        category: "",
        unit: "",
        minStock: 0,
        currentStock: 0,
        image: null as any, // Existing path or raw File
        refIds: [] as string[],
        machineName: "",
    });

    const [editLoading, setEditLoading] = useState(false);
    const [refIdInput, setRefIdInput] = useState("");

    // QR Modal State
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [qrCodeData, setQrCodeData] = useState<string | null>(null);
    const [qrProduct, setQrProduct] = useState<any>(null);
    const [qrLoading, setQrLoading] = useState(false);

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const [filters, setFilters] = useState({
        search: "",
        refIdPrefix: "",
        category: "",
        unit: "",
        stock: "all" as "all" | "low" | "out" | "in",
        createdFrom: "",
        createdTo: "",
    });
    useEffect(() => {
        const container = document.querySelector(".max-h-\\[540px\\]");
        container?.scrollTo({ top: 0, behavior: "smooth" });
        fetchCategories();
    }, [page]);


    const inputBase =
        "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300";

    const selectBase =
        "h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300";

    const queryParams = useMemo(() => {
        const params: any = {
            page,
            limit,
            search: filters.search || undefined,
            refIdPrefix: filters.refIdPrefix || undefined,
            category: filters.category || undefined,
            unit: filters.unit || undefined,
            createdFrom: filters.createdFrom || undefined,
            createdTo: filters.createdTo || undefined,
        };

        if (filters.stock === "low") params.minStockOnly = true;
        if (filters.stock === "out") params.outOfStock = true;
        if (filters.stock === "in") params.inStock = true;

        return params;
    }, [filters, page, limit]);

    const load = async () => {
        try {
            setLoading(true);
            const [res] = await Promise.all([
                api.get("/products", { params: queryParams }),
                new Promise((resolve) => setTimeout(resolve, 1200))
            ]);
            setProducts(res.data.data);
            setTotalPages(res.data.meta.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get("/categories");
            setCategories(res.data.map((c: any) => c.name));
        } catch (err) {
            console.error("Failed to fetch categories:", err);
        }
    };

    const handleEdit = (e: React.MouseEvent, product: ProductListItem) => {
        e.stopPropagation();
        setEditingProduct(product);
        setEditForm({
            name: product.name,
            category: product.category || "",
            unit: product.unit,
            minStock: product.minStock,
            currentStock: product.currentStock,
            image: product.image || null,
            refIds: product.refIds || [],
            machineName: product.machineName || "",
        });
        setIsEditModalOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        const deletePromise = api.delete(`/products/${id}`);

        toast.promise(deletePromise, {
            loading: 'Deleting product...',
            success: () => {
                load();
                return 'Product deleted successfully';
            },
            error: (err) => err.response?.data?.error || 'Failed to delete product',
        });

        try {
            setDeletingId(id);
            await deletePromise;
        } catch (err) {
            console.error(err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleUpdate = async () => {
        if (!editForm.name || !editForm.unit) {
            toast.error("Name and Unit are required");
            return;
        }

        const formData = new FormData();
        formData.append("name", editForm.name);
        formData.append("category", editForm.category);
        formData.append("unit", editForm.unit);
        formData.append("minStock", editForm.minStock.toString());
        formData.append("currentStock", editForm.currentStock.toString());
        formData.append("machineName", editForm.machineName);
        formData.append("refIds", JSON.stringify(editForm.refIds));

        if (editForm.image instanceof File) {
            formData.append("image", editForm.image);
        } else if (typeof editForm.image === "string") {
            formData.append("image", editForm.image); // Send path as string
        }

        const updatePromise = api.put(`/products/${editingProduct.id}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });


        toast.promise(updatePromise, {
            loading: 'Updating product...',
            success: () => {
                setIsEditModalOpen(false);
                load();
                return 'Product updated successfully';
            },
            error: (err) => err.response?.data?.error || 'Failed to update product',
        });

        try {
            setEditLoading(true);
            await updatePromise;
        } catch (err) {
            console.error(err);
        } finally {
            setEditLoading(false);
        }
    };

    const handleGenerateQR = async (e: React.MouseEvent, product: ProductListItem) => {
        e.stopPropagation();
        setQrProduct(product);
        setIsQRModalOpen(true);
        setQrLoading(true);
        setQrCodeData(null);

        try {
            const res = await api.get(`/products/${product.id}/qr`);
            if (res.data.success) {
                setQrCodeData(res.data.qrCode);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate QR code");
            setIsQRModalOpen(false);
        } finally {
            setQrLoading(false);
        }
    };

    const downloadQR = () => {
        if (!qrCodeData || !qrProduct) return;
        const link = document.createElement("a");
        link.href = qrCodeData;
        link.download = `QR_${qrProduct.name.replace(/\s+/g, "_")}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setEditForm((f) => ({ ...f, image: file }));
    };

    const addRefId = () => {
        const value = refIdInput.trim();
        if (!value) return;

        setEditForm((f) => ({
            ...f,
            refIds: f.refIds.includes(value)
                ? f.refIds
                : [...f.refIds, value],
        }));

        setRefIdInput("");
    };

    const removeRefId = (ref: string) => {
        setEditForm((f) => ({
            ...f,
            refIds: f.refIds.filter((r) => r !== ref),
        }));
    };

    useEffect(() => {
        setPage(1);
    }, [filters]);

    useEffect(() => {
        const t = setTimeout(() => {
            load();
        }, 300);
        return () => clearTimeout(t);
    }, [page, filters, queryParams]);

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            {/* HEADER */}
            <div className="px-6 py-5 border-b border-gray-100 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                        <Package className="text-gray-600" size={22} />
                    </div>

                    <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900">Parts Inventory</h3>
                        <p className="text-xs text-gray-500">
                            Page {page} of {totalPages}
                            {loading ? <span className="ml-2 text-gray-400">Loading…</span> : null}
                        </p>
                    </div>

                    <div className="w-[360px]">
                        <input
                            value={filters.search}
                            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                            placeholder="Search part name, category, machine…"
                            className={inputBase}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[220px]">
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Ref ID</label>
                        <input
                            value={filters.refIdPrefix}
                            onChange={(e) => setFilters((f) => ({ ...f, refIdPrefix: e.target.value }))}
                            placeholder="Starts with…"
                            className={inputBase}
                        />
                    </div>

                    <div className="min-w-[180px]">
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Category</label>
                        <div className="relative">
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                                className={selectBase}
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="min-w-[140px]">
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Unit</label>
                        <div className="relative">
                            <select
                                value={filters.unit}
                                onChange={(e) => setFilters((f) => ({ ...f, unit: e.target.value }))}
                                className={selectBase}
                            >
                                <option value="">All Units</option>
                                <option value="pcs">pcs</option>
                                <option value="kg">kg</option>
                            </select>
                        </div>
                    </div>

                    <div className="min-w-[160px]">
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Stock</label>
                        <div className="relative">
                            <select
                                value={filters.stock}
                                onChange={(e) => setFilters((f) => ({ ...f, stock: e.target.value as any }))}
                                className={selectBase}
                            >
                                <option value="all">All</option>
                                <option value="in">In stock</option>
                                <option value="low">Low stock</option>
                                <option value="out">Out of stock</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={() =>
                            setFilters({
                                search: "",
                                refIdPrefix: "",
                                category: "",
                                unit: "",
                                stock: "all",
                                createdFrom: "",
                                createdTo: "",
                            })
                        }
                        className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 active:bg-gray-100"
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className="p-6 max-h-[540px] overflow-y-auto">
                {loading ? (
                    <ProductsPageSkeleton />
                ) : products.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Package size={32} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">No parts found</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-700 bg-gray-50/80">
                                <th className="px-4 py-4 text-left rounded-l-xl">Image</th>
                                <th className="px-4 py-4 text-left">Part Details</th>
                                <th className="px-4 py-4 text-left">Category</th>
                                <th className="px-4 py-4 text-left">Unit</th>
                                <th className="px-4 py-4 text-right">Current Stock</th>
                                <th className="px-4 py-4 text-right">Min Level</th>
                                {isAdmin && <th className="px-4 py-4 text-center rounded-r-xl">Actions</th>}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {products.map((p) => (
                                <tr
                                    key={p.id}
                                    onClick={() => navigate(`/products/${p.id}`)}
                                    className="cursor-pointer hover:bg-gray-50/70 transition-colors"
                                >
                                    <td className="px-4 py-4">
                                        {p.image ? (
                                            <img
                                                src={p.image.startsWith('http') ? p.image : `http://localhost:4000${p.image}`}
                                                className="w-11 h-11 rounded-xl object-cover border border-gray-200 shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200">
                                                <Gallery size={16} className="text-gray-300" />
                                            </div>
                                        )}
                                    </td>


                                    <td className="px-4 py-4">
                                        <div className="text-sm font-medium text-gray-900">{p.name}</div>
                                        <div className="mt-1 flex flex-wrap items-center gap-1">
                                            {p.refIds?.slice(0, 2).map((ref) => (
                                                <span key={ref} className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-[11px] text-gray-700 border border-gray-200">{ref}</span>
                                            ))}
                                            {p.refIds && p.refIds.length > 2 && (
                                                <span className="text-[11px] text-gray-400 font-medium">
                                                    +{p.refIds.length - 2} more
                                                </span>
                                            )}
                                        </div>
                                        {p.machineName && (
                                            <div className="mt-0.5 text-[10px] text-gray-500">
                                                Machine: <span className="font-medium text-gray-700">{p.machineName}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-xs text-gray-700">{p.category || "—"}</td>
                                    <td className="px-4 py-4 text-xs font-medium text-gray-900">{p.unit}</td>
                                    <td className={`px-4 py-4 text-right font-semibold ${p.currentStock <= p.minStock ? "text-red-600" : "text-gray-900"}`}>{p.currentStock}</td>
                                    <td className="px-4 py-4 text-right text-xs text-gray-500 font-medium">{p.minStock}</td>

                                    {isAdmin && (
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={(e) => handleGenerateQR(e, p)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><QrCode size={16} /></button>
                                                <button onClick={(e) => handleEdit(e, p)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                                                <button onClick={(e) => handleDelete(e, p.id)} disabled={deletingId === p.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                                                    {deletingId === p.id ? <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* PAGINATION */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <p className="text-xs text-gray-500">
                    Page <span className="font-medium text-gray-700">{page}</span> of{" "}
                    <span className="font-medium text-gray-700">{totalPages}</span>
                </p>

                <div className="flex items-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>

            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm"><Edit className="text-gray-600" size={20} /></div>
                                <div><h3 className="text-lg font-bold text-gray-900">Update Product</h3><p className="text-xs text-gray-500">Modify part details</p></div>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"><X size={20} /></button>
                        </div>

                        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Product Name</label>
                                    <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className={inputBase} />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                                    <select
                                        value={editForm.category}
                                        onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                                        className={selectBase}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Unit</label>
                                    <input value={editForm.unit} onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))} className={inputBase} />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Current Stock</label>
                                    <input type="number" value={editForm.currentStock} onChange={(e) => setEditForm((f) => ({ ...f, currentStock: Number(e.target.value) }))} className={inputBase} />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Min Stock</label>
                                    <input type="number" value={editForm.minStock} onChange={(e) => setEditForm((f) => ({ ...f, minStock: Number(e.target.value) }))} className={inputBase} />
                                </div>
                                {/* REF IDS */}
                                <div className="col-span-2 space-y-2">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Reference IDs
                                    </label>

                                    <div className="flex gap-2">
                                        <input
                                            value={refIdInput}
                                            onChange={(e) => setRefIdInput(e.target.value)}
                                            placeholder="Enter ref id (eg: MTR-001)"
                                            className={inputBase}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    addRefId();
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={addRefId}
                                            className="px-4 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800"
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {/* Chips */}
                                    <div className="flex flex-wrap gap-2">
                                        {editForm.refIds.map((ref, idx) => (
                                            <span
                                                key={ref + idx}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 border text-xs font-medium text-gray-700"
                                            >
                                                {ref}
                                                <button
                                                    onClick={() => removeRefId(ref)}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Product Image</label>
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <div className="w-20 h-20 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                                        {editForm.image ? (
                                            <img
                                                src={
                                                    editForm.image instanceof File
                                                        ? URL.createObjectURL(editForm.image)
                                                        : (editForm.image.startsWith('http') || editForm.image.startsWith('blob:')
                                                            ? editForm.image
                                                            : `http://localhost:4000${editForm.image}`)
                                                }
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Gallery size={24} className="text-gray-300" />
                                        )}


                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer shadow-sm transition-all">
                                            <Plus size={14} /> {editForm.image ? "Change Image" : "Upload Image"}
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
                            <button onClick={handleUpdate} disabled={editLoading} className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 shadow-lg shadow-gray-200 transition-all">
                                {editLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />} Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR CODE MODAL */}
            {isQRModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm"><QrCode className="text-gray-600" size={20} /></div>
                                <div><h3 className="text-md font-bold text-gray-900">Product QR</h3><p className="text-[10px] text-gray-500">Scan for product details</p></div>
                            </div>
                            <button onClick={() => setIsQRModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"><X size={18} /></button>
                        </div>

                        <div className="p-8 flex flex-col items-center justify-center space-y-6">
                            {qrLoading ? (
                                <div className="w-48 h-48 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center">
                                    <div className="w-8 h-8 border-3 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                qrCodeData && (
                                    <>
                                        <div className="bg-white p-4 rounded-3xl shadow-xl border border-gray-100">
                                            <img src={qrCodeData} alt="Product QR Code" className="w-48 h-48" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-gray-900">{qrProduct?.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">ID: {qrProduct?.id}</p>
                                        </div>
                                    </>
                                )
                            )}
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center">
                            <button
                                onClick={downloadQR}
                                disabled={!qrCodeData}
                                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 shadow-lg shadow-gray-200 transition-all"
                            >
                                <Download size={18} /> Download QR Code
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsList;
