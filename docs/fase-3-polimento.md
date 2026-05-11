# Fase 3 — Polimento & Detalhes

> **Status:** ✅ Concluída  
> **Data:** 2026-05-11

---

## Motivação

Após primeiro uso real em corujão, três pontos de melhoria foram identificados:

1. Mapa decisivo sem destaque visual
2. Pool de mapas incompleto — CS tem mais mapas além dos 7 do seed
3. Sem registro de KDA por jogador por mapa

---

## O que foi feito

### 3.1 Destaque do Mapa Decisivo

**Problema:** `BanPick.action = 'DECIDER'` tem `side = null`, então o mapa não aparecia nos painéis laterais do BanPickBoard.

**Solução:**
- Banner amarelo `★ Mapa Decisivo` aparece no topo do board assim que o decider é confirmado
- Durante o step DECIDER, os cards disponíveis no pool ficam com borda e fundo dourado + escala maior (`scale-105`, sombra)
- No detalhe da partida, o decider tem card próprio destacado (borda amber/yellow) separado dos picks normais

**Arquivos:** `components/ban-pick/BanPickBoard.tsx`, `app/(admin)/corujoes/[id]/matches/[matchId]/page.tsx`

---

### 3.2 Gestão do Map Pool

**Problema:** Seed só tinha 7 mapas ativos. Não havia como adicionar mapas pela UI.

**Solução:**
- Seed expandido: 7 mapas ativos + 6 inativos (Cache, Overpass, Train, Cobblestone, Office, Tuscan)
- Página `/maps` ganhou formulário "Adicionar mapa" (displayName + slug + jogo)
- Mapas separados visualmente em seções: Ativos / Inativos
- Botão "excluir" em cada card (discreto, abaixo do toggle)

**Novos Server Actions:** `createMap`, `deleteMap` em `actions/maps.ts`

**Arquivos:** `app/(admin)/maps/page.tsx`, `actions/maps.ts`, `prisma/seed.ts`

---

### 3.3 KDA por Mapa

**Problema:** Sem forma de registrar estatísticas de cada jogador em cada mapa da série.

**Solução:**
- Novo modelo `MatchMapStat` no schema: `kills`, `deaths`, `assists` com `@@unique([matchId, mapId, playerId])`
- Para cada mapa escolhido (PICKs + DECIDER) na partida, aparece uma tabela KDA editável
- Formulário por mapa com campos K/D/A por jogador; salva com upsert
- KDA visível desde que a partida tenha ban/pick iniciado (`status != SCHEDULED`)

**Schema:** `MatchMapStat` + relações reversas em `Match`, `Map`, `Player`

**Novos Server Actions:** `saveMapStats` em `actions/matches.ts`

**Arquivos:** `prisma/schema.prisma`, `actions/matches.ts`, `app/(admin)/corujoes/[id]/matches/[matchId]/page.tsx`

---

### 3.4 Excluir Entidades

**Problema:** Sem botão de excluir — usuário não conseguia remover partidas ou corujões errados.

**Solução:**
- Excluir partida — disponível quando `status = SCHEDULED` (antes do ban/pick iniciar). Confirma antes de deletar.
- Excluir corujão — disponível quando `status = DRAFT`. Confirma com aviso sobre partidas.
- Excluir mapa — botão discreto "excluir" em cada card no `/maps`
- Todas as exclusões usam `onDelete: Cascade` já definido no schema

**Novos Server Actions:** `deleteMatch` em `actions/matches.ts`, `deleteCorujao` em `actions/corujoes.ts`, `deleteMap` em `actions/maps.ts`

---

## Schema delta

```prisma
model MatchMapStat {
  id      String @id @default(cuid())
  kills   Int    @default(0)
  deaths  Int    @default(0)
  assists Int    @default(0)
  matchId  String
  mapId    String
  playerId String
  match    Match  @relation(...)
  map      Map    @relation(...)
  player   Player @relation(...)
  @@unique([matchId, mapId, playerId])
}
```

---

## O que NÃO entra nesta fase

- Imagens reais dos mapas (requer assets locais ou CDN — planejado para fase futura)
- Dashboard de estatísticas / rankings de KDA
- Histórico de partidas por jogador
- Sorteio automático de times

---

## Próximas ideias (Fase 4)

- Dashboard com rankings: K/D/A acumulado por jogador, winrate
- Histórico de corujões com filtro por período
- Imagens dos mapas no ban/pick
- Export de resultados (PDF/imagem para compartilhar)
- Sorteio automático de times balanceados
