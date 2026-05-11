import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import { CorujaoStatusBadge, FormatBadge, MatchStatusBadge } from '@/components/ui/StatusBadge'
import { deleteCorujao } from '@/actions/corujoes'
import { DEFAULT_AVATAR } from '@/lib/avatars'
import DeleteButton from '@/components/ui/DeleteButton'

export default async function CorujaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const corujao = await prisma.corujao.findUnique({
    where: { id },
    include: {
      game: true,
      players: { include: { player: true } },
      jogos: {
        orderBy: { sequence: 'asc' },
        include: {
          membros: { include: { player: true } },
          banPicks: { include: { map: true } },
        },
      },
    },
  })
  if (!corujao) notFound()

  let winsA = 0, winsB = 0
  for (const j of corujao.jogos) {
    if (j.status === 'COMPLETED') {
      if ((j.scoreTeamA ?? 0) > (j.scoreTeamB ?? 0)) winsA++
      else if ((j.scoreTeamB ?? 0) > (j.scoreTeamA ?? 0)) winsB++
    }
  }

  const teamAName = corujao.jogos[0]?.nameTeamA ?? 'Time A'
  const teamBName = corujao.jogos[0]?.nameTeamB ?? 'Time B'

  const deleteAction = deleteCorujao.bind(null, id)

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title={corujao.name}
        subtitle={`${new Date(corujao.date).toLocaleDateString('pt-BR')} · ${corujao.game.name}`}
        backHref="/corujoes"
        backLabel="Corujões"
        action={
          <div className="flex items-center gap-2">
            <Link href={`/corujoes/${id}/edit`}>
              <Button variant="ghost" size="sm">Editar</Button>
            </Link>
            <CorujaoStatusBadge status={corujao.status} />
          </div>
        }
      />

      {/* Placar geral */}
      {corujao.jogos.some(j => j.status === 'COMPLETED') && (
        <Card>
          <CardContent className="flex items-center justify-center gap-8 py-6">
            <div className="text-center">
              <p className="text-xs text-white/40 mb-1">{teamAName}</p>
              <p className="text-4xl font-bold text-accent-blue">{winsA}</p>
            </div>
            <p className="text-white/20 text-lg font-bold">vs</p>
            <div className="text-center">
              <p className="text-xs text-white/40 mb-1">{teamBName}</p>
              <p className="text-4xl font-bold text-accent-blue">{winsB}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Jogos */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/75">Jogos</h2>
            {corujao.status !== 'FINISHED' && (
              <Link href={`/corujoes/${id}/matches/new`}>
                <Button size="sm">+ Novo jogo</Button>
              </Link>
            )}
          </div>

          {corujao.jogos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-white/40 text-sm mb-3">Nenhum jogo ainda.</p>
                <Link href={`/corujoes/${id}/matches/new`}>
                  <Button size="sm">Criar primeiro jogo</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            corujao.jogos.map(jogo => {
              const teamA = jogo.membros.filter(m => m.side === 'TEAM_A').map(m => m.player.nickname ?? m.player.name)
              const teamB = jogo.membros.filter(m => m.side === 'TEAM_B').map(m => m.player.nickname ?? m.player.name)
              const picks = jogo.banPicks.filter(bp => bp.action === 'PICK' || bp.action === 'DECIDER')

              return (
                <Link key={jogo.id} href={`/corujoes/${id}/matches/${jogo.id}`}>
                  <Card className="hover:border-white/[0.12] transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/30">#{jogo.sequence}</span>
                          <FormatBadge format={jogo.format} />
                          <MatchStatusBadge status={jogo.status} />
                        </div>
                        {jogo.status === 'SCHEDULED' && (
                          <Link href={`/corujoes/${id}/matches/${jogo.id}/ban-pick`} onClick={e => e.stopPropagation()}>
                            <Button size="sm" variant="secondary">Iniciar Ban/Pick →</Button>
                          </Link>
                        )}
                        {jogo.status === 'COMPLETED' && (
                          <span className="text-sm font-bold text-white">
                            {jogo.scoreTeamA} – {jogo.scoreTeamB}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex-1">
                          <p className="text-white/40 mb-0.5">{jogo.nameTeamA ?? 'Time A'}</p>
                          <p className="text-white/70">{teamA.join(', ') || '—'}</p>
                        </div>
                        <span className="text-white/20">vs</span>
                        <div className="flex-1 text-right">
                          <p className="text-white/40 mb-0.5">{jogo.nameTeamB ?? 'Time B'}</p>
                          <p className="text-white/70">{teamB.join(', ') || '—'}</p>
                        </div>
                      </div>

                      {picks.length > 0 && (
                        <div className="flex gap-1.5 mt-3 flex-wrap">
                          {picks.map(bp => (
                            <span key={bp.id} className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                              bp.action === 'DECIDER'
                                ? 'bg-accent-yellow/10 text-accent-yellow'
                                : 'bg-accent-blue/10 text-accent-blue'
                            }`}>
                              {bp.action === 'DECIDER' && '★ '}{bp.map.displayName}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })
          )}
        </div>

        {/* Roster */}
        <div>
          <h2 className="text-sm font-semibold text-white/75 mb-3">Roster da noite</h2>
          <Card>
            <CardContent className="py-3 space-y-1">
              {corujao.players.map(cp => (
                <div key={cp.playerId} className="flex items-center gap-2.5 py-1.5">
                  <div className="w-8 h-8 rounded-xl bg-accent-blue/10 flex items-center justify-center text-lg">
                    {cp.player.avatar ?? DEFAULT_AVATAR}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">{cp.player.name}</p>
                    {cp.player.nickname && <p className="text-[10px] text-white/40">{cp.player.nickname}</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Excluir corujão */}
      <div className="pt-2 border-t border-white/[0.06]">
        <DeleteButton
          action={deleteAction}
          confirm={`Excluir "${corujao.name}"? Todos os jogos serão removidos.`}
          label="Excluir corujão"
        />
      </div>
    </div>
  )
}
