import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import { updateMatch } from '@/actions/matches'
import { DEFAULT_AVATAR } from '@/lib/avatars'

export default async function EditMatchPage({ params }: { params: Promise<{ id: string; matchId: string }> }) {
  const { id: corujaoId, matchId } = await params
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      corujao: true,
      members: { include: { player: true } },
    },
  })
  if (!match) notFound()

  const action = updateMatch.bind(null, matchId, corujaoId)
  const isScheduled = match.status === 'SCHEDULED'

  return (
    <div className="p-6 max-w-lg">
      <PageHeader
        title={`Editar partida #${match.sequence}`}
        backHref={`/corujoes/${corujaoId}/matches/${matchId}`}
        backLabel="Partida"
      />

      <form action={action} className="space-y-4">
        {/* Nomes dos times */}
        <Card>
          <CardHeader><p className="text-sm font-medium text-white/75">Nomes dos times</p></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Input name="nameTeamA" placeholder="Time A" defaultValue={match.nameTeamA ?? ''} label="Time A" />
            <Input name="nameTeamB" placeholder="Time B" defaultValue={match.nameTeamB ?? ''} label="Time B" />
          </CardContent>
        </Card>

        {/* Lados dos jogadores (só antes do ban/pick) */}
        {isScheduled ? (
          <Card>
            <CardHeader>
              <p className="text-sm font-medium text-white/75">Lados dos jogadores</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mb-3 text-center text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                <span>Jogador</span>
                <span className="text-accent-blue">Time A</span>
                <span className="text-accent-red">Time B</span>
              </div>
              <div className="space-y-1">
                {match.members.map(m => (
                  <div key={m.playerId} className="grid grid-cols-3 gap-2 items-center py-2 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{m.player.avatar ?? DEFAULT_AVATAR}</span>
                      <div>
                        <p className="text-sm text-white">{m.player.nickname ?? m.player.name}</p>
                        {m.player.nickname && <p className="text-[10px] text-white/30">{m.player.name}</p>}
                      </div>
                    </div>
                    <label className="flex justify-center cursor-pointer">
                      <input type="radio" name={`player_${m.playerId}`} value="TEAM_A" defaultChecked={m.side === 'TEAM_A'} className="w-4 h-4 accent-accent-blue" />
                    </label>
                    <label className="flex justify-center cursor-pointer">
                      <input type="radio" name={`player_${m.playerId}`} value="TEAM_B" defaultChecked={m.side === 'TEAM_B'} className="w-4 h-4 accent-accent-red" />
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <p className="text-xs text-white/30 px-1">
            Lados dos jogadores não podem ser alterados após o ban/pick iniciar.
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit">Salvar</Button>
          <a href={`/corujoes/${corujaoId}/matches/${matchId}`}><Button type="button" variant="ghost">Cancelar</Button></a>
        </div>
      </form>
    </div>
  )
}
