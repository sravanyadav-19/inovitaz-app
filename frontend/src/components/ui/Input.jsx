/**
 * Input — labelled field with error/helper wiring (form-design skill:
 * label > input > helper > error, single column, error not colour-only).
 * Generates its own ids from `name` so aria linkage is never copy-pasta.
 */
export default function Input({
  id,
  name,
  label,
  error = '',
  helper = '',
  icon = null,          // optional left icon (React node, aria-hidden)
  rightSlot = null,     // optional right-side control (password toggles etc.)
  className = '',
  ...props
}) {
  const inputId = id || name;
  const helperId = helper ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block t-sm font-medium text-outline mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline"
          >
            {icon}
          </span>
        )}
        <input
          id={inputId}
          name={name}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={`input ${icon ? 'pl-10' : ''} ${rightSlot ? 'pr-12' : ''} ${error ? 'border-danger-fg/60' : ''}`.trim()}
          {...props}
        />
        {rightSlot && (
          <span className="absolute inset-y-0 right-0 pr-1 flex items-center justify-center">
            {rightSlot}
          </span>
        )}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1 t-caption text-danger-fg">
          {error}
        </p>
      ) : helper ? (
        <p id={helperId} className="mt-1 t-caption text-outline">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
