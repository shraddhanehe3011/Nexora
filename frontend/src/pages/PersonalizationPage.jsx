import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AGE_GROUP_OPTIONS,
  ALLERGY_OPTIONS,
  DIETARY_OPTIONS,
  GOAL_OPTIONS,
  HEALTH_OPTIONS,
} from '../utils/constants';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import Logo from '../components/ui/Logo';
import { FoodImage } from '../components/ui/FoodImage';
import { VEG_CIRCLE_IMG } from '../utils/images';

const STEPS = [
  { key: 'basic', title: 'Your Basic Profile', subtitle: 'Tell us your age group' },
  { key: 'diet', title: 'Dietary Preference', subtitle: 'How do you usually eat?' },
  { key: 'health', title: 'Health Preferences', subtitle: 'Awareness preferences only — not diagnosis' },
  { key: 'allergies', title: 'Allergies', subtitle: 'Select anything you need us to watch for' },
  { key: 'goals', title: 'Nutrition Goals', subtitle: 'What matters most in your food choices?' },
  { key: 'review', title: 'Review & Finish', subtitle: 'Confirm your personalization' },
];

function ChipGroup({ options, values, onChange, multiple = true }) {
  const toggle = (value) => {
    if (!multiple) {
      onChange([value]);
      return;
    }
    if (value === 'none') {
      onChange(['none']);
      return;
    }
    const withoutNone = values.filter((v) => v !== 'none');
    if (withoutNone.includes(value)) onChange(withoutNone.filter((v) => v !== value));
    else onChange([...withoutNone, value]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = values.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`chip ${active ? 'chip-active' : 'hover:border-nexora-300'}`}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function PersonalizationPage() {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ageGroup: user?.profile?.ageGroup || '',
    dietaryPreference: user?.profile?.dietaryPreference || '',
    healthPreferences: user?.profile?.healthPreferences || [],
    allergies: user?.profile?.allergies || [],
    nutritionGoals: user?.profile?.nutritionGoals || [],
    otherPreferences: user?.profile?.otherPreferences || '',
  });

  const canNext = useMemo(() => {
    if (step === 0) return Boolean(form.ageGroup);
    if (step === 1) return Boolean(form.dietaryPreference);
    if (step === 2) return form.healthPreferences.length > 0;
    if (step === 3) return true;
    if (step === 4) return form.nutritionGoals.length > 0;
    return (
      form.ageGroup &&
      form.dietaryPreference &&
      form.healthPreferences.length > 0 &&
      form.nutritionGoals.length > 0
    );
  }, [form, step]);

  const submit = async () => {
    if (!canNext) {
      toast.error('Please complete the required fields');
      return;
    }
    setSaving(true);
    try {
      await userService.updateProfile(form);
      await refreshUser();
      toast.success('Personalization saved');
      navigate('/app');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to save profile'));
    } finally {
      setSaving(false);
    }
  };

  const current = STEPS[step];

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Logo />
          <div className="card mt-6 p-6 md:p-8">
            <div className="mb-8 flex items-center justify-between gap-2 overflow-x-auto">
              {STEPS.map((s, i) => (
                <div key={s.key} className="flex min-w-[2.5rem] flex-1 flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      i < step
                        ? 'bg-nexora-500 text-white'
                        : i === step
                          ? 'bg-nexora-500 text-white ring-4 ring-nexora-100'
                          : 'bg-gray-100 text-muted'
                    }`}
                  >
                    {i + 1}
                  </div>
                  {i < STEPS.length - 1 ? (
                    <div className="mt-2 hidden h-0.5 w-full bg-line sm:block" />
                  ) : null}
                </div>
              ))}
            </div>

            <p className="text-xs font-semibold uppercase tracking-wide text-nexora-600">
              Step {step + 1} of {STEPS.length}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-ink md:text-3xl">{current.title}</h1>
            <p className="mt-2 text-sm text-muted">{current.subtitle}</p>

            <div className="mt-8 space-y-6">
              {step === 0 ? (
                <div>
                  <h2 className="mb-3 font-semibold text-ink">Age Group</h2>
                  <ChipGroup
                    options={AGE_GROUP_OPTIONS}
                    values={form.ageGroup ? [form.ageGroup] : []}
                    multiple={false}
                    onChange={(vals) => setForm((f) => ({ ...f, ageGroup: vals[0] || '' }))}
                  />
                </div>
              ) : null}

              {step === 1 ? (
                <ChipGroup
                  options={DIETARY_OPTIONS}
                  values={form.dietaryPreference ? [form.dietaryPreference] : []}
                  multiple={false}
                  onChange={(vals) =>
                    setForm((f) => ({ ...f, dietaryPreference: vals[0] || '' }))
                  }
                />
              ) : null}

              {step === 2 ? (
                <ChipGroup
                  options={HEALTH_OPTIONS}
                  values={form.healthPreferences}
                  onChange={(vals) => setForm((f) => ({ ...f, healthPreferences: vals }))}
                />
              ) : null}

              {step === 3 ? (
                <ChipGroup
                  options={ALLERGY_OPTIONS}
                  values={form.allergies}
                  onChange={(vals) => setForm((f) => ({ ...f, allergies: vals }))}
                />
              ) : null}

              {step === 4 ? (
                <>
                  <ChipGroup
                    options={GOAL_OPTIONS}
                    values={form.nutritionGoals}
                    onChange={(vals) => setForm((f) => ({ ...f, nutritionGoals: vals }))}
                  />
                  <div>
                    <label className="label" htmlFor="otherPreferences">
                      Other preferences (optional)
                    </label>
                    <textarea
                      id="otherPreferences"
                      className="input min-h-24"
                      value={form.otherPreferences}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, otherPreferences: e.target.value }))
                      }
                    />
                  </div>
                </>
              ) : null}

              {step === 5 ? (
                <div className="space-y-3 rounded-2xl bg-nexora-50 p-4 text-sm">
                  <p>
                    <span className="font-semibold">Age:</span>{' '}
                    {AGE_GROUP_OPTIONS.find((o) => o.value === form.ageGroup)?.label}
                  </p>
                  <p>
                    <span className="font-semibold">Diet:</span>{' '}
                    {DIETARY_OPTIONS.find((o) => o.value === form.dietaryPreference)?.label}
                  </p>
                  <p>
                    <span className="font-semibold">Goals:</span>{' '}
                    {form.nutritionGoals.length}
                  </p>
                  <p>
                    <span className="font-semibold">Allergies:</span>{' '}
                    {form.allergies.length || 'None selected'}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex justify-between gap-3">
              <button
                type="button"
                className="btn-secondary"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Back
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!canNext}
                  onClick={() => setStep((s) => s + 1)}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!canNext || saving}
                  onClick={submit}
                >
                  {saving ? 'Saving…' : 'Finish & go to Home'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="relative hidden items-center justify-center lg:flex">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-6 rounded-full bg-nexora-100/80 blur-2xl" />
            <div className="relative overflow-hidden rounded-full border-8 border-white shadow-xl">
              <FoodImage
                src={VEG_CIRCLE_IMG}
                alt="Fresh vegetables and nutrition"
                className="aspect-square w-full object-cover"
              />
            </div>
            <div className="absolute inset-x-8 bottom-10 rounded-2xl bg-white/95 p-4 text-center shadow-lg">
              <p className="text-sm font-bold text-ink">
                Personalized Nutrition Insights for a Healthier You.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
