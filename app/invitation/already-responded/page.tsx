import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CheckCircle, XCircle, Info } from 'lucide-react'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ previous?: string }>
}

export default async function AlreadyRespondedPage({ searchParams }: Props) {
  const { previous } = await searchParams

  const getIcon = () => {
    if (previous === 'accepted') {
      return <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
    }
    if (previous === 'declined') {
      return <XCircle className="h-16 w-16 text-muted-foreground mx-auto" />
    }
    return <Info className="h-16 w-16 text-blue-500 mx-auto" />
  }

  const getMessage = () => {
    if (previous === 'accepted') {
      return "You've already accepted this invitation."
    }
    if (previous === 'declined') {
      return "You've already declined this invitation."
    }
    if (previous === 'expired') {
      return 'This invitation has expired.'
    }
    return "You've already responded to this invitation."
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          {getIcon()}
          <h1 className="text-2xl font-bold mt-4">Already Responded</h1>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">{getMessage()}</p>
          <p className="text-sm text-muted-foreground">
            If you need to change your response, you can do so in the app.
          </p>
          <Button asChild className="w-full">
            <Link href="/auth/signin">Sign in to manage your response</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
