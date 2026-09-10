import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { displayValue } from '../../utils/constants';
import { FoodImage } from '../ui/FoodImage';

function Badge({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-gray-100 text-gray-700',
    red: 'bg-rose-100 text-rose-700',
    orange: 'bg-amber-100 text-amber-800',
    green: 'bg-nexora-100 text-nexora-800',
    blue: 'bg-sky-100 text-sky-800',
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export default function ProductCard({ product, variant = 'list' }) {
  const id = product.id || product.sourceProductId || product.barcode;
  const nutri = product.nutriScore?.toUpperCase?.() || product.nutriScore;
  const novaTone = product.novaGroup >= 4 ? 'red' : product.novaGroup >= 3 ? 'orange' : 'green';

  if (variant === 'grid') {
    return (
      <Link to={`/app/products/${id}`} className="card overflow-hidden transition hover:shadow-md">
        <div className="flex h-36 items-center justify-center bg-nexora-50 p-3">
          <FoodImage
            src={product.imageUrl}
            alt={product.productName || 'Product'}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="space-y-2 p-4">
          <h3 className="line-clamp-2 font-semibold text-ink">
            {displayValue(product.productName, 'Not available in Open Food Facts')}
          </h3>
          <p className="text-sm text-muted">
            {displayValue(product.brand, 'Not available in Open Food Facts')}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/app/products/${id}`}
      className="card flex items-center gap-4 p-3 transition hover:shadow-md sm:p-4"
    >
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-nexora-50 p-2 sm:h-24 sm:w-24">
        <FoodImage
          src={product.imageUrl}
          alt={product.productName || 'Product'}
          className="h-full w-full object-contain"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-bold text-ink">
          {displayValue(product.productName, 'Not available in Open Food Facts')}
        </h3>
        <p className="mt-0.5 text-sm text-muted">
          {displayValue(product.brand, 'Not available in Open Food Facts')}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {product.novaGroup != null ? (
            <Badge tone={novaTone}>NOVA {product.novaGroup}</Badge>
          ) : (
            <Badge>NOVA N/A</Badge>
          )}
          {nutri ? (
            <Badge tone="orange">Nutri-Score {nutri}</Badge>
          ) : (
            <Badge>Nutri-Score N/A</Badge>
          )}
          {product.barcode ? <Badge tone="blue">#{product.barcode}</Badge> : null}
        </div>
      </div>
      <ChevronRight className="hidden h-5 w-5 shrink-0 text-muted sm:block" />
    </Link>
  );
}
