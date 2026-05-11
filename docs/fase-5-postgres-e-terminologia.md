# Fase 5 — PostgreSQL, Terminologia e Error Boundaries

> **Status:** ✅ Concluída  
> **Data:** 2026-05-11

---

## Motivação

Após fase 4, três problemas bloquearam o uso em produção:

1. **SQLite incompatível com Vercel** — sistema de arquivos read-only faz toda requisição falhar no deploy
2. **Terminologia confusa** — "Partida" era usado para o container MD3 (que é composto por até 3 partidas), gerando confusão semântica
3. **Sem error boundaries** — qualquer erro de servidor exibia a página de erro padrão do Next.js, sem caminho de volta

---

## O que foi feito

### 5.1 Migração SQLite → PostgreSQL (Neon)

Banco migrado para **Neon** (PostgreSQL serverless, free tier, região São Paulo).

**`prisma/schema.prisma`** — provider alterado de `sqlite` para `postgresql`  
**`.env`** — `DATABASE_URL` atualizado para connection string Neon com `sslmode=require&channel_binding=require`  
**`.env.example`** — template documentado com todos os env vars necessários  
**`.gitignore`** — entradas SQLite removidas (`*.db`, `*.db-journal`, `*.db-shm`, `*.db-wal`)

Seed reexecutado após reset: `npx tsx prisma/seed.ts`

---

### 5.2 Renomeação de Terminologia

**Conceito:** um "Jogo" (MD3, MD5) é composto por até 3 ou 5 partidas (mapas individuais). O container que o sistema gerencia é o Jogo — não a partida individual.

#### Schema Prisma

| Antes | Depois |
|---|---|
| `model Match` | `model Jogo` |
| `model MatchTeamMember` | `model JogoMembro` |
| `model MatchMapStat` | `model JogoMapStat` |
| `Corujao.matches Match[]` | `Corujao.jogos Jogo[]` |
| `Player.matchSlots` | `Player.jogoSlots` |
| `Player.mapStats` | `Player.jogoMapStats` |
| `Map.mapStats` | `Map.jogoMapStats` |
| campo `matchId` (BanPick, JogoMembro, JogoMapStat) | campo `jogoId` |
| relação `match` em BanPick | relação `jogo` |

Enums mantidos: `MatchFormat`, `MatchStatus`, `MatchSide`, `BanPickAction`

#### Actions e Pages

Todas as chamadas `prisma.match` → `prisma.jogo`, `match.members` → `jogo.membros`, chave de upsert `jogoId_mapId_playerId`.

UI text: "Partida" → "Jogo", "partidas" → "jogos", "Nova partida" → "Novo jogo", "Editar partida" → "Editar jogo", "Ver partida" → "Ver jogo".

---

### 5.3 Error Boundaries

**`app/not-found.tsx`** — página 404 customizada dentro do app, com link de volta aos corujões  
**`app/error.tsx`** — error boundary global (`'use client'`)  
**`app/(admin)/error.tsx`** — error boundary da área admin com botão "Tentar novamente" e link para corujões

Resolve o bug de 404 no back do navegador na Vercel (que ocorria porque as páginas erravam silenciosamente com SQLite).

---

## Schema atual (pós-fase 5)

```prisma
model Jogo {
  id         String      @id @default(cuid())
  sequence   Int
  format     MatchFormat @default(MD1)
  status     MatchStatus @default(SCHEDULED)
  nameTeamA  String?
  nameTeamB  String?
  scoreTeamA Int?
  scoreTeamB Int?
  playedAt   DateTime?
  createdAt  DateTime    @default(now())

  corujaoId String
  corujao   Corujao      @relation(fields: [corujaoId], references: [id], onDelete: Cascade)
  membros   JogoMembro[]
  banPicks  BanPick[]
  mapStats  JogoMapStat[]

  @@unique([corujaoId, sequence])
}

model JogoMembro {
  id       String    @id @default(cuid())
  side     MatchSide
  jogoId   String
  playerId String
  jogo     Jogo      @relation(fields: [jogoId], references: [id], onDelete: Cascade)
  player   Player    @relation(fields: [playerId], references: [id])

  @@unique([jogoId, playerId])
}

model JogoMapStat {
  id       String @id @default(cuid())
  kills    Int    @default(0)
  deaths   Int    @default(0)
  assists  Int    @default(0)
  jogoId   String
  mapId    String
  playerId String
  jogo     Jogo   @relation(fields: [jogoId], references: [id], onDelete: Cascade)
  map      Map    @relation(fields: [mapId], references: [id])
  player   Player @relation(fields: [playerId], references: [id])

  @@unique([jogoId, mapId, playerId])
}
```

---

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `prisma/schema.prisma` | provider postgresql, modelos renomeados |
| `.env` | connection string Neon |
| `.env.example` | template com vars documentadas |
| `.gitignore` | removidas entradas SQLite |
| `actions/matches.ts` | prisma.jogo, jogo.membros, jogoMapStat |
| `actions/ban-pick.ts` | prisma.jogo, jogoId |
| `app/(admin)/corujoes/[id]/page.tsx` | corujao.jogos, UI "Jogos" |
| `app/(admin)/corujoes/[id]/matches/new/page.tsx` | "Novo jogo", "Criar jogo" |
| `app/(admin)/corujoes/[id]/matches/[matchId]/page.tsx` | JogoPage, jogo.membros |
| `app/(admin)/corujoes/[id]/matches/[matchId]/edit/page.tsx` | prisma.jogo, jogo.membros, "Editar jogo" |
| `app/(admin)/corujoes/[id]/matches/[matchId]/ban-pick/page.tsx` | prisma.jogo |
| `app/(admin)/corujoes/page.tsx` | _count.jogos, UI "jogos" |
| `app/(admin)/dashboard/page.tsx` | _count.jogos, UI "jogo" |
| `components/ban-pick/BanPickBoard.tsx` | "tela do jogo", "Ver jogo" |
| `components/ui/Sidebar.tsx` | "Jogos" → "Títulos" (para não colidir com "Jogos" do CS) |
| `app/not-found.tsx` | novo — 404 customizada |
| `app/error.tsx` | novo — error boundary global |
| `app/(admin)/error.tsx` | novo — error boundary admin |

---

## Estado atual do sistema (pós-fase 5)

- ✅ Banco PostgreSQL (Neon, São Paulo)
- ✅ Deploy Vercel funcional
- ✅ Terminologia consistente: Jogo = container MD1/MD3/MD5
- ✅ Error boundaries em todas as camadas da rota
- ✅ Seed com 13 mapas CS e 10 jogadores

## Próximas ideias (Fase 6)

- Dashboard com rankings de KDA acumulado e winrate por jogador
- Histórico de corujões com filtros
- Imagens dos mapas no ban/pick (assets locais em `/public/maps/`)
- Sorteio automático de times balanceados
- Export de resultados (imagem para compartilhar)
