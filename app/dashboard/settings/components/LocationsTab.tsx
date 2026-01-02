'use client'

import { memo } from 'react'
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
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Locations</CardTitle>
              <CardDescription>
                Manage your church's venues and rooms for events
              </CardDescription>
            </div>
            <Button onClick={() => locationManager.openLocationDialog()} className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No locations yet</p>
              <p className="text-sm">Add your first location to use in events</p>
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{location.name}</span>
                        {location.campus && (
                          <CampusBadge name={location.campus.name} color={location.campus.color} size="sm" />
                        )}
                      </div>
                      {location.address && (
                        <div className="text-sm text-muted-foreground">{location.address}</div>
                      )}
                      {location.notes && (
                        <div className="text-xs text-muted-foreground mt-1">{location.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => locationManager.openLocationDialog(location)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => locationManager.openDeleteLocationDialog(location)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
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
        <AlertDialogContent className="bg-white dark:bg-zinc-950">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locationManager.editingLocation ? 'Edit Location' : 'Add Location'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locationManager.editingLocation
                ? 'Update the location details below.'
                : 'Add a new location for your events.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="locationName">Location Name *</Label>
              <Input
                id="locationName"
                value={locationManager.locationName}
                onChange={(e) => locationManager.setLocationName(e.target.value)}
                placeholder="e.g., Main Sanctuary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationAddress">Address</Label>
              <Input
                id="locationAddress"
                value={locationManager.locationAddress}
                onChange={(e) => locationManager.setLocationAddress(e.target.value)}
                placeholder="e.g., 123 Church Street"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationNotes">Notes</Label>
              <Input
                id="locationNotes"
                value={locationManager.locationNotes}
                onChange={(e) => locationManager.setLocationNotes(e.target.value)}
                placeholder="e.g., Enter through side door"
              />
            </div>
            {campuses.length > 0 && (
              <div className="space-y-2">
                <Label>Campus</Label>
                <SingleCampusPicker
                  campuses={campuses}
                  selectedCampusId={locationManager.locationCampusId}
                  onChange={locationManager.setLocationCampusId}
                  placeholder="All campuses"
                />
              </div>
            )}
          </div>
          <AlertDialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
            <AlertDialogCancel disabled={locationManager.isSavingLocation} className="rounded-full border-input bg-white dark:bg-zinc-950 px-4 py-2">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                locationManager.handleSaveLocation(locations, setLocations, setError, setSuccess)
              }
              disabled={locationManager.isSavingLocation || !locationManager.locationName.trim()}
              className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white !px-4 !py-2 disabled:!opacity-50"
            >
              {locationManager.isSavingLocation
                ? 'Saving...'
                : locationManager.editingLocation
                  ? 'Save Changes'
                  : 'Add Location'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Location Confirmation */}
      <AlertDialog
        open={locationManager.deleteLocationDialogOpen}
        onOpenChange={(open) => !open && locationManager.closeDeleteLocationDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{locationManager.locationToDelete?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
            <AlertDialogCancel className="rounded-full border-input bg-white dark:bg-zinc-950 px-4 py-2">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                locationManager.handleDeleteLocation(locations, setLocations, setError, setSuccess)
              }
              className="!rounded-full !bg-red-600 hover:!bg-red-700 !text-white !px-4 !py-2"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})
