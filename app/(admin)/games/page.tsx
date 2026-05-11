import { prisma } from '@/lib/db'
import PageHeader from '@/components/ui/PageHeader'
import Card, { CardContent } from '@/components/ui/Card'

export default async function GamesPage() {
  const games = await prisma.game.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="p-6">
      <PageHeader title="Jogos" subtitle="Jogos disponíveis na plataforma" />
      <div className="space-y-2">
        {games.map(game => (
          <div key={game.id} className="flex items-center justify-between bg-card border border-white/[0.06] rounded-xl px-5 py-3.5">
            <div>
              <p className="text-sm font-medium text-white">{game.name}</p>
              <p className="text-xs text-white/40">{game.slug}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${game.isActive ? 'bg-accent-green/10 text-accent-green' : 'bg-white/[0.06] text-white/40'}`}>
              {game.isActive ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        ))}
      </div>
      <Card className="mt-4">
        <CardContent className="text-center py-6">
          <p className="text-xs text-white/30">Suporte a mais jogos em breve — Valorant, Dota, LoL, Rocket League...</p>
        </CardContent>
      </Card>
    </div>
  )
}
