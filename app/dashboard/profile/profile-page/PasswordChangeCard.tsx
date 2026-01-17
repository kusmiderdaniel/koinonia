'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordChangeCardProps {
  showPasswordForm: boolean
  currentPassword: string
  newPassword: string
  confirmPassword: string
  showCurrentPassword: boolean
  showNewPassword: boolean
  isChangingPassword: boolean
  passwordError: string | null
  passwordSuccess: string | null
  onShowPasswordFormChange: (show: boolean) => void
  onCurrentPasswordChange: (value: string) => void
  onNewPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onShowCurrentPasswordToggle: () => void
  onShowNewPasswordToggle: () => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export function PasswordChangeCard({
  showPasswordForm,
  currentPassword,
  newPassword,
  confirmPassword,
  showCurrentPassword,
  showNewPassword,
  isChangingPassword,
  passwordError,
  passwordSuccess,
  onShowPasswordFormChange,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onShowCurrentPasswordToggle,
  onShowNewPasswordToggle,
  onSubmit,
  onCancel,
}: PasswordChangeCardProps) {
  const t = useTranslations('profile.password')
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {passwordError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{passwordError}</AlertDescription>
          </Alert>
        )}

        {passwordSuccess && (
          <Alert className="mb-4 border-green-500 text-green-700">
            <AlertDescription>{passwordSuccess}</AlertDescription>
          </Alert>
        )}

        {!showPasswordForm ? (
          <div className="p-4 border border-black/20 dark:border-white/20 rounded-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => onShowPasswordFormChange(true)}
            >
              {t('changeButton')}
            </Button>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="space-y-4 p-4 border border-black/20 dark:border-white/20 rounded-lg"
          >
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => onCurrentPasswordChange(e.target.value)}
                  disabled={isChangingPassword}
                  required
                />
                <button
                  type="button"
                  onClick={onShowCurrentPasswordToggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('newPassword')}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => onNewPasswordChange(e.target.value)}
                  disabled={isChangingPassword}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={onShowNewPasswordToggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                disabled={isChangingPassword}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="!bg-brand hover:!bg-brand/90 !text-brand-foreground"
              >
                {isChangingPassword ? t('changing') : t('updateButton')}
              </Button>
              <Button
                type="button"
                variant="outline-pill"
                onClick={onCancel}
                disabled={isChangingPassword}
                className="!border-0"
              >
                {t('cancel')}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
