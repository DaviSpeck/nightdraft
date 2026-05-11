import { prisma } from '@/lib/db'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import { CorujaoStatusBadge } from '@/components/ui/StatusBadge'

export default async function CorujoesPage() {
  const corujoes = await prisma.corujao.findMany({
    orderBy: { date: 'desc' },
    include: {
      game: { select: { name: true } },
      _count: { select: { players: true, matches: true } },
      matches: { select: { status: true } },
    },
  })

  return (
    <div className="p-6">
      <PageHeader
        title="Corujões"
        subtitle={`${corujoes.length} sessão${corujoes.length !== 1 ? 'ões' : ''} registrada${corujoes.length !== 1 ? 's' : ''}`}
        action={
          <Link href="/corujoes/new">
            <Button>+ Novo corujão</Button>
          </Link>
        }
      />

      {corujoes.length === 0 ? (
        <div className="bg-card border border-white/[0.06] rounded-xl px-5 py-12 text-center">
          <p className="text-2xl mb-3">🌙</p>
          <p className="text-white/40 text-sm">Nenhum corujão ainda.</p>
          <Link href="/corujoes/new" className="inline-flex mt-3 text-sm text-accent-blue hover:underline">
            Criar primeiro corujão →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {corujoes.map(c => {
            const done = c.matches.filter(m => m.status === 'COMPLETED').length
            return (
              <Link key={c.id} href={`/corujoes/${c.id}`} className="flex items-center justify-between bg-card border border-white/[0.06] rounded-xl px-5 py-4 hover:border-white/[0.12] transition-colors group">
                <div className="flex items-center gap-4">
                  <span className="text-xl">🌙</span>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-accent-blue transition-colors">{c.name}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {new Date(c.date).toLocaleDateString('pt-BR')} · {c._count.players} jogadores · {c._count.matches} partida{c._count.matches !== 1 ? 's' : ''}
                      {c._count.matches > 0 && ` (${done} finalizada${done !== 1 ? 's' : ''})`}
                    </p>
                  </div>
                </div>
                <CorujaoStatusBadge status={c.status} />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
