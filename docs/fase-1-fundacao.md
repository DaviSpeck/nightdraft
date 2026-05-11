# Fase 1 — Fundação

> **Status:** ✅ Concluída e commitada  
> **Commit:** `c7a988a`  
> **Data:** 2026-05-11

---

## Planejamento

### Objetivo
Criar a base do projeto do zero: estrutura Next.js, banco de dados, autenticação e layout navegável. Ao final desta fase o projeto deve rodar localmente, exigir senha para acessar e exibir um dashboard vazio mas funcional.

### Escopo
| Item | Descrição |
|---|---|
| Setup do projeto | Next.js 15, TypeScript, Tailwind v4, ESLint, path aliases |
| Dependências extras | Prisma ORM, iron-session, Zod |
| Schema de banco | Todas as entidades do planejamento aprovado |
| Seed | Dados iniciais obrigatórios para uso imediato |
| Autenticação | Senha única via env var, sem multi-usuário |
| Layout base | Sidebar, tema dark, primitivos de UI reutilizáveis |
| Dashboard | Tela inicial mínima com contadores |

### O que NÃO entra
- Nenhuma feature de produto (jogadores, corujões, partidas)
- Testes automatizados
- Deploy / hospedagem

### Decisões técnicas
- **iron-session** no lugar de next-auth — sem overhead para senha única
- **Middleware** protege todas as rotas exceto `/login` e `/api/auth`
- **Tailwind v4** com `@theme` para tokens de cor centralizados
- **Prisma singleton** em `lib/db.ts` para evitar múltiplas conexões em dev
- **`requireAuth()`** no layout do grupo `(admin)` — verificação server-side, sem flash de conteúdo

---

## Execução

### O que foi entregue

| Arquivo | Responsabilidade |
|---|---|
| `prisma/schema.prisma` | Game, Player, Map, Corujao, CorujaoPlayer, Match, MatchTeamMember, BanPick |
| `prisma/seed.ts` | CS + 7 mapas + 10 jogadores de exemplo |
| `lib/db.ts` | Singleton Prisma |
| `lib/auth.ts` | `getSession()`, `requireAuth()`, `sessionOptions` |
| `app/api/auth/route.ts` | POST login / DELETE logout |
| `middleware.ts` | Proteção de rotas + matcher correto |
| `app/login/page.tsx` | Tela de login com paleta NightDraft |
| `app/(admin)/layout.tsx` | Grupo protegido com sidebar |
| `app/(admin)/dashboard/page.tsx` | Dashboard com contadores e estado vazio orientado |
| `app/globals.css` | Paleta completa via `@theme` |
| `components/ui/` | Button, Card, Badge, Sidebar |
| `.env.example` | Template de variáveis de ambiente |

### Validações realizadas
- `tsc --noEmit` → zero erros
- `npm run build` → build limpo, todas as rotas corretas
- `/login` → HTTP 200
- `/dashboard` sem sessão → HTTP 307 redirect para `/login`
- `npx prisma db seed` → CS + 7 mapas + 10 jogadores inseridos

### Como rodar
```bash
cp .env.example .env   # edite ADMIN_PASSWORD e SESSION_SECRET
npm run dev
# http://localhost:3000  →  senha padrão: nightdraft123
```

---

## Próxima fase
**Fase 2 — Features core:** Jogadores, Map Pool, Corujão, Partidas e Ban/Pick.
