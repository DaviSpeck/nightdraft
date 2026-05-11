import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardContent } from '@/components/ui/Card'
import { updatePlayer } from '@/actions/players'

export default async function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const player = await prisma.player.findUnique({ where: { id } })
  if (!player) notFound()

  const action = updatePlayer.bind(null, id)

  return (
    <div className="p-6 max-w-md">
      <PageHeader title="Editar jogador" backHref="/players" backLabel="Jogadores" />
      <Card>
        <CardContent>
          <form action={action} className="space-y-4">
            <Input label="Nome *" name="name" defaultValue={player.name} required autoFocus />
            <Input label="Nickname" name="nickname" defaultValue={player.nickname ?? ''} />
            <div className="pt-2 flex gap-2">
              <Button type="submit">Salvar</Button>
              <a href="/players"><Button type="button" variant="ghost">Cancelar</Button></a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
