import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import { FormatBadge, MatchStatusBadge } from '@/components/ui/StatusBadge'
import { finalizeMatch } from '@/actions/matches'

export default async function MatchPage({ params }: { params: Promise<{ id: string; matchId: string }> }) {
  const { id: corujaoId, matchId } = await params
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      corujao: true,
      members: { include: { player: true } },
      banPicks: { orderBy: { order: 'asc' }, include: { map: true } },
    },
  })
  if (!match) notFound()

  const teamA = match.members.filter(m => m.side === 'TEAM_A')
  const teamB = match.members.filter(m => m.side === 'TEAM_B')
  const picks  = match.banPicks.filter(bp => bp.action === 'PICK' || bp.action === 'DECIDER')
  const bansA  = match.banPicks.filter(bp => bp.action === 'BAN' && bp.side === 'TEAM_A')
  const bansB  = match.banPicks.filter(bp => bp.action === 'BAN' && bp.side === 'TEAM_B')

  const action = finalizeMatch.bind(null, matchId, corujaoId)

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <PageHeader
        title={`Partida #${match.sequence} — ${match.format}`}
        subtitle={match.corujao.name}
        backHref={`/corujoes/${corujaoId}`}
        backLabel={match.corujao.name}
        action={
          <div className="flex items-center gap-2">
            <FormatBadge format={match.format} />
            <MatchStatusBadge status={match.status} />
          </div>
        }
      />

      {/* Times */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: match.nameTeamA ?? 'Time A', members: teamA, accent: 'border-accent-blue/20' },
          { label: match.nameTeamB ?? 'Time B', members: teamB, accent: 'border-accent-red/20' },
        ].map(team => (
          <Card key={team.label} className={`border ${team.accent}`}>
            <CardHeader><p className="text-xs font-semibold text-white/60">{team.label}</p></CardHeader>
            <CardContent className="py-3 space-y-1.5">
              {team.members.map(m => (
                <p key={m.id} className="text-sm text-white">{m.player.nickname ?? m.player.name}</p>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ban/Pick */}
      {match.status === 'SCHEDULED' ? (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-sm text-white/60">Ban/Pick não iniciado</p>
            <Link href={`/corujoes/${corujaoId}/matches/${matchId}/ban-pick`}>
              <Button>Iniciar Ban/Pick →</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {picks.length > 0 && (
            <Card>
              <CardHeader><p className="text-xs font-semibold text-white/60">Mapas escolhidos</p></CardHeader>
              <CardContent className="flex flex-wrap gap-2 py-3">
                {picks.map(bp => (
                  <span key={bp.id} className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${bp.action === 'DECIDER' ? 'bg-accent-yellow/10 text-accent-yellow' : 'bg-accent-blue/10 text-accent-blue'}`}>
                    {bp.map.displayName} {bp.action === 'DECIDER' && '★'}
                  </span>
                ))}
              </CardContent>
            </Card>
          )}

          {(bansA.length > 0 || bansB.length > 0) && (
            <Card>
              <CardHeader><p className="text-xs font-semibold text-white/60">Bans</p></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 py-3">
                <div>
                  <p className="text-[10px] text-white/30 mb-1.5">{match.nameTeamA ?? 'Time A'}</p>
                  <div className="flex flex-wrap gap-1">
                    {bansA.map(bp => <span key={bp.id} className="text-xs text-white/40 line-through">{bp.map.displayName}</span>)}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-white/30 mb-1.5">{match.nameTeamB ?? 'Time B'}</p>
                  <div className="flex flex-wrap gap-1">
                    {bansB.map(bp => <span key={bp.id} className="text-xs text-white/40 line-through">{bp.map.displayName}</span>)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Resultado */}
      {match.status === 'ONGOING' && (
        <Card>
          <CardHeader><p className="text-sm font-medium text-white/75">Registrar resultado</p></CardHeader>
          <CardContent>
            <form action={action} className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-white/40 mb-1">{match.nameTeamA ?? 'Time A'}</p>
                <input name="scoreTeamA" type="number" min="0" max="30" defaultValue="0"
                  className="w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-2 text-center text-xl font-bold text-white focus:outline-none focus:border-accent-blue" />
              </div>
              <span className="text-white/20 text-lg font-bold mt-4">–</span>
              <div className="flex-1">
                <p className="text-xs text-white/40 mb-1">{match.nameTeamB ?? 'Time B'}</p>
                <input name="scoreTeamB" type="number" min="0" max="30" defaultValue="0"
                  className="w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-2 text-center text-xl font-bold text-white focus:outline-none focus:border-accent-blue" />
              </div>
              <Button type="submit" className="mt-4">Finalizar</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {match.status === 'COMPLETED' && (
        <Card>
          <CardContent className="flex items-center justify-center gap-8 py-6">
            <div className="text-center">
              <p className="text-xs text-white/40 mb-1">{match.nameTeamA ?? 'Time A'}</p>
              <p className="text-4xl font-bold text-white">{match.scoreTeamA}</p>
            </div>
            <p className="text-white/20 text-lg font-bold">–</p>
            <div className="text-center">
              <p className="text-xs text-white/40 mb-1">{match.nameTeamB ?? 'Time B'}</p>
              <p className="text-4xl font-bold text-white">{match.scoreTeamB}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
