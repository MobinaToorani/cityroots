export function FieldMessages({
  id,
  description,
  error,
}: {
  id: string;
  description?: string;
  error?: string;
}) {
  return (
    <>
      {description && (
        <p id={`${id}-description`} className="px-1 text-meta text-text-muted">
          {description}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="px-1 text-meta font-medium text-danger">
          {error}
        </p>
      )}
    </>
  );
}
