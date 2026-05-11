import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-white/10">404</p>
        <p className="text-white/60 text-sm">Página não encontrada</p>
        <Link href="/corujoes" className="inline-block text-sm text-accent-blue hover:underline">
          Voltar ao início →
        </Link>
      </div>
    </div>
  )
}
