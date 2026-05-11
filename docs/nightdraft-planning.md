# NightDraft — Documento de Planejamento

> **Status:** ✅ FASES 1–5 CONCLUÍDAS  
> **Data:** 2026-05-11  
> **Versão:** 1.5 — PostgreSQL (Neon) + terminologia Jogo consolidada

---

## 1. Visão do Produto

**NightDraft** é uma plataforma web privada para organização de corujões, lobbies e partidas competitivas entre amigos e comunidades. Começa com suporte a Counter-Strike, mas toda a arquitetura nasce multi-game para acomodar Valorant, Dota, LoL, Rocket League e outros sem retrabalho estrutural.

**Job-to-be-Done central:**
> *"Quando estou organizando um corujão, quero criar a sessão da noite, montar os times, fazer o ban/pick e registrar o resultado de cada partida — sem depender de memória, WhatsApp ou planilha."*

### Conceito de Corujão

**Corujão é uma sessão** — não um torneio, não uma campanha. É "hoje à noite a gente vai jogar". Ele é o **container central do produto**: agrupa múltiplas partidas (MD1, MD3, MD5...) que acontecem numa mesma noite.

Fluxo natural:
```
Criar Corujão → Adicionar partidas (MD1, MD3, MD5) → Ban/Pick de cada partida → Jogar → Registrar resultado
```

---

## 2. Stack

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Server Components eliminam camadas de API desnecessárias; Server Actions para mutações |
| Linguagem | TypeScript | Tipagem end-to-end com Prisma |
| Estilos | TailwindCSS | Velocidade de desenvolvimento, sem CSS custom desnecessário |
| ORM | Prisma | Abstração de banco limpa; migração SQLite → Postgres é troca de string |
| Banco | SQLite (WAL mode) | Zero infra, zero custo, backup é `cp`. Adequado para um admin e volume de corujão |
| Auth | iron-session | Cookie httpOnly assinado, sem next-auth (overkill para senha única) |
| Validação | Zod | Campos `Json` do Prisma são `any` no TS — Zod é obrigatório na borda |

---

## 3. Autenticação

### Fluxo

```
[Login Page /login]
    ↓ usuário digita a senha
[POST /api/auth]
    ↓ compara com process.env.ADMIN_PASSWORD
    ↓ se correto → grava cookie iron-session { authenticated: true }
[middleware.ts]
    ↓ lê o cookie em toda rota do grupo (admin)
    ↓ inválido → redirect /login
    ↓ válido → renderiza a rota
```

### Variáveis de ambiente

```env
ADMIN_PASSWORD=sua_senha_aqui
SESSION_SECRET=string_aleatoria_longa_para_assinar_o_cookie
DATABASE_URL=file:./dev.db
```

### Regras de implementação

- `SESSION_SECRET` é **diferente** de `ADMIN_PASSWORD` — é a chave de assinatura do cookie
- Middleware exclui `_next/static`, `_next/image`, `favicon.ico` e `/api/auth` do matcher
- O layout do grupo `(admin)` valida a sessão server-side antes de renderizar qualquer página

```typescript
// middleware.ts
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
}
```

---

## 4. Modelagem de Entidades

> **v1.2** — Player global (sem game_id), Team removido do Corujão, times por partida via MatchTeamMember.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ─── JOGO ─────────────────────────────────────────────

model Game {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique        // "counter-strike", "valorant"
  logoUrl   String?
  coverUrl  String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  maps     Map[]
  corujoes Corujao[]
}

// ─── JOGADOR (global, sem vínculo com jogo) ───────────

model Player {
  id        String   @id @default(cuid())
  name      String
  nickname  String?
  avatarUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  corujoes   CorujaoPlayer[]
  matchSlots MatchTeamMember[]
}

// ─── MAPA ─────────────────────────────────────────────

model Map {
  id          String  @id @default(cuid())
  name        String                // "de_dust2"
  displayName String                // "Dust II"
  imageUrl    String?
  isActive    Boolean @default(true)

  gameId   String
  game     Game      @relation(fields: [gameId], references: [id])
  banPicks BanPick[]

  @@unique([gameId, name])
}

// ─── CORUJÃO ──────────────────────────────────────────

model Corujao {
  id        String        @id @default(cuid())
  name      String                          // obrigatório: "Corujão 11/05"
  date      DateTime
  status    CorujaoStatus @default(DRAFT)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  gameId  String
  game    Game    @relation(fields: [gameId], references: [id])

  players CorujaoPlayer[]
  matches Match[]
}

model CorujaoPlayer {
  corujaoId String
  playerId  String
  corujao   Corujao @relation(fields: [corujaoId], references: [id])
  player    Player  @relation(fields: [playerId], references: [id])

  @@id([corujaoId, playerId])
}

// ─── PARTIDA ──────────────────────────────────────────

model Match {
  id         String      @id @default(cuid())
  sequence   Int                         // ordem dentro do corujão: 1, 2, 3...
  format     MatchFormat @default(MD1)
  status     MatchStatus @default(SCHEDULED)
  nameTeamA  String?                     // "Os Brabos" — nome ad-hoc, opcional
  nameTeamB  String?
  scoreTeamA Int?
  scoreTeamB Int?
  playedAt   DateTime?
  createdAt  DateTime    @default(now())

  corujaoId String
  corujao   Corujao @relation(fields: [corujaoId], references: [id])

  members  MatchTeamMember[]
  banPicks BanPick[]

  @@unique([corujaoId, sequence])
}

model MatchTeamMember {
  id       String    @id @default(cuid())
  side     MatchSide                     // TEAM_A | TEAM_B
  matchId  String
  playerId String
  match    Match     @relation(fields: [matchId], references: [id])
  player   Player    @relation(fields: [playerId], references: [id])

  @@unique([matchId, playerId])
}

// ─── BAN/PICK ─────────────────────────────────────────

model BanPick {
  id       String        @id @default(cuid())
  action   BanPickAction                 // BAN | PICK | DECIDER
  order    Int                           // 0-indexed, sequência do processo
  side     MatchSide?                    // TEAM_A | TEAM_B | null (decider automático)

  matchId String
  mapId   String
  match   Match  @relation(fields: [matchId], references: [id])
  map     Map    @relation(fields: [mapId], references: [id])

  @@unique([matchId, order])
}

// ─── ENUMS ────────────────────────────────────────────

enum CorujaoStatus {
  DRAFT         // configurando partidas
  IN_PROGRESS   // primeira partida iniciada
  FINISHED      // todas concluídas
}

enum MatchFormat  { MD1 MD3 MD5 }
enum MatchStatus  { SCHEDULED ONGOING COMPLETED CANCELLED }
enum MatchSide    { TEAM_A TEAM_B }
enum BanPickAction { BAN PICK DECIDER }
```

> **Nota:** `Team` foi removido. Times em Corujão são ad-hoc por partida via `MatchTeamMember`. Se surgir requisito de times com identidade persistente (torneios, ladder), reintroduz-se com propósito claro.

### Seed inicial obrigatório

```typescript
// prisma/seed.ts — executado em npx prisma db seed
// 1. Game: Counter-Strike (slug: "counter-strike")
// 2. Maps: Mirage, Inferno, Nuke, Ancient, Anubis, Dust2, Vertigo (isActive: true)
// 3. Players de exemplo: 10 jogadores
```

Mapas iniciais do CS: **Mirage, Inferno, Nuke, Ancient, Anubis, Dust2, Vertigo**

---

## 5. Estrutura de Pastas

```
nightdraft/
├── app/
│   ├── (admin)/                    # grupo protegido — layout verifica sessão
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── corujoes/               # NOVO — ponto de entrada principal
│   │   │   ├── page.tsx            # lista de corujões
│   │   │   ├── new/page.tsx        # criar corujão
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # visão do corujão (matches, placar geral)
│   │   │       └── matches/
│   │   │           ├── new/page.tsx
│   │   │           └── [matchId]/
│   │   │               ├── page.tsx
│   │   │               └── ban-pick/page.tsx
│   │   ├── games/
│   │   │   └── page.tsx
│   │   ├── players/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── teams/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── maps/
│   │   │   └── page.tsx
│   │   └── matches/                # matches avulsos (sem corujão)
│   │       ├── page.tsx
│   │       ├── new/page.tsx
│   │       └── [id]/
│   │           ├── page.tsx
│   │           └── ban-pick/page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── api/
│   │   └── auth/
│   │       └── route.ts
│   ├── layout.tsx                  # root layout (fontes, globals)
│   └── globals.css
│
├── components/
│   ├── ui/                         # primitivos reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Sidebar.tsx
│   │   └── ...
│   ├── games/
│   ├── players/
│   ├── teams/
│   ├── maps/
│   ├── matches/
│   └── ban-pick/
│
├── lib/
│   ├── auth.ts                     # iron-session helpers
│   ├── db.ts                       # singleton Prisma
│   ├── ban-pick.ts                 # lógica de sequência MD1/MD3/MD5
│   └── utils.ts
│
├── actions/                        # Server Actions por domínio
│   ├── auth.ts
│   ├── games.ts
│   ├── players.ts
│   ├── teams.ts
│   ├── maps.ts
│   ├── corujoes.ts
│   ├── matches.ts
│   └── ban-pick.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── types/
│   └── index.ts                    # tipos derivados do Prisma + extensões
│
├── middleware.ts
├── .env
├── .env.example
└── tailwind.config.ts
```

---

## 6. Escopo do MVP (Priorizado)

| Prioridade | Feature | Status |
|---|---|---|
| 1 | **Auth simples** (senha única via env) | MVP obrigatório |
| 2 | **Jogadores** (CRUD completo) | MVP obrigatório |
| 3 | **Times** (CRUD + membros + capitão) | MVP obrigatório |
| 4 | **Corujão** (criar sessão, agrupar partidas, placar geral) | MVP obrigatório |
| 5 | **Partidas** (dentro do corujão: MD1/MD3/MD5, status, placar) | MVP obrigatório |
| 6 | **Ban/Pick** (tela dedicada, interativo single-device) | MVP obrigatório |
| 7 | **Map Pool** (CRUD de mapas por jogo) | MVP obrigatório |
| 8 | **Histórico** (corujões e partidas finalizadas) | MVP importante |
| 9 | **Dashboard** (visão geral + atalhos) | MVP importante |
| 10 | **Games** (tela de gerenciamento) | Pós-MVP |

### O que NÃO entra no MVP

- Cadastro, recovery de senha, RBAC, multi-admin
- WebSocket / live updates automáticos
- Discord integration
- Ranking / estatísticas por jogador
- Sorteio automático de times
- Link público de partida
- Torneios / bracket / check-in

---

## 7. Identidade Visual

### Tema
- Dark mode obrigatório (sem toggle de light mode)
- Paleta estratificada — nunca fundo direto, sempre camadas

### Paleta

| Uso | Cor | Token |
|---|---|---|
| Background base | `#0B0F19` | `bg-base` |
| Superfície | `#111827` | `bg-surface` |
| Card elevado | `#1A2233` | `bg-card` |
| Ação / seleção | `#5B8CFF` | `accent-blue` |
| Ativo / sucesso | `#22C55E` | `accent-green` |
| Erro / eliminado | `#EF4444` | `accent-red` |
| Atenção / pendente | `#F59E0B` | `accent-yellow` |

### Regras de cor (não quebrar)
- Cores de acento são linguagem de **estado**, não decoração
- Imagens/logos de jogo aparecem **dentro** de cards — nunca como wallpaper ou elemento estrutural de UI
- O acento pode variar por jogo no futuro (CS = blue, Valorant = red) — use variáveis CSS desde o início

### Hierarquia tipográfica
- Título: `font-weight: 700`, `opacity: 1`
- Subtítulo: `font-weight: 600`, `opacity: 0.75`
- Metadado: `font-weight: 400`, `opacity: 0.45`

### Componentes visuais
- Sidebar fixa (desktop) com ícone + label por rota
- Cards com fundo `#1A2233`, borda `1px solid rgba(255,255,255,0.06)`
- Badges de status usando a paleta de acentos
- Hover: `transition: 150ms ease`, background levemente mais claro
- Glow sutil apenas em elementos de destaque (nunca em texto geral)
- Skeleton loaders (não spinner genérico) para estados de carregamento

### Seletor de jogos (Dashboard)
```
[ ◉ CS ]   [ + Adicionar ]
```
Tab horizontal, com acento na cor do jogo ativo. Com um único jogo, o `+ Adicionar` planta a semente do multi-game visualmente sem precisar de funcionalidade.

---

## 8. Ban/Pick — Especificação Visual

A tela de Ban/Pick é o **UX peak** do produto. Merece especificação própria.

### Layout

```
┌──────────────────────────────────────────────────────┐
│  [ Timer: ████████████░░░░░░ ]  "Time do Home bana"  │
├────────────┬─────────────────────────┬───────────────┤
│ HOME TEAM  │      POOL DE MAPAS      │  AWAY TEAM    │
│            │                         │               │
│  BAN: —    │  [Mirage] [Inferno]     │  BAN: —       │
│  BAN: —    │  [Nuke]   [Ancient]     │  BAN: —       │
│  PICK: —   │  [Anubis] [Dust2]       │  PICK: —      │
│            │  [Vertigo]              │               │
└────────────┴─────────────────────────┴───────────────┘
```

### Estados dos mapas

| Estado | Visual |
|---|---|
| Disponível | Card normal, hover com borda accent-blue |
| Banido | `opacity: 0.35`, overlay cinza, ícone X, animação de morte (200ms) |
| Escolhido | Borda na cor do time, glow suave, `translateY(-4px)` |
| Decisivo | Destaque central, animação de snap ao finalizar |

### Timer

- Barra que esvazia (não número frio)
- `accent-blue` → `accent-yellow` (últimos 10s) → `accent-red` (últimos 3s)
- Pulsação lenta na barra nos últimos 5s

### Entrada na tela

Fade de 300ms que escurece o fundo → tela emerge do centro. Não é transição de página — é um modo.

### Implementação: Server Action + revalidatePath (sem WebSocket)

Ban/Pick confirmado como **interativo em dispositivo único** (admin clica os passos ao vivo). Sem necessidade de sincronização multi-dispositivo.

```typescript
// actions/ban-pick.ts
'use server'
export async function submitBanPick(matchId: string, mapId: string) {
  const currentStep = await getCurrentBanPickStep(matchId)
  // valida que o step existe e o mapa está disponível
  await prisma.$transaction(async (tx) => {
    await tx.banPick.create({
      data: { match_id: matchId, map_id: mapId, order: currentStep.order, action: currentStep.action, team_slot: currentStep.teamSlot }
    })
    // se último step → atualiza Match.status e verifica Corujao.status
  })
  revalidatePath(`/corujoes/${corujaoId}/matches/${matchId}/ban-pick`)
}
```

**Lock contra duplo-clique:**
1. `@@unique([match_id, order])` no model `BanPick` — banco rejeita insert duplicado com `P2002`
2. `useTransition` + `isPending` na UI — botão desabilitado enquanto Action está em voo

```tsx
const [isPending, startTransition] = useTransition()
<button disabled={isPending} onClick={() => startTransition(() => submitBanPick(matchId, mapId))}>
```

### Lógica de sequência (configurável, não hardcoded)

```typescript
// lib/ban-pick.ts
type BanPickStep = {
  teamSlot: 'home' | 'away'
  action: 'BAN' | 'PICK' | 'DECIDER'
}

const sequences: Record<MatchFormat, BanPickStep[]> = {
  MD1: [
    { teamSlot: 'home', action: 'BAN' },
    { teamSlot: 'away', action: 'BAN' },
    { teamSlot: 'home', action: 'BAN' },
    { teamSlot: 'away', action: 'BAN' },
    { teamSlot: 'home', action: 'BAN' },
    { teamSlot: 'away', action: 'BAN' },
    { teamSlot: 'home', action: 'DECIDER' },  // ou automático
  ],
  MD3: [ /* ... */ ],
  MD5: [ /* ... */ ],
}
```

---

## 9. Decisões

### D1 — Ban/Pick ✅ RESOLVIDO

Ban/Pick é **interativo em dispositivo único**. Admin clica os passos ao vivo na tela. Sem WebSocket, sem polling. Server Actions + revalidatePath.

---

### D2 — Player global ✅ RESOLVIDO

Player é **global** — sem `game_id`. O mesmo amigo joga CS e Valorant com o mesmo perfil. O jogo está no Corujão, não no Player. `Team` foi removido do schema.

---

### D3 — Deploy (sem custo)

| Opção | Banco | Acesso | Custo |
|---|---|---|---|
| **Local** (`next dev`) | SQLite | Só na LAN | Gratuito |
| **Vercel + Neon** | Postgres | Qualquer lugar | Gratuito (free tiers) |
| **Fly.io** | SQLite (volume persistente) | Qualquer lugar | Gratuito (free allowance) |
| **Oracle Cloud Free Tier** | SQLite | Qualquer lugar | Gratuito para sempre |

**Recomendação:** se o corujão é sempre na sua máquina → rode local, zero configuração. Se quer acesso de qualquer dispositivo → **Vercel + Neon** (ambos têm free tier generoso, deploy em 2 minutos com `git push`).

> ⚠️ Vercel usa Postgres (via Neon), não SQLite. O schema Prisma já comporta ambos — só muda a string de conexão e o provider.

---

## 10. Ordem de Geração de Código

Após aprovação deste documento, a implementação segue esta ordem:

```
Fase 1 — Fundação
  1. Inicializar projeto Next.js + TypeScript + Tailwind
  2. Configurar Prisma schema completo (com Corujao + Match + BanPick)
  3. Criar seed (Game CS + 7 mapas + times e jogadores de exemplo)
  4. Implementar autenticação (iron-session + middleware)
  5. Layout base (sidebar, tema, primitivos UI)

Fase 2 — Features core
  6. Jogadores (listagem + CRUD)
  7. Times (listagem + CRUD + membros + capitão)
  8. Mapas / Map Pool (listagem + CRUD)
  9. Corujão (criar, listar, tela da sessão com placar geral)
  10. Partidas (criar dentro do corujão, MD1/MD3/MD5, status, placar)
  11. Ban/Pick (tela dedicada + sequência interativa + estados visuais)

Fase 3 — Complementares
  12. Histórico (corujões e partidas finalizadas)
  13. Dashboard (métricas + atalhos + seletor de jogo)
  14. Games (listagem + ativar/desativar)

Fase 4 — Finalização
  15. .env.example
  16. Instruções de setup local (README)
  17. Testes manuais do fluxo completo (corujão → partida → ban/pick → resultado)
```

---

## 11. Evoluções Futuras (fora do escopo agora, mas arquitetura preparada)

| Feature | Preparação atual |
|---|---|
| Múltiplos admins | Adicionar `User` model, migrar sessão |
| Discord integration | Campos `discord_id` nas entidades, webhooks via API Route |
| Ranking interno | Campo `extra: Json` em MatchPlayer já comporta stats |
| Sorteio automático de times | Placeholder/TODO na tela de Times |
| Link público de partida | Route group `(public)` ao lado de `(admin)` |
| WebSocket / live updates | Isolar lógica de estado em lib separada |
| Torneios / bracket | Novo model `Tournament` → `Match[]` |
| Múltiplos jogos (UI) | Seletor de jogos no Dashboard já no layout |

---

## 12. Checklist de Aprovação

- [x] Ban/Pick interativo, dispositivo único — Server Actions + revalidatePath
- [x] Nome do Corujão obrigatório
- [x] Jogadores variam por partida — CorujaoPlayer define o roster da noite, MatchTeamMember divide por lado
- [x] Player global — sem game_id, sem Team
- [x] Deploy: **local + SQLite** — zero infra, backup via cp
- [x] Schema de entidades aprovado
- [x] Ordem de geração de código aprovada
- [x] **✅ APROVADO PARA EXECUÇÃO**

---

*Documento gerado após roundtable com Winston (Arquitetura), John (Produto), Sally (UX) e Amelia (Engenharia).*
