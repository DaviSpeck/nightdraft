'use client'

import { useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import { DEFAULT_AVATAR } from '@/lib/avatars'

type PlayerInfo = {
  id: string
  name: string
  nickname: string | null
  avatar: string | null
}

type Props = {
  corujaoId: string
  corujaoName: string
  players: PlayerInfo[]
  manualAction: (formData: FormData) => Promise<void>
  draftAction: (formData: FormData) => Promise<void>
}

const FORMATS = ['MD1', 'MD3', 'MD5'] as const

export function NewMatchForm({ corujaoId, corujaoName, players, manualAction, draftAction }: Props) {
  const [mode, setMode] = useState<'manual' | 'draft'>('manual')
  const [captainA, setCaptainA] = useState('')
  const [captainB, setCaptainB] = useState('')

  const isEven = players.length % 2 === 0
  const canDraft = isEven && players.length >= 4
  const draftDisabledReason = !canDraft
    ? players.length < 4
      ? 'mín. 4'
      : 'nº ímpar'
    : null

  const formatPicker = (
    <Card>
      <CardHeader><p className="text-sm font-medium text-white/75">Formato</p></CardHeader>
      <CardContent className="flex gap-3">
        {FORMATS.map(fmt => (
          <label key={fmt} className="flex-1 cursor-pointer">
            <input type="radio" name="format" value={fmt} defaultChecked={fmt === 'MD3'} className="sr-only peer" />
            <div className="border border-white/[0.08] rounded-lg p-3 text-center text-sm font-bold text-white/60 peer-checked:border-accent-yellow peer-checked:text-accent-yellow peer-checked:bg-accent-yellow/5 transition-all">
              {fmt}
            </div>
          </label>
        ))}
      </CardContent>
    </Card>
  )

  return (
    <div className="p-6 max-w-2xl">
      <PageHeader
        title="Novo jogo"
        subtitle={corujaoName}
        backHref={`/corujoes/${corujaoId}`}
        backLabel={corujaoName}
      />

      <div className="flex gap-1 p-1 bg-surface rounded-xl mb-4 border border-white/[0.06]">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            mode === 'manual' ? 'bg-card text-white' : 'text-white/40 hover:text-white/70'
          }`}
        >
          Manual
        </button>
        <button
          type="button"
          onClick={() => canDraft && setMode('draft')}
          disabled={!canDraft}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            mode === 'draft'
              ? 'bg-card text-white'
              : !canDraft
              ? 'text-white/20 cursor-not-allowed'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          Draft
          {draftDisabledReason && (
            <span className="ml-1.5 text-[10px] text-white/25">({draftDisabledReason})</span>
          )}
        </button>
      </div>

      {mode === 'manual' && (
        <form action={manualAction} className="space-y-4">
          {formatPicker}

          <Card>
            <CardHeader>
              <p className="text-sm font-medium text-white/75">
                Nomes dos times <span className="text-white/30 font-normal">(opcional)</span>
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Input name="nameTeamA" placeholder="Time A" />
              <Input name="nameTeamB" placeholder="Time B" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-sm font-medium text-white/75">Montar times</p>
              <p className="text-xs text-white/40 mt-0.5">Escolha o lado de cada jogador</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mb-3 text-center text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                <span>Jogador</span>
                <span className="text-accent-blue">Time A</span>
                <span className="text-accent-red">Time B</span>
              </div>
              <div className="space-y-1">
                {players.map(player => (
                  <div key={player.id} className="grid grid-cols-3 gap-2 items-center py-2 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{player.avatar ?? DEFAULT_AVATAR}</span>
                      <div>
                        <p className="text-sm text-white">{player.nickname ?? player.name}</p>
                        {player.nickname && <p className="text-[10px] text-white/30">{player.name}</p>}
                      </div>
                    </div>
                    <label className="flex justify-center cursor-pointer">
                      <input type="radio" name={`player_${player.id}`} value="TEAM_A" defaultChecked className="w-4 h-4 accent-accent-blue" />
                    </label>
                    <label className="flex justify-center cursor-pointer">
                      <input type="radio" name={`player_${player.id}`} value="TEAM_B" className="w-4 h-4 accent-accent-red" />
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="submit">Criar jogo</Button>
            <a href={`/corujoes/${corujaoId}`}><Button type="button" variant="ghost">Cancelar</Button></a>
          </div>
        </form>
      )}

      {mode === 'draft' && (
        <form action={draftAction} className="space-y-4">
          {formatPicker}

          <Card>
            <CardHeader>
              <p className="text-sm font-medium text-white/75">Selecionar capitães</p>
              <p className="text-xs text-white/40 mt-0.5">Os capitães farão os picks alternados. Quem começa é sorteado.</p>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-accent-blue uppercase tracking-wider mb-2">Capitão A</p>
                <div className="space-y-1">
                  {players.map(player => (
                    <label
                      key={player.id}
                      className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                        captainB === player.id
                          ? 'opacity-25 cursor-not-allowed'
                          : 'cursor-pointer'
                      } ${
                        captainA === player.id
                          ? 'bg-accent-blue/10 border border-accent-blue/30'
                          : 'border border-transparent hover:bg-white/[0.04]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="captainAId"
                        value={player.id}
                        className="sr-only"
                        onChange={() => setCaptainA(player.id)}
                        disabled={captainB === player.id}
                      />
                      <span className="text-base">{player.avatar ?? DEFAULT_AVATAR}</span>
                      <span className="text-sm text-white">{player.nickname ?? player.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-accent-red uppercase tracking-wider mb-2">Capitão B</p>
                <div className="space-y-1">
                  {players.map(player => (
                    <label
                      key={player.id}
                      className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                        captainA === player.id
                          ? 'opacity-25 cursor-not-allowed'
                          : 'cursor-pointer'
                      } ${
                        captainB === player.id
                          ? 'bg-accent-red/10 border border-accent-red/30'
                          : 'border border-transparent hover:bg-white/[0.04]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="captainBId"
                        value={player.id}
                        className="sr-only"
                        onChange={() => setCaptainB(player.id)}
                        disabled={captainA === player.id}
                      />
                      <span className="text-base">{player.avatar ?? DEFAULT_AVATAR}</span>
                      <span className="text-sm text-white">{player.nickname ?? player.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="submit" disabled={!captainA || !captainB}>
              Sortear e iniciar draft
            </Button>
            <a href={`/corujoes/${corujaoId}`}><Button type="button" variant="ghost">Cancelar</Button></a>
          </div>
        </form>
      )}
    </div>
  )
}
