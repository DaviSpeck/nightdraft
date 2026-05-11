import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import { CorujaoStatusBadge, FormatBadge, MatchStatusBadge } from '@/components/ui/StatusBadge'

export default async function CorujaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const corujao = await prisma.corujao.findUnique({
    where: { id },
    include: {
      game: true,
      players: { include: { player: true } },
      matches: {
        orderBy: { sequence: 'asc' },
        include: {
          members: { include: { player: true } },
          banPicks: { include: { map: true } },
        },
      },
    },
  })
  if (!corujao) notFound()

  // Placar geral da noite
  let winsA = 0, winsB = 0
  for (const m of corujao.matches) {
    if (m.status === 'COMPLETED') {
      if ((m.scoreTeamA ?? 0) > (m.scoreTeamB ?? 0)) winsA++
      else if ((m.scoreTeamB ?? 0) > (m.scoreTeamA ?? 0)) winsB++
    }
  }

  const teamAName = corujao.matches[0]?.nameTeamA ?? 'Time A'
  const teamBName = corujao.matches[0]?.nameTeamB ?? 'Time B'

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title={corujao.name}
        subtitle={`${new Date(corujao.date).toLocaleDateString('pt-BR')} · ${corujao.game.name}`}
        backHref="/corujoes"
        backLabel="Corujões"
        action={<CorujaoStatusBadge status={corujao.status} />}
      />

      {/* Placar geral */}
      {corujao.matches.some(m => m.status === 'COMPLETED') && (
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
        {/* Partidas */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/75">Partidas</h2>
            {corujao.status !== 'FINISHED' && (
              <Link href={`/corujoes/${id}/matches/new`}>
                <Button size="sm">+ Nova partida</Button>
              </Link>
            )}
          </div>

          {corujao.matches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-white/40 text-sm mb-3">Nenhuma partida ainda.</p>
                <Link href={`/corujoes/${id}/matches/new`}>
                  <Button size="sm">Criar primeira partida</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            corujao.matches.map(match => {
              const teamA = match.members.filter(m => m.side === 'TEAM_A').map(m => m.player.nickname ?? m.player.name)
              const teamB = match.members.filter(m => m.side === 'TEAM_B').map(m => m.player.nickname ?? m.player.name)
              const picks = match.banPicks.filter(bp => bp.action === 'PICK' || bp.action === 'DECIDER')

              return (
                <Link key={match.id} href={`/corujoes/${id}/matches/${match.id}`}>
                  <Card className="hover:border-white/[0.12] transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/30">#{match.sequence}</span>
                          <FormatBadge format={match.format} />
                          <MatchStatusBadge status={match.status} />
                        </div>
                        {match.status === 'SCHEDULED' && (
                          <Link href={`/corujoes/${id}/matches/${match.id}/ban-pick`} onClick={e => e.stopPropagation()}>
                            <Button size="sm" variant="secondary">Iniciar Ban/Pick →</Button>
                          </Link>
                        )}
                        {match.status === 'COMPLETED' && (
                          <span className="text-sm font-bold text-white">
                            {match.scoreTeamA} – {match.scoreTeamB}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex-1">
                          <p className="text-white/40 mb-0.5">{match.nameTeamA ?? 'Time A'}</p>
                          <p className="text-white/70">{teamA.join(', ') || '—'}</p>
                        </div>
                        <span className="text-white/20">vs</span>
                        <div className="flex-1 text-right">
                          <p className="text-white/40 mb-0.5">{match.nameTeamB ?? 'Time B'}</p>
                          <p className="text-white/70">{teamB.join(', ') || '—'}</p>
                        </div>
                      </div>

                      {picks.length > 0 && (
                        <div className="flex gap-1.5 mt-3 flex-wrap">
                          {picks.map(bp => (
                            <span key={bp.id} className="text-[10px] bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded font-medium">
                              {bp.map.displayName}
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
                  <div className="w-6 h-6 rounded-full bg-accent-blue/10 flex items-center justify-center text-[10px] font-bold text-accent-blue">
                    {cp.player.name.charAt(0)}
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
    </div>
  )
}
