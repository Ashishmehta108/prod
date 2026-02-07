import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { Layers, Plus, Trash2, Edit, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Ripple from "../components/shared/Ripple";

interface Category {
    _id: string;
    name: string;
    description?: string;
    isActive: boolean;
}

const CategoriesPage: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: "",
        description: "",
    });

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await api.get("/categories");
            setCategories(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return toast.error("Name is required");

        try {
            setSubmitting(true);
            if (editingId) {
                await api.put(`/categories/${editingId}`, form);
                toast.success("Category updated");
            } else {
                await api.post("/categories", form);
                toast.success("Category created");
            }
            setForm({ name: "", description: "" });
            setEditingId(null);
            fetchCategories();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (cat: Category) => {
        setEditingId(cat._id);
        setForm({ name: cat.name, description: cat.description || "" });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This won't affect existing products.")) return;
        try {
            await api.delete(`/categories/${id}`);
            toast.success("Category deleted");
            fetchCategories();
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">Product Categories</h1>
                    <p className="text-sm text-neutral-500">Manage and organize your product groups</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-neutral-300 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-neutral-50 border-b border-neutral-300 px-6 py-4">
                            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                                {editingId ? "Edit Category" : "New Category"}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Name *</label>
                                <input
                                    type="text"
                                    className="w-full h-10 bg-neutral-50 border border-neutral-300 px-3 text-sm rounded-lg focus:outline-none focus:border-neutral-900 transition-colors"
                                    placeholder="e.g. Raw Materials"
                                    value={form.name}
                                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Description</label>
                                <textarea
                                    className="w-full bg-neutral-50 border border-neutral-300 px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-neutral-900 transition-colors resize-none"
                                    rows={3}
                                    placeholder="Optional details..."
                                    value={form.description}
                                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 h-10 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 size={16} className="animate-spin" /> : editingId ? <Save size={16} /> : <Plus size={16} />}
                                    {editingId ? "Update" : "Create"}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => { setEditingId(null); setForm({ name: "", description: "" }); }}
                                        className="h-10 px-4 border border-neutral-300 text-neutral-600 rounded-lg hover:bg-neutral-50"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-neutral-300 rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-neutral-50 border-b border-neutral-300 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Existing Categories</h2>
                            <span className="text-[10px] font-bold bg-neutral-200 px-2 py-0.5 rounded text-neutral-600 uppercase tracking-widest leading-normal mb-[-2px]">
                                {categories.length} Total
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-neutral-50/50 border-b border-neutral-200">
                                        <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={2} className="px-6 py-12 text-center">
                                                <Loader2 className="animate-spin mx-auto text-neutral-300" size={32} />
                                            </td>
                                        </tr>
                                    ) : categories.length === 0 ? (
                                        <tr>
                                            <td colSpan={2} className="px-6 py-12 text-center text-neutral-400 text-sm italic">
                                                No categories found. Create one to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        categories.map((cat) => (
                                            <tr key={cat._id} className="hover:bg-neutral-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-neutral-900 text-sm">{cat.name}</div>
                                                    {cat.description && <div className="text-xs text-neutral-500 mt-0.5">{cat.description}</div>}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(cat)}
                                                            className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(cat._id)}
                                                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoriesPage;
