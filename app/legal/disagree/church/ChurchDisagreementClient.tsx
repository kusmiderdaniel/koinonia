'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { pl, enUS } from 'date-fns/locale'
import {
  AlertTriangle,
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Check,
  Users,
  Download,
  UserCog,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { recordDisagreement, withdrawDisagreement, type DisagreementInfo } from '../actions'
import { transferOwnership, exportChurchData } from './actions'

interface ChurchDisagreementClientProps {
  mode: 'disagree' | 'pending' | 'error'
  disagreementInfo?: DisagreementInfo
  pendingDisagreements?: Array<{
    id: string
    documentType: string
    documentTitle: string
    deadline: string
    isChurchDeletion: boolean
  }>
  transferCandidates?: Array<{
    id: string
    name: string
    email: string
  }>
  error?: string
  language: 'en' | 'pl'
}

const translations = {
  en: {
    documentTypes: {
      dpa: 'Data Processing Agreement',
      church_admin_terms: 'Church Administrator Terms',
    },
    error: {
      title: 'Error',
      backToDashboard: 'Back to Dashboard',
    },
    pending: {
      title: 'Pending Church Deletions',
      description:
        "You have disagreed with the following documents. Your church will be deleted if you don't withdraw your disagreement before the deadline.",
      deadline: 'Deadline',
      reAgree: 'Re-agree',
      exportData: 'Export Data',
      exporting: 'Exporting...',
      backToDashboard: 'Back to Dashboard',
    },
    warning: {
      title: 'Church Deletion Warning',
      subtitle: 'Please read this carefully before proceeding',
      alertTitle: 'Your church will be permanently deleted',
      alertDescription:
        "If you disagree with the updated {document} and do not re-agree before the deadline, {churchName} and all associated data will be permanently deleted.",
      effectiveDate: 'Effective Date',
      deletionDeadline: 'Deletion Deadline',
      acknowledgement: 'By disagreeing, you acknowledge that:',
      point1: 'Your church cannot operate without accepting the current terms',
      point2: "{churchName} will be deleted on the deadline date if you don't re-agree",
      point3: 'All church members will be disconnected from the church',
      point4: 'Church members will be notified 10 days before deletion',
      point5: 'You can withdraw your disagreement at any time before the deadline',
      point6: 'Once deleted, your church data cannot be recovered',
      goBack: 'Go Back',
      continueButton: 'I Understand, Continue',
    },
    options: {
      title: 'Your Options',
      subtitle: 'Before deleting your church, consider these alternatives',
      transferTitle: 'Transfer Ownership',
      transferDescription: 'Transfer the church to another admin who accepts the new terms',
      transferButton: 'Transfer to Another Admin',
      transferSettingsTitle: 'Transfer Ownership',
      transferSettingsDescription:
        'Transfer church ownership to another admin. The new owner will need to accept the updated legal documents to keep the church active.',
      transferSettingsButton: 'Go to Ownership Transfer',
      exportTitle: 'Export Church Data',
      exportDescription: 'Download all your church data before deletion',
      exportButton: 'Export Church Data',
      exporting: 'Exporting...',
      proceedTitle: 'Proceed with Disagreement',
      proceedDescription: 'Schedule your church for deletion',
      proceedButton: 'Proceed with Disagreement',
      goBack: 'Go Back',
    },
    confirm: {
      title: 'Confirm Your Disagreement',
      description: 'Enter your password to confirm your disagreement with the {document}',
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      checkbox:
        'I understand that {churchName} will be permanently deleted on {date} if I do not withdraw this disagreement.',
      goBack: 'Go Back',
      confirmButton: 'Confirm Disagreement',
      processing: 'Processing...',
    },
    transfer: {
      title: 'Transfer Church Ownership',
      description: 'Select an admin to transfer ownership to. This will cancel the scheduled deletion.',
      selectLabel: 'Select New Owner',
      selectPlaceholder: 'Select an admin',
      passwordLabel: 'Your Password',
      passwordPlaceholder: 'Enter your password to confirm',
      cancel: 'Cancel',
      transferButton: 'Transfer Ownership',
      transferring: 'Transferring...',
    },
    toast: {
      disagreementRecorded: 'Disagreement recorded',
      disagreementWithdrawn: 'Disagreement withdrawn - you have re-agreed to the document',
      ownershipTransferred: 'Ownership transferred successfully. Church deletion cancelled.',
      exportSuccess: 'Church data exported successfully',
      exportFailed: 'Failed to export data',
      error: 'An error occurred',
    },
  },
  pl: {
    documentTypes: {
      dpa: 'Umowa Powierzenia Danych',
      church_admin_terms: 'Warunki dla Administratorów Kościoła',
    },
    error: {
      title: 'Błąd',
      backToDashboard: 'Wróć do panelu',
    },
    pending: {
      title: 'Oczekujące usunięcia kościoła',
      description:
        'Wyraziłeś sprzeciw wobec poniższych dokumentów. Twój kościół zostanie usunięty, jeśli nie wycofasz sprzeciwu przed upływem terminu.',
      deadline: 'Termin',
      reAgree: 'Zaakceptuj ponownie',
      exportData: 'Eksportuj dane',
      exporting: 'Eksportowanie...',
      backToDashboard: 'Wróć do panelu',
    },
    warning: {
      title: 'Ostrzeżenie o usunięciu kościoła',
      subtitle: 'Przeczytaj uważnie przed kontynuowaniem',
      alertTitle: 'Twój kościół zostanie trwale usunięty',
      alertDescription:
        'Jeśli nie zgadzasz się z zaktualizowanym dokumentem {document} i nie zaakceptujesz go ponownie przed upływem terminu, {churchName} oraz wszystkie powiązane dane zostaną trwale usunięte.',
      effectiveDate: 'Data wejścia w życie',
      deletionDeadline: 'Termin usunięcia',
      acknowledgement: 'Wyrażając sprzeciw, potwierdzasz że:',
      point1: 'Twój kościół nie może działać bez akceptacji aktualnych warunków',
      point2: '{churchName} zostanie usunięty w dniu terminu, jeśli nie zaakceptujesz ponownie',
      point3: 'Wszyscy członkowie kościoła zostaną odłączeni od kościoła',
      point4: 'Członkowie kościoła zostaną powiadomieni 10 dni przed usunięciem',
      point5: 'Możesz wycofać sprzeciw w dowolnym momencie przed upływem terminu',
      point6: 'Po usunięciu danych kościoła nie można ich odzyskać',
      goBack: 'Wróć',
      continueButton: 'Rozumiem, kontynuuj',
    },
    options: {
      title: 'Twoje opcje',
      subtitle: 'Przed usunięciem kościoła rozważ te alternatywy',
      transferTitle: 'Przekaż własność',
      transferDescription: 'Przekaż kościół innemu administratorowi, który akceptuje nowe warunki',
      transferButton: 'Przekaż innemu administratorowi',
      transferSettingsTitle: 'Przekaż własność',
      transferSettingsDescription:
        'Przekaż własność kościoła innemu administratorowi. Nowy właściciel będzie musiał zaakceptować zaktualizowane dokumenty prawne, aby kościół pozostał aktywny.',
      transferSettingsButton: 'Przejdź do przekazania własności',
      exportTitle: 'Eksportuj dane kościoła',
      exportDescription: 'Pobierz wszystkie dane kościoła przed usunięciem',
      exportButton: 'Eksportuj dane kościoła',
      exporting: 'Eksportowanie...',
      proceedTitle: 'Kontynuuj ze sprzeciwem',
      proceedDescription: 'Zaplanuj usunięcie kościoła',
      proceedButton: 'Kontynuuj ze sprzeciwem',
      goBack: 'Wróć',
    },
    confirm: {
      title: 'Potwierdź swój sprzeciw',
      description: 'Wprowadź hasło, aby potwierdzić sprzeciw wobec dokumentu {document}',
      password: 'Hasło',
      passwordPlaceholder: 'Wprowadź hasło',
      checkbox:
        'Rozumiem, że {churchName} zostanie trwale usunięty {date}, jeśli nie wycofam tego sprzeciwu.',
      goBack: 'Wróć',
      confirmButton: 'Potwierdź sprzeciw',
      processing: 'Przetwarzanie...',
    },
    transfer: {
      title: 'Przekaż własność kościoła',
      description:
        'Wybierz administratora, któremu chcesz przekazać własność. Anuluje to zaplanowane usunięcie.',
      selectLabel: 'Wybierz nowego właściciela',
      selectPlaceholder: 'Wybierz administratora',
      passwordLabel: 'Twoje hasło',
      passwordPlaceholder: 'Wprowadź hasło, aby potwierdzić',
      cancel: 'Anuluj',
      transferButton: 'Przekaż własność',
      transferring: 'Przekazywanie...',
    },
    toast: {
      disagreementRecorded: 'Sprzeciw został zapisany',
      disagreementWithdrawn: 'Sprzeciw wycofany - ponownie zaakceptowałeś dokument',
      ownershipTransferred: 'Własność przekazana pomyślnie. Usunięcie kościoła anulowane.',
      exportSuccess: 'Dane kościoła wyeksportowane pomyślnie',
      exportFailed: 'Nie udało się wyeksportować danych',
      error: 'Wystąpił błąd',
    },
  },
}

export function ChurchDisagreementClient({
  mode,
  disagreementInfo,
  pendingDisagreements,
  transferCandidates = [],
  error,
  language,
}: ChurchDisagreementClientProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [understood, setUnderstood] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'warning' | 'options' | 'confirm'>('warning')
  const [selectedAction, setSelectedAction] = useState<'disagree' | 'transfer' | null>(null)
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>('')
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [transferPassword, setTransferPassword] = useState('')
  const [isExporting, setIsExporting] = useState(false)

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
      router.push('/legal/disagree/success?type=church')
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

  const handleTransferOwnership = async () => {
    if (!selectedNewOwner || !transferPassword) return

    setIsSubmitting(true)
    try {
      const result = await transferOwnership(selectedNewOwner, transferPassword)

      if (result.error) {
        toast.error(result.error)
        setIsSubmitting(false)
        return
      }

      toast.success(t.toast.ownershipTransferred)
      setShowTransferDialog(false)
      router.push('/dashboard')
    } catch {
      toast.error(t.toast.error)
      setIsSubmitting(false)
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const result = await exportChurchData()

      if (result.error) {
        toast.error(result.error)
        setIsExporting(false)
        return
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `church-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(t.toast.exportSuccess)
    } catch {
      toast.error(t.toast.exportFailed)
    } finally {
      setIsExporting(false)
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
            <CardDescription className="mt-3">{t.pending.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingDisagreements.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
              >
                <div>
                  <p className="font-medium">{d.documentTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {t.pending.deadline}: {format(new Date(d.deadline), 'PPP', { locale: dateFnsLocale })}
                  </p>
                  <p className="text-sm text-red-600 font-medium">
                    {formatDistanceToNow(new Date(d.deadline), { addSuffix: true, locale: dateFnsLocale })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWithdraw(d.id)}
                  disabled={isSubmitting}
                  className="shrink-0"
                >
                  <Check className="mr-2 h-4 w-4" />
                  {t.pending.reAgree}
                </Button>
              </div>
            ))}

            <div className="pt-4 flex gap-3">
              <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? t.pending.exporting : t.pending.exportData}
              </Button>
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
    const churchName = disagreementInfo.churchName || (language === 'pl' ? 'Twój kościół' : 'your church')
    const documentName = getDocumentTypeName(disagreementInfo.documentType)

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-red-50/50 to-background dark:from-red-950/20">
        <Card className="max-w-xl w-full shadow-lg border-red-200 dark:border-red-900/50">
          {step === 'warning' ? (
            <>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <CardTitle className="text-red-600">{t.warning.title}</CardTitle>
                    <CardDescription>{t.warning.subtitle}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-red-500 bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200">
                  <Building2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <AlertTitle className="text-red-800 dark:text-red-200 font-semibold">
                    {t.warning.alertTitle}
                  </AlertTitle>
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    {t.warning.alertDescription
                      .replace('{document}', documentName)
                      .replace('{churchName}', churchName)}
                  </AlertDescription>
                </Alert>

                <div className="grid gap-3">
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">{t.warning.effectiveDate}</p>
                      <p className="font-semibold">{format(effectiveDate, 'PPPP', { locale: dateFnsLocale })}</p>
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

                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t.warning.acknowledgement}
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{t.warning.point1}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{t.warning.point2.replace('{churchName}', churchName)}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{t.warning.point3}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{t.warning.point4}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{t.warning.point5}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{t.warning.point6}</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => router.back()} className="flex-1 h-11">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t.warning.goBack}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setStep('options')}
                    className="flex-1 h-11 !bg-red-600 hover:!bg-red-700 !text-white font-medium"
                  >
                    {t.warning.continueButton}
                  </Button>
                </div>
              </CardContent>
            </>
          ) : step === 'options' ? (
            <>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>{t.options.title}</CardTitle>
                    <CardDescription>{t.options.subtitle}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Transfer Ownership via Settings Option */}
                <div className="p-4 border border-blue-200 dark:border-blue-900 rounded-lg space-y-3 bg-blue-50 dark:bg-blue-950/30">
                  <div className="flex items-center gap-3">
                    <UserCog className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-700 dark:text-blue-400">
                        {t.options.transferSettingsTitle}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {t.options.transferSettingsDescription}
                      </p>
                    </div>
                  </div>
                  <Link href="/settings/church?tab=ownership">
                    <Button
                      variant="outline"
                      className="w-full border-blue-300 hover:bg-blue-100 dark:border-blue-800 dark:hover:bg-blue-900/50"
                    >
                      {t.options.transferSettingsButton}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {/* Export Data Option */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">{t.options.exportTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.options.exportDescription}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? t.options.exporting : t.options.exportButton}
                  </Button>
                </div>

                {/* Proceed with Disagreement */}
                <div className="p-4 border border-red-200 dark:border-red-900 rounded-lg space-y-3 bg-red-50 dark:bg-red-950">
                  <div className="flex items-center gap-3">
                    <Trash2 className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-400">
                        {t.options.proceedTitle}
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {t.options.proceedDescription}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setSelectedAction('disagree')
                      setStep('confirm')
                    }}
                    className="w-full !bg-red-600 hover:!bg-red-700 !text-white font-medium"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    {t.options.proceedButton}
                  </Button>
                </div>

                <Button variant="ghost" onClick={() => setStep('warning')} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.options.goBack}
                </Button>
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
                      {t.confirm.checkbox
                        .replace('{churchName}', churchName)
                        .replace('{date}', format(deadline, 'PPP', { locale: dateFnsLocale }))}
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep('options')} className="flex-1 h-11">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t.confirm.goBack}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleConfirmDisagreement}
                    disabled={!understood || !password || isSubmitting}
                    className="flex-1 h-11 !bg-red-600 hover:!bg-red-700 !text-white font-medium disabled:!bg-red-300"
                  >
                    {isSubmitting ? t.confirm.processing : t.confirm.confirmButton}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Transfer Ownership Dialog */}
        <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.transfer.title}</DialogTitle>
              <DialogDescription>{t.transfer.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newOwner">{t.transfer.selectLabel}</Label>
                <Select value={selectedNewOwner} onValueChange={setSelectedNewOwner}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.transfer.selectPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {transferCandidates.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.name} ({admin.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transferPassword">{t.transfer.passwordLabel}</Label>
                <Input
                  id="transferPassword"
                  type="password"
                  value={transferPassword}
                  onChange={(e) => setTransferPassword(e.target.value)}
                  placeholder={t.transfer.passwordPlaceholder}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                {t.transfer.cancel}
              </Button>
              <Button
                onClick={handleTransferOwnership}
                disabled={!selectedNewOwner || !transferPassword || isSubmitting}
              >
                {isSubmitting ? t.transfer.transferring : t.transfer.transferButton}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return null
}
