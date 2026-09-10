import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Send,
  Share2,
  Bookmark,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { analysisService } from '../services/analysisService';
import { chatService } from '../services/chatService';
import { getErrorMessage } from '../services/api';
import LoadingScreen from '../components/ui/LoadingScreen';
import { ScoreRing, suitabilityLabel } from '../components/ui/ScoreRing';
import { displayValue } from '../utils/constants';
import { FoodImage } from '../components/ui/FoodImage';

const TABS = [
  'Overview',
  'Nutrition',
  'Ingredients',
  'Verification',
  'Scores',
  'Recommendations',
  'Ask Nexora',
];

const SUGGESTED = [
  'Why did this product get this score?',
  'Why is this product not suitable for me?',
  'Is the sugar level high?',
  'What are the main concerns with this product?',
  'Suggest better alternatives',
];

function StatusIcon({ status }) {
  if (status === 'match') return <CheckCircle2 className="h-4 w-4 text-nexora-600" />;
  if (status === 'partial_match') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  if (status === 'mismatch') return <XCircle className="h-4 w-4 text-rose-500" />;
  return <HelpCircle className="h-4 w-4 text-muted" />;
}

export default function AnalysisPage() {
  const { analysisId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Overview');
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const analysis = await analysisService.getById(analysisId);
        if (!active) return;
        setData(analysis);
        const history = await chatService.history(analysisId);
        if (active) setMessages(history.messages || []);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Unable to load analysis'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [analysisId]);

  const ask = async (q) => {
    const text = (q || question).trim();
    if (!text) return;
    setAsking(true);
    setQuestion('');
    setTab('Ask Nexora');
    try {
      const res = await chatService.ask({
        analysisId,
        productId: data?.product?.id,
        question: text,
      });
      setMessages(res.messages || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Ask Nexora failed'));
    } finally {
      setAsking(false);
    }
  };

  const matchConfidence = useMemo(() => {
    const comps = data?.verification?.comparisons || [];
    if (!comps.length) return null;
    const scored = comps.filter((c) => c.status === 'match' || c.status === 'partial_match');
    return Math.round((scored.length / comps.length) * 100);
  }, [data]);

  if (loading) return <LoadingScreen label="Loading analysis…" />;
  if (!data) return <p className="text-sm text-muted">Analysis not found.</p>;

  const overall = data.overallScore || {};
  const personalized = data.personalizedScore || {};
  const product = data.product || {};
  const nutrition = product.nutrition || {};
  const recommendations = data.recommendationSummary?.recommendations || [];
  const breakdown = Object.entries(overall.breakdown || {});

  return (
    <div className="space-y-6">
      <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-nexora-50 p-2">
          <FoodImage
            src={product.imageUrl}
            alt={product.productName || 'Product'}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-ink md:text-3xl">
            {displayValue(product.productName, 'Product analysis')}
          </h1>
          <p className="mt-1 text-sm text-muted">{displayValue(product.brand)}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {product.novaGroup != null ? (
              <span className="rounded-full bg-rose-100 px-2.5 py-1 font-semibold text-rose-700">
                NOVA {product.novaGroup}
              </span>
            ) : null}
            {product.nutriScore ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-800">
                Nutri-Score {String(product.nutriScore).toUpperCase()}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={() => toast.success('Saved in history')}>
            <Bookmark className="h-4 w-4" /> Save
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast.success('Link copied');
            }}
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t
                ? 'bg-nexora-500 text-white'
                : 'bg-white text-muted ring-1 ring-line hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card flex justify-center p-6">
              <ScoreRing
                score={overall.score}
                label="Overall Food Score"
                sublabel={
                  overall.score == null
                    ? 'Insufficient data'
                    : overall.score >= 70
                      ? 'Looking good'
                      : 'Needs attention'
                }
              />
            </div>
            <div className="card flex justify-center p-6">
              <ScoreRing
                score={personalized.personalizedScore}
                label="Your NEXORA Score"
                sublabel={suitabilityLabel(
                  personalized.suitability,
                  personalized.personalizedScore
                )}
              />
            </div>
          </div>

          {personalized.allergyConflict ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              Potential allergy conflict detected.
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="card p-5">
              <h3 className="font-bold text-rose-600">Key Concerns</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {(overall.concerns || data.explanation?.negativeFactors || []).length ? (
                  (overall.concerns || data.explanation?.negativeFactors || []).map((c) => (
                    <li key={c} className="flex gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                      {c}
                    </li>
                  ))
                ) : (
                  <li>Not available</li>
                )}
              </ul>
            </div>
            <div className="card p-5">
              <h3 className="font-bold text-nexora-600">Strengths</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {(overall.strengths || data.explanation?.positiveFactors || []).length ? (
                  (overall.strengths || data.explanation?.positiveFactors || []).map((c) => (
                    <li key={c} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-nexora-500" />
                      {c}
                    </li>
                  ))
                ) : (
                  <li>Not available</li>
                )}
              </ul>
            </div>
            <div className="card bg-nexora-50 p-5">
              <h3 className="font-bold text-ink">Consider Alternatives</h3>
              <p className="mt-3 text-sm text-muted">
                {recommendations.length
                  ? `${recommendations.length} better-for-you option(s) found based on your preferences.`
                  : data.recommendationSummary?.explanation ||
                    'No suitable alternative was found in the available product database.'}
              </p>
              <button
                type="button"
                className="btn-primary mt-4"
                onClick={() => setTab('Recommendations')}
              >
                View alternatives
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'Nutrition' ? (
        <div className="card overflow-x-auto p-5">
          <h2 className="text-xl font-bold text-ink">Nutrition (per 100g)</h2>
          <table className="mt-4 w-full text-left text-sm">
            <tbody>
              {[
                ['Energy', nutrition.energyKcal100g, 'kcal'],
                ['Fat', nutrition.fat100g, 'g'],
                ['Saturated fat', nutrition.saturatedFat100g, 'g'],
                ['Carbohydrates', nutrition.carbohydrates100g, 'g'],
                ['Sugars', nutrition.sugars100g, 'g'],
                ['Fibre', nutrition.fibre100g, 'g'],
                ['Protein', nutrition.proteins100g, 'g'],
                ['Salt', nutrition.salt100g, 'g'],
                ['Sodium', nutrition.sodium100g, 'mg'],
              ].map(([label, value, unit]) => (
                <tr key={label} className="border-b border-line">
                  <td className="py-3 font-medium text-ink">{label}</td>
                  <td className="py-3 text-muted">
                    {value != null ? `${value} ${unit}` : 'Not available in Open Food Facts'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'Ingredients' ? (
        <div className="card space-y-4 p-5">
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
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <p className="font-semibold text-ink">Additives</p>
              <p className="text-muted">
                {product.additives?.length
                  ? product.additives.join(', ')
                  : 'Not available in Open Food Facts'}
              </p>
            </div>
            <div>
              <p className="font-semibold text-ink">Allergens</p>
              <p className="text-muted">
                {product.allergens?.length
                  ? product.allergens.join(', ')
                  : 'Not available in Open Food Facts'}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'Verification' ? (
        data.verification ? (
          <div className="card space-y-5 p-5">
            <h2 className="text-xl font-bold text-ink">OCR Verification</h2>
            {(data.verification.lowConfidenceWarning ||
              data.verification.ocrConfidence === 'low') && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Low OCR confidence — please verify this information manually.
              </p>
            )}
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <h3 className="font-semibold text-ink">Package data (OCR)</h3>
                <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-surface p-3 text-xs text-muted">
                  {JSON.stringify(data.verification.packageData || {}, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold text-ink">Open Food Facts data</h3>
                <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-surface p-3 text-xs text-muted">
                  {JSON.stringify(data.verification.databaseData || {}, null, 2)}
                </pre>
              </div>
            </div>
            <ul className="space-y-2">
              {(data.verification.comparisons || []).map((c) => (
                <li
                  key={c.field}
                  className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5 text-sm"
                >
                  <span className="capitalize font-medium text-ink">
                    {c.field.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span className="flex items-center gap-2 capitalize text-muted">
                    <StatusIcon status={c.status} />
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </li>
              ))}
            </ul>
            {matchConfidence != null ? (
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold text-ink">Overall Match Confidence</span>
                  <span className="text-nexora-600">{matchConfidence}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-nexora-500 transition-all"
                    style={{ width: `${matchConfidence}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="card p-8 text-center text-sm text-muted">
            No OCR verification for this analysis. Upload a package image to compare.
            <div className="mt-4">
              <Link to="/app/upload" className="btn-primary">
                Upload image
              </Link>
            </div>
          </div>
        )
      ) : null}

      {tab === 'Scores' ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card flex justify-center p-6">
              <ScoreRing score={overall.score} label="Overall Food Score" />
            </div>
            <div className="card flex justify-center p-6">
              <ScoreRing score={personalized.personalizedScore} label="Your NEXORA Score" />
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-bold text-ink">Score breakdown</h3>
            <div className="mt-4 space-y-3">
              {breakdown.length ? (
                breakdown.map(([name, value]) => (
                  <div key={name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="capitalize text-ink">{name}</span>
                      <span className="font-semibold text-muted">{value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-nexora-500"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">Not available</p>
              )}
            </div>
            <div className="mt-6">
              <h3 className="font-bold text-ink">Why this score?</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                {(data.explanation?.personalizedFactors || []).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted">{data.explanation?.disclaimer}</p>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'Recommendations' ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-ink">Better For You Alternatives</h2>
          <p className="text-sm text-muted">
            {data.recommendationSummary?.explanation ||
              'Alternatives ranked from Open Food Facts using your preferences.'}
          </p>
          {recommendations.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((rec) => (
                <article key={rec.product?.id || rec.product?.barcode} className="card overflow-hidden">
                  <div className="relative flex h-36 items-center justify-center bg-nexora-50 p-3">
                    <FoodImage
                      src={rec.product?.imageUrl}
                      alt={rec.product?.productName || 'Alternative'}
                      className="h-full w-full object-contain"
                    />
                    {rec.overallScore != null ? (
                      <span className="absolute right-3 top-3 rounded-full bg-nexora-500 px-2.5 py-1 text-xs font-bold text-white">
                        {rec.overallScore}
                      </span>
                    ) : null}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-ink">
                      {displayValue(rec.product?.productName, 'Not available')}
                    </h3>
                    <p className="text-sm text-muted">{displayValue(rec.product?.brand)}</p>
                    <ul className="mt-3 space-y-1.5 text-sm text-muted">
                      {(rec.reasons || [rec.reason]).filter(Boolean).slice(0, 3).map((r) => (
                        <li key={r} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-nexora-500" />
                          {r}
                        </li>
                      ))}
                    </ul>
                    {rec.product?.id ? (
                      <Link
                        to={`/app/products/${rec.product.id}`}
                        className="mt-4 inline-block text-sm font-semibold text-nexora-600"
                      >
                        View product
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center text-sm text-muted">
              No suitable alternative was found in the available product database.
            </div>
          )}
        </div>
      ) : null}

      {tab === 'Ask Nexora' ? (
        <div className="card overflow-hidden">
          <div className="border-b border-line bg-nexora-50 px-5 py-4">
            <h2 className="text-xl font-bold text-ink">Ask Nexora</h2>
            <p className="text-sm text-muted">
              Ask questions about this product and its analysis.
            </p>
          </div>
          <div className="max-h-96 space-y-3 overflow-y-auto bg-white p-5">
            {messages.filter((m) => m.role !== 'system').length ? (
              messages
                .filter((m) => m.role !== 'system')
                .map((m, idx) => (
                  <div
                    key={`${m.role}-${idx}`}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'ml-auto bg-nexora-500 text-white'
                        : 'mr-auto border border-line bg-surface text-ink'
                    }`}
                  >
                    {m.content}
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted">No messages yet. Try a suggested question.</p>
            )}
            {asking ? <p className="text-sm text-muted">Nexora is thinking…</p> : null}
          </div>
          <div className="space-y-3 border-t border-line p-4">
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:border-nexora-300"
                  onClick={() => ask(s)}
                  disabled={asking}
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                ask();
              }}
            >
              <input
                className="input"
                placeholder="Ask about this analysis…"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <button className="btn-primary" disabled={asking} type="submit" aria-label="Send">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted">
        Completeness:{' '}
        {data.dataCompleteness?.percentage != null
          ? `${data.dataCompleteness.percentage}%`
          : 'Not available'}{' '}
        · Confidence: {displayValue(data.confidence?.label)} ·{' '}
        <Link to={`/app/products/${product.id}`} className="font-semibold text-nexora-600">
          Product details
        </Link>
      </p>
    </div>
  );
}
