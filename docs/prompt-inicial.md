# NightDraft

Você atuará como um arquiteto de software e desenvolvedor fullstack sênior.

Quero criar uma plataforma web moderna chamada NightDraft.

NightDraft será uma plataforma gamer multi-game criada para organização de:

- corujões
- lobbies
- partidas competitivas
- partidas casuais
- times
- eventos entre amigos/comunidades

O primeiro jogo suportado será Counter-Strike, mas toda a arquitetura e identidade visual devem nascer preparadas para múltiplos jogos futuramente.

Importante:
O projeto NÃO deve nascer acoplado exclusivamente ao CS.

A ideia é que futuramente suporte:
- Valorant
- Dota
- League of Legends
- Rocket League
- Rainbow Six
- Fortnite
- entre outros

# Stack desejada

- Next.js (App Router)
- TypeScript
- TailwindCSS
- Prisma ORM
- SQLite inicialmente
- Server Actions quando fizer sentido
- Componentização organizada
- Estrutura simples e rápida de rodar
- Preparado para expansão futura

# Objetivo do MVP

Criar rapidamente um painel funcional para:

- organizar jogadores
- criar times
- gerenciar mapas
- controlar ban/pick
- criar partidas
- visualizar histórico

Tudo de forma rápida, bonita e funcional.

Sem overengineering.

# Regra obrigatória de autenticação

O MVP NÃO terá múltiplos usuários.

Não implementar:
- cadastro
- recovery password
- ACL
- RBAC
- painel de usuários
- múltiplos administradores

A plataforma terá apenas UM acesso global protegido por senha via variável de ambiente.

Exemplo:

```env
ADMIN_PASSWORD=minha_senha
```

Fluxo esperado:
- tela simples de login
- senha validada no backend
- sessão simples persistida
- logout simples

Objetivo:
ter um painel privado extremamente rápido e simples de acessar.

# Identidade visual

A interface deve transmitir:

- vibe gamer moderna
- lobby competitivo
- painel premium
- organização rápida de partidas
- ambiente de comunidade
- sensação de HUB gamer multi-game

Importante:
Mesmo começando por Counter-Strike, o visual NÃO deve parecer exclusivo de CS.

# Referências visuais

Inspirar visualmente em:
- FACEIT
- Challengermode
- Discord
- Steam
- Leetify
- HLTV (estrutura)

# Direção visual

## Tema

- Dark mode obrigatório
- Visual clean e moderno
- Alto contraste
- Excelente legibilidade
- Layout responsivo

## Paleta sugerida

### Base
- #0B0F19
- #111827
- #1A2233

### Destaques
- #5B8CFF
- #22C55E
- #EF4444
- #F59E0B

## Componentes visuais

- sidebar moderna
- cards organizados
- badges de status
- hover suave
- glow discreto
- ícones minimalistas
- visual premium sem exageros

# Modelagem multi-game obrigatória

Criar entidade Game.

Campos sugeridos:

- id
- name
- slug
- logo_url opcional
- cover_url opcional
- is_active
- created_at

Criar automaticamente o primeiro jogo:

- Counter-Strike
- slug: counter-strike

As demais entidades devem suportar relacionamento com game_id quando fizer sentido.

# Funcionalidades do MVP

## 1. Dashboard

Tela inicial com:

- total de jogadores
- total de partidas
- próxima partida
- última partida finalizada
- jogos ativos
- atalhos rápidos

Também quero:
- seletor de jogo
- destaque visual do jogo selecionado

## 2. Jogos

Tela simples para:
- listar jogos
- ativar/desativar jogos
- adicionar novos jogos futuramente

No MVP, apenas Counter-Strike virá ativo.

## 3. Jogadores

Permitir:

- cadastrar jogador
- editar jogador
- remover jogador
- ativar/desativar jogador

Campos:
- id
- nickname
- nome opcional
- rank opcional
- avatar opcional
- ativo
- game_id opcional
- created_at

## 4. Times

Permitir:

- criar time manualmente
- editar time
- remover time
- adicionar/remover jogadores
- definir capitão

Campos:
- nome
- jogadores
- capitão opcional
- jogo associado

Adicionar placeholder/TODO para:
- sorteio automático de times

## 5. Map Pool

Criar gerenciamento de mapas.

Mapas iniciais do CS:

- Mirage
- Inferno
- Nuke
- Ancient
- Anubis
- Dust2
- Vertigo

Permitir:
- ativar/desativar mapa
- adicionar mapa
- editar mapa
- remover mapa

Campos:
- nome
- imagem opcional
- ativo
- game_id

## 6. Partidas

Permitir criar partidas com:

- nome/título
- jogo
- data/hora
- time A
- time B
- formato
- status
- mapas
- vencedor opcional
- placar opcional

Formatos iniciais:
- MD1
- MD3
- MD5

Status:
- agendada
- em andamento
- finalizada

## 7. Sistema de Ban/Pick

Criar tela dedicada para veto de mapas.

Funcionalidades:
- visualizar mapas disponíveis
- registrar bans
- registrar picks
- definir mapa decisivo
- visualizar ordem de bans/picks
- atualizar estado visual dos mapas

Estados:
- disponível
- banido
- escolhido
- decisivo

Importante:
não precisa automatizar todas as regras competitivas agora.
A ideia é ter uma estrutura flexível para evoluir.

## 8. Histórico

Tela de histórico contendo:
- partidas finalizadas
- vencedor
- times
- placar
- mapas jogados
- data

# Navegação

Sidebar sugerida:
- Dashboard
- Jogos
- Jogadores
- Times
- Map Pool
- Partidas
- Histórico

# Estrutura esperada

Antes de gerar código:

1. apresentar arquitetura resumida
2. apresentar modelagem das entidades
3. apresentar estrutura de pastas
4. apresentar fluxo de autenticação

Depois:

1. gerar setup do projeto
2. gerar schema Prisma
3. gerar autenticação simples
4. gerar layout base
5. gerar páginas
6. gerar componentes
7. gerar instruções para rodar localmente
8. gerar `.env.example`

# Evoluções futuras

Preparar estrutura para futuramente adicionar:

- múltiplos administradores
- Discord integration
- ranking interno
- estatísticas por jogador
- sorteio automático de times
- matchmaking
- torneios
- bracket
- check-in
- presença
- link público da partida
- websocket/live updates
- notificações

# Prioridades

Priorizar:
- simplicidade
- organização
- boa UX
- velocidade de desenvolvimento
- facilidade de expansão

Evitar:
- arquitetura enterprise desnecessária
- excesso de abstrações
- complexidade prematura

A ideia é:
subir rápido, usar nos corujões e evoluir aos poucos.