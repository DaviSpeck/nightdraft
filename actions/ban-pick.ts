'use server'

import { prisma } from '@/lib/db'
import { getCurrentStep, isComplete } from '@/lib/ban-pick'
import { revalidatePath } from 'next/cache'

export async function submitBanPick(jogoId: string, corujaoId: string, mapId: string) {
  const jogo = await prisma.jogo.findUniqueOrThrow({
    where: { id: jogoId },
    include: { banPicks: true },
  })

  const step = getCurrentStep(jogo.format, jogo.banPicks.length)
  if (!step) throw new Error('Ban/pick já completo')

  const usedMapIds = jogo.banPicks.map(bp => bp.mapId)
  if (usedMapIds.includes(mapId)) throw new Error('Mapa já utilizado')

  await prisma.$transaction(async (tx) => {
    await tx.banPick.create({
      data: {
        jogoId,
        mapId,
        action: step.action,
        order: jogo.banPicks.length,
        side: step.side,
      },
    })

    if (jogo.status === 'SCHEDULED') {
      await tx.jogo.update({ where: { id: jogoId }, data: { status: 'ONGOING' } })
      await tx.corujao.updateMany({
        where: { id: corujaoId, status: 'DRAFT' },
        data: { status: 'IN_PROGRESS' },
      })
    }
  })

  revalidatePath(`/corujoes/${corujaoId}/matches/${jogoId}/ban-pick`)
}
