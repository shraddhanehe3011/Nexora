import { Link } from 'react-router-dom';

export default function Logo({ className = '', to = '/', size = 'md' }) {
  const imgClass = size === 'lg' ? 'h-11 w-11' : size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const textClass = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-lg' : 'text-xl';

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src="/nexora.svg" alt="" className={imgClass} />
      <span className={`font-bold tracking-tight text-ink ${textClass}`}>NEXORA</span>
    </div>
  );

  if (to === false) return content;
  return (
    <Link to={to} aria-label="NEXORA home">
      {content}
    </Link>
  );
}
