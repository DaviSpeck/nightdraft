interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'red' | 'yellow' | 'ghost'
}

const variants = {
  blue: 'bg-accent-blue/10 text-accent-blue',
  green: 'bg-accent-green/10 text-accent-green',
  red: 'bg-accent-red/10 text-accent-red',
  yellow: 'bg-accent-yellow/10 text-accent-yellow',
  ghost: 'bg-white/[0.06] text-white/60',
}

export default function Badge({ children, variant = 'ghost' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}
