'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft } from 'lucide-react'
import type { CampusInfo } from './types'

interface CampusStepProps {
  error: string | null
  isLoading: boolean
  campuses: CampusInfo[]
  selectedCampusId: string | null
  onSelectedCampusIdChange: (id: string) => void
  phone: string
  onPhoneChange: (value: string) => void
  dateOfBirth: string
  onDateOfBirthChange: (value: string) => void
  sex: 'male' | 'female' | '' | undefined
  onSexChange: (value: 'male' | 'female') => void
  onBack: () => void
  onSubmit: () => void
}

export function CampusStep({
  error,
  isLoading,
  campuses,
  selectedCampusId,
  onSelectedCampusIdChange,
  phone,
  onPhoneChange,
  dateOfBirth,
  onDateOfBirthChange,
  sex,
  onSexChange,
  onBack,
  onSubmit,
}: CampusStepProps) {
  return (
    <CardContent className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Campus Selection */}
      {campuses.length > 1 && (
        <div className="space-y-3">
          <Label>Select your campus</Label>
          <RadioGroup
            value={selectedCampusId || ''}
            onValueChange={onSelectedCampusIdChange}
            className="space-y-2"
          >
            {campuses.map((campus) => (
              <div
                key={campus.id}
                className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onSelectedCampusIdChange(campus.id)}
              >
                <RadioGroupItem value={campus.id} id={campus.id} />
                <Label
                  htmlFor={campus.id}
                  className="flex-1 cursor-pointer flex items-center gap-2"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: campus.color }}
                  />
                  <span className="font-medium">{campus.name}</span>
                  {campus.is_default && (
                    <span className="text-xs text-muted-foreground">
                      (Main)
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* Profile Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => onDateOfBirthChange(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sex">Sex</Label>
          <Select value={sex} onValueChange={onSexChange}>
            <SelectTrigger className="bg-white dark:bg-zinc-950">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-950">
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline-pill"
          className="flex-1"
          onClick={onBack}
          disabled={isLoading}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <Button
          type="button"
          className="flex-1 !rounded-full !bg-brand hover:!bg-brand/90 text-white"
          disabled={isLoading || (campuses.length > 1 && !selectedCampusId)}
          onClick={onSubmit}
        >
          {isLoading ? 'Joining...' : 'Join Church'}
        </Button>
      </div>
    </CardContent>
  )
}
