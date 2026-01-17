'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Building2, Users, Check, ArrowRight, LogOut } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const t = useTranslations('onboarding')

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  const createChurchFeatures = [
    t('main.createChurch.feature1'),
    t('main.createChurch.feature2'),
    t('main.createChurch.feature3'),
    t('main.createChurch.feature4'),
  ]

  const joinChurchFeatures = [
    t('main.joinChurch.feature1'),
    t('main.joinChurch.feature2'),
    t('main.joinChurch.feature3'),
    t('main.joinChurch.feature4'),
  ]

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-brand/5 via-background to-background">
      {/* Header */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{t('signOut')}</span>
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4 py-16 sm:px-6">
        <div className="w-full max-w-4xl space-y-10">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10 mb-2">
              <span className="text-3xl">⛪</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {t('main.title')}
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              {t('main.description')}
            </p>
          </div>

          {/* Cards */}
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Create Church Card */}
            <Card className="group relative overflow-hidden border-2 hover:border-brand/50 transition-all duration-300 hover:shadow-lg hover:shadow-brand/5">
              <CardContent className="p-6 sm:p-8">
                <div className="space-y-6">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand/10 text-brand group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="w-6 h-6" />
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold">{t('main.createChurch.title')}</h2>
                    <p className="text-muted-foreground text-sm">
                      {t('main.createChurch.description')}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {createChurchFeatures.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Button */}
                  <Button asChild className="w-full h-12 !rounded-full !bg-brand hover:!bg-brand/90 !text-brand-foreground group/btn" size="lg">
                    <Link href="/onboarding/create-church" className="gap-2">
                      {t('main.createChurch.button')}
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Join Church Card */}
            <Card className="group relative overflow-hidden border-2 hover:border-brand/50 transition-all duration-300 hover:shadow-lg hover:shadow-brand/5">
              <CardContent className="p-6 sm:p-8">
                <div className="space-y-6">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-6 h-6" />
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold">{t('main.joinChurch.title')}</h2>
                    <p className="text-muted-foreground text-sm">
                      {t('main.joinChurch.description')}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {joinChurchFeatures.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Button */}
                  <Button asChild className="w-full h-12 !rounded-full !border-2 !border-black dark:!border-white bg-transparent hover:bg-muted text-foreground group/btn" variant="outline" size="lg">
                    <Link href="/onboarding/join-church" className="gap-2">
                      {t('main.joinChurch.button')}
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer text */}
          <p className="text-center text-sm text-muted-foreground">
            {t('needHelp')}{' '}
            <a href="mailto:support@koinonia.app" className="text-brand hover:underline">
              support@koinonia.app
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
