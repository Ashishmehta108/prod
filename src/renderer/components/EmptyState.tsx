import React from "react";
import { Package, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EmptyProductsState: React.FC<{
}> = () => {
    const navigate = useNavigate()
    const onButtonClick = async () => {
        navigate("/products/add")
    }
    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Plus size={18} className="text-gray-700" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">Add Products</h3>
                        <p className="text-xs text-gray-500">Record incoming inventory</p>
                    </div>
                </div>
            </div>

            <div className="p-5">
                <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                        <Package size={28} className="text-gray-300" />
                    </div>

                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                        No Products Available
                    </h4>

                    <p className="text-xs text-gray-500 text-center max-w-xs mb-4">
                        Create your first product to start tracking incoming inventory
                    </p>

                    <button onClick={onButtonClick} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded hover:bg-gray-800 transition-colors">
                        <Plus size={14} />
                        <span>Add Product</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmptyProductsState;