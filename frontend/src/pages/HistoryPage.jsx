import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { historyService } from '../services/historyService';
import { getErrorMessage } from '../services/api';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import { displayValue } from '../utils/constants';

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await historyService.list({ search });
        if (active) setItems(data.items || []);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Unable to load history'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Analysis History</h1>
        <p className="mt-2 text-sm text-muted">Saved analyses from your account in MongoDB.</p>
      </div>

      <input
        className="input max-w-md"
        placeholder="Search by product or brand"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search history"
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : items.length ? (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={`/app/analysis/${item.analysisId}`}
                className="card flex gap-4 p-4 transition hover:shadow-md"
              >
                <div className="h-20 w-20 shrink-0 rounded-xl bg-nexora-50">
                  {item.product?.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt=""
                      className="h-full w-full object-contain p-2"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold text-ink">
                    {displayValue(item.product?.productName, 'Unknown product')}
                  </h2>
                  <p className="text-sm text-muted">
                    {item.date ? new Date(item.date).toLocaleString() : 'Not available'}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    Overall: {displayValue(item.overallScore)} · Personalized:{' '}
                    {displayValue(item.personalizedScore)} · Status: {item.status}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No analyses yet"
          description="Search or scan a product to create your first analysis."
          action={
            <Link to="/app/search" className="btn-primary">
              Search products
            </Link>
          }
        />
      )}
    </div>
  );
}
