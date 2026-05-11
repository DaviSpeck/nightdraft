import { prisma } from '@/lib/db'
import PageHeader from '@/components/ui/PageHeader'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toggleMap, createMap, deleteMap } from '@/actions/maps'

export default async function MapsPage() {
  const [maps, games] = await Promise.all([
    prisma.map.findMany({
      orderBy: [{ isActive: 'desc' }, { displayName: 'asc' }],
      include: { game: { select: { id: true, name: true } } },
    }),
    prisma.game.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ])

  const activeMaps   = maps.filter(m => m.isActive)
  const inactiveMaps = maps.filter(m => !m.isActive)

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <PageHeader
        title="Map Pool"
        subtitle="Gerencie os mapas disponíveis para ban/pick"
      />

      {/* Adicionar mapa */}
      <Card>
        <CardHeader><p className="text-sm font-medium text-white/75">Adicionar mapa</p></CardHeader>
        <CardContent className="py-4">
          <form action={createMap} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[140px]">
              <p className="text-xs text-white/40 mb-1">Nome de exibição</p>
              <Input name="displayName" placeholder="ex: Cache" required />
            </div>
            <div className="flex-1 min-w-[140px]">
              <p className="text-xs text-white/40 mb-1">Slug (de_xxx)</p>
              <Input name="name" placeholder="ex: de_cache" required />
            </div>
            <div className="min-w-[140px]">
              <p className="text-xs text-white/40 mb-1">Jogo</p>
              <select
                name="gameId"
                className="w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue"
              >
                {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <Button type="submit">Adicionar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Mapas ativos */}
      <div>
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
          Ativos — {activeMaps.length} no pool
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {activeMaps.map(map => (
            <MapCard key={map.id} map={map} />
          ))}
        </div>
      </div>

      {/* Mapas inativos */}
      {inactiveMaps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
            Inativos — fora do pool
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {inactiveMaps.map(map => (
              <MapCard key={map.id} map={map} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MapCard({ map }: { map: { id: string; displayName: string; name: string; isActive: boolean; game: { name: string } } }) {
  return (
    <div className={`relative bg-card border rounded-xl p-4 transition-all ${map.isActive ? 'border-white/[0.06]' : 'border-white/[0.03] opacity-50'}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className={`text-sm font-semibold ${map.isActive ? 'text-white' : 'text-white/40'}`}>
            {map.displayName}
          </p>
          <p className="text-xs text-white/30 mt-0.5">{map.name}</p>
        </div>
        {map.isActive
          ? <span className="text-[10px] bg-accent-green/10 text-accent-green px-1.5 py-0.5 rounded font-medium">Ativo</span>
          : <span className="text-[10px] bg-white/[0.06] text-white/40 px-1.5 py-0.5 rounded font-medium">Inativo</span>
        }
      </div>
      <div className="space-y-1.5">
        <form action={toggleMap.bind(null, map.id, !map.isActive)}>
          <button
            type="submit"
            className={`w-full text-xs py-1.5 rounded-lg border transition-colors ${
              map.isActive
                ? 'border-accent-red/30 text-accent-red hover:bg-accent-red/10'
                : 'border-accent-green/30 text-accent-green hover:bg-accent-green/10'
            }`}
          >
            {map.isActive ? 'Desativar' : 'Ativar'}
          </button>
        </form>
        <form action={deleteMap.bind(null, map.id)}>
          <button
            type="submit"
            className="w-full text-[10px] py-1 text-white/20 hover:text-accent-red/60 transition-colors"
          >
            excluir
          </button>
        </form>
      </div>
    </div>
  )
}
