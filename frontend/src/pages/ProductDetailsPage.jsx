import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { productService } from '../services/productService';
import { analysisService } from '../services/analysisService';
import { getErrorMessage } from '../services/api';
import LoadingScreen from '../components/ui/LoadingScreen';
import { displayValue } from '../utils/constants';
import { FoodImage } from '../components/ui/FoodImage';

const NUTRITION_ROWS = [
  ['energyKcal100g', 'Energy / calories', 'kcal'],
  ['fat100g', 'Fat', 'g'],
  ['saturatedFat100g', 'Saturated fat', 'g'],
  ['carbohydrates100g', 'Carbohydrates', 'g'],
  ['sugars100g', 'Sugars', 'g'],
  ['fibre100g', 'Fibre', 'g'],
  ['proteins100g', 'Protein', 'g'],
  ['salt100g', 'Salt', 'g'],
  ['sodium100g', 'Sodium', 'mg'],
];

export default function ProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analysing, setAnalysing] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await productService.getById(productId);
        if (active) setProduct(data.product);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Product not found'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [productId]);

  const runAnalysis = async () => {
    setAnalysing(true);
    try {
      const analysis = await analysisService.analyzeProduct(product.id || productId);
      toast.success('Analysis ready');
      navigate(`/app/analysis/${analysis.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to analyse product'));
    } finally {
      setAnalysing(false);
    }
  };

  if (loading) return <LoadingScreen label="Loading product…" />;
  if (!product) return <p className="text-sm text-muted">Product not available.</p>;

  const nutrition = product.nutrition || {};
  const completeness = product.dataCompleteness?.percentage;

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[280px_1fr]">
          <div className="flex items-center justify-center bg-gradient-to-br from-nexora-50 to-white p-8">
            <FoodImage
              src={product.imageUrl}
              alt={product.productName || 'Product'}
              className="max-h-64 w-full object-contain"
            />
          </div>
          <div className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-nexora-600">
              Open Food Facts
            </p>
            <h1 className="mt-1 text-3xl font-bold text-ink">
              {displayValue(product.productName, 'Not available in Open Food Facts')}
            </h1>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Brand</dt>
                <dd className="font-medium">
                  {displayValue(product.brand, 'Not available in Open Food Facts')}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Category</dt>
                <dd className="font-medium">
                  {displayValue(
                    product.categories?.slice?.(0, 2)?.join(', '),
                    'Not available in Open Food Facts'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Barcode</dt>
                <dd className="font-medium">
                  {displayValue(product.barcode, 'Not available in Open Food Facts')}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Serving size</dt>
                <dd className="font-medium">
                  {displayValue(product.servingSize, 'Not available in Open Food Facts')}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {product.novaGroup != null ? (
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                  NOVA {product.novaGroup}
                </span>
              ) : null}
              {product.nutriScore ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  Nutri-Score {String(product.nutriScore).toUpperCase()}
                </span>
              ) : null}
            </div>
            <p className="mt-4 text-sm text-muted">
              Product information completeness:{' '}
              <span className="font-bold text-ink">
                {completeness != null ? `${completeness}%` : 'Not available'}
              </span>
            </p>
            <button className="btn-primary mt-6 px-8 py-3" onClick={runAnalysis} disabled={analysing}>
              {analysing ? 'Analysing…' : 'Run NEXORA Analysis'}
            </button>
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-bold text-ink">Nutrition</h2>
        <p className="mt-1 text-xs text-muted">Values per 100g when available.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 font-medium">Nutrient</th>
                <th className="py-2 font-medium">Per 100g</th>
              </tr>
            </thead>
            <tbody>
              {NUTRITION_ROWS.map(([key, label, unit]) => (
                <tr key={key} className="border-b border-line/70">
                  <td className="py-2.5">{label}</td>
                  <td className="py-2.5 text-muted">
                    {nutrition[key] != null
                      ? `${nutrition[key]} ${unit}`
                      : 'Not available in Open Food Facts'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="text-xl font-bold text-ink">Ingredients</h2>
        <p className="whitespace-pre-wrap text-sm text-muted">
          {displayValue(product.ingredientsText, 'Not available in Open Food Facts')}
        </p>
        {product.ingredients?.length ? (
          <div className="flex flex-wrap gap-2">
            {product.ingredients.slice(0, 40).map((ing) => (
              <span key={ing} className="rounded-full bg-nexora-50 px-3 py-1 text-xs text-nexora-800">
                {ing}
              </span>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
