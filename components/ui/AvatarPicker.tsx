'use client'

import { useState } from 'react'
import { AVATARS, DEFAULT_AVATAR } from '@/lib/avatars'

export default function AvatarPicker({ defaultValue }: { defaultValue?: string | null }) {
  const [selected, setSelected] = useState(defaultValue ?? DEFAULT_AVATAR)

  return (
    <div>
      <p className="text-xs text-white/40 mb-2">Avatar</p>
      <input type="hidden" name="avatar" value={selected} />
      <div className="flex flex-wrap gap-2">
        {AVATARS.map(emoji => (
          <button
            key={emoji}
            type="button"
            onClick={() => setSelected(emoji)}
            className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
              selected === emoji
                ? 'bg-accent-blue/20 border-2 border-accent-blue scale-110'
                : 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08]'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
