import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-navy-200 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-4 py-2.5 rounded-xl bg-navy-800/60 border border-navy-700 text-navy-50 placeholder-navy-400 transition-colors duration-200 focus:border-accent-400 focus:ring-1 focus:ring-accent-400 outline-none ${error ? 'border-error-500' : ''} ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-error-400">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-sm text-navy-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
