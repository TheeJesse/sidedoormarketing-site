interface AvatarProps {
  name: string
  photoUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
}

// Generate a consistent earthy background color from name
function colorFromName(name: string): string {
  const colors = [
    'bg-brand-200 text-brand-800',
    'bg-earth-200 text-earth-800',
    'bg-amber-200 text-amber-800',
    'bg-emerald-200 text-emerald-800',
    'bg-teal-200 text-teal-800',
    'bg-lime-200 text-lime-800',
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

export function Avatar({ name, photoUrl, size = 'md', className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizes[size]} ${colorFromName(name)} rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${className}`}
    >
      {initials}
    </div>
  )
}
