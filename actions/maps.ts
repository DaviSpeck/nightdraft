'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CreateMapSchema = z.object({
  displayName: z.string().min(1, 'Nome obrigatório'),
  name: z.string().min(1, 'Slug obrigatório'),
  gameId: z.string().min(1),
})

export async function toggleMap(id: string, isActive: boolean) {
  await prisma.map.update({ where: { id }, data: { isActive } })
  revalidatePath('/maps')
}

export async function createMap(formData: FormData) {
  const parsed = CreateMapSchema.safeParse({
    displayName: formData.get('displayName'),
    name: formData.get('name'),
    gameId: formData.get('gameId'),
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)

  const existing = await prisma.map.findUnique({
    where: { gameId_name: { gameId: parsed.data.gameId, name: parsed.data.name } },
  })
  if (existing) throw new Error('Mapa já cadastrado com esse slug')

  await prisma.map.create({
    data: { ...parsed.data, isActive: true },
  })
  revalidatePath('/maps')
}

export async function deleteMap(id: string) {
  await prisma.map.delete({ where: { id } })
  revalidatePath('/maps')
}
