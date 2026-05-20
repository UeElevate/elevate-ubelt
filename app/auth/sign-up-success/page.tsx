import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'
import Link from 'next/link'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
            <Mail className="h-8 w-8 text-secondary-foreground" />
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a confirmation link to verify your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click the link in the email to complete your registration and join our Youth Ministry community.
          </p>
          
          <div className="pt-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">
                Back to Sign In
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or try signing up again.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
