import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import { updateCorujao } from '@/actions/corujoes'

export default async function EditCorujaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const corujao = await prisma.corujao.findUnique({
    where: { id },
    include: { game: true },
  })
  if (!corujao) notFound()

  const action = updateCorujao.bind(null, id)
  const dateStr = corujao.date.toISOString().split('T')[0]

  return (
    <div className="p-6 max-w-md">
      <PageHeader
        title="Editar corujão"
        backHref={`/corujoes/${id}`}
        backLabel={corujao.name}
      />
      <Card>
        <CardHeader><p className="text-sm font-medium text-white/75">Informações</p></CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <Input label="Nome *" name="name" defaultValue={corujao.name} required autoFocus />
            <Input label="Data *" name="date" type="date" defaultValue={dateStr} required />
            <div className="pt-2 flex gap-2">
              <Button type="submit">Salvar</Button>
              <a href={`/corujoes/${id}`}><Button type="button" variant="ghost">Cancelar</Button></a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
