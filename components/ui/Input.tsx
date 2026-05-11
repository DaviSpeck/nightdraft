import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
}

export default function Input({ label, hint, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-white/75">{label}</label>}
      <input
        {...props}
        className={`w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-accent-blue transition-colors disabled:opacity-40 ${className}`}
      />
      {hint && <p className="text-xs text-white/40">{hint}</p>}
    </div>
  )
}
