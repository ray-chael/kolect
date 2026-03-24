import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionSlugLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-12">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1fr_420px]">
        {/* Image gallery */}
        <div className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-20 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Product details + purchase panel */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-9 w-1/2" />
          </div>

          <div className="space-y-1">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-5 w-24" />
          </div>

          <div className="space-y-2 rounded-xl border p-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>

          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
