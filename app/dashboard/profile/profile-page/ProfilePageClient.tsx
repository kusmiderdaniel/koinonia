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
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <LoadingState message="Loading profile..." />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information
        </p>
      </div>

      {state.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.success && (
        <Alert className="mb-6 border-green-500 text-green-700">
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
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
  )
}
