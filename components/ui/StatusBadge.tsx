import { CorujaoStatus, MatchStatus, MatchFormat } from '@prisma/client'

const corujaoLabels: Record<CorujaoStatus, { label: string; variant: string }> = {
  DRAFT:       { label: 'Rascunho',    variant: 'bg-white/[0.06] text-white/60' },
  IN_PROGRESS: { label: 'Em andamento', variant: 'bg-accent-blue/10 text-accent-blue' },
  FINISHED:    { label: 'Finalizado',  variant: 'bg-accent-green/10 text-accent-green' },
}

const matchLabels: Record<MatchStatus, { label: string; variant: string }> = {
  SCHEDULED: { label: 'Agendada',    variant: 'bg-white/[0.06] text-white/60' },
  ONGOING:   { label: 'Em andamento', variant: 'bg-accent-blue/10 text-accent-blue' },
  COMPLETED: { label: 'Finalizada',  variant: 'bg-accent-green/10 text-accent-green' },
  CANCELLED: { label: 'Cancelada',   variant: 'bg-accent-red/10 text-accent-red' },
}

const formatLabels: Record<MatchFormat, string> = {
  MD1: 'MD1', MD3: 'MD3', MD5: 'MD5',
}

export function CorujaoStatusBadge({ status }: { status: CorujaoStatus }) {
  const { label, variant } = corujaoLabels[status]
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variant}`}>{label}</span>
}

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const { label, variant } = matchLabels[status]
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variant}`}>{label}</span>
}

export function FormatBadge({ format }: { format: MatchFormat }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-accent-yellow/10 text-accent-yellow">
      {formatLabels[format]}
    </span>
  )
}
