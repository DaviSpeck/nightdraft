'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <p className="text-white/40 text-sm">Erro ao carregar a página</p>
      <div className="flex gap-4">
        <button onClick={reset} className="text-sm text-accent-blue hover:underline">
          Tentar novamente
        </button>
        <Link href="/corujoes" className="text-sm text-white/40 hover:text-white/60">
          Ir para corujões
        </Link>
      </div>
    </div>
  )
}
