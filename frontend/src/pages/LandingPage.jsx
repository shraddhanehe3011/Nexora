import { Link } from 'react-router-dom';
import {
  Search,
  ScanLine,
  Sparkles,
  HeartHandshake,
  Database,
  UserRound,
  Eye,
  Leaf,
  CheckCircle2,
} from 'lucide-react';
import Logo from '../components/ui/Logo';
import { FoodImage } from '../components/ui/FoodImage';
import { HERO_FOOD_IMG } from '../utils/images';

const steps = [
  { icon: Search, title: 'Search, Scan or Upload' },
  { icon: Sparkles, title: 'We Analyse' },
  { icon: HeartHandshake, title: 'Your Personal Score' },
  { icon: Leaf, title: 'Make Better Choices' },
];

const pillars = [
  { icon: Database, title: 'Real Data', text: 'Open Food Facts powered' },
  { icon: UserRound, title: 'Personalized', text: 'Based on your profile' },
  { icon: Eye, title: 'Transparent', text: 'Clear score reasons' },
  { icon: Leaf, title: 'Smarter Choices', text: 'Better alternatives' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
            <a href="#home" className="hover:text-ink">
              Home
            </a>
            <a href="#features" className="hover:text-ink">
              Features
            </a>
            <a href="#how" className="hover:text-ink">
              How It Works
            </a>
            <a href="#contact" className="hover:text-ink">
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost hidden sm:inline-flex">
              Login
            </Link>
            <Link to="/signup" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section id="home" className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl lg:text-[3.25rem]">
            Understand What
            <br />
            You Eat.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            Analyse packaged foods with real nutrition data, personalization, and transparent
            scores — so you can choose smarter every day.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup" className="btn-primary px-7 py-3">
              Get Started
            </Link>
            <a href="#how" className="btn-secondary px-7 py-3">
              Learn More
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-4 rounded-[2rem] bg-nexora-100/60 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-nexora-50 to-white p-4 shadow-lg shadow-nexora-100">
            <FoodImage
              src={HERO_FOOD_IMG}
              alt="Mixed nuts packaged food"
              className="h-72 w-full rounded-[1.5rem] object-cover md:h-80"
            />
            <div className="pointer-events-none absolute inset-4">
              <span className="absolute left-3 top-6 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-nexora-700 shadow-md">
                <CheckCircle2 className="h-3.5 w-3.5" /> Low Sugar
              </span>
              <span className="absolute right-2 top-24 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-nexora-700 shadow-md">
                <CheckCircle2 className="h-3.5 w-3.5" /> High Protein
              </span>
              <span className="absolute bottom-16 left-6 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-nexora-700 shadow-md">
                <CheckCircle2 className="h-3.5 w-3.5" /> No Additives
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-center text-2xl font-bold text-ink md:text-3xl">How NEXORA Works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title }, i) => (
              <div key={title} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-line">
                  <Icon className="h-7 w-7 text-nexora-600" />
                </div>
                <p className="mt-4 text-sm font-semibold text-ink">
                  {i + 1}. {title}
                </p>
                {i < steps.length - 1 ? (
                  <div className="pointer-events-none absolute right-0 top-8 hidden h-px w-1/2 translate-x-1/2 bg-nexora-200 lg:block" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 rounded-3xl bg-nexora-50/80 p-6 sm:grid-cols-2 lg:grid-cols-4 lg:p-8">
          {pillars.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-nexora-600 shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-ink">{title}</p>
                <p className="text-sm text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer id="contact" className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} NEXORA. Food information platform.</p>
          <p>Not a medical device. Does not diagnose or treat conditions.</p>
        </div>
      </footer>
    </div>
  );
}
