'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, MapPin, User } from 'lucide-react'
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
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Campus Selection */}
      {campuses.length > 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold">Select Your Campus</h3>
          </div>

          <RadioGroup
            value={selectedCampusId || ''}
            onValueChange={onSelectedCampusIdChange}
            className="space-y-2"
          >
            {campuses.map((campus) => (
              <div
                key={campus.id}
                className="flex items-center space-x-3 rounded-xl border-2 p-4 cursor-pointer hover:bg-muted/50 transition-colors data-[state=checked]:border-brand"
                onClick={() => onSelectedCampusIdChange(campus.id)}
                data-state={selectedCampusId === campus.id ? 'checked' : 'unchecked'}
              >
                <RadioGroupItem value={campus.id} id={campus.id} />
                <Label
                  htmlFor={campus.id}
                  className="flex-1 cursor-pointer flex items-center gap-3"
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: campus.color }}
                  />
                  <div>
                    <span className="font-medium">{campus.name}</span>
                    {campus.is_default && (
                      <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Main Campus
                      </span>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* Profile Information */}
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-2 border-b">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold">Your Information <span className="font-normal text-muted-foreground text-sm">(Optional)</span></h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              className="h-11"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                className="h-11"
                value={dateOfBirth}
                onChange={(e) => onDateOfBirthChange(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex">Gender</Label>
              <Select value={sex} onValueChange={onSexChange}>
                <SelectTrigger className="h-11 bg-white dark:bg-zinc-950">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-950">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="sm:flex-1 h-14 text-base !rounded-full !border-2 !border-black dark:!border-white gap-2 order-2 sm:order-1"
          onClick={onBack}
          disabled={isLoading}
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Button>
        <Button
          type="button"
          size="lg"
          className="sm:flex-1 h-14 text-base !rounded-full !bg-brand hover:!bg-brand/90 text-white order-1 sm:order-2"
          disabled={isLoading || (campuses.length > 1 && !selectedCampusId)}
          onClick={onSubmit}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Joining...
            </>
          ) : (
            'Join Church'
          )}
        </Button>
      </div>
    </div>
  )
}
