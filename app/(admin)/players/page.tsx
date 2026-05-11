import { prisma } from '@/lib/db'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'
import { deletePlayer } from '@/actions/players'

export default async function PlayersPage() {
  const players = await prisma.player.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="p-6">
      <PageHeader
        title="Jogadores"
        subtitle={`${players.length} cadastrado${players.length !== 1 ? 's' : ''}`}
        action={
          <Link href="/players/new">
            <Button>+ Novo jogador</Button>
          </Link>
        }
      />

      {players.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-white/40 text-sm">Nenhum jogador cadastrado.</p>
            <Link href="/players/new" className="inline-flex mt-3 text-sm text-accent-blue hover:underline">
              Cadastrar primeiro jogador →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {players.map(player => (
            <div key={player.id} className="flex items-center justify-between bg-card border border-white/[0.06] rounded-xl px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-blue/10 flex items-center justify-center text-sm font-bold text-accent-blue">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{player.name}</p>
                  {player.nickname && <p className="text-xs text-white/45">{player.nickname}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/players/${player.id}/edit`}>
                  <Button variant="ghost" size="sm">Editar</Button>
                </Link>
                <form action={deletePlayer.bind(null, player.id)}>
                  <Button variant="danger" size="sm" type="submit">Remover</Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
