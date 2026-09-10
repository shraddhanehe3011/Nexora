import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  History,
  UserRound,
  LogOut,
  Menu,
  X,
  ScanLine,
  Search,
  Upload,
} from 'lucide-react';
import { useState } from 'react';
import Logo from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  { to: '/app/search', label: 'Search', icon: Search },
  { to: '/app/scan', label: 'Scan Barcode', icon: ScanLine },
  { to: '/app/upload', label: 'Upload Image', icon: Upload },
  { to: '/app/history', label: 'History', icon: History },
  { to: '/app/profile', label: 'Profile', icon: UserRound },
];

function NavItems({ onNavigate, className = '' }) {
  return (
    <nav className={className} aria-label="Main">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? 'bg-nexora-500 text-white shadow-sm shadow-nexora-200'
                : 'text-muted hover:bg-nexora-50 hover:text-ink'
            }`
          }
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const onSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/app/search?q=${encodeURIComponent(query.trim())}`);
  };

  const initial = (user?.username || 'U').slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white p-5 md:flex">
          <Logo to="/app" />
          <NavItems className="mt-8 flex flex-col gap-1.5" />
          <button
            type="button"
            className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3 md:px-6">
              <button
                type="button"
                className="rounded-lg p-2 text-ink hover:bg-nexora-50 md:hidden"
                aria-label={open ? 'Close menu' : 'Open menu'}
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <form onSubmit={onSearch} className="relative hidden flex-1 md:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  className="input pl-10"
                  placeholder="Search food products, brands or barcode..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Quick search"
                />
              </form>

              <div className="ml-auto flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-ink">{user?.username}</p>
                  <p className="text-xs text-muted">Your profile</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-nexora-500 text-sm font-bold text-white">
                  {initial}
                </div>
              </div>
            </div>

            {open ? (
              <div className="border-t border-line p-4 md:hidden">
                <NavItems className="flex flex-col gap-1" onNavigate={() => setOpen(false)} />
                <button
                  type="button"
                  className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : null}
          </header>

          <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">{children}</main>

          <nav
            className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-white/95 px-1 py-2 backdrop-blur md:hidden"
            aria-label="Mobile"
          >
            {links.slice(0, 5).map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium ${
                    isActive ? 'text-nexora-600' : 'text-muted'
                  }`
                }
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label.split(' ')[0]}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
