'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { pl, enUS } from 'date-fns/locale'
import { AlertTriangle, Calendar, Clock, ArrowLeft, Trash2, Check, ShieldAlert, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { recordDisagreement, withdrawDisagreement, type DisagreementInfo } from '../actions'

interface UserDisagreementClientProps {
  mode: 'disagree' | 'pending' | 'error'
  disagreementInfo?: DisagreementInfo
  pendingDisagreements?: Array<{
    id: string
    documentType: string
    documentTitle: string
    deadline: string
    isChurchDeletion: boolean
  }>
  error?: string
  language: 'en' | 'pl'
}

const translations = {
  en: {
    documentTypes: {
      terms_of_service: 'Terms of Service',
      privacy_policy: 'Privacy Policy',
    },
    error: {
      title: 'Error',
      backToDashboard: 'Back to Dashboard',
    },
    pending: {
      title: 'Pending Disagreements',
      description: 'You have disagreed with the following documents. Your account will be deleted if you don\'t withdraw your disagreement before the deadline.',
      deadline: 'Deadline',
      reAgree: 'Re-agree',
      viewDocument: 'View Document',
      backToDashboard: 'Back to Dashboard',
    },
    warning: {
      title: 'Account Deletion Warning',
      subtitle: 'Please read this carefully before proceeding',
      alertTitle: 'Your account will be permanently deleted',
      alertDescription: 'If you disagree with the updated {document} and do not re-agree before the deadline, your Koinonia account and all associated data will be permanently deleted.',
      effectiveDate: 'Effective Date',
      deletionDeadline: 'Deletion Deadline',
      acknowledgement: 'By disagreeing, you acknowledge that:',
      point1: 'You cannot use Koinonia without accepting the current terms',
      point2: 'Your account will be deleted on the deadline date if you don\'t re-agree',
      point3: 'You can withdraw your disagreement at any time before the deadline',
      point4: 'Once deleted, your account cannot be recovered',
      goBack: 'Go Back',
      continueButton: 'I Understand, Continue',
    },
    confirm: {
      title: 'Confirm Your Disagreement',
      description: 'Enter your password to confirm your disagreement with the {document}',
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      checkbox: 'I understand that my account will be permanently deleted on {date} if I do not withdraw this disagreement.',
      goBack: 'Go Back',
      confirmButton: 'Confirm Disagreement',
      processing: 'Processing...',
    },
    toast: {
      disagreementRecorded: 'Disagreement recorded',
      disagreementWithdrawn: 'Disagreement withdrawn - you have re-agreed to the document',
      error: 'An error occurred',
    },
  },
  pl: {
    documentTypes: {
      terms_of_service: 'Regulamin',
      privacy_policy: 'Polityka Prywatności',
    },
    error: {
      title: 'Błąd',
      backToDashboard: 'Wróć do panelu',
    },
    pending: {
      title: 'Oczekujące sprzeciwy',
      description: 'Wyraziłeś sprzeciw wobec poniższych dokumentów. Twoje konto zostanie usunięte, jeśli nie wycofasz sprzeciwu przed upływem terminu.',
      deadline: 'Termin',
      reAgree: 'Zaakceptuj ponownie',
      viewDocument: 'Zobacz dokument',
      backToDashboard: 'Wróć do panelu',
    },
    warning: {
      title: 'Ostrzeżenie o usunięciu konta',
      subtitle: 'Przeczytaj uważnie przed kontynuowaniem',
      alertTitle: 'Twoje konto zostanie trwale usunięte',
      alertDescription: 'Jeśli nie zgadzasz się z zaktualizowanym dokumentem {document} i nie zaakceptujesz go ponownie przed upływem terminu, Twoje konto Koinonia oraz wszystkie powiązane dane zostaną trwale usunięte.',
      effectiveDate: 'Data wejścia w życie',
      deletionDeadline: 'Termin usunięcia',
      acknowledgement: 'Wyrażając sprzeciw, potwierdzasz że:',
      point1: 'Nie możesz korzystać z Koinonia bez akceptacji aktualnych warunków',
      point2: 'Twoje konto zostanie usunięte w dniu terminu, jeśli nie zaakceptujesz ponownie',
      point3: 'Możesz wycofać sprzeciw w dowolnym momencie przed upływem terminu',
      point4: 'Po usunięciu konta nie można go odzyskać',
      goBack: 'Wróć',
      continueButton: 'Rozumiem, kontynuuj',
    },
    confirm: {
      title: 'Potwierdź swój sprzeciw',
      description: 'Wprowadź hasło, aby potwierdzić sprzeciw wobec dokumentu {document}',
      password: 'Hasło',
      passwordPlaceholder: 'Wprowadź hasło',
      checkbox: 'Rozumiem, że moje konto zostanie trwale usunięte {date}, jeśli nie wycofam tego sprzeciwu.',
      goBack: 'Wróć',
      confirmButton: 'Potwierdź sprzeciw',
      processing: 'Przetwarzanie...',
    },
    toast: {
      disagreementRecorded: 'Sprzeciw został zapisany',
      disagreementWithdrawn: 'Sprzeciw wycofany - ponownie zaakceptowałeś dokument',
      error: 'Wystąpił błąd',
    },
  },
}

export function UserDisagreementClient({
  mode,
  disagreementInfo,
  pendingDisagreements,
  error,
  language,
}: UserDisagreementClientProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'warning' | 'confirm'>('warning')

  const t = translations[language]
  const dateFnsLocale = language === 'pl' ? pl : enUS

  const getDocumentTypeName = (type: string) => {
    return t.documentTypes[type as keyof typeof t.documentTypes] || type
  }

  const handleConfirmDisagreement = async () => {
    if (!disagreementInfo || !understood || !password) return

    setIsSubmitting(true)
    try {
      const result = await recordDisagreement(disagreementInfo.id, password)

      if (result.error) {
        toast.error(result.error)
        setIsSubmitting(false)
        return
      }

      toast.success(t.toast.disagreementRecorded)
      router.push('/legal/disagree/success?type=user')
    } catch {
      toast.error(t.toast.error)
      setIsSubmitting(false)
    }
  }

  const handleWithdraw = async (disagreementId: string) => {
    setIsSubmitting(true)
    try {
      const result = await withdrawDisagreement(disagreementId)

      if (result.error) {
        toast.error(result.error)
        setIsSubmitting(false)
        return
      }

      toast.success(t.toast.disagreementWithdrawn)
      router.push('/dashboard')
    } catch {
      toast.error(t.toast.error)
      setIsSubmitting(false)
    }
  }

  // Error state
  if (mode === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-muted/30 to-background">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">{t.error.title}</CardTitle>
            <CardDescription className="text-base mt-2">{error}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.error.backToDashboard}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Pending disagreements list
  if (mode === 'pending' && pendingDisagreements) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-muted/30 to-background">
        <Card className="max-w-lg w-full shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <CardTitle>{t.pending.title}</CardTitle>
              </div>
            </div>
            <CardDescription className="mt-3">
              {t.pending.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingDisagreements.map((d) => {
              const formattedTitle = getDocumentTypeName(d.documentType)
              const documentUrl = `/legal/${d.documentType.replace(/_/g, '-')}`

              return (
                <div
                  key={d.id}
                  className="p-4 border rounded-lg bg-muted/30 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-base">{formattedTitle}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {t.pending.deadline}: {format(new Date(d.deadline), 'PPP', { locale: dateFnsLocale })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatDistanceToNow(new Date(d.deadline), { addSuffix: true, locale: dateFnsLocale })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(documentUrl, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {t.pending.viewDocument}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleWithdraw(d.id)}
                      disabled={isSubmitting}
                      className="!bg-green-600 hover:!bg-green-700 !text-white"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {t.pending.reAgree}
                    </Button>
                  </div>
                </div>
              )
            })}

            <div className="pt-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.pending.backToDashboard}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Disagreement flow
  if (mode === 'disagree' && disagreementInfo) {
    const deadline = new Date(disagreementInfo.deadline)
    const effectiveDate = new Date(disagreementInfo.effectiveDate)
    const documentName = getDocumentTypeName(disagreementInfo.documentType)

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-red-50/50 to-background dark:from-red-950/20">
        <Card className="max-w-xl w-full shadow-lg border-red-200 dark:border-red-900/50">
          {step === 'warning' ? (
            <>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <ShieldAlert className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-red-600">{t.warning.title}</CardTitle>
                    <CardDescription>{t.warning.subtitle}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Warning Alert - Fixed Layout */}
                <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/50 p-4">
                  <div className="flex gap-3">
                    <Trash2 className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-semibold text-red-700 dark:text-red-400">
                        {t.warning.alertTitle}
                      </h4>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {t.warning.alertDescription.replace('{document}', documentName)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date Cards */}
                <div className="grid gap-3">
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">{t.warning.effectiveDate}</p>
                      <p className="font-semibold">
                        {format(effectiveDate, 'PPPP', { locale: dateFnsLocale })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-red-600">{t.warning.deletionDeadline}</p>
                      <p className="font-semibold text-red-700 dark:text-red-400">
                        {format(deadline, 'PPPP', { locale: dateFnsLocale })}
                      </p>
                      <p className="text-xs text-red-500 mt-0.5">
                        {formatDistanceToNow(deadline, { addSuffix: true, locale: dateFnsLocale })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Acknowledgement List */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">{t.warning.acknowledgement}</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{t.warning.point1}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{t.warning.point2}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{t.warning.point3}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{t.warning.point4}</span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => router.back()} className="flex-1 h-11">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t.warning.goBack}
                  </Button>
                  <Button
                    onClick={() => setStep('confirm')}
                    className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md"
                  >
                    {t.warning.continueButton}
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <CardTitle>{t.confirm.title}</CardTitle>
                    <CardDescription>
                      {t.confirm.description.replace('{document}', documentName)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">{t.confirm.password}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.confirm.passwordPlaceholder}
                    />
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                    <Checkbox
                      id="understood"
                      checked={understood}
                      onCheckedChange={(checked) => setUnderstood(checked === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="understood" className="text-sm leading-relaxed cursor-pointer">
                      {t.confirm.checkbox.replace(
                        '{date}',
                        format(deadline, 'PPP', { locale: dateFnsLocale })
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('warning')} className="flex-1 h-11">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t.confirm.goBack}
                  </Button>
                  <Button
                    onClick={handleConfirmDisagreement}
                    disabled={!understood || !password || isSubmitting}
                    className="flex-1 h-11 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium rounded-md"
                  >
                    {isSubmitting ? t.confirm.processing : t.confirm.confirmButton}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    )
  }

  return null
}
