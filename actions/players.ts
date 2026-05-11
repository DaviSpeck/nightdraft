'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const Schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  nickname: z.string().optional(),
})

export async function createPlayer(formData: FormData) {
  const parsed = Schema.safeParse({
    name: formData.get('name'),
    nickname: formData.get('nickname') || undefined,
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)
  await prisma.player.create({ data: parsed.data })
  revalidatePath('/players')
  redirect('/players')
}

export async function updatePlayer(id: string, formData: FormData) {
  const parsed = Schema.safeParse({
    name: formData.get('name'),
    nickname: formData.get('nickname') || undefined,
  })
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)
  await prisma.player.update({ where: { id }, data: parsed.data })
  revalidatePath('/players')
  redirect('/players')
}

export async function deletePlayer(id: string) {
  await prisma.player.delete({ where: { id } })
  revalidatePath('/players')
}
