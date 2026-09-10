import { useEffect, useState } from 'react';
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
import LoadingScreen from '../components/ui/LoadingScreen';

function MultiSelect({ label, options, values, onChange }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = values.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              className={`rounded-full border px-3 py-1.5 text-sm ${
                active ? 'border-nexora-600 bg-nexora-600 text-white' : 'border-line bg-white'
              }`}
              aria-pressed={active}
              onClick={() => {
                if (active) onChange(values.filter((v) => v !== opt.value));
                else onChange([...values.filter((v) => v !== 'none'), opt.value].filter((v) => !(opt.value !== 'none' && v === 'none')));
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await userService.getProfile();
        setForm({
          ageGroup: data.profile?.ageGroup || '',
          dietaryPreference: data.profile?.dietaryPreference || '',
          healthPreferences: data.profile?.healthPreferences || [],
          allergies: data.profile?.allergies || [],
          nutritionGoals: data.profile?.nutritionGoals || [],
          otherPreferences: data.profile?.otherPreferences || '',
        });
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await userService.updateProfile(form);
      await refreshUser();
      toast.success('Profile updated — future analyses will use these preferences');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to update profile'));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <LoadingScreen label="Loading profile…" />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Profile</h1>
        <p className="mt-2 text-sm text-muted">
          {user?.username} · {user?.email}
        </p>
      </div>

      <div className="card space-y-6 p-5">
        <div>
          <label className="label" htmlFor="ageGroup">
            Age group
          </label>
          <select
            id="ageGroup"
            className="input"
            value={form.ageGroup}
            onChange={(e) => setForm((f) => ({ ...f, ageGroup: e.target.value }))}
          >
            <option value="">Select</option>
            {AGE_GROUP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="dietaryPreference">
            Dietary preference
          </label>
          <select
            id="dietaryPreference"
            className="input"
            value={form.dietaryPreference}
            onChange={(e) => setForm((f) => ({ ...f, dietaryPreference: e.target.value }))}
          >
            <option value="">Select</option>
            {DIETARY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <MultiSelect
          label="Health-related preferences"
          options={HEALTH_OPTIONS}
          values={form.healthPreferences}
          onChange={(healthPreferences) => setForm((f) => ({ ...f, healthPreferences }))}
        />
        <MultiSelect
          label="Allergies"
          options={ALLERGY_OPTIONS}
          values={form.allergies}
          onChange={(allergies) => setForm((f) => ({ ...f, allergies }))}
        />
        <MultiSelect
          label="Nutrition goals"
          options={GOAL_OPTIONS}
          values={form.nutritionGoals}
          onChange={(nutritionGoals) => setForm((f) => ({ ...f, nutritionGoals }))}
        />

        <div>
          <label className="label" htmlFor="otherPreferences">
            Other preferences
          </label>
          <textarea
            id="otherPreferences"
            className="input min-h-24"
            value={form.otherPreferences}
            onChange={(e) => setForm((f) => ({ ...f, otherPreferences: e.target.value }))}
          />
        </div>

        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
