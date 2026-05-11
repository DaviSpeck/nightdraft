import { prisma } from '@/lib/db'
import PageHeader from '@/components/ui/PageHeader'
import { toggleMap } from '@/actions/maps'

export default async function MapsPage() {
  const maps = await prisma.map.findMany({
    orderBy: { displayName: 'asc' },
    include: { game: { select: { name: true } } },
  })

  return (
    <div className="p-6">
      <PageHeader
        title="Map Pool"
        subtitle="Ative ou desative mapas disponíveis para ban/pick"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {maps.map(map => (
          <div
            key={map.id}
            className={`relative bg-card border rounded-xl p-4 transition-all ${
              map.isActive ? 'border-white/[0.06]' : 'border-white/[0.03] opacity-50'
            }`}
          >
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
          </div>
        ))}
      </div>
    </div>
  )
}
