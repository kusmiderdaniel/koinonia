'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react'
import { SingleCampusPicker } from '@/components/CampusPicker'
import { CampusBadge } from '@/components/CampusBadge'
import type { useLocationManager } from '../hooks'
import type { Location } from '../types'
import type { Campus } from '../actions'

interface LocationsTabProps {
  locations: Location[]
  campuses: Campus[]
  locationManager: ReturnType<typeof useLocationManager>
  setLocations: (locations: Location[]) => void
  setError: (error: string | null) => void
  setSuccess: (success: string | null) => void
}

export const LocationsTab = memo(function LocationsTab({
  locations,
  campuses,
  locationManager,
  setLocations,
  setError,
  setSuccess,
}: LocationsTabProps) {
  const t = useTranslations('settings.locations')
  const defaultCampus = campuses.find(c => c.is_default)

  return (
    <>
      <Card className="w-full md:min-w-[28rem]">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
            <div>
              <CardTitle className="text-lg md:text-xl">{t('title')}</CardTitle>
              <CardDescription className="text-sm">
                {t('description')}
              </CardDescription>
            </div>
            <Button onClick={() => locationManager.openLocationDialog(undefined, defaultCampus?.id)} className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white shrink-0 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              {t('addLocation')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          {locations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('empty.title')}</p>
              <p className="text-sm">{t('empty.description')}</p>
            </div>
          ) : (
            <div className="space-y-1.5 md:space-y-2">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-2 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-2"
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1 md:gap-2">
                        <span className="font-medium text-sm md:text-base truncate">{location.name}</span>
                        {location.campus && (
                          <CampusBadge name={location.campus.name} color={location.campus.color} size="sm" />
                        )}
                      </div>
                      {location.address && (
                        <div className="text-xs text-muted-foreground truncate hidden sm:block">{location.address}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 md:h-8 md:w-8"
                      onClick={() => locationManager.openLocationDialog(location)}
                    >
                      <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 md:h-8 md:w-8"
                      onClick={() => locationManager.openDeleteLocationDialog(location)}
                    >
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Location Dialog */}
      <AlertDialog
        open={locationManager.locationDialogOpen}
        onOpenChange={(open) => !open && locationManager.closeLocationDialog()}
      >
        <AlertDialogContent className="bg-white dark:bg-zinc-950 max-w-[90vw] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locationManager.editingLocation ? t('dialog.editTitle') : t('dialog.addTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locationManager.editingLocation
                ? t('dialog.editDescription')
                : t('dialog.addDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="locationName">{t('dialog.nameLabel')}</Label>
              <Input
                id="locationName"
                value={locationManager.locationName}
                onChange={(e) => locationManager.setLocationName(e.target.value)}
                placeholder={t('dialog.namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationAddress">{t('dialog.addressLabel')}</Label>
              <Input
                id="locationAddress"
                value={locationManager.locationAddress}
                onChange={(e) => locationManager.setLocationAddress(e.target.value)}
                placeholder={t('dialog.addressPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationNotes">{t('dialog.notesLabel')}</Label>
              <Input
                id="locationNotes"
                value={locationManager.locationNotes}
                onChange={(e) => locationManager.setLocationNotes(e.target.value)}
                placeholder={t('dialog.notesPlaceholder')}
              />
            </div>
            {campuses.length > 0 && (
              <div className="space-y-2">
                <Label>{t('dialog.campusLabel')}</Label>
                <SingleCampusPicker
                  campuses={campuses}
                  selectedCampusId={locationManager.locationCampusId}
                  onChange={locationManager.setLocationCampusId}
                  placeholder={t('dialog.campusPlaceholder')}
                />
              </div>
            )}
          </div>
          <AlertDialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
            <AlertDialogCancel disabled={locationManager.isSavingLocation} className="rounded-full !border !border-black dark:!border-white bg-white dark:bg-zinc-950 px-4 py-2">{t('dialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                locationManager.handleSaveLocation(locations, setLocations, setError, setSuccess)
              }
              disabled={locationManager.isSavingLocation || !locationManager.locationName.trim()}
              className="rounded-full !border !border-brand !bg-brand hover:!bg-brand/90 !text-white px-4 py-2 disabled:!opacity-50"
            >
              {locationManager.isSavingLocation
                ? t('dialog.saving')
                : locationManager.editingLocation
                  ? t('dialog.saveChanges')
                  : t('dialog.addButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Location Confirmation */}
      <AlertDialog
        open={locationManager.deleteLocationDialogOpen}
        onOpenChange={(open) => !open && locationManager.closeDeleteLocationDialog()}
      >
        <AlertDialogContent className="max-w-[90vw] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDialog.description', { name: locationManager.locationToDelete?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
            <AlertDialogCancel className="rounded-full !border !border-black dark:!border-white bg-white dark:bg-zinc-950 px-4 py-2">{t('deleteDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                locationManager.handleDeleteLocation(locations, setLocations, setError, setSuccess)
              }
              className="!rounded-full !bg-red-600 hover:!bg-red-700 !text-white !px-4 !py-2"
            >
              {t('deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})
