import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import BanPickBoard from '@/components/ban-pick/BanPickBoard'
import { getCurrentStep, getSequence, isComplete } from '@/lib/ban-pick'

export default async function BanPickPage({ params }: { params: Promise<{ id: string; matchId: string }> }) {
  const { id: corujaoId, matchId } = await params

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      banPicks: { orderBy: { order: 'asc' }, include: { map: true } },
      corujao: { include: { game: true } },
    },
  })
  if (!match) notFound()

  const activeMaps = await prisma.map.findMany({
    where: { gameId: match.corujao.gameId, isActive: true },
    orderBy: { displayName: 'asc' },
  })

  const doneCount = match.banPicks.length
  const currentStep = getCurrentStep(match.format, doneCount)
  const totalSteps = getSequence(match.format).length
  const done = isComplete(match.format, doneCount)

  return (
    <BanPickBoard
      matchId={matchId}
      corujaoId={corujaoId}
      format={match.format}
      nameTeamA={match.nameTeamA ?? 'Time A'}
      nameTeamB={match.nameTeamB ?? 'Time B'}
      allMaps={activeMaps}
      banPicks={match.banPicks}
      currentStep={currentStep}
      stepIndex={doneCount}
      totalSteps={totalSteps}
      done={done}
    />
  )
}
