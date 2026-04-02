interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'earth' | 'amber' | 'blue' | 'red'
  className?: string
}

const variants = {
  green: 'bg-brand-100 text-brand-700',
  earth: 'bg-earth-100 text-earth-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  red: 'bg-red-100 text-red-700',
}

export function Badge({ children, variant = 'green', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
