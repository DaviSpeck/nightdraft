import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { createMatch, createMatchDraft } from '@/actions/matches'
import { NewMatchForm } from './NewMatchForm'

export default async function NovoJogoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const corujao = await prisma.corujao.findUnique({
    where: { id },
    include: { players: { include: { player: true } } },
  })
  if (!corujao) notFound()

  const players = corujao.players.map(cp => ({
    id: cp.player.id,
    name: cp.player.name,
    nickname: cp.player.nickname,
    avatar: cp.player.avatar,
  }))

  const manualAction = createMatch.bind(null, id)
  const draftAction = createMatchDraft.bind(null, id)

  return (
    <NewMatchForm
      corujaoId={id}
      corujaoName={corujao.name}
      players={players}
      manualAction={manualAction}
      draftAction={draftAction}
    />
  )
}
