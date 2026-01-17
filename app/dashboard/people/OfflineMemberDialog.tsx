'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import { createOfflineMember } from './actions'

interface OfflineMemberDialogProps {
  trigger?: React.ReactNode
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function OfflineMemberDialog({ trigger, weekStartsOn = 0 }: OfflineMemberDialogProps) {
  const t = useTranslations('people')
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    sex: '',
  })

  // Prevent hydration mismatch from Radix UI random IDs
  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error(t('offlineMember.errorRequired'))
      return
    }

    setLoading(true)
    const result = await createOfflineMember({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      dateOfBirth: formData.dateOfBirth || null,
      sex: formData.sex || null,
    })
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(t('offlineMember.successMessage', { name: `${formData.firstName} ${formData.lastName}` }))
      setOpen(false)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        sex: '',
      })
      router.refresh()
    }
  }

  // Show placeholder button until mounted to prevent hydration mismatch
  if (!mounted) {
    return trigger || (
      <Button variant="outline" className="gap-2 justify-center !border !border-black/20 dark:!border-white/20">
        <UserPlus className="h-4 w-4" />
        {t('offlineMember.button')}
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 justify-center !border !border-black/20 dark:!border-white/20">
            <UserPlus className="h-4 w-4" />
            {t('offlineMember.button')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] !border !border-black dark:!border-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('offlineMember.title')}</DialogTitle>
            <DialogDescription>
              {t('offlineMember.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('offlineMember.firstNameRequired')}</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder={t('offlineMember.firstNamePlaceholder')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('offlineMember.lastNameRequired')}</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder={t('offlineMember.lastNamePlaceholder')}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('offlineMember.emailOptional')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('offlineMember.emailPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('offlineMember.phoneOptional')}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t('offlineMember.phonePlaceholder')}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">{t('offlineMember.dateOfBirth')}</Label>
                <DatePicker
                  id="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(value) => setFormData({ ...formData, dateOfBirth: value })}
                  placeholder={t('offlineMember.selectDate')}
                  disabled={loading}
                  weekStartsOn={weekStartsOn}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">{t('offlineMember.gender')}</Label>
                <Select
                  value={formData.sex}
                  onValueChange={(value) => setFormData({ ...formData, sex: value })}
                >
                  <SelectTrigger id="sex" className="w-full !border !border-black/20 dark:!border-white/20">
                    <SelectValue placeholder={t('offlineMember.selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className="border border-black/20 dark:border-white/20">
                    <SelectItem value="male">{t('sex.male')}</SelectItem>
                    <SelectItem value="female">{t('sex.female')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" className="rounded-full" onClick={() => setOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="!bg-brand hover:!bg-brand/90 !text-black !border !border-brand">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('addMember')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
