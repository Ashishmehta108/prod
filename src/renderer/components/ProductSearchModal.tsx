import React, { useState, useEffect } from "react";
import { X, Search, Package, Hash, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../api/client";

interface Product {
    id: string;
    name: string;
    image?: string;
    refIds: string[];
    category?: string;
    currentStock: number;
    unit: string;
}

interface Meta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (productId: string) => void;
}

const PAGE_SIZE = 10;

export const ProductSearchModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onSelect,
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    /* -------------------- Load on open -------------------- */
    useEffect(() => {
        if (isOpen) {
            setPage(1);
            fetchProducts("", 1);
        } else {
            setSearchTerm("");
            setProducts([]);
            setMeta(null);
        }
    }, [isOpen]);

    /* -------------------- Debounced search -------------------- */
    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            setPage(1);
            fetchProducts(searchTerm, 1);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchProducts = async (search: string, pageToLoad: number) => {
        try {
            setLoading(true);

            const res = await api.get("/products", {
                params: {
                    search: search || undefined,
                    page: pageToLoad,
                    limit: PAGE_SIZE,
                },
            });

            setProducts(res.data.data || []);
            setMeta(res.data.meta || null);
        } catch (err) {
            console.error("Failed to fetch products:", err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const goToPage = (newPage: number) => {
        if (!meta) return;
        if (newPage < 1 || newPage > meta.totalPages) return;

        setPage(newPage);
        fetchProducts(searchTerm, newPage);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-erp-border">

                {/* Header */}
                <div className="px-6 py-4 border-b border-erp-border flex items-center justify-between bg-erp-surface">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-erp-accent/10 flex items-center justify-center border border-erp-accent/20">
                            <Package size={20} className="text-erp-accent" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-neutral-900">
                                Find Product
                            </h3>
                            <p className="text-xs text-erp-text-secondary mt-1">
                                Search by name or reference ID
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-erp-surface-muted rounded-full text-erp-text-secondary hover:text-neutral-900"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-erp-border bg-white">
                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-erp-text-secondary"
                        />
                        <input
                            autoFocus
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Start typing product name or reference ID..."
                            className="w-full pl-11 pr-4 py-3 bg-erp-surface-muted border border-erp-border rounded-lg text-sm focus:ring-2 focus:ring-erp-accent/20"
                        />
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-2">
                    {loading && products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-8 h-8 border-3 border-erp-accent/20 border-t-erp-accent rounded-full animate-spin" />
                            <p className="text-xs text-erp-text-secondary mt-3">
                                Searching products...
                            </p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Search size={24} className="text-erp-text-secondary mb-2" />
                            <h4 className="text-sm font-semibold text-neutral-900">
                                No products found
                            </h4>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-1">
                            {products.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => {
                                        onSelect(product.id);
                                        onClose();
                                    }}
                                    className="w-full flex items-center gap-4 p-3 hover:bg-erp-surface-muted rounded-lg text-left border border-transparent hover:border-erp-border"
                                >
                                    <div className="w-12 h-12 border rounded-lg overflow-hidden">
                                        {product.image ? (
                                            <img
                                                src={`http://localhost:4000${product.image}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-erp-surface-muted">
                                                <Package size={18} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm truncate">
                                            {product.name}
                                        </h4>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {product.refIds?.map((ref, i) => (
                                                <span
                                                    key={i}
                                                    className="text-[10px] px-2 py-0.5 bg-neutral-100 border rounded font-bold flex items-center gap-1"
                                                >
                                                    <Hash size={10} /> {ref}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-[10px] uppercase text-erp-text-secondary">
                                            Stock
                                        </div>
                                        <div
                                            className={`text-sm font-bold ${product.currentStock > 0
                                                    ? "text-neutral-900"
                                                    : "text-red-500"
                                                }`}
                                        >
                                            {product.currentStock} {product.unit}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {meta && meta.totalPages > 1 && (
                    <div className="px-6 py-3 border-t bg-erp-surface flex items-center justify-between text-xs">
                        <button
                            disabled={page === 1}
                            onClick={() => goToPage(page - 1)}
                            className="flex items-center gap-1 px-3 py-1 border rounded disabled:opacity-40"
                        >
                            <ChevronLeft size={14} /> Prev
                        </button>

                        <span className="font-bold">
                            Page {meta.page} of {meta.totalPages}
                        </span>

                        <button
                            disabled={page === meta.totalPages}
                            onClick={() => goToPage(page + 1)}
                            className="flex items-center gap-1 px-3 py-1 border rounded disabled:opacity-40"
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
