import { Navigation } from '@/components/navigation'
import { SplashScreen } from '@/components/splash-screen'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SplashScreen />
      <Navigation />
      <main className="min-h-screen pt-14 pb-20 md:pt-0 md:pb-0 md:ml-64">
        {children}
      </main>
    </>
  )
}
