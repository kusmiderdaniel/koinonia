'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useJoinChurchPageState } from './useJoinChurchPageState'
import { JoinCodeStep } from './JoinCodeStep'
import { CampusStep } from './CampusStep'

export function JoinChurchPageClient() {
  const state = useJoinChurchPageState()

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <div className="absolute top-4 right-4">
        <Button variant="outline-pill" size="sm" onClick={state.handleSignOut}>
          Sign Out
        </Button>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {state.step === 'code'
              ? 'Join Your Church'
              : `Join ${state.churchInfo?.name}`}
          </CardTitle>
          <CardDescription>
            {state.step === 'code'
              ? 'Enter the 6-character join code from your church admin'
              : 'Complete your profile to join the church'}
          </CardDescription>
        </CardHeader>

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
      </Card>
    </div>
  )
}
