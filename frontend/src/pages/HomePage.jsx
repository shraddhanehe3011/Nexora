import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ScanLine, Upload, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { historyService } from '../services/historyService';
import { FoodImage } from '../components/ui/FoodImage';
import { displayValue } from '../utils/constants';

const actions = [
  {
    to: '/app/search',
    title: 'Search Product',
    text: 'Find by name, brand or barcode',
    icon: Search,
    tone: 'bg-nexora-50 text-nexora-600',
  },
  {
    to: '/app/scan',
    title: 'Scan Barcode',
    text: 'Use camera or enter code',
    icon: ScanLine,
    tone: 'bg-sky-50 text-sky-600',
  },
  {
    to: '/app/upload',
    title: 'Upload Image',
    text: 'OCR package label analysis',
    icon: Upload,
    tone: 'bg-amber-50 text-amber-600',
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    historyService
      .list({ limit: 8 })
      .then((data) => setRecent(data.items || []))
      .catch(() => setRecent([]));
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/app/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-ink md:text-4xl">
          Welcome back, {user?.username || 'there'}!
        </h1>
        <p className="mt-2 text-sm text-muted">
          Search, scan, or upload a packaged food to get your personalized NEXORA analysis.
        </p>
      </section>

      <form onSubmit={onSearch} className="flex gap-2 md:hidden">
        <input
          className="input"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn-primary" type="submit">
          <Search className="h-4 w-4" />
        </button>
      </form>

      <section className="grid gap-4 sm:grid-cols-3">
        {actions.map(({ to, title, text, icon: Icon, tone }) => (
          <Link
            key={to}
            to={to}
            className="card group p-6 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tone}`}>
              <Icon className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-lg font-bold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-muted">{text}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-nexora-600 opacity-0 transition group-hover:opacity-100">
              Open <ChevronRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Recent Analyses</h2>
          <Link to="/app/history" className="text-sm font-semibold text-nexora-600">
            View all
          </Link>
        </div>

        {recent.length ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recent.map((item) => (
              <Link
                key={item.id}
                to={`/app/analysis/${item.analysisId}`}
                className="card w-44 shrink-0 overflow-hidden transition hover:shadow-md"
              >
                <div className="flex h-28 items-center justify-center bg-nexora-50 p-3">
                  <FoodImage
                    src={item.product?.imageUrl}
                    alt={item.product?.productName || 'Product'}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-semibold text-ink">
                    {displayValue(item.product?.productName, 'Unknown product')}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Score {displayValue(item.overallScore)} · You {displayValue(item.personalizedScore)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card px-5 py-8 text-center text-sm text-muted">
            No analyses yet. Start by searching a product.
          </div>
        )}
      </section>
    </div>
  );
}
