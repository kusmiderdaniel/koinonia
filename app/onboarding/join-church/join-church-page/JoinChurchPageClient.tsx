'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useJoinChurchPageState } from './useJoinChurchPageState'
import { JoinCodeStep } from './JoinCodeStep'
import { CampusStep } from './CampusStep'
import { Users, LogOut, CheckCircle2 } from 'lucide-react'

export function JoinChurchPageClient() {
  const state = useJoinChurchPageState()

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-blue-500/5 via-background to-background">
      {/* Header */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-2"
          onClick={state.handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4 py-16 sm:px-6">
        <div className="w-full max-w-md space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 mb-2">
              {state.step === 'code' ? (
                <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {state.step === 'code'
                ? 'Join Your Church'
                : `Join ${state.churchInfo?.name}`}
            </h1>
            <p className="text-muted-foreground text-lg max-w-sm mx-auto">
              {state.step === 'code'
                ? 'Enter the 6-character join code from your church admin'
                : 'Complete your profile to join the church'}
            </p>
          </div>

          {/* Form Card */}
          <Card className="border-2">
            <CardContent className="p-6 sm:p-8">
              {state.step === 'code' ? (
                <JoinCodeStep
                  form={state.form}
                  error={state.error}
                  isLoading={state.isLoading}
                  joinCodeValue={state.joinCodeValue}
                  onJoinCodeChange={state.handleJoinCodeChange}
                  onSubmit={state.onSubmitCode}
                />
              ) : (
                <CampusStep
                  error={state.error}
                  isLoading={state.isLoading}
                  campuses={state.campuses}
                  selectedCampusId={state.selectedCampusId}
                  onSelectedCampusIdChange={state.setSelectedCampusId}
                  phone={state.phone}
                  onPhoneChange={state.setPhone}
                  dateOfBirth={state.dateOfBirth}
                  onDateOfBirthChange={state.setDateOfBirth}
                  sex={state.sex}
                  onSexChange={state.setSex}
                  onBack={state.handleBack}
                  onSubmit={state.onSubmitCampus}
                />
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground">
            Need help? Contact us at{' '}
            <a href="mailto:support@koinonia.app" className="text-brand hover:underline">
              support@koinonia.app
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
