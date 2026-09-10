import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/ui/Logo';
import { signupSchema } from '../validators/schemas';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { FoodImage } from '../components/ui/FoodImage';
import { AUTH_SIDE_IMG } from '../utils/images';

export default function SignupPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (values) => {
    try {
      const user = await registerUser(values);
      toast.success('Account created');
      navigate(user.profileCompleted ? '/app' : '/personalization');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to create account'));
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-nexora-50 lg:block">
        <FoodImage
          src={AUTH_SIDE_IMG}
          alt="Fresh healthy food"
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-nexora-900/70 via-nexora-800/30 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="text-2xl font-bold">Understand What You Eat.</p>
          <p className="mt-2 text-sm text-nexora-100">
            Personalized packaged-food insights powered by real data.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <Logo size="lg" />
          </div>
          <h1 className="text-center text-2xl font-bold text-ink">Create Your Account</h1>
          <p className="mt-2 text-center text-sm text-muted">Start your personalized food journey</p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="label" htmlFor="username">
                Username
              </label>
              <input id="username" className="input" placeholder="Your name" {...register('username')} />
              {errors.username ? (
                <p className="mt-1 text-xs text-rose-600">{errors.username.message}</p>
              ) : null}
            </div>
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email ? (
                <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
              ) : null}
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  autoComplete="new-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? (
                <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
              ) : null}
            </div>
            <div>
              <label className="label" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  className="input pr-10"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword.message}</p>
              ) : null}
            </div>
            <button className="btn-primary w-full py-3" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-nexora-600">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
