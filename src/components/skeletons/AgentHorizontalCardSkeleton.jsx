import { Skeleton } from "@/components/ui/skeleton";

const AgentHorizontalCardSkeleton = () => {
  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-lg">
      <div className="flex flex-col gap-6 md:flex-row md:items-stretch">
        {/* Agent Image Section Skeleton */}
        <div className="w-full md:w-[240px] h-[240px] md:h-[240px] rounded-2xl overflow-hidden flex-shrink-0 relative">
          <Skeleton className="h-full w-full rounded-2xl" />
        </div>

        {/* Agent Details Section Skeleton */}
        <div className="flex w-full flex-1 flex-col justify-between">
          <div className="w-full">
            {/* Header Section Skeleton */}
            <div className="flex items-center justify-between gap-4 w-full pb-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>

            {/* Separator Skeleton */}
            <div className="w-full border-b border-gray-100 mb-4" />

            {/* Contact Information Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-3/4 max-w-[160px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Section Skeleton */}
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 mt-6 border-t pt-4">
            {/* Social Links Skeleton */}
            <div className="flex items-center gap-3">
              {[...Array(4)].map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-9 w-9 rounded-full"
                />
              ))}
            </div>

            {/* Chat Button Skeleton */}
            <Skeleton className="h-10 w-44 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentHorizontalCardSkeleton;
