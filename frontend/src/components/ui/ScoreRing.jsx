export function ScoreRing({ score, size = 140, stroke = 10, label, sublabel, tone }) {
  const value = score == null ? 0 : Math.max(0, Math.min(100, score));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const autoTone =
    score == null ? 'muted' : score >= 70 ? 'good' : score >= 45 ? 'warn' : 'bad';
  const t = tone || autoTone;
  const colors = {
    good: '#22c55e',
    warn: '#f59e0b',
    bad: '#ef4444',
    muted: '#d1d5db',
  };
  const textColors = {
    good: 'text-nexora-600',
    warn: 'text-amber-600',
    bad: 'text-rose-600',
    muted: 'text-muted',
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors[t]}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={score == null ? circumference : offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className={`text-3xl font-bold ${textColors[t]}`}>
            {score != null ? score : '—'}
            <span className="text-sm font-medium text-muted">/100</span>
          </p>
        </div>
      </div>
      {label ? <p className="mt-3 text-sm font-semibold text-ink">{label}</p> : null}
      {sublabel ? <p className={`text-xs font-medium ${textColors[t]}`}>{sublabel}</p> : null}
    </div>
  );
}

export function suitabilityLabel(suitability, score) {
  if (suitability === 'avoid_due_to_allergen_conflict') return 'Allergy conflict';
  if (suitability === 'excellent_match' || score >= 80) return 'Excellent match';
  if (suitability === 'good_match' || score >= 65) return 'Good match';
  if (suitability === 'moderate_match' || score >= 45) return 'Moderate';
  if (suitability === 'poor_match' || (score != null && score < 45)) return 'Not suitable';
  if (score == null) return 'Insufficient data';
  if (score >= 70) return 'Looking good';
  if (score >= 45) return 'Needs attention';
  return 'Needs attention';
}
