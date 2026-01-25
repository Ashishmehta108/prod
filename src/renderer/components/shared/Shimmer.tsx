import { ShimmerSkeleton } from "../Skeleton";
export const ShimmerItem = () => {
  return (
    <div className="px-3 py-2.5 rounded-lg">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
          <ShimmerSkeleton className="h-3 w-3/4 mb-2" />
          <ShimmerSkeleton className="h-3 w-1/2" />
        </div>

        <ShimmerSkeleton className="h-4 w-8 rounded" />
      </div>
    </div>
  );
};

export default ShimmerItem;
