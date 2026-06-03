export function FormError({ error }) {
  if (!error) return null;
  const details = error.details;
  if (details && typeof details === 'object') {
    return (
      <ul className="form-error">
        {Object.entries(details).map(([field, msg]) => (
          <li key={field}><b>{field}</b> — {msg}</li>
        ))}
      </ul>
    );
  }
  return <p className="form-error">{error.message || String(error)}</p>;
}
