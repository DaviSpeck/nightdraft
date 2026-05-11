'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function toggleMap(id: string, isActive: boolean) {
  await prisma.map.update({ where: { id }, data: { isActive } })
  revalidatePath('/maps')
}
