'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Building2, Plus, Pencil, Trash2, Star } from 'lucide-react'
import type { useCampusManager } from '../hooks'
import type { Campus } from '../actions'

// Predefined color options for campuses
const CAMPUS_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
]

interface CampusesTabProps {
  campuses: Campus[]
  campusManager: ReturnType<typeof useCampusManager>
  setCampuses: (campuses: Campus[]) => void
  setError: (error: string | null) => void
  setSuccess: (success: string | null) => void
}

export const CampusesTab = memo(function CampusesTab({
  campuses,
  campusManager,
  setCampuses,
  setError,
  setSuccess,
}: CampusesTabProps) {
  return (
    <>
      <Card className="min-w-[28rem]">
        <CardHeader>
          <div className="flex items-center justify-between gap-6">
            <div>
              <CardTitle>Campuses</CardTitle>
              <CardDescription>
                Manage your church&apos;s campus locations for multi-site operations
              </CardDescription>
            </div>
            <Button onClick={() => campusManager.openCampusDialog()} className="!rounded-full !bg-brand hover:!bg-brand/90 !text-white shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Add Campus
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {campuses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No campuses yet</p>
              <p className="text-sm">Add your first campus to organize your church locations</p>
            </div>
          ) : (
            <div className="space-y-2">
              {campuses.map((campus) => (
                <div
                  key={campus.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full mt-0.5 flex-shrink-0"
                      style={{ backgroundColor: campus.color }}
                    />
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{campus.name}</span>
                      {campus.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!campus.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          campusManager.handleSetDefault(campus.id, setCampuses, setError, setSuccess)
                        }
                        className="text-xs"
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => campusManager.openCampusDialog(campus)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => campusManager.openDeleteCampusDialog(campus)}
                      disabled={campus.is_default || campuses.length <= 1}
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

      {/* Add/Edit Campus Dialog */}
      <AlertDialog
        open={campusManager.campusDialogOpen}
        onOpenChange={(open) => !open && campusManager.closeCampusDialog()}
      >
        <AlertDialogContent className="bg-white dark:bg-zinc-950 max-w-lg overflow-hidden">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {campusManager.editingCampus ? 'Edit Campus' : 'Add Campus'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {campusManager.editingCampus
                ? 'Update the campus details below.'
                : 'Add a new campus for your church.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto overflow-x-hidden">
            {/* Campus Name */}
            <div className="space-y-2">
              <Label htmlFor="campusName">Campus Name *</Label>
              <Input
                id="campusName"
                value={campusManager.campusName}
                onChange={(e) => campusManager.setCampusName(e.target.value)}
                placeholder="e.g., Main Campus"
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Campus Color</Label>
              <div className="flex flex-wrap gap-2 justify-center">
                {CAMPUS_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-all ${
                      campusManager.campusColor === color
                        ? 'ring-2 ring-offset-2 ring-black dark:ring-white'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => campusManager.setCampusColor(color)}
                  />
                ))}
              </div>
            </div>

            {/* Is Default - only show when editing a non-default campus */}
            {campusManager.editingCampus && !campusManager.editingCampus.is_default && (
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="campusIsDefault" className="text-base">Set as Default Campus</Label>
                  <p className="text-sm text-muted-foreground">
                    New members will be assigned to this campus by default
                  </p>
                </div>
                <Switch
                  id="campusIsDefault"
                  checked={campusManager.campusIsDefault}
                  onCheckedChange={campusManager.setCampusIsDefault}
                />
              </div>
            )}
          </div>
          <AlertDialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
            <AlertDialogCancel disabled={campusManager.isSavingCampus} className="rounded-full !border !border-black dark:!border-white bg-white dark:bg-zinc-950 px-4 py-2">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                campusManager.handleSaveCampus(campuses, setCampuses, setError, setSuccess)
              }
              disabled={campusManager.isSavingCampus || !campusManager.campusName.trim()}
              className="rounded-full !border !border-brand !bg-brand hover:!bg-brand/90 !text-white px-4 py-2 disabled:!opacity-50"
            >
              {campusManager.isSavingCampus
                ? 'Saving...'
                : campusManager.editingCampus
                  ? 'Save Changes'
                  : 'Add Campus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Campus Confirmation */}
      <AlertDialog
        open={campusManager.deleteCampusDialogOpen}
        onOpenChange={(open) => !open && campusManager.closeDeleteCampusDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campus?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{campusManager.campusToDelete?.name}&quot;?
              Members and events assigned to this campus will need to be reassigned.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="!bg-transparent !border-0 flex justify-end gap-3 pt-4">
            <AlertDialogCancel className="rounded-full !border !border-black dark:!border-white bg-white dark:bg-zinc-950 px-4 py-2">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                campusManager.handleDeleteCampus(campuses, setCampuses, setError, setSuccess)
              }
              className="rounded-full !border !border-red-600 !bg-red-600 hover:!bg-red-700 !text-white px-4 py-2"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})
