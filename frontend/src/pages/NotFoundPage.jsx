import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <p className="text-sm font-semibold text-nexora-700">404</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-muted">The page you requested does not exist.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to NEXORA
      </Link>
    </div>
  );
}
