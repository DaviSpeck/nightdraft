'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const Schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  date: z.string().min(1, 'Data obrigatória'),
  gameId: z.string().min(1),
  playerIds: z.array(z.string()).min(2, 'Selecione ao menos 2 jogadores'),
})

export async function createCorujao(formData: FormData) {
  const playerIds = formData.getAll('playerIds').map(String)
  const parsed = Schema.safeParse({
    name: formData.get('name'),
    date: formData.get('date'),
    gameId: formData.get('gameId'),
    playerIds,
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)

  const { name, date, gameId, playerIds: pIds } = parsed.data
  const corujao = await prisma.corujao.create({
    data: {
      name,
      date: new Date(date),
      gameId,
      players: { create: pIds.map(playerId => ({ playerId })) },
    },
  })
  revalidatePath('/corujoes')
  redirect(`/corujoes/${corujao.id}`)
}
