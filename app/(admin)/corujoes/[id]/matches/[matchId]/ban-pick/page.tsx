import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import BanPickBoard from '@/components/ban-pick/BanPickBoard'
import { getCurrentStep, getSequence, isComplete } from '@/lib/ban-pick'

export default async function BanPickPage({ params }: { params: Promise<{ id: string; matchId: string }> }) {
  const { id: corujaoId, matchId: jogoId } = await params

  const jogo = await prisma.jogo.findUnique({
    where: { id: jogoId },
    include: {
      banPicks: { orderBy: { order: 'asc' }, include: { map: true } },
      corujao: { include: { game: true } },
    },
  })
  if (!jogo) notFound()

  const activeMaps = await prisma.map.findMany({
    where: { gameId: jogo.corujao.gameId, isActive: true },
    orderBy: { displayName: 'asc' },
  })

  const doneCount = jogo.banPicks.length
  const currentStep = getCurrentStep(jogo.format, doneCount)
  const totalSteps = getSequence(jogo.format).length
  const done = isComplete(jogo.format, doneCount)

  return (
    <BanPickBoard
      matchId={jogoId}
      corujaoId={corujaoId}
      format={jogo.format}
      nameTeamA={jogo.nameTeamA ?? 'Time A'}
      nameTeamB={jogo.nameTeamB ?? 'Time B'}
      allMaps={activeMaps}
      banPicks={jogo.banPicks}
      currentStep={currentStep}
      stepIndex={doneCount}
      totalSteps={totalSteps}
      done={done}
    />
  )
}
