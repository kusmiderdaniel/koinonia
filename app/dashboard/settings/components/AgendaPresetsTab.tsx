'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Plus, MoreVertical, Pencil, Trash2, ListChecks } from 'lucide-react'
import { toast } from 'sonner'
import { deleteAgendaPreset } from '../agenda-presets/actions'
import { AgendaPresetDialog } from '../agenda-presets/AgendaPresetDialog'
import { formatDuration } from '@/lib/utils/format'

interface Ministry {
  id: string
  name: string
  color: string
}

interface Preset {
  id: string
  title: string
  description: string | null
  duration_seconds: number
  ministry_id: string | null
  ministry: Ministry | null
}

interface AgendaPresetsTabProps {
  presets: Preset[]
  ministries: Ministry[]
  setPresets: React.Dispatch<React.SetStateAction<Preset[]>>
  setError: (error: string | null) => void
  setSuccess: (success: string | null) => void
}

export function AgendaPresetsTab({
  presets,
  ministries,
  setPresets,
  setError,
  setSuccess,
}: AgendaPresetsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [presetToDelete, setPresetToDelete] = useState<Preset | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleAddPreset = () => {
    setEditingPreset(null)
    setDialogOpen(true)
  }

  const handleEditPreset = (preset: Preset) => {
    setEditingPreset(preset)
    setDialogOpen(true)
  }

  const handleDeleteClick = (preset: Preset) => {
    setPresetToDelete(preset)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!presetToDelete) return

    setIsDeleting(true)
    const result = await deleteAgendaPreset(presetToDelete.id)
    setIsDeleting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Agenda item deleted')
      setPresets(presets.filter(p => p.id !== presetToDelete.id))
    }

    setDeleteDialogOpen(false)
    setPresetToDelete(null)
  }

  const handleSuccess = (preset: Preset, isNew: boolean) => {
    if (isNew) {
      setPresets([...presets, preset].sort((a, b) => a.title.localeCompare(b.title)))
    } else {
      setPresets(presets.map(p => p.id === preset.id ? preset : p))
    }
    setDialogOpen(false)
    setEditingPreset(null)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Agenda Items</CardTitle>
            <CardDescription>
              Reusable agenda items for your events and templates. Items are automatically added here when you create new agenda items.
            </CardDescription>
          </div>
          <Button onClick={handleAddPreset} className="rounded-full bg-brand hover:bg-brand/90 text-brand-foreground border border-black/20 dark:border-white/20">
            <Plus className="w-4 h-4 mr-2" />
            Add Agenda Item
          </Button>
        </CardHeader>
        <CardContent>
          {presets.length === 0 ? (
            <div className="text-center py-12">
              <ListChecks className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No agenda items yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Agenda items are created automatically when you add them to events or templates.
                You can also create them manually here.
              </p>
              <Button onClick={handleAddPreset} className="rounded-full bg-brand hover:bg-brand/90 text-brand-foreground border border-black/20 dark:border-white/20">
                <Plus className="w-4 h-4 mr-2" />
                Create your first agenda item
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Ministry</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {presets.map((preset) => (
                  <TableRow key={preset.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{preset.title}</div>
                        {preset.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {preset.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDuration(preset.duration_seconds)}</TableCell>
                    <TableCell>
                      {preset.ministry ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: preset.ministry.color }}
                          />
                          <span>{preset.ministry.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditPreset(preset)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(preset)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <AgendaPresetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        preset={editingPreset}
        ministries={ministries}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-zinc-950">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete agenda item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{presetToDelete?.title}&quot; from your agenda items library.
              Items already added to events or templates will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
