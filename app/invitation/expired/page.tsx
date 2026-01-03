import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import Link from 'next/link'

export default function InvitationExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <Clock className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold mt-4">Invitation Expired</h1>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            This invitation has expired because the event has already started or passed.
          </p>
          <Button asChild className="w-full">
            <Link href="/auth/signin">Sign in to view upcoming events</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
