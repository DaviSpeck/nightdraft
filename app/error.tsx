'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-white/60 text-sm">Algo deu errado</p>
        <button
          onClick={reset}
          className="text-sm text-accent-blue hover:underline"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
