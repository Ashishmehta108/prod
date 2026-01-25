import React from "react";
import "../skeletons.css"
export const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`skeleton ${className}`} />
);

export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
    <div className="w-full space-y-4">
        <div className="flex space-x-4 border-b border-gray-100 pb-4">
            {Array.from({ length: cols }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
            ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex space-x-4 py-4 border-b border-gray-50">
                {Array.from({ length: cols }).map((_, j) => (
                    <Skeleton key={j} className="h-4 flex-1" />
                ))}
            </div>
        ))}
    </div>
);


export const ProductsPageSkeleton = () => {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            {/* HEADER */}
            <div className="px-6 py-5 border-b border-gray-100 space-y-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-11 h-11 rounded-2xl" />

                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>

                    <div className="w-[360px]">
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                </div>

                {/* FILTERS ROW */}
                <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[220px] space-y-1">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>

                    <div className="min-w-[180px] space-y-1">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>

                    <div className="min-w-[140px] space-y-1">
                        <Skeleton className="h-3 w-10" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>

                    <div className="min-w-[160px] space-y-1">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>

                    <Skeleton className="h-10 w-16 rounded-lg" />
                </div>
            </div>

            {/* TABLE */}
            <div className="p-6">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50/80">
                            <th className="px-4 py-4 text-left rounded-l-xl">
                                <Skeleton className="h-3 w-12" />
                            </th>
                            <th className="px-4 py-4 text-left">
                                <Skeleton className="h-3 w-24" />
                            </th>
                            <th className="px-4 py-4 text-left">
                                <Skeleton className="h-3 w-16" />
                            </th>
                            <th className="px-4 py-4 text-left">
                                <Skeleton className="h-3 w-10" />
                            </th>
                            <th className="px-4 py-4 text-right">
                                <Skeleton className="h-3 w-24 ml-auto" />
                            </th>
                            <th className="px-4 py-4 text-right">
                                <Skeleton className="h-3 w-20 ml-auto" />
                            </th>
                            <th className="px-4 py-4 text-center rounded-r-xl">
                                <Skeleton className="h-3 w-16 mx-auto" />
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <tr key={i}>
                                {/* Image */}
                                <td className="px-4 py-4">
                                    <Skeleton className="w-11 h-11 rounded-xl" />
                                </td>

                                {/* Part Details */}
                                <td className="px-4 py-4">
                                    <Skeleton className="h-4 w-40 mb-2" />
                                    <div className="flex items-center gap-1">
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                        <Skeleton className="h-5 w-14 rounded-full" />
                                    </div>
                                    <Skeleton className="h-3 w-32 mt-1" />
                                </td>

                                {/* Category */}
                                <td className="px-4 py-4">
                                    <Skeleton className="h-3 w-20" />
                                </td>

                                {/* Unit */}
                                <td className="px-4 py-4">
                                    <Skeleton className="h-3 w-12" />
                                </td>

                                {/* Current Stock */}
                                <td className="px-4 py-4 text-right">
                                    <Skeleton className="h-4 w-12 ml-auto" />
                                </td>

                                {/* Min Level */}
                                <td className="px-4 py-4 text-right">
                                    <Skeleton className="h-3 w-10 ml-auto" />
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <Skeleton className="w-7 h-7 rounded-lg" />
                                        <Skeleton className="w-7 h-7 rounded-lg" />
                                        <Skeleton className="w-7 h-7 rounded-lg" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export const StatsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <Skeleton className="w-16 h-4" />
                </div>
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-3 w-32" />
            </div>
        ))}
    </div>
);
export const DashboardGridSkeleton = () => (
    <div className="min-h-full bg-neutral-50/50 px-6 py-6 md:px-8 md:py-7">
        <div className="max-w-[1400px] mx-auto space-y-8">
            {/* Breadcrumb Navigation Skeleton */}
            <nav className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="w-1 h-3" />
                <Skeleton className="h-3 w-20" />
            </nav>

            {/* Header Section Skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-4 w-80" />
            </div>

            {/* Stats Grid Skeleton - 2 Column Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                {/* Total Products Card Skeleton */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 p-7">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-6">
                            <div className="flex items-center gap-3.5">
                                <Skeleton className="w-11 h-11 rounded-xl" />
                                <Skeleton className="h-3 w-28" />
                            </div>
                            <div className="space-y-1.5">
                                <Skeleton className="h-11 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Low Stock Card Skeleton */}
                <div className="bg-white rounded-2xl border border-neutral-200/80 p-7">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-6">
                            <div className="flex items-center gap-3.5">
                                <Skeleton className="w-11 h-11 rounded-xl" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <div className="space-y-1.5">
                                <Skeleton className="h-11 w-24" />
                                <Skeleton className="h-3 w-40" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stock Status Table Skeleton */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 py-3 border-b border-neutral-100 last:border-0">
                            <Skeleton className="w-10 h-10 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-3 w-1/4" />
                            </div>
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);



interface SkeletonProps {
    className?: string;
}

export const ShimmerSkeleton = ({ className = "" }: SkeletonProps) => {
    return (
        <div
            aria-hidden
            className={`relative overflow-hidden rounded-md bg-gray-100 dark:bg-neutral-800 shadow-inner-subtle ${className}`}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent animate-shimmer-wave" />
        </div>
    );
};

export default Skeleton;
