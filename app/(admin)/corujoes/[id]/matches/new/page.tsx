import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import { createMatch } from '@/actions/matches'
import { DEFAULT_AVATAR } from '@/lib/avatars'

export default async function NewMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const corujao = await prisma.corujao.findUnique({
    where: { id },
    include: { players: { include: { player: true } } },
  })
  if (!corujao) notFound()

  const action = createMatch.bind(null, id)

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader
        title="Nova partida"
        subtitle={corujao.name}
        backHref={`/corujoes/${id}`}
        backLabel={corujao.name}
      />

      <form action={action} className="space-y-4">
        {/* Formato */}
        <Card>
          <CardHeader><p className="text-sm font-medium text-white/75">Formato</p></CardHeader>
          <CardContent className="flex gap-3">
            {(['MD1', 'MD3', 'MD5'] as const).map(fmt => (
              <label key={fmt} className="flex-1 cursor-pointer">
                <input type="radio" name="format" value={fmt} defaultChecked={fmt === 'MD3'} className="sr-only peer" />
                <div className="border border-white/[0.08] rounded-lg p-3 text-center text-sm font-bold text-white/60 peer-checked:border-accent-yellow peer-checked:text-accent-yellow peer-checked:bg-accent-yellow/5 transition-all">
                  {fmt}
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Nomes dos times (opcional) */}
        <Card>
          <CardHeader><p className="text-sm font-medium text-white/75">Nomes dos times <span className="text-white/30 font-normal">(opcional)</span></p></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Input name="nameTeamA" placeholder="Time A" />
            <Input name="nameTeamB" placeholder="Time B" />
          </CardContent>
        </Card>

        {/* Montagem dos times */}
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-white/75">Montar times</p>
            <p className="text-xs text-white/40 mt-0.5">Escolha o lado de cada jogador</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 mb-3 text-center text-[10px] font-semibold text-white/40 uppercase tracking-wider">
              <span>Jogador</span>
              <span className="text-accent-blue">Time A</span>
              <span className="text-accent-red">Time B</span>
            </div>
            <div className="space-y-1">
              {corujao.players.map(cp => (
                <div key={cp.playerId} className="grid grid-cols-3 gap-2 items-center py-2 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cp.player.avatar ?? DEFAULT_AVATAR}</span>
                    <div>
                      <p className="text-sm text-white">{cp.player.nickname ?? cp.player.name}</p>
                      {cp.player.nickname && <p className="text-[10px] text-white/30">{cp.player.name}</p>}
                    </div>
                  </div>
                  <label className="flex justify-center cursor-pointer">
                    <input type="radio" name={`player_${cp.playerId}`} value="TEAM_A" defaultChecked className="w-4 h-4 accent-accent-blue" />
                  </label>
                  <label className="flex justify-center cursor-pointer">
                    <input type="radio" name={`player_${cp.playerId}`} value="TEAM_B" className="w-4 h-4 accent-accent-red" />
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit">Criar partida</Button>
          <a href={`/corujoes/${id}`}><Button type="button" variant="ghost">Cancelar</Button></a>
        </div>
      </form>
    </div>
  )
}
