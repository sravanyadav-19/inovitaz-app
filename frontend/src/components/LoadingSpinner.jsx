const LoadingSpinner = ({ size = 'medium', text = '' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`loader ${sizeClasses[size]}`}></div>
      {text && <p className="text-secondary-600 text-sm">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;