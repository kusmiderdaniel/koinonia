'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { LoadingState } from '@/components/LoadingState'
import { useIsMobile } from '@/lib/hooks'
import { useProfilePageState } from './useProfilePageState'
import { PersonalInfoCard } from './PersonalInfoCard'
import { PasswordChangeCard } from './PasswordChangeCard'
import { NotificationSettingsCard } from './NotificationSettingsCard'
import { LanguageSettingsCard } from './LanguageSettingsCard'
import { isLeaderOrAbove } from '@/lib/permissions'

type TabKey = 'personal' | 'password' | 'notifications' | 'language'

interface TabItem {
  key: TabKey
  labelKey: string
  descriptionKey: string
  show: boolean
}

export function ProfilePageClient() {
  const t = useTranslations('profile')
  const state = useProfilePageState()
  const isMobile = useIsMobile()
  const showNotificationSettings = isLeaderOrAbove(state.userRole)
  const [mobileSelectedTab, setMobileSelectedTab] = useState<TabKey | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('personal')

  const tabItems: TabItem[] = [
    { key: 'personal', labelKey: 'tabs.personal', descriptionKey: 'tabDescriptions.personal', show: true },
    { key: 'password', labelKey: 'tabs.password', descriptionKey: 'tabDescriptions.password', show: true },
    { key: 'notifications', labelKey: 'tabs.notifications', descriptionKey: 'tabDescriptions.notifications', show: showNotificationSettings },
    { key: 'language', labelKey: 'tabs.language', descriptionKey: 'tabDescriptions.language', show: true },
  ]

  const visibleTabs = tabItems.filter(t => t.show)
  const selectedTabItem = visibleTabs.find(t => t.key === mobileSelectedTab)

  if (state.isLoadingData) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] md:h-screen items-center justify-center">
        <LoadingState message={t('loading')} />
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
      case 'language':
        return <LanguageSettingsCard currentLanguage={state.language} />
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
                  <h1 className="text-lg font-bold">{selectedTabItem ? t(selectedTabItem.labelKey) : ''}</h1>
                  <p className="text-xs text-muted-foreground">{selectedTabItem ? t(selectedTabItem.descriptionKey) : ''}</p>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-bold">{t('title')}</h1>
                <p className="text-sm text-muted-foreground">
                  {t('subtitle')}
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
                      <div className="font-medium">{t(tab.labelKey)}</div>
                      <div className="text-sm text-muted-foreground">{t(tab.descriptionKey)}</div>
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
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-row gap-6">
          {/* Tab navigation - vertical sidebar */}
          <div className="shrink-0 w-64">
            <div className="flex flex-col w-full gap-1 p-1 border border-black dark:border-zinc-700 rounded-lg bg-muted/50">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full text-left py-2.5 px-3 rounded-md transition-colors ${
                    activeTab === tab.key
                      ? 'bg-brand text-brand-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="font-medium text-sm">{t(tab.labelKey)}</div>
                  <div className={`text-xs ${activeTab === tab.key ? 'opacity-80' : 'text-muted-foreground'}`}>
                    {t(tab.descriptionKey)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 min-w-0 overflow-auto">
            <div className="border border-black dark:border-zinc-700 rounded-lg p-4">
              {activeTab === 'personal' && (
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
              )}

              {activeTab === 'password' && (
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
              )}

              {activeTab === 'notifications' && showNotificationSettings && (
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
              )}

              {activeTab === 'language' && (
                <LanguageSettingsCard currentLanguage={state.language} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
