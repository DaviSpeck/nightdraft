import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardContent } from '@/components/ui/Card'
import AvatarPicker from '@/components/ui/AvatarPicker'
import { createPlayer } from '@/actions/players'

export default function NewPlayerPage() {
  return (
    <div className="p-6 max-w-md">
      <PageHeader title="Novo jogador" backHref="/players" backLabel="Jogadores" />
      <Card>
        <CardContent className="space-y-4">
          <form action={createPlayer} className="space-y-4">
            <AvatarPicker />
            <Input label="Nome *" name="name" placeholder="Gabriel Silva" required autoFocus />
            <Input label="Nickname" name="nickname" placeholder="FalleN" />
            <div className="pt-2 flex gap-2">
              <Button type="submit">Salvar jogador</Button>
              <a href="/players"><Button type="button" variant="ghost">Cancelar</Button></a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
