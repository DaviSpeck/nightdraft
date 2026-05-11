'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Logo from './Logo'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/corujoes', label: 'Corujões', icon: '🌙' },
  { href: '/players', label: 'Jogadores', icon: '👤' },
  { href: '/maps', label: 'Map Pool', icon: '🗺' },
  { href: '/games', label: 'Títulos', icon: '🎮' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-surface border-r border-white/[0.06] min-h-screen">
      <div className="px-4 py-5 border-b border-white/[0.06] flex items-center gap-2.5">
        <Logo size={24} />
        <div>
          <span className="text-sm font-bold text-white tracking-tight">NightDraft</span>
          <span className="ml-1.5 text-[9px] font-semibold text-accent-blue bg-accent-blue/10 px-1.5 py-0.5 rounded align-middle">CS</span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-accent-blue/10 text-accent-blue font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-2 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-colors"
        >
          <span className="text-base leading-none">↩</span>
          Sair
        </button>
      </div>
    </aside>
  )
}
