import Link from 'next/link'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  backLabel?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, backHref, backLabel, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        {backHref && (
          <Link href={backHref} className="text-xs text-white/40 hover:text-white/70 transition-colors mb-1 inline-flex items-center gap-1">
            ← {backLabel ?? 'Voltar'}
          </Link>
        )}
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-white/45 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
