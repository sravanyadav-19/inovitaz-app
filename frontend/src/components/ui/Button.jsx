/**
 * Button — the single way to render a clickable action (Phase 0 primitive).
 * Wraps the .btn token classes so size/target/variants stay consistent.
 * sizing: md = 44px (fitts-law floor), lg = 48px (primary CTAs),
 * sm = 36px (desktop-dense contexts only — never the only target on touch).
 */
const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  danger: 'btn-danger',
};

const SIZES = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`btn ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim()}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="w-5 h-5 border-2 border-current opacity-60 border-t-transparent rounded-full animate-spin"
        />
      ) : (
        children
      )}
    </button>
  );
}

/**
 * IconButton — icon-only action with the 44×44 Fitts target baked in.
 * Requires aria-label; icon is aria-hidden (label is the accessible name).
 */
export function IconButton({ label, className = '', children, ...props }) {
  return (
    <button type="button" aria-label={label} className={`btn-icon ${className}`.trim()} {...props}>
      <span aria-hidden="true" className="w-5 h-5 inline-flex items-center justify-center">
        {children}
      </span>
    </button>
  );
}
