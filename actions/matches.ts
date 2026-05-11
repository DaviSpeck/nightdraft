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

export async function updateMatch(matchId: string, corujaoId: string, formData: FormData) {
  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) throw new Error('Partida não encontrada')

  const nameTeamA = (formData.get('nameTeamA') as string) || null
  const nameTeamB = (formData.get('nameTeamB') as string) || null

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: { nameTeamA, nameTeamB },
    })

    // Only reassign sides if match hasn't started yet
    if (match.status === 'SCHEDULED') {
      const corujaoPlayers = await tx.corujaoPlayer.findMany({
        where: { corujaoId },
        select: { playerId: true },
      })
      for (const { playerId } of corujaoPlayers) {
        const side = formData.get(`player_${playerId}`) as string
        if (side === 'TEAM_A' || side === 'TEAM_B') {
          await tx.matchTeamMember.updateMany({
            where: { matchId, playerId },
            data: { side },
          })
        }
      }
    }
  })

  revalidatePath(`/corujoes/${corujaoId}/matches/${matchId}`)
  redirect(`/corujoes/${corujaoId}/matches/${matchId}`)
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

export async function deleteMatch(matchId: string, corujaoId: string) {
  await prisma.match.delete({ where: { id: matchId } })
  revalidatePath(`/corujoes/${corujaoId}`)
  redirect(`/corujoes/${corujaoId}`)
}

const StatRowSchema = z.object({
  kills: z.coerce.number().int().min(0).default(0),
  deaths: z.coerce.number().int().min(0).default(0),
  assists: z.coerce.number().int().min(0).default(0),
})

export async function saveMapStats(matchId: string, corujaoId: string, mapId: string, formData: FormData) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { members: { include: { player: true } } },
  })
  if (!match) throw new Error('Partida não encontrada')

  const upserts = match.members.map(member => {
    const parsed = StatRowSchema.parse({
      kills: formData.get(`kills_${member.playerId}_${mapId}`),
      deaths: formData.get(`deaths_${member.playerId}_${mapId}`),
      assists: formData.get(`assists_${member.playerId}_${mapId}`),
    })
    return prisma.matchMapStat.upsert({
      where: { matchId_mapId_playerId: { matchId, mapId, playerId: member.playerId } },
      update: parsed,
      create: { matchId, mapId, playerId: member.playerId, ...parsed },
    })
  })

  await prisma.$transaction(upserts)
  revalidatePath(`/corujoes/${corujaoId}/matches/${matchId}`)
}
