import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const cs = await prisma.game.upsert({
    where: { slug: 'counter-strike' },
    update: {},
    create: {
      name: 'Counter-Strike',
      slug: 'counter-strike',
      isActive: true,
    },
  })

  const maps = [
    { name: 'de_mirage', displayName: 'Mirage' },
    { name: 'de_inferno', displayName: 'Inferno' },
    { name: 'de_nuke', displayName: 'Nuke' },
    { name: 'de_ancient', displayName: 'Ancient' },
    { name: 'de_anubis', displayName: 'Anubis' },
    { name: 'de_dust2', displayName: 'Dust II' },
    { name: 'de_vertigo', displayName: 'Vertigo' },
  ]

  for (const map of maps) {
    await prisma.map.upsert({
      where: { gameId_name: { gameId: cs.id, name: map.name } },
      update: {},
      create: { ...map, gameId: cs.id, isActive: true },
    })
  }

  const players = [
    { name: 'Gabriel Silva', nickname: 'FalleN' },
    { name: 'Marcelo David', nickname: 'coldzera' },
    { name: 'Fernando Alvarenga', nickname: 'fer' },
    { name: 'Lincoln Lau', nickname: 'fnx' },
    { name: 'Epitácio Pessoa', nickname: 'TACO' },
    { name: 'Epitacio Santos', nickname: 'ezskin' },
    { name: 'Pedro Henrique', nickname: 'hen1' },
    { name: 'Lucas Teles', nickname: 'LUCAS1' },
    { name: 'Vinicius Figueiredo', nickname: 'VINI' },
    { name: 'Gustavo Possi', nickname: 'NiKo' },
  ]

  for (const player of players) {
    await prisma.player.upsert({
      where: { id: player.nickname },
      update: {},
      create: { id: player.nickname, ...player },
    })
  }

  console.log(`✅ Seed concluído: ${cs.name}, ${maps.length} mapas, ${players.length} jogadores`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
