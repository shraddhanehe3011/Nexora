export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-nexora-100/80 ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="card p-4">
      <Skeleton className="mb-3 h-32 w-full" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
