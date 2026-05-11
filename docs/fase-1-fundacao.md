# Fase 1 — Fundação

> **Status:** ✅ Concluída  
> **Data:** 2026-05-11

## O que foi entregue

| Item | Detalhe |
|---|---|
| Projeto Next.js 15 | App Router, TypeScript, Tailwind v4 |
| Prisma schema | Todas as entidades aprovadas: Game, Player, Map, Corujao, CorujaoPlayer, Match, MatchTeamMember, BanPick |
| Banco SQLite | `dev.db` criado, WAL pronto para uso |
| Seed | Counter-Strike + 7 mapas + 10 jogadores de exemplo |
| Autenticação | iron-session, senha única via `ADMIN_PASSWORD`, cookie httpOnly |
| Middleware | Protege todas as rotas exceto `/login` e `/api/auth` |
| Layout base | Sidebar com navegação, tema dark, grupo `(admin)` |
| Primitivos UI | Button, Card, Badge, Sidebar |
| Dashboard | Tela inicial com contadores e atalho para primeiro corujão |

## Validações

- `tsc --noEmit` — zero erros
- `npm run build` — build limpo
- `/login` → 200 OK
- `/dashboard` sem sessão → 307 redirect para login

## Como rodar

```bash
cp .env.example .env        # edite ADMIN_PASSWORD e SESSION_SECRET
npm run dev
# acessa http://localhost:3000
```

## Próxima fase

**Fase 2 — Features core:** Jogadores (CRUD), Map Pool (CRUD), Corujão (criar/listar/sessão), Partidas (MD1/MD3/MD5), Ban/Pick (tela interativa).

> Deploy recomendado: após Fase 2, quando o produto for utilizável num corujão real.
