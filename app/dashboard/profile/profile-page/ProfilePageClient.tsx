'use client'

import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { LoadingState } from '@/components/LoadingState'
import { useIsMobile } from '@/lib/hooks'
import { useProfilePageState } from './useProfilePageState'
import { PersonalInfoCard } from './PersonalInfoCard'
import { PasswordChangeCard } from './PasswordChangeCard'
import { NotificationSettingsCard } from './NotificationSettingsCard'
import { isLeaderOrAbove } from '@/lib/permissions'

type TabKey = 'personal' | 'password' | 'notifications'

interface TabItem {
  key: TabKey
  label: string
  description: string
  show: boolean
}

export function ProfilePageClient() {
  const state = useProfilePageState()
  const isMobile = useIsMobile()
  const showNotificationSettings = isLeaderOrAbove(state.userRole)
  const [mobileSelectedTab, setMobileSelectedTab] = useState<TabKey | null>(null)

  const tabItems: TabItem[] = [
    { key: 'personal', label: 'Personal Information', description: 'Name, email, phone, and more', show: true },
    { key: 'password', label: 'Password', description: 'Change your password', show: true },
    { key: 'notifications', label: 'Notification Settings', description: 'Manage notification preferences', show: showNotificationSettings },
  ]

  const visibleTabs = tabItems.filter(t => t.show)
  const selectedTabItem = visibleTabs.find(t => t.key === mobileSelectedTab)

  if (state.isLoadingData) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] md:h-screen items-center justify-center">
        <LoadingState message="Loading profile..." />
      </div>
    )
  }

  const renderTabContent = (tabKey: TabKey) => {
    switch (tabKey) {
      case 'personal':
        return (
          <>
            {state.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            {state.success && (
              <Alert className="mb-4 border-green-500 text-green-700">
                <AlertDescription>{state.success}</AlertDescription>
              </Alert>
            )}
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
          </>
        )
      case 'password':
        return (
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
        )
      case 'notifications':
        return showNotificationSettings ? (
          <>
            {state.notificationSuccess && (
              <Alert className="mb-4 border-green-500 text-green-700">
                <AlertDescription>{state.notificationSuccess}</AlertDescription>
              </Alert>
            )}
            {state.notificationError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{state.notificationError}</AlertDescription>
              </Alert>
            )}
            <NotificationSettingsCard
              preferences={state.notificationPreferences}
              isLoading={state.isUpdatingNotifications}
              onPreferencesChange={state.handleNotificationPreferencesChange}
              onSave={state.handleSaveNotificationPreferences}
            />
          </>
        ) : null
      default:
        return null
    }
  }

  // Mobile Layout - Master/Detail pattern
  if (isMobile) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 shrink-0">
            {mobileSelectedTab ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setMobileSelectedTab(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-lg font-bold">{selectedTabItem?.label}</h1>
                  <p className="text-xs text-muted-foreground">{selectedTabItem?.description}</p>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-bold">Your Profile</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your account settings
                </p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto px-4 pb-4">
            {mobileSelectedTab ? (
              // Detail View - Show selected tab content
              <div className="border border-black dark:border-zinc-700 rounded-lg p-3">
                {renderTabContent(mobileSelectedTab)}
              </div>
            ) : (
              // Master View - Show list of tabs
              <div className="space-y-2">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setMobileSelectedTab(tab.key)}
                    className="w-full flex items-center justify-between p-4 border border-black dark:border-zinc-700 rounded-lg bg-card hover:bg-muted/50 transition-colors text-left"
                  >
                    <div>
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-sm text-muted-foreground">{tab.description}</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Desktop Layout - Side-by-side tabs
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold">Your Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings
            </p>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <Tabs defaultValue="personal" className="h-full flex flex-row gap-6">
            {/* Tab navigation - vertical sidebar */}
            <div className="shrink-0 w-56">
              <TabsList className="flex flex-col w-full h-auto gap-1 p-1 border border-black dark:border-zinc-700 rounded-lg bg-muted/50">
                <TabsTrigger
                  value="personal"
                  className="w-full justify-start data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-sm py-2 px-3"
                >
                  Personal Information
                </TabsTrigger>
                <TabsTrigger
                  value="password"
                  className="w-full justify-start data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-sm py-2 px-3"
                >
                  Password
                </TabsTrigger>
                {showNotificationSettings && (
                  <TabsTrigger
                    value="notifications"
                    className="w-full justify-start data-[state=active]:bg-brand data-[state=active]:text-brand-foreground text-sm py-2 px-3"
                  >
                    Notification Settings
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Tab content */}
            <div className="flex-1 min-w-0 min-h-0 overflow-auto">
              <div className="border border-black dark:border-zinc-700 rounded-lg p-4 w-fit">
                <TabsContent value="personal" className="mt-0 h-full">
                  {state.error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{state.error}</AlertDescription>
                    </Alert>
                  )}
                  {state.success && (
                    <Alert className="mb-4 border-green-500 text-green-700">
                      <AlertDescription>{state.success}</AlertDescription>
                    </Alert>
                  )}
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
                </TabsContent>

                <TabsContent value="password" className="mt-0 h-full">
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
                </TabsContent>

                {showNotificationSettings && (
                  <TabsContent value="notifications" className="mt-0 h-full">
                    {state.notificationSuccess && (
                      <Alert className="mb-4 border-green-500 text-green-700">
                        <AlertDescription>{state.notificationSuccess}</AlertDescription>
                      </Alert>
                    )}
                    {state.notificationError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{state.notificationError}</AlertDescription>
                      </Alert>
                    )}
                    <NotificationSettingsCard
                      preferences={state.notificationPreferences}
                      isLoading={state.isUpdatingNotifications}
                      onPreferencesChange={state.handleNotificationPreferencesChange}
                      onSave={state.handleSaveNotificationPreferences}
                    />
                  </TabsContent>
                )}
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
