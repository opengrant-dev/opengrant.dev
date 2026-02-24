import { useState, useEffect } from 'react'

export default function ScrollProgress() {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement
      const scrolled = el.scrollTop
      const total = el.scrollHeight - el.clientHeight
      setPct(total > 0 ? (scrolled / total) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0,
        height: '2px',
        width: `${pct}%`,
        background: 'linear-gradient(90deg, #0ea5e9, #6366f1, #8b5cf6)',
        zIndex: 9999,
        pointerEvents: 'none',
        transition: 'width 0.08s linear',
      }}
    />
  )
}
