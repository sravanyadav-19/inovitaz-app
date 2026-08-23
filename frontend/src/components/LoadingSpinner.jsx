const LoadingSpinner = ({ size = 'medium', text = '' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
  };

  const message = text || 'Loading';

  return (
    <div
      className="flex flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className={`loader ${sizeClasses[size]}`} aria-hidden="true" />
      {text && <p className="text-outline text-sm">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
