export default function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="11" stroke="#5B8CFF" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="3" fill="#5B8CFF" />
      <line x1="16" y1="5" x2="16" y2="10" stroke="#5B8CFF" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="22" x2="16" y2="27" stroke="#5B8CFF" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="16" x2="10" y2="16" stroke="#5B8CFF" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="16" x2="27" y2="16" stroke="#5B8CFF" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
