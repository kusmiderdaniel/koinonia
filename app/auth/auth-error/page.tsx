import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AuthErrorPage() {
  const t = await getTranslations('auth.authError')

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-red-500">
            {t('title')}
          </CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('reasons')}
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>{t('expiredLink')}</li>
            <li>{t('usedLink')}</li>
            <li>{t('networkError')}</li>
          </ul>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link href="/auth/signin">
              {t('trySignin')}
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/signup">
              {t('createAccount')}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
