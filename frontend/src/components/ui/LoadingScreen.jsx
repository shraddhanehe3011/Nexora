export default function LoadingScreen({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8" role="status">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-nexora-200 border-t-nexora-600" />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
