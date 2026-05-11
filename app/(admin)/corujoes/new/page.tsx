import { prisma } from '@/lib/db'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import { createCorujao } from '@/actions/corujoes'

export default async function NewCorujaoPage() {
  const [games, players] = await Promise.all([
    prisma.game.findMany({ where: { isActive: true } }),
    prisma.player.findMany({ orderBy: { name: 'asc' } }),
  ])

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="p-6 max-w-xl">
      <PageHeader title="Novo corujão" backHref="/corujoes" backLabel="Corujões" />
      <form action={createCorujao} className="space-y-4">
        <Card>
          <CardHeader><p className="text-sm font-medium text-white/75">Informações</p></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Nome *" name="name" placeholder='Corujão 11/05' required autoFocus />
            <Input label="Data *" name="date" type="date" defaultValue={today} required />
            <input type="hidden" name="gameId" value={games[0]?.id ?? ''} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-white/75">Jogadores da noite</p>
            <p className="text-xs text-white/40 mt-0.5">Selecione quem vai participar (mín. 2)</p>
          </CardHeader>
          <CardContent>
            {players.length === 0 ? (
              <p className="text-sm text-white/40 py-4 text-center">
                Nenhum jogador cadastrado. <a href="/players/new" className="text-accent-blue hover:underline">Cadastrar →</a>
              </p>
            ) : (
              <div className="space-y-1">
                {players.map(player => (
                  <label key={player.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] cursor-pointer group">
                    <input
                      type="checkbox"
                      name="playerIds"
                      value={player.id}
                      defaultChecked
                      className="w-4 h-4 rounded accent-accent-blue"
                    />
                    <div>
                      <span className="text-sm text-white">{player.name}</span>
                      {player.nickname && <span className="text-xs text-white/40 ml-2">{player.nickname}</span>}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit">Criar corujão</Button>
          <a href="/corujoes"><Button type="button" variant="ghost">Cancelar</Button></a>
        </div>
      </form>
    </div>
  )
}
