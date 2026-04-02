import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-earth-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            w-full px-4 py-2.5 rounded-xl border bg-white text-earth-800
            placeholder:text-earth-400 text-sm transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
            ${error ? 'border-red-400' : 'border-earth-200'}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
