import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { productService } from '../services/productService';
import { getErrorMessage } from '../services/api';
import ProductCard from '../components/products/ProductCard';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get('q') || '';
  const [query, setQuery] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const runSearch = async (q) => {
    if (!q.trim()) {
      toast.error('Enter a product name, brand, or barcode');
      return;
    }
    setLoading(true);
    setParams({ q: q.trim() });
    try {
      const data = await productService.search(q.trim());
      setResults(data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Search failed'));
      setResults({ products: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initial) runSearch(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Search Product</h1>
        <p className="mt-2 text-sm text-muted">
          Live results from Open Food Facts via the NEXORA API.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          className="input"
          placeholder="Product name, brand, or barcode"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn-primary sm:w-36" disabled={loading}>
          <Search className="h-4 w-4" />
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : null}

      {!loading && results ? (
        results.products?.length ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Showing {results.products.length} result(s)
              {results.count ? ` of ${results.count}` : ''}
            </p>
            {results.products.map((p) => (
              <ProductCard key={p.id || p.barcode || p.sourceProductId} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No products found"
            description="Try another name, brand, or barcode."
          />
        )
      ) : null}
    </div>
  );
}
