'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingState } from '@/components/LoadingState'
import { useProfilePageState } from './useProfilePageState'
import { PersonalInfoCard } from './PersonalInfoCard'
import { PasswordChangeCard } from './PasswordChangeCard'

export function ProfilePageClient() {
  const state = useProfilePageState()

  if (state.isLoadingData) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] md:h-screen items-center justify-center">
        <LoadingState message="Loading profile..." />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold">Your Profile</h1>
            <p className="text-muted-foreground">
              Manage your personal information
            </p>
          </div>
        </div>

        {state.error && (
          <Alert variant="destructive" className="mb-4 shrink-0">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {state.success && (
          <Alert className="mb-4 border-green-500 text-green-700 shrink-0">
            <AlertDescription>{state.success}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 min-h-0 overflow-auto">
          <div className="border border-black dark:border-zinc-700 rounded-lg px-3 md:px-4 py-4 md:py-6 max-w-md space-y-6">
            <PersonalInfoCard
              form={state.form}
              email={state.email}
              sex={state.sex}
              dateOfBirth={state.dateOfBirth}
              firstDayOfWeek={state.firstDayOfWeek}
              isLoading={state.isLoading}
              onSubmit={state.onSubmit}
              onDateOfBirthChange={state.handleDateOfBirthChange}
              onSexChange={state.handleSexChange}
            />

            <PasswordChangeCard
              showPasswordForm={state.showPasswordForm}
              currentPassword={state.currentPassword}
              newPassword={state.newPassword}
              confirmPassword={state.confirmPassword}
              showCurrentPassword={state.showCurrentPassword}
              showNewPassword={state.showNewPassword}
              isChangingPassword={state.isChangingPassword}
              passwordError={state.passwordError}
              passwordSuccess={state.passwordSuccess}
              onShowPasswordFormChange={state.setShowPasswordForm}
              onCurrentPasswordChange={state.setCurrentPassword}
              onNewPasswordChange={state.setNewPassword}
              onConfirmPasswordChange={state.setConfirmPassword}
              onShowCurrentPasswordToggle={() =>
                state.setShowCurrentPassword(!state.showCurrentPassword)
              }
              onShowNewPasswordToggle={() =>
                state.setShowNewPassword(!state.showNewPassword)
              }
              onSubmit={state.handlePasswordChange}
              onCancel={state.handleCancelPasswordChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
