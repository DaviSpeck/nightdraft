import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import { FormatBadge, MatchStatusBadge } from '@/components/ui/StatusBadge'
import { finalizeMatch, deleteMatch, saveMapStats } from '@/actions/matches'
import { DEFAULT_AVATAR } from '@/lib/avatars'
import DeleteButton from '@/components/ui/DeleteButton'

export default async function JogoPage({ params }: { params: Promise<{ id: string; matchId: string }> }) {
  const { id: corujaoId, matchId: jogoId } = await params
  const jogo = await prisma.jogo.findUnique({
    where: { id: jogoId },
    include: {
      corujao: true,
      membros: { include: { player: true }, orderBy: { side: 'asc' } },
      banPicks: { orderBy: { order: 'asc' }, include: { map: true } },
      mapStats: true,
    },
  })
  if (!jogo) notFound()

  const teamA  = jogo.membros.filter(m => m.side === 'TEAM_A')
  const teamB  = jogo.membros.filter(m => m.side === 'TEAM_B')
  const picks  = jogo.banPicks.filter(bp => bp.action === 'PICK')
  const decider = jogo.banPicks.find(bp => bp.action === 'DECIDER')
  const bansA  = jogo.banPicks.filter(bp => bp.action === 'BAN' && bp.side === 'TEAM_A')
  const bansB  = jogo.banPicks.filter(bp => bp.action === 'BAN' && bp.side === 'TEAM_B')
  const allPicks = [...picks, ...(decider ? [decider] : [])]

  const finalizeAction = finalizeMatch.bind(null, jogoId, corujaoId)
  const deleteAction   = deleteMatch.bind(null, jogoId, corujaoId)

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <PageHeader
        title={`Jogo #${jogo.sequence} — ${jogo.format}`}
        subtitle={jogo.corujao.name}
        backHref={`/corujoes/${corujaoId}`}
        backLabel={jogo.corujao.name}
        action={
          <div className="flex items-center gap-2">
            <Link href={`/corujoes/${corujaoId}/matches/${jogoId}/edit`}>
              <Button variant="ghost" size="sm">Editar</Button>
            </Link>
            <FormatBadge format={jogo.format} />
            <MatchStatusBadge status={jogo.status} />
          </div>
        }
      />

      {/* Times */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: jogo.nameTeamA ?? 'Time A', members: teamA, accent: 'border-accent-blue/20' },
          { label: jogo.nameTeamB ?? 'Time B', members: teamB, accent: 'border-accent-red/20' },
        ].map(team => (
          <Card key={team.label} className={`border ${team.accent}`}>
            <CardHeader><p className="text-xs font-semibold text-white/60">{team.label}</p></CardHeader>
            <CardContent className="py-3 space-y-1.5">
              {team.members.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="text-base">{m.player.avatar ?? DEFAULT_AVATAR}</span>
                  <p className="text-sm text-white">{m.player.nickname ?? m.player.name}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ban/Pick */}
      {jogo.status === 'SCHEDULED' ? (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-sm text-white/60">Ban/Pick não iniciado</p>
            <Link href={`/corujoes/${corujaoId}/matches/${jogoId}/ban-pick`}>
              <Button>Iniciar Ban/Pick →</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {decider && (
            <div className="rounded-xl border border-accent-yellow/40 bg-accent-yellow/10 px-5 py-4 flex items-center gap-4">
              <span className="text-accent-yellow text-2xl">★</span>
              <div>
                <p className="text-[10px] text-accent-yellow/60 font-semibold uppercase tracking-wider">Mapa Decisivo</p>
                <p className="text-lg font-bold text-accent-yellow">{decider.map.displayName}</p>
              </div>
            </div>
          )}

          {picks.length > 0 && (
            <Card>
              <CardHeader><p className="text-xs font-semibold text-white/60">Mapas escolhidos</p></CardHeader>
              <CardContent className="flex flex-wrap gap-2 py-3">
                {picks.map(bp => (
                  <span key={bp.id} className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-accent-blue/10 text-accent-blue">
                    {bp.map.displayName}
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
                  <p className="text-[10px] text-white/30 mb-1.5">{jogo.nameTeamA ?? 'Time A'}</p>
                  <div className="flex flex-wrap gap-1">
                    {bansA.map(bp => <span key={bp.id} className="text-xs text-white/40 line-through">{bp.map.displayName}</span>)}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-white/30 mb-1.5">{jogo.nameTeamB ?? 'Time B'}</p>
                  <div className="flex flex-wrap gap-1">
                    {bansB.map(bp => <span key={bp.id} className="text-xs text-white/40 line-through">{bp.map.displayName}</span>)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* KDA por mapa */}
      {allPicks.length > 0 && jogo.status !== 'SCHEDULED' && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white/75">
            KDA por mapa
            <span className="ml-2 text-[10px] font-normal text-white/30">K / D / A</span>
          </h2>
          {allPicks.map(bp => {
            const saveAction = saveMapStats.bind(null, jogoId, corujaoId, bp.mapId)
            const existingStats = jogo.mapStats.filter(s => s.mapId === bp.mapId)

            return (
              <Card key={bp.id} className={bp.action === 'DECIDER' ? 'border-accent-yellow/20' : ''}>
                <CardHeader>
                  <p className="text-xs font-semibold text-white/60">
                    {bp.map.displayName}
                    {bp.action === 'DECIDER' && <span className="ml-1.5 text-accent-yellow">★ Decisivo</span>}
                  </p>
                </CardHeader>
                <CardContent className="py-3">
                  <form action={saveAction}>
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 gap-y-2 items-center mb-3">
                      <p className="text-[10px] text-white/30 font-semibold uppercase">Jogador</p>
                      <p className="text-[10px] text-accent-green/70 font-semibold w-12 text-center">K</p>
                      <p className="text-[10px] text-accent-red/70 font-semibold w-12 text-center">D</p>
                      <p className="text-[10px] text-accent-blue/70 font-semibold w-12 text-center">A</p>

                      {jogo.membros.map(membro => {
                        const stat = existingStats.find(s => s.playerId === membro.playerId)
                        return (
                          <>
                            <p key={`name_${membro.id}`} className="text-sm text-white flex items-center gap-1.5">
                              <span>{membro.player.avatar ?? DEFAULT_AVATAR}</span>
                              {membro.player.nickname ?? membro.player.name}
                              <span className={`text-[10px] ${membro.side === 'TEAM_A' ? 'text-accent-blue/50' : 'text-accent-red/50'}`}>
                                {membro.side === 'TEAM_A' ? jogo.nameTeamA ?? 'A' : jogo.nameTeamB ?? 'B'}
                              </span>
                            </p>
                            <input key={`k_${membro.id}`} name={`kills_${membro.playerId}_${bp.mapId}`} type="number" min="0" max="99" defaultValue={stat?.kills ?? 0} className="w-12 bg-surface border border-white/[0.08] rounded px-1 py-1 text-center text-sm text-white focus:outline-none focus:border-accent-green" />
                            <input key={`d_${membro.id}`} name={`deaths_${membro.playerId}_${bp.mapId}`} type="number" min="0" max="99" defaultValue={stat?.deaths ?? 0} className="w-12 bg-surface border border-white/[0.08] rounded px-1 py-1 text-center text-sm text-white focus:outline-none focus:border-accent-red" />
                            <input key={`a_${membro.id}`} name={`assists_${membro.playerId}_${bp.mapId}`} type="number" min="0" max="99" defaultValue={stat?.assists ?? 0} className="w-12 bg-surface border border-white/[0.08] rounded px-1 py-1 text-center text-sm text-white focus:outline-none focus:border-accent-blue" />
                          </>
                        )
                      })}
                    </div>
                    <Button type="submit" size="sm" variant="ghost">Salvar KDA</Button>
                  </form>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Resultado */}
      {jogo.status === 'ONGOING' && (
        <Card>
          <CardHeader><p className="text-sm font-medium text-white/75">Registrar resultado</p></CardHeader>
          <CardContent>
            <form action={finalizeAction} className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-white/40 mb-1">{jogo.nameTeamA ?? 'Time A'}</p>
                <input name="scoreTeamA" type="number" min="0" max="30" defaultValue="0" className="w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-2 text-center text-xl font-bold text-white focus:outline-none focus:border-accent-blue" />
              </div>
              <span className="text-white/20 text-lg font-bold mt-4">–</span>
              <div className="flex-1">
                <p className="text-xs text-white/40 mb-1">{jogo.nameTeamB ?? 'Time B'}</p>
                <input name="scoreTeamB" type="number" min="0" max="30" defaultValue="0" className="w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-2 text-center text-xl font-bold text-white focus:outline-none focus:border-accent-blue" />
              </div>
              <Button type="submit" className="mt-4">Finalizar</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {jogo.status === 'COMPLETED' && (
        <Card>
          <CardContent className="flex items-center justify-center gap-8 py-6">
            <div className="text-center">
              <p className="text-xs text-white/40 mb-1">{jogo.nameTeamA ?? 'Time A'}</p>
              <p className="text-4xl font-bold text-white">{jogo.scoreTeamA}</p>
            </div>
            <p className="text-white/20 text-lg font-bold">–</p>
            <div className="text-center">
              <p className="text-xs text-white/40 mb-1">{jogo.nameTeamB ?? 'Time B'}</p>
              <p className="text-4xl font-bold text-white">{jogo.scoreTeamB}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="pt-2 border-t border-white/[0.06]">
        <DeleteButton
          action={deleteAction}
          confirm="Excluir este jogo? Esta ação não pode ser desfeita."
          label="Excluir jogo"
        />
      </div>
    </div>
  )
}
