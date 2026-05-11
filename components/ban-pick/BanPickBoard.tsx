'use client'

import { useTransition } from 'react'
import { submitBanPick } from '@/actions/ban-pick'
import { BanPickStep, stepLabel } from '@/lib/ban-pick'
import type { Map, BanPick, MatchSide } from '@prisma/client'

type BanPickWithMap = BanPick & { map: Map }

interface Props {
  matchId: string
  corujaoId: string
  format: string
  nameTeamA: string
  nameTeamB: string
  allMaps: Map[]
  banPicks: BanPickWithMap[]
  currentStep: BanPickStep | null
  stepIndex: number
  totalSteps: number
  done: boolean
}

const sideColor = {
  TEAM_A: 'text-accent-blue border-accent-blue',
  TEAM_B: 'text-accent-red  border-accent-red',
}

export default function BanPickBoard({
  matchId, corujaoId, format, nameTeamA, nameTeamB,
  allMaps, banPicks, currentStep, stepIndex, totalSteps, done,
}: Props) {
  const [isPending, startTransition] = useTransition()

  const usedMapIds = new Set(banPicks.map(bp => bp.mapId))

  function handleMapClick(mapId: string) {
    if (isPending || done || !currentStep) return
    startTransition(() => submitBanPick(matchId, corujaoId, mapId))
  }

  const bansA   = banPicks.filter(bp => bp.action === 'BAN'   && bp.side === 'TEAM_A')
  const bansB   = banPicks.filter(bp => bp.action === 'BAN'   && bp.side === 'TEAM_B')
  const picksA  = banPicks.filter(bp => bp.action === 'PICK'  && bp.side === 'TEAM_A')
  const picksB  = banPicks.filter(bp => bp.action === 'PICK'  && bp.side === 'TEAM_B')
  const decider = banPicks.find(bp => bp.action === 'DECIDER')

  const isDeciderStep = currentStep?.action === 'DECIDER'
  const teamName = (side: MatchSide | null) => side === 'TEAM_A' ? nameTeamA : side === 'TEAM_B' ? nameTeamB : '—'

  return (
    <div className="min-h-screen bg-base flex flex-col">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/40">{format} · Ban/Pick</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${
                i < stepIndex ? 'bg-white/30' : i === stepIndex && !done ? 'bg-accent-blue' : 'bg-white/[0.08]'
              }`} />
            ))}
          </div>
          <span className="text-xs text-white/40 ml-2">{done ? 'Concluído' : `${stepIndex + 1} / ${totalSteps}`}</span>
        </div>
      </div>

      {/* Current step indicator */}
      {!done && currentStep ? (
        <div className={`px-6 py-5 text-center border-b border-white/[0.06] ${isDeciderStep ? 'bg-accent-yellow/5' : 'bg-surface'}`}>
          <p className={`text-lg font-bold ${isDeciderStep ? 'text-accent-yellow' : currentStep.side ? sideColor[currentStep.side].split(' ')[0] : 'text-white'}`}>
            {isDeciderStep
              ? '★ Mapa Decisivo — último mapa restante'
              : stepLabel(currentStep, nameTeamA, nameTeamB)}
          </p>
          <p className="text-xs text-white/40 mt-1">
            {isDeciderStep
              ? 'Confirme o mapa decisivo'
              : currentStep.action === 'BAN'
              ? 'Clique no mapa para banir'
              : 'Clique no mapa para escolher'}
          </p>
        </div>
      ) : done ? (
        <div className="px-6 py-5 text-center border-b border-white/[0.06] bg-accent-green/5">
          <p className="text-base font-bold text-accent-green">✓ Ban/Pick concluído</p>
          <p className="text-xs text-white/40 mt-1">Registre o resultado na tela do jogo</p>
        </div>
      ) : null}

      {/* Decider banner */}
      {decider && (
        <div className="mx-6 mt-4 rounded-xl border border-accent-yellow/30 bg-accent-yellow/10 px-5 py-3 flex items-center gap-3">
          <span className="text-accent-yellow text-xl">★</span>
          <div>
            <p className="text-xs text-accent-yellow/60 font-semibold uppercase tracking-wider">Mapa Decisivo</p>
            <p className="text-base font-bold text-accent-yellow">{decider.map.displayName}</p>
          </div>
        </div>
      )}

      {/* Board */}
      <div className="flex flex-1 gap-0 mt-4">
        {/* Team A */}
        <div className="w-44 border-r border-white/[0.06] p-4 space-y-4">
          <p className="text-xs font-semibold text-accent-blue uppercase tracking-wider">{nameTeamA}</p>
          {picksA.length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 mb-1.5">PICKS</p>
              {picksA.map(bp => (
                <div key={bp.id} className="text-xs text-white font-medium bg-accent-blue/10 border border-accent-blue/20 rounded px-2 py-1 mb-1">
                  {bp.map.displayName}
                </div>
              ))}
            </div>
          )}
          {bansA.length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 mb-1.5">BANS</p>
              {bansA.map(bp => (
                <div key={bp.id} className="text-xs text-white/40 line-through px-2 py-1 mb-1">{bp.map.displayName}</div>
              ))}
            </div>
          )}
        </div>

        {/* Map pool */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
            {allMaps.map(map => {
              const bp = banPicks.find(b => b.mapId === map.id)
              const isBanned    = bp?.action === 'BAN'
              const isPicked    = bp?.action === 'PICK'
              const isDeciderMap = bp?.action === 'DECIDER'
              const isAvailable  = !usedMapIds.has(map.id) && !done
              const isCurrent    = isAvailable && !isPending
              const isDeciderCandidate = isDeciderStep && isAvailable

              return (
                <button
                  key={map.id}
                  onClick={() => isCurrent && handleMapClick(map.id)}
                  disabled={!isCurrent || isPending}
                  className={`relative rounded-xl border p-3 text-center transition-all duration-200 ${
                    isBanned
                      ? 'opacity-30 border-white/[0.04] cursor-not-allowed bg-white/[0.02]'
                      : isPicked
                      ? 'border-accent-blue/40 bg-accent-blue/10 -translate-y-1'
                      : isDeciderMap
                      ? 'border-accent-yellow/60 bg-accent-yellow/15 -translate-y-1 ring-2 ring-accent-yellow/30'
                      : isDeciderCandidate
                      ? 'border-accent-yellow/50 bg-accent-yellow/10 hover:border-accent-yellow hover:bg-accent-yellow/20 cursor-pointer scale-105 shadow-lg shadow-accent-yellow/10'
                      : isCurrent
                      ? 'border-white/[0.08] bg-card hover:border-accent-blue hover:bg-accent-blue/5 cursor-pointer'
                      : 'border-white/[0.06] bg-card cursor-not-allowed'
                  } ${isPending ? 'opacity-60' : ''}`}
                >
                  {isBanned && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                      <span className="text-white/30 text-xl">✕</span>
                    </div>
                  )}
                  <p className={`text-xs font-semibold ${
                    isBanned ? 'text-white/20' : isPicked ? 'text-accent-blue' : isDeciderMap || isDeciderCandidate ? 'text-accent-yellow' : 'text-white'
                  }`}>
                    {map.displayName}
                  </p>
                  {isPicked && <p className="text-[9px] text-accent-blue/70 mt-0.5">PICK</p>}
                  {isDeciderMap && <p className="text-[9px] text-accent-yellow/70 mt-0.5 font-bold">★ DECISIVO</p>}
                  {isBanned && <p className="text-[9px] text-white/20 mt-0.5">BAN</p>}
                  {isDeciderCandidate && <p className="text-[9px] text-accent-yellow/60 mt-0.5">confirmar</p>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Team B */}
        <div className="w-44 border-l border-white/[0.06] p-4 space-y-4">
          <p className="text-xs font-semibold text-accent-red uppercase tracking-wider text-right">{nameTeamB}</p>
          {picksB.length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 mb-1.5 text-right">PICKS</p>
              {picksB.map(bp => (
                <div key={bp.id} className="text-xs text-white font-medium bg-accent-red/10 border border-accent-red/20 rounded px-2 py-1 mb-1 text-right">
                  {bp.map.displayName}
                </div>
              ))}
            </div>
          )}
          {bansB.length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 mb-1.5 text-right">BANS</p>
              {bansB.map(bp => (
                <div key={bp.id} className="text-xs text-white/40 line-through px-2 py-1 mb-1 text-right">{bp.map.displayName}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {done && (
        <div className="border-t border-white/[0.06] px-6 py-4 text-center">
          <a href={`/corujoes/${corujaoId}/matches/${matchId}`} className="inline-flex items-center gap-2 text-sm text-accent-blue hover:underline">
            Ver jogo e registrar resultado →
          </a>
        </div>
      )}
    </div>
  )
}
