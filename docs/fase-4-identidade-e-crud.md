# Fase 4 — Identidade Visual & CRUD Completo

> **Status:** ✅ Concluída  
> **Data:** 2026-05-11

---

## Motivação

Após fase 3 de polimento, quatro pontos finais foram identificados para tornar o sistema mais completo e profissional:

1. Sem identidade visual (logo, favicon)
2. Avatares de jogadores genéricos (só inicial do nome)
3. Delete restrito a estados específicos (SCHEDULED/DRAFT)
4. Sem edição de corujão ou partida após criação

---

## O que foi feito

### 4.1 Logo e Favicon

Logo: crosshair/mira — ícone circular com marcas de alinhamento, cor `accent-blue`. Representa simultaneamente "alvo" (CS) e "draft" (escolha).

**`public/logo.svg`** — SVG estático para uso em `<img>`, OG tags e outros contextos  
**`app/icon.tsx`** — Gera favicon PNG 32×32 via `next/og` ImageResponse (rota `/icon` do App Router)  
**`components/ui/Logo.tsx`** — Componente React com SVG inline, prop `size`  
**`components/ui/Sidebar.tsx`** — Header atualizado: ícone `Logo` + "NightDraft" + badge "CS"

---

### 4.2 Avatares de Jogadores

Campo `avatar String?` adicionado ao modelo `Player`. Armazena um emoji selecionado pelo usuário.

**16 opções:** 🎯 🦊 🐺 🦁 🐯 🦅 🐉 👾 🤖 👻 💀 ⚡ 🔥 ❄️ 🌙 ⭐  
**Default de exibição:** 🎯 (definido em `lib/avatars.ts`)

**`lib/avatars.ts`** — Constante `AVATARS` e `DEFAULT_AVATAR`  
**`components/ui/AvatarPicker.tsx`** — Seletor visual: grid de emojis, estado local com `useState`, hidden input com valor  
**Integrado em:** criação e edição de jogadores; exibido em listagem de jogadores, roster do corujão, times na partida, seleção de times em nova partida e edição de partida

---

### 4.3 CRUD Completo — Delete Sem Restrição

Antes o delete de partida só funcionava com `status = SCHEDULED` e o de corujão com `status = DRAFT`.

**Agora:** qualquer partida e qualquer corujão podem ser excluídos independente do status, com confirm dialog alertando sobre irreversibilidade.

Cascade já configurado no schema garante limpeza de todas as relações (BanPick, MatchTeamMember, MatchMapStat, CorujaoPlayer).

---

### 4.4 Editar Corujão

**Rota:** `GET /corujoes/[id]/edit`  
**Campos editáveis:** nome, data (o jogo e o roster de jogadores são fixos após criação)  
**Action:** `updateCorujao(corujaoId, formData)` em `actions/corujoes.ts`  
**Botão "Editar"** adicionado no header da página do corujão (ao lado do status badge)

---

### 4.5 Editar Partida

**Rota:** `GET /corujoes/[id]/matches/[matchId]/edit`  
**Campos editáveis:**
- Nomes dos times: sempre editáveis
- Lados dos jogadores (TEAM_A / TEAM_B): somente se `status = SCHEDULED` (antes do ban/pick iniciar)

**Action:** `updateMatch(matchId, corujaoId, formData)` em `actions/matches.ts`  
**Botão "Editar"** adicionado no header da página da partida

---

## Schema delta

```prisma
model Player {
  // ...
  avatar String?  // novo campo
  // ...
}
```

---

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `prisma/schema.prisma` | `avatar String?` em Player |
| `lib/avatars.ts` | novo — constantes de avatar |
| `components/ui/Logo.tsx` | novo — SVG crosshair |
| `components/ui/AvatarPicker.tsx` | novo — seletor de emoji |
| `public/logo.svg` | novo — SVG estático |
| `app/icon.tsx` | novo — favicon gerado |
| `components/ui/Sidebar.tsx` | logo no header |
| `actions/players.ts` | campo `avatar` em create/update |
| `actions/corujoes.ts` | `updateCorujao` + delete sem restrição |
| `actions/matches.ts` | `updateMatch` + delete sem restrição |
| `app/(admin)/players/page.tsx` | avatar na listagem |
| `app/(admin)/players/new/page.tsx` | AvatarPicker |
| `app/(admin)/players/[id]/edit/page.tsx` | AvatarPicker |
| `app/(admin)/corujoes/[id]/page.tsx` | botão editar, avatar no roster |
| `app/(admin)/corujoes/[id]/edit/page.tsx` | novo — edição de corujão |
| `app/(admin)/corujoes/[id]/matches/new/page.tsx` | avatar na seleção de times |
| `app/(admin)/corujoes/[id]/matches/[matchId]/page.tsx` | botão editar, avatar nos times, delete sem restrição |
| `app/(admin)/corujoes/[id]/matches/[matchId]/edit/page.tsx` | novo — edição de partida |

---

## O que NÃO entra nesta fase

- Upload de imagem para avatar (zero infra = zero upload; emojis são suficientes)
- Edição do roster de jogadores do corujão pós-criação (complexidade alta, baixa necessidade)
- Imagens dos mapas no ban/pick
- Dashboard com estatísticas/rankings

---

## Estado atual do sistema (pós-fase 4)

Todas as funcionalidades planejadas nas fases 1–4 estão implementadas. O sistema é utilizável num corujão real:

- ✅ Autenticação por senha única
- ✅ CRUD de jogadores com avatar emoji
- ✅ Gestão de map pool (ativar/desativar/criar/excluir)
- ✅ Criar e gerenciar corujões
- ✅ Criar partidas MD1/MD3/MD5 com seleção de times
- ✅ Ban/pick interativo com destaque do mapa decisivo
- ✅ Registro de placar e resultado
- ✅ KDA por jogador por mapa
- ✅ CRUD completo — editar e excluir tudo
- ✅ Logo e favicon com identidade visual própria

## Próximas ideias (Fase 5)

- Dashboard com rankings de KDA acumulado e winrate por jogador
- Histórico de corujões com filtros
- Imagens dos mapas no ban/pick (assets locais em `/public/maps/`)
- Sorteio automático de times balanceados
- Export de resultados (imagem para compartilhar)
