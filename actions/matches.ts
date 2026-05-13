'use server'

import { prisma } from '@/lib/db'
import { MatchFormat, MatchSide } from '@prisma/client'
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

  const membros: { playerId: string; side: 'TEAM_A' | 'TEAM_B' }[] = []
  for (const { playerId } of corujaoPlayers) {
    const side = formData.get(`player_${playerId}`) as string
    if (side === 'TEAM_A' || side === 'TEAM_B') membros.push({ playerId, side })
  }

  if (membros.filter(m => m.side === 'TEAM_A').length === 0) throw new Error('Time A sem jogadores')
  if (membros.filter(m => m.side === 'TEAM_B').length === 0) throw new Error('Time B sem jogadores')

  const last = await prisma.jogo.findFirst({ where: { corujaoId }, orderBy: { sequence: 'desc' } })
  const sequence = (last?.sequence ?? 0) + 1

  const jogo = await prisma.jogo.create({
    data: {
      corujaoId,
      sequence,
      format: parsed.data.format as MatchFormat,
      nameTeamA: parsed.data.nameTeamA,
      nameTeamB: parsed.data.nameTeamB,
      membros: { create: membros },
    },
  })

  revalidatePath(`/corujoes/${corujaoId}`)
  redirect(`/corujoes/${corujaoId}/matches/${jogo.id}`)
}

export async function updateMatch(jogoId: string, corujaoId: string, formData: FormData) {
  const jogo = await prisma.jogo.findUnique({ where: { id: jogoId } })
  if (!jogo) throw new Error('Jogo não encontrado')

  const nameTeamA = (formData.get('nameTeamA') as string) || null
  const nameTeamB = (formData.get('nameTeamB') as string) || null

  await prisma.$transaction(async (tx) => {
    await tx.jogo.update({
      where: { id: jogoId },
      data: { nameTeamA, nameTeamB },
    })

    if (jogo.status === 'SCHEDULED') {
      const corujaoPlayers = await tx.corujaoPlayer.findMany({
        where: { corujaoId },
        select: { playerId: true },
      })
      for (const { playerId } of corujaoPlayers) {
        const side = formData.get(`player_${playerId}`) as string
        if (side === 'TEAM_A' || side === 'TEAM_B') {
          await tx.jogoMembro.updateMany({
            where: { jogoId, playerId },
            data: { side },
          })
        }
      }
    }
  })

  revalidatePath(`/corujoes/${corujaoId}/matches/${jogoId}`)
  redirect(`/corujoes/${corujaoId}/matches/${jogoId}`)
}

export async function finalizeMatch(jogoId: string, corujaoId: string, formData: FormData) {
  const scoreA = parseInt(formData.get('scoreTeamA') as string)
  const scoreB = parseInt(formData.get('scoreTeamB') as string)
  if (isNaN(scoreA) || isNaN(scoreB)) throw new Error('Placar inválido')

  await prisma.$transaction(async (tx) => {
    await tx.jogo.update({
      where: { id: jogoId },
      data: { scoreTeamA: scoreA, scoreTeamB: scoreB, status: 'COMPLETED', playedAt: new Date() },
    })
    const remaining = await tx.jogo.count({
      where: { corujaoId, status: { not: 'COMPLETED' } },
    })
    if (remaining === 0) {
      await tx.corujao.update({ where: { id: corujaoId }, data: { status: 'FINISHED' } })
    }
  })

  revalidatePath(`/corujoes/${corujaoId}`)
  redirect(`/corujoes/${corujaoId}`)
}

export async function createMatchDraft(corujaoId: string, formData: FormData) {
  const format = formData.get('format') as string
  const captainAId = formData.get('captainAId') as string
  const captainBId = formData.get('captainBId') as string

  if (!captainAId || !captainBId) throw new Error('Selecione os dois capitães')
  if (captainAId === captainBId) throw new Error('Os capitães devem ser jogadores diferentes')
  if (!['MD1', 'MD3', 'MD5'].includes(format)) throw new Error('Formato inválido')

  const [captainA, captainB, playerCount] = await Promise.all([
    prisma.player.findUnique({ where: { id: captainAId } }),
    prisma.player.findUnique({ where: { id: captainBId } }),
    prisma.corujaoPlayer.count({ where: { corujaoId } }),
  ])

  if (!captainA || !captainB) throw new Error('Jogador não encontrado')
  if (playerCount < 4) throw new Error('Mínimo de 4 jogadores para o draft')
  if (playerCount % 2 !== 0) throw new Error('O draft requer um número par de jogadores')

  const draftTurn: MatchSide = Math.random() < 0.5 ? 'TEAM_A' : 'TEAM_B'
  const nameTeamA = `Time ${captainA.nickname ?? captainA.name}`
  const nameTeamB = `Time ${captainB.nickname ?? captainB.name}`

  const last = await prisma.jogo.findFirst({ where: { corujaoId }, orderBy: { sequence: 'desc' } })
  const sequence = (last?.sequence ?? 0) + 1

  const jogo = await prisma.jogo.create({
    data: {
      corujaoId,
      sequence,
      format: format as MatchFormat,
      nameTeamA,
      nameTeamB,
      creationMode: 'DRAFT',
      draftStatus: 'DRAFTING',
      draftTurn,
      membros: {
        create: [
          { playerId: captainAId, side: 'TEAM_A', isCaptain: true },
          { playerId: captainBId, side: 'TEAM_B', isCaptain: true },
        ],
      },
    },
  })

  revalidatePath(`/corujoes/${corujaoId}`)
  redirect(`/corujoes/${corujaoId}/matches/${jogo.id}/draft`)
}

export async function draftPick(jogoId: string, corujaoId: string, formData: FormData) {
  const playerId = formData.get('playerId') as string
  if (!playerId) throw new Error('Jogador inválido')

  const jogo = await prisma.jogo.findUnique({
    where: { id: jogoId },
    include: {
      membros: { select: { playerId: true } },
      corujao: { include: { players: { select: { playerId: true } } } },
    },
  })
  if (!jogo) throw new Error('Jogo não encontrado')
  if (jogo.draftStatus !== 'DRAFTING') throw new Error('Draft já finalizado')

  const pickedIds = new Set(jogo.membros.map(m => m.playerId))
  const availableIds = jogo.corujao.players
    .map(p => p.playerId)
    .filter(id => !pickedIds.has(id))

  if (!availableIds.includes(playerId)) throw new Error('Jogador não disponível')

  const side = jogo.draftTurn!
  const isLastPick = availableIds.length === 1
  const nextTurn: MatchSide = side === 'TEAM_A' ? 'TEAM_B' : 'TEAM_A'

  await prisma.$transaction(async (tx) => {
    await tx.jogoMembro.create({ data: { jogoId, playerId, side, isCaptain: false } })
    await tx.jogo.update({
      where: { id: jogoId },
      data: {
        draftTurn: isLastPick ? null : nextTurn,
        draftStatus: isLastPick ? 'COMPLETED' : 'DRAFTING',
      },
    })
  })

  revalidatePath(`/corujoes/${corujaoId}/matches/${jogoId}/draft`)

  if (isLastPick) {
    redirect(`/corujoes/${corujaoId}/matches/${jogoId}/ban-pick`)
  }
}

export async function deleteMatch(jogoId: string, corujaoId: string) {
  await prisma.jogo.delete({ where: { id: jogoId } })
  revalidatePath(`/corujoes/${corujaoId}`)
  redirect(`/corujoes/${corujaoId}`)
}

const StatRowSchema = z.object({
  kills: z.coerce.number().int().min(0).default(0),
  deaths: z.coerce.number().int().min(0).default(0),
  assists: z.coerce.number().int().min(0).default(0),
})

export async function saveMapStats(jogoId: string, corujaoId: string, mapId: string, formData: FormData) {
  const jogo = await prisma.jogo.findUnique({
    where: { id: jogoId },
    include: { membros: { include: { player: true } } },
  })
  if (!jogo) throw new Error('Jogo não encontrado')

  const upserts = jogo.membros.map(membro => {
    const parsed = StatRowSchema.parse({
      kills: formData.get(`kills_${membro.playerId}_${mapId}`),
      deaths: formData.get(`deaths_${membro.playerId}_${mapId}`),
      assists: formData.get(`assists_${membro.playerId}_${mapId}`),
    })
    return prisma.jogoMapStat.upsert({
      where: { jogoId_mapId_playerId: { jogoId, mapId, playerId: membro.playerId } },
      update: parsed,
      create: { jogoId, mapId, playerId: membro.playerId, ...parsed },
    })
  })

  await prisma.$transaction(upserts)
  revalidatePath(`/corujoes/${corujaoId}/matches/${jogoId}`)
}
