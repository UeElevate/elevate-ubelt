import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
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
      <main className="min-h-screen pt-16">
        {children}
      </main>
      <Footer />
    </>
  )
}
