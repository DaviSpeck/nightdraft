'use client'

interface Props {
  action: () => Promise<void>
  confirm: string
  label?: string
  className?: string
}

export default function DeleteButton({ action, confirm: confirmMsg, label = 'Excluir', className }: Props) {
  return (
    <form action={action}>
      <button
        type="submit"
        className={className ?? 'text-xs text-accent-red/50 hover:text-accent-red transition-colors'}
        onClick={e => {
          if (!window.confirm(confirmMsg)) e.preventDefault()
        }}
      >
        {label}
      </button>
    </form>
  )
}
