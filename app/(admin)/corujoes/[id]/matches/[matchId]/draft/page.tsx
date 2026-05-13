import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import { draftPick } from '@/actions/matches'
import { DEFAULT_AVATAR } from '@/lib/avatars'

export default async function DraftPage({ params }: { params: Promise<{ id: string; matchId: string }> }) {
  const { id: corujaoId, matchId } = await params

  const jogo = await prisma.jogo.findUnique({
    where: { id: matchId },
    include: {
      membros: { include: { player: true } },
      corujao: { include: { players: { include: { player: true } } } },
    },
  })

  if (!jogo) notFound()
  if (jogo.creationMode !== 'DRAFT') redirect(`/corujoes/${corujaoId}/matches/${matchId}`)
  if (jogo.draftStatus === 'COMPLETED') redirect(`/corujoes/${corujaoId}/matches/${matchId}/ban-pick`)

  const pickedIds = new Set(jogo.membros.map(m => m.playerId))
  const available = jogo.corujao.players
    .map(cp => cp.player)
    .filter(p => !pickedIds.has(p.id))

  const teamA = jogo.membros.filter(m => m.side === 'TEAM_A')
  const teamB = jogo.membros.filter(m => m.side === 'TEAM_B')

  const isTurnA = jogo.draftTurn === 'TEAM_A'
  const pickAction = draftPick.bind(null, matchId, corujaoId)

  const currentTeamName = isTurnA ? jogo.nameTeamA : jogo.nameTeamB

  return (
    <div className="p-6 max-w-3xl">
      <PageHeader
        title="Draft de times"
        subtitle={`${jogo.nameTeamA ?? 'Time A'} vs ${jogo.nameTeamB ?? 'Time B'}`}
        backHref={`/corujoes/${corujaoId}`}
        backLabel={jogo.corujao.name}
      />

      <div className={`mb-6 rounded-xl p-3 text-center text-sm font-semibold border transition-all ${
        isTurnA
          ? 'border-accent-blue/30 bg-accent-blue/[0.08] text-accent-blue'
          : 'border-accent-red/30 bg-accent-red/[0.08] text-accent-red'
      }`}>
        Vez de <span className="font-bold">{currentTeamName}</span> escolher
        <span className="ml-2 text-xs font-normal opacity-60">
          ({available.length} restante{available.length !== 1 ? 's' : ''})
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`rounded-xl border p-4 transition-all ${
          isTurnA ? 'border-accent-blue/40 bg-accent-blue/[0.03]' : 'border-white/[0.06]'
        }`}>
          <p className="text-xs font-semibold text-accent-blue uppercase tracking-wider mb-3">
            {jogo.nameTeamA ?? 'Time A'}
          </p>
          <div className="space-y-2">
            {teamA.map(m => (
              <div key={m.id} className="flex items-center gap-2">
                <span className="text-base">{m.player.avatar ?? DEFAULT_AVATAR}</span>
                <span className="text-sm text-white">{m.player.nickname ?? m.player.name}</span>
                {m.isCaptain && <span className="ml-auto text-xs">👑</span>}
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-xl border p-4 transition-all ${
          !isTurnA ? 'border-accent-red/40 bg-accent-red/[0.03]' : 'border-white/[0.06]'
        }`}>
          <p className="text-xs font-semibold text-accent-red uppercase tracking-wider mb-3">
            {jogo.nameTeamB ?? 'Time B'}
          </p>
          <div className="space-y-2">
            {teamB.map(m => (
              <div key={m.id} className="flex items-center gap-2">
                <span className="text-base">{m.player.avatar ?? DEFAULT_AVATAR}</span>
                <span className="text-sm text-white">{m.player.nickname ?? m.player.name}</span>
                {m.isCaptain && <span className="ml-auto text-xs">👑</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {available.length > 0 && (
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">
            Disponíveis
          </p>
          <div className="grid grid-cols-2 gap-2">
            {available.map(player => (
              <form key={player.id} action={pickAction}>
                <input type="hidden" name="playerId" value={player.id} />
                <button
                  type="submit"
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border border-white/[0.08] transition-all cursor-pointer text-left ${
                    isTurnA
                      ? 'hover:border-accent-blue/40 hover:bg-accent-blue/[0.04]'
                      : 'hover:border-accent-red/40 hover:bg-accent-red/[0.04]'
                  }`}
                >
                  <span className="text-lg">{player.avatar ?? DEFAULT_AVATAR}</span>
                  <div>
                    <p className="text-sm text-white">{player.nickname ?? player.name}</p>
                    {player.nickname && <p className="text-[10px] text-white/30">{player.name}</p>}
                  </div>
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
