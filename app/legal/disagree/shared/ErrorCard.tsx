'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorCardProps {
  error?: string
  translations: {
    title: string
    backToDashboard: string
  }
}

export function ErrorCard({ error, translations: t }: ErrorCardProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-muted/30 to-background">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-red-600">{t.title}</CardTitle>
          <CardDescription className="text-base mt-2">{error}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.backToDashboard}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
