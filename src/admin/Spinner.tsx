export function Spinner({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="spinner-row" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}
