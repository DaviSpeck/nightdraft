# Fase 2 — Features Core

> **Status:** Aguardando aprovação  
> **Data:** 2026-05-11

---

## Objetivo

Tornar o NightDraft utilizável num corujão real. Ao final desta fase deve ser possível cadastrar jogadores, montar um corujão, criar partidas MD1/MD3/MD5, executar o ban/pick interativo e registrar o resultado.

---

## Escopo

### 2.1 Jogadores
CRUD completo de jogadores globais (sem vínculo com jogo).

**Telas:**
- `/players` — listagem com busca e toggle ativo/inativo
- `/players/new` — formulário de criação
- `/players/[id]/edit` — edição

**Campos:** `name` (obrigatório), `nickname`, `avatarUrl`

**Server Actions:** `createPlayer`, `updatePlayer`, `deletePlayer`

---

### 2.2 Map Pool
Gerenciamento do pool de mapas por jogo.

**Telas:**
- `/maps` — listagem com toggle ativo/inativo por mapa

**Ações inline:** ativar/desativar mapa (sem tela separada)

**Sem criar/deletar mapas no MVP** — os 7 mapas do CS já estão no seed. Adicionar mapa novo é uma ação rara que pode ser feita via Prisma Studio por ora.

**Server Actions:** `toggleMap`

---

### 2.3 Corujão
Container central da noite. Criação, listagem e tela da sessão.

**Telas:**
- `/corujoes` — listagem (DRAFT, IN_PROGRESS, FINISHED) com data e contagem de partidas
- `/corujoes/new` — formulário: nome (obrigatório), data, jogo, seleção de jogadores
- `/corujoes/[id]` — tela da sessão: roster de jogadores, lista de partidas com status, placar geral Time A vs Time B, botão "Nova Partida"

**Regras:**
- Status `DRAFT → IN_PROGRESS` quando primeira partida inicia
- Status `IN_PROGRESS → FINISHED` quando todas as partidas estão `COMPLETED`
- Transições de status dentro de transaction Prisma

**Server Actions:** `createCorujao`, `updateCorujaoStatus`, `addPlayerToCorujao`, `removePlayerFromCorujao`

---

### 2.4 Partidas
Criação e gerenciamento de partidas dentro de um corujão.

**Telas:**
- `/corujoes/[id]/matches/new` — formulário: formato (MD1/MD3/MD5), nomes opcionais dos times, seleção de jogadores por lado (TEAM_A / TEAM_B) a partir do roster do corujão
- `/corujoes/[id]/matches/[matchId]` — detalhe: times, placar editável, status, link para ban/pick

**Regras:**
- `sequence` auto-incrementado dentro do corujão
- Ao iniciar ban/pick → `Match.status = ONGOING`
- Ao registrar resultado → `Match.status = COMPLETED`, verifica status do corujão

**Server Actions:** `createMatch`, `updateMatchScore`, `updateMatchStatus`

---

### 2.5 Ban/Pick
Tela interativa single-device para veto de mapas.

**Tela:** `/corujoes/[id]/matches/[matchId]/ban-pick`

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [TEAM A nome]    "TEAM A bana"    [TEAM B nome]    │
├──────────────┬──────────────────────┬───────────────┤
│  BAN: —      │  [Mirage] [Inferno]  │  BAN: —       │
│  BAN: —      │  [Nuke]   [Ancient]  │  BAN: —       │
│  PICK: —     │  [Anubis] [Dust2]    │  PICK: —      │
│              │  [Vertigo]           │               │
└──────────────┴──────────────────────┴───────────────┘
```

**Estados dos mapas:**
| Estado | Visual |
|---|---|
| Disponível | Card normal, hover com borda accent-blue |
| Banido | `opacity: 0.35`, overlay X cinza, animação 200ms |
| Escolhido | Borda na cor do time, glow, `translateY(-4px)` |
| Decisivo | Destaque central |

**Sequências configuráveis (não hardcoded):**

```typescript
// lib/ban-pick.ts
const sequences: Record<MatchFormat, BanPickStep[]> = {
  MD1: [
    { side: 'TEAM_A', action: 'BAN' },
    { side: 'TEAM_B', action: 'BAN' },
    { side: 'TEAM_A', action: 'BAN' },
    { side: 'TEAM_B', action: 'BAN' },
    { side: 'TEAM_A', action: 'BAN' },
    { side: 'TEAM_B', action: 'BAN' },
    { side: null,     action: 'DECIDER' },  // último mapa restante
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
```

**Implementação:**
- Estado = banco de dados. A UI deriva de `banPicks` já registrados.
- `Server Action submitBanPick` → valida step atual → `prisma.$transaction` → `revalidatePath`
- Lock duplo-clique: `@@unique([matchId, order])` no banco + `useTransition/isPending` na UI
- Ao completar todos os steps → `Match.status = ONGOING` (aguardando resultado)

**Server Actions:** `submitBanPick`

---

## Ordem de implementação

```
1. Jogadores — CRUD (mais simples, aquece o padrão)
2. Map Pool  — toggle de mapas (trivial, mas necessário para ban/pick)
3. Corujão   — criar + listar + tela da sessão
4. Partidas  — criar dentro do corujão + detalhe
5. Ban/Pick  — tela interativa completa
```

---

## Padrões técnicos desta fase

- **Server Actions em `actions/`** por domínio — sem misturar com componentes
- **`revalidatePath` após toda mutação** — sem estado client-side desnecessário
- **Formulários com `useTransition` + `isPending`** — feedback de loading sem biblioteca
- **Sem biblioteca de formulário** (react-hook-form, formik) — formulários simples não precisam
- **Sem modal/dialog library** — usar navegação de página para criar/editar
- **Zod para validação** em todas as Server Actions que recebem input do usuário

---

## O que NÃO entra nesta fase

- Histórico (Fase 3)
- Dashboard com métricas reais (Fase 3)
- Tela de gerenciamento de jogos (Fase 3)
- Upload de imagens / avatares
- Editar/deletar corujão após criado
- Estatísticas de jogador (kills, deaths)
- Sorteio automático de times

---

## Critérios de conclusão

- [ ] Cadastrar um jogador e vê-lo na listagem
- [ ] Ativar/desativar mapa no Map Pool
- [ ] Criar um corujão com nome, data e jogadores
- [ ] Criar uma partida MD3 dentro do corujão com os times montados
- [ ] Executar ban/pick completo do MD3 (7 steps)
- [ ] Registrar placar e ver o resultado na tela do corujão
- [ ] Status do corujão atualiza automaticamente para FINISHED

---

## Checklist de aprovação

- [ ] Escopo da fase está correto?
- [ ] As sequências MD1/MD3/MD5 do ban/pick estão certas?
- [ ] Alguma feature mudou de prioridade?
- [ ] **OK para iniciar execução?**
