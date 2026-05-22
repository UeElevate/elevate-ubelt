'use client'

import { useState, useEffect } from 'react'

export function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('hasSeenSplash')) return
    setVisible(true)

    // auto-dismiss after 2.5 s
    const timer = setTimeout(dismiss, 2500)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = () => {
    setFading(true)
    sessionStorage.setItem('hasSeenSplash', 'true')
    setTimeout(() => setVisible(false), 500)
  }

  if (!visible) return null

  return (
    <div
      onClick={dismiss}
      className={`fixed inset-0 z-200 flex flex-col items-center justify-center cursor-pointer select-none transition-opacity duration-500 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background:
          'linear-gradient(170deg, #FF8C00 0%, #FF6D1B 25%, #C45000 50%, #0b3a7a 75%, #061e3d 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-8 left-8 w-40 h-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-16 right-8 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-secondary/20 blur-2xl pointer-events-none" />

      {/* Logo mark */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <img src="/elevate_ubelt_logo.png" alt="Elevate UBelt" className="h-28 w-auto mb-8 brightness-0 invert" />

        {/* Progress bar */}
        <div className="mt-10 w-48 h-0.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/80 rounded-full"
            style={{
              animation: 'grow 2.5s linear forwards',
            }}
          />
        </div>

        <p className="text-white/40 text-xs mt-4 tracking-widest uppercase">
          Tap anywhere to skip
        </p>
      </div>

      <style>{`
        @keyframes grow {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  )
}
