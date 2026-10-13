/**
 * Badge — status pill using the semantic color roles.
 * `variant`: primary | success | warning | danger | purple
 */
export default function Badge({ variant = 'primary', className = '', children, ...props }) {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
