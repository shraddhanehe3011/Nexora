export default function EmptyState({ title, description, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <h3 className="font-display text-xl text-ink">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
