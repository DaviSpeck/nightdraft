'use server'

import { prisma } from '@/lib/db'
import { MatchFormat } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const CreateSchema = z.object({
  format: z.enum(['MD1', 'MD3', 'MD5']),
  nameTeamA: z.string().optional(),
  nameTeamB: z.string().optional(),
})

export async function createMatch(corujaoId: string, formData: FormData) {
  const parsed = CreateSchema.safeParse({
    format: formData.get('format'),
    nameTeamA: formData.get('nameTeamA') || undefined,
    nameTeamB: formData.get('nameTeamB') || undefined,
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)

  const corujaoPlayers = await prisma.corujaoPlayer.findMany({
    where: { corujaoId },
    select: { playerId: true },
  })

  const members: { playerId: string; side: 'TEAM_A' | 'TEAM_B' }[] = []
  for (const { playerId } of corujaoPlayers) {
    const side = formData.get(`player_${playerId}`) as string
    if (side === 'TEAM_A' || side === 'TEAM_B') members.push({ playerId, side })
  }

  if (members.filter(m => m.side === 'TEAM_A').length === 0) throw new Error('TEAM A sem jogadores')
  if (members.filter(m => m.side === 'TEAM_B').length === 0) throw new Error('TEAM B sem jogadores')

  const last = await prisma.match.findFirst({ where: { corujaoId }, orderBy: { sequence: 'desc' } })
  const sequence = (last?.sequence ?? 0) + 1

  const match = await prisma.match.create({
    data: {
      corujaoId,
      sequence,
      format: parsed.data.format as MatchFormat,
      nameTeamA: parsed.data.nameTeamA,
      nameTeamB: parsed.data.nameTeamB,
      members: { create: members },
    },
  })

  revalidatePath(`/corujoes/${corujaoId}`)
  redirect(`/corujoes/${corujaoId}/matches/${match.id}`)
}

export async function finalizeMatch(matchId: string, corujaoId: string, formData: FormData) {
  const scoreA = parseInt(formData.get('scoreTeamA') as string)
  const scoreB = parseInt(formData.get('scoreTeamB') as string)
  if (isNaN(scoreA) || isNaN(scoreB)) throw new Error('Placar inválido')

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: { scoreTeamA: scoreA, scoreTeamB: scoreB, status: 'COMPLETED', playedAt: new Date() },
    })
    const remaining = await tx.match.count({
      where: { corujaoId, status: { not: 'COMPLETED' } },
    })
    if (remaining === 0) {
      await tx.corujao.update({ where: { id: corujaoId }, data: { status: 'FINISHED' } })
    }
  })

  revalidatePath(`/corujoes/${corujaoId}`)
  redirect(`/corujoes/${corujaoId}`)
}
