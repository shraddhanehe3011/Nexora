import { Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_#d8f3ea_0%,_#f7faf8_40%,_#ffffff_100%)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link to="/" aria-label="NEXORA home">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn-secondary">
            Login
          </Link>
          <Link to="/signup" className="btn-primary">
            Get Started
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
