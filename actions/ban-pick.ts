'use server'

import { prisma } from '@/lib/db'
import { getCurrentStep, isComplete } from '@/lib/ban-pick'
import { revalidatePath } from 'next/cache'

export async function submitBanPick(matchId: string, corujaoId: string, mapId: string) {
  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    include: { banPicks: true },
  })

  const step = getCurrentStep(match.format, match.banPicks.length)
  if (!step) throw new Error('Ban/pick já completo')

  const usedMapIds = match.banPicks.map(bp => bp.mapId)
  if (usedMapIds.includes(mapId)) throw new Error('Mapa já utilizado')

  await prisma.$transaction(async (tx) => {
    await tx.banPick.create({
      data: {
        matchId,
        mapId,
        action: step.action,
        order: match.banPicks.length,
        side: step.side,
      },
    })

    if (match.status === 'SCHEDULED') {
      await tx.match.update({ where: { id: matchId }, data: { status: 'ONGOING' } })
      await tx.corujao.updateMany({
        where: { id: corujaoId, status: 'DRAFT' },
        data: { status: 'IN_PROGRESS' },
      })
    }
  })

  revalidatePath(`/corujoes/${corujaoId}/matches/${matchId}/ban-pick`)
}
