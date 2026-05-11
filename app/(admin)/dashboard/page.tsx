import { prisma } from '@/lib/db'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'

export default async function DashboardPage() {
  const [playerCount, corujaoCount, lastCorujao] = await Promise.all([
    prisma.player.count(),
    prisma.corujao.count(),
    prisma.corujao.findFirst({
      orderBy: { createdAt: 'desc' },
      include: { game: true, _count: { select: { jogos: true } } },
    }),
  ])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white/45 mt-0.5">Visão geral do NightDraft</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Jogadores" value={playerCount} icon="👤" />
        <StatCard label="Corujões" value={corujaoCount} icon="🌙" />
        <StatCard label="Jogo ativo" value="CS" icon="🎮" accent />
        <StatCard label="Status" value="Online" icon="✦" accent />
      </div>

      {lastCorujao && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium text-white/75">Último corujão</h2>
          </CardHeader>
          <CardContent>
            <p className="text-white font-medium">{lastCorujao.name}</p>
            <p className="text-sm text-white/45 mt-0.5">
              {lastCorujao._count.jogos} jogo{lastCorujao._count.jogos !== 1 ? 's' : ''} · {lastCorujao.game.name}
            </p>
          </CardContent>
        </Card>
      )}

      {corujaoCount === 0 && (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-white/45 text-sm">Nenhum corujão ainda.</p>
            <a href="/corujoes/new" className="inline-flex mt-3 text-sm text-accent-blue hover:underline">
              Criar primeiro corujão →
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, accent }: { label: string; value: string | number; icon: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs text-white/45">{label}</p>
          <p className={`text-lg font-bold ${accent ? 'text-accent-blue' : 'text-white'}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
