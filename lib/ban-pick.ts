import { MatchFormat, MatchSide, BanPickAction } from '@prisma/client'

export type BanPickStep = {
  side: MatchSide | null  // null = decider automático (último mapa restante)
  action: BanPickAction
}

const sequences: Record<MatchFormat, BanPickStep[]> = {
  MD1: [
    { side: 'TEAM_A', action: 'BAN' },
    { side: 'TEAM_B', action: 'BAN' },
    { side: 'TEAM_A', action: 'BAN' },
    { side: 'TEAM_B', action: 'BAN' },
    { side: 'TEAM_A', action: 'BAN' },
    { side: 'TEAM_B', action: 'BAN' },
    { side: null,     action: 'DECIDER' },
  ],
  MD3: [
    { side: 'TEAM_A', action: 'BAN' },
    { side: 'TEAM_B', action: 'BAN' },
    { side: 'TEAM_A', action: 'PICK' },
    { side: 'TEAM_B', action: 'PICK' },
    { side: 'TEAM_A', action: 'BAN' },
    { side: 'TEAM_B', action: 'BAN' },
    { side: null,     action: 'DECIDER' },
  ],
  MD5: [
    { side: 'TEAM_A', action: 'BAN' },
    { side: 'TEAM_B', action: 'BAN' },
    { side: 'TEAM_A', action: 'PICK' },
    { side: 'TEAM_B', action: 'PICK' },
    { side: 'TEAM_A', action: 'PICK' },
    { side: 'TEAM_B', action: 'PICK' },
    { side: null,     action: 'DECIDER' },
  ],
}

export function getSequence(format: MatchFormat): BanPickStep[] {
  return sequences[format]
}

export function getCurrentStep(format: MatchFormat, doneCount: number): BanPickStep | null {
  return sequences[format][doneCount] ?? null
}

export function isComplete(format: MatchFormat, doneCount: number): boolean {
  return doneCount >= sequences[format].length
}

export function stepLabel(step: BanPickStep, teamA: string, teamB: string): string {
  const team = step.side === 'TEAM_A' ? teamA : step.side === 'TEAM_B' ? teamB : null
  if (step.action === 'DECIDER') return 'Mapa Decisivo'
  if (step.action === 'BAN') return `${team} está banindo`
  return `${team} está escolhendo`
}
