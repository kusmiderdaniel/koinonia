import Link from 'next/link'
import { cookies } from 'next/headers'
import { Check, AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SuccessPageProps {
  searchParams: Promise<{
    type?: 'user' | 'church'
  }>
}

const translations = {
  en: {
    title: 'Disagreement Recorded',
    description: 'Your disagreement has been recorded successfully',
    intro: 'Your disagreement with the legal document update has been recorded. As a result:',
    church: {
      item1: 'Your church is scheduled for deletion',
      item2: 'Church members will be notified 10 days before deletion',
      item3: 'You can transfer church ownership to another admin before the deadline',
      item4: 'You can export your church data before deletion',
      item5: 'You can withdraw your disagreement at any time before the deadline',
    },
    user: {
      item1: 'Your account is scheduled for deletion on the deadline date',
      item2: 'You can continue using Koinonia until then',
      item3: 'You can withdraw your disagreement at any time before the deadline',
      item4: 'If you withdraw, you accept the updated terms and your account will not be deleted',
    },
    changeYourMind: 'Change your mind?',
    changeYourMindDescription:
      'You can withdraw your disagreement from your profile settings at any time before the deadline.',
    viewDisagreements: 'View My Disagreements',
    continueToDashboard: 'Continue to Dashboard',
  },
  pl: {
    title: 'Sprzeciw Zapisany',
    description: 'Twój sprzeciw został pomyślnie zapisany',
    intro: 'Twój sprzeciw wobec aktualizacji dokumentu prawnego został zapisany. W rezultacie:',
    church: {
      item1: 'Twój kościół jest zaplanowany do usunięcia',
      item2: 'Członkowie kościoła zostaną powiadomieni 10 dni przed usunięciem',
      item3: 'Możesz przekazać własność kościoła innemu administratorowi przed terminem',
      item4: 'Możesz wyeksportować dane swojego kościoła przed usunięciem',
      item5: 'Możesz wycofać swój sprzeciw w dowolnym momencie przed terminem',
    },
    user: {
      item1: 'Twoje konto jest zaplanowane do usunięcia w dniu terminu',
      item2: 'Możesz nadal korzystać z Koinonia do tego czasu',
      item3: 'Możesz wycofać swój sprzeciw w dowolnym momencie przed terminem',
      item4: 'Jeśli wycofasz sprzeciw, akceptujesz zaktualizowane warunki i Twoje konto nie zostanie usunięte',
    },
    changeYourMind: 'Zmienisz zdanie?',
    changeYourMindDescription:
      'Możesz wycofać swój sprzeciw z ustawień profilu w dowolnym momencie przed terminem.',
    viewDisagreements: 'Zobacz Moje Sprzeciwy',
    continueToDashboard: 'Przejdź do Panelu',
  },
}

export default async function DisagreementSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams
  const type = params.type || 'user'
  const isChurch = type === 'church'

  // Get user's language preference
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'
  const language = (locale === 'pl' ? 'pl' : 'en') as 'en' | 'pl'
  const t = translations[language]

  // Route to appropriate disagreement page based on type
  const disagreementsUrl = isChurch ? '/legal/disagree/church' : '/legal/disagree/user'

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isChurch ? (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>{t.intro}</p>
              <ul className="list-disc list-inside space-y-2">
                <li>{t.church.item1}</li>
                <li>{t.church.item2}</li>
                <li>{t.church.item3}</li>
                <li>{t.church.item4}</li>
                <li>{t.church.item5}</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>{t.intro}</p>
              <ul className="list-disc list-inside space-y-2">
                <li>{t.user.item1}</li>
                <li>{t.user.item2}</li>
                <li>{t.user.item3}</li>
                <li>{t.user.item4}</li>
              </ul>
            </div>
          )}

          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">
                  {t.changeYourMind}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {t.changeYourMindDescription}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild variant="outline">
              <Link href={disagreementsUrl}>{t.viewDisagreements}</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">
                {t.continueToDashboard}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
