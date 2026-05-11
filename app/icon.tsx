import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: '#0B0F19',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '7px',
      }}
    >
      <div style={{ position: 'relative', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer ring */}
        <div style={{ position: 'absolute', width: 22, height: 22, borderRadius: '50%', border: '1.5px solid #5B8CFF' }} />
        {/* Inner dot */}
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#5B8CFF' }} />
        {/* Top tick */}
        <div style={{ position: 'absolute', top: 0, left: '50%', marginLeft: -0.75, width: 1.5, height: 4, background: '#5B8CFF', borderRadius: 1 }} />
        {/* Bottom tick */}
        <div style={{ position: 'absolute', bottom: 0, left: '50%', marginLeft: -0.75, width: 1.5, height: 4, background: '#5B8CFF', borderRadius: 1 }} />
        {/* Left tick */}
        <div style={{ position: 'absolute', left: 0, top: '50%', marginTop: -0.75, width: 4, height: 1.5, background: '#5B8CFF', borderRadius: 1 }} />
        {/* Right tick */}
        <div style={{ position: 'absolute', right: 0, top: '50%', marginTop: -0.75, width: 4, height: 1.5, background: '#5B8CFF', borderRadius: 1 }} />
      </div>
    </div>,
    { ...size }
  )
}
