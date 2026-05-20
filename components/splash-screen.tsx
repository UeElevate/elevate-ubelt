'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user has seen splash before in this session
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash')
    if (hasSeenSplash) {
      setIsVisible(false)
    }
  }, [])

  const handleEnter = () => {
    setIsAnimating(true)
    sessionStorage.setItem('hasSeenSplash', 'true')
    setTimeout(() => {
      setIsVisible(false)
    }, 500)
  }

  if (!isVisible) return null

  return (
    <div 
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-primary transition-opacity duration-500 ${
        isAnimating ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Decorative circles */}
      <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-secondary/20 blur-2xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-accent/20 blur-2xl" />
      <div className="absolute top-1/3 right-20 w-24 h-24 rounded-full bg-secondary/30 blur-xl" />
      
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Logo placeholder - circle with cross */}
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-secondary flex items-center justify-center mb-8 shadow-lg">
          <div className="relative w-12 h-12 md:w-16 md:h-16">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-full bg-primary rounded-full" />
            <div className="absolute top-1/3 left-0 w-full h-2 bg-primary rounded-full" />
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4 text-balance">
          Welcome to Youth Ministry
        </h1>
        
        <p className="text-primary-foreground/80 text-lg md:text-xl mb-8 max-w-md text-pretty">
          Connect with fellow believers, grow in faith, and serve our community together.
        </p>

        <Button
          onClick={handleEnter}
          size="lg"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 py-6 text-lg font-semibold shadow-lg"
        >
          Enter
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 w-full h-full"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            className="fill-secondary/20"
          />
        </svg>
      </div>
    </div>
  )
}
