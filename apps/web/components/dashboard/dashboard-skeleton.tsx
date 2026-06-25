import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6 md:px-6 md:py-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-44 lg:col-span-2" />
        <Skeleton className="h-44" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[minmax(220px,auto)]">
        <Skeleton className="md:row-span-2" />
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
        <Skeleton className="h-56 md:col-span-2" />
        <Skeleton className="h-56" />
      </div>

      <Skeleton className="h-64" />
    </div>
  )
}
