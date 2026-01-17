'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  PEOPLE_COLUMNS,
  getAllColumns,
  isCustomFieldColumn,
  getFieldIdFromColumnKey,
  type PeopleColumnKey,
  type PeopleColumn,
} from './columns'
import type { CustomFieldDefinition } from '@/types/custom-fields'
import type { Member } from './types'

interface ExportDialogProps {
  members: Member[]
  customFields: CustomFieldDefinition[]
}

// CSV export columns - includes some columns that aren't in the table
type ExportColumnKey = PeopleColumnKey | 'first_name' | 'last_name'

interface ExportColumn {
  key: ExportColumnKey
  label: string
  getValue: (member: Member, customFields: CustomFieldDefinition[]) => string
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function ExportDialog({ members, customFields }: ExportDialogProps) {
  const t = useTranslations('people')
  const [open, setOpen] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)

  // Build export columns list
  const exportColumns = useMemo(() => {
    const columns: ExportColumn[] = [
      {
        key: 'first_name',
        label: t('export.firstName'),
        getValue: (m) => m.first_name || '',
      },
      {
        key: 'last_name',
        label: t('export.lastName'),
        getValue: (m) => m.last_name || '',
      },
      {
        key: 'email',
        label: t('tableHeader.email'),
        getValue: (m) => m.email || '',
      },
      {
        key: 'phone',
        label: t('tableHeader.phone'),
        getValue: (m) => m.phone || '',
      },
      {
        key: 'role',
        label: t('tableHeader.role'),
        getValue: (m) => m.role || '',
      },
      {
        key: 'active',
        label: t('tableHeader.active'),
        getValue: (m) => m.active ? t('export.yes') : t('export.no'),
      },
      {
        key: 'gender',
        label: t('tableHeader.gender'),
        getValue: (m) => m.sex ? t(`gender.${m.sex}`) : '',
      },
      {
        key: 'date_of_birth',
        label: t('tableHeader.dateOfBirth'),
        getValue: (m) => formatDate(m.date_of_birth),
      },
      {
        key: 'age',
        label: t('tableHeader.age'),
        getValue: (m) => {
          if (!m.date_of_birth) return ''
          const today = new Date()
          const birth = new Date(m.date_of_birth)
          let age = today.getFullYear() - birth.getFullYear()
          const monthDiff = today.getMonth() - birth.getMonth()
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
          }
          return age.toString()
        },
      },
      {
        key: 'campus',
        label: t('tableHeader.campus'),
        getValue: (m) => m.campuses?.map(c => c.name).join(', ') || '',
      },
      {
        key: 'ministry_roles',
        label: t('tableHeader.ministryRoles'),
        getValue: (m) => {
          if (!m.ministry_members) return ''
          return m.ministry_members.map(mm => {
            const ministry = Array.isArray(mm.ministry) ? mm.ministry[0] : mm.ministry
            const role = Array.isArray(mm.role) ? mm.role[0] : mm.role
            if (!ministry || !role) return ''
            return `${ministry.name}: ${role.name}`
          }).filter(Boolean).join(', ')
        },
      },
      {
        key: 'baptized',
        label: t('tableHeader.baptized'),
        getValue: (m) => m.baptism ? t('export.yes') : t('export.no'),
      },
      {
        key: 'baptism_date',
        label: t('tableHeader.baptismDate'),
        getValue: (m) => formatDate(m.baptism_date),
      },
      {
        key: 'departure_date',
        label: t('tableHeader.departureDate'),
        getValue: (m) => formatDate(m.date_of_departure),
      },
      {
        key: 'departure_reason',
        label: t('tableHeader.departureReason'),
        getValue: (m) => m.reason_for_departure ? t(`departureReasons.${m.reason_for_departure}`) : '',
      },
      {
        key: 'joined',
        label: t('tableHeader.joined'),
        getValue: (m) => formatDate(m.created_at),
      },
    ]

    // Add custom field columns
    for (const field of customFields) {
      columns.push({
        key: `cf_${field.id}` as ExportColumnKey,
        label: field.name,
        getValue: (m) => {
          const value = m.custom_field_values?.[field.id]
          if (value === null || value === undefined) return ''

          if (field.field_type === 'checkbox') {
            return value ? t('export.yes') : t('export.no')
          }
          if (field.field_type === 'date' && value) {
            return formatDate(value as string)
          }
          if (field.field_type === 'select' && value) {
            const option = field.options?.find(o => o.value === value)
            return option?.label || String(value)
          }
          if (field.field_type === 'multiselect' && Array.isArray(value)) {
            return value.map(v => {
              const option = field.options?.find(o => o.value === v)
              return option?.label || v
            }).join(', ')
          }
          return String(value)
        },
      })
    }

    return columns
  }, [t, customFields])

  // Initialize with default selected columns on open
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && selectedColumns.size === 0) {
      // Default: select common columns
      setSelectedColumns(new Set(['first_name', 'last_name', 'email', 'phone']))
    }
    setOpen(isOpen)
  }

  const toggleColumn = (key: string) => {
    setSelectedColumns(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedColumns(new Set(exportColumns.map(c => c.key)))
  }

  const selectNone = () => {
    setSelectedColumns(new Set())
  }

  const handleExport = () => {
    setIsExporting(true)

    try {
      // Get selected columns in order
      const columnsToExport = exportColumns.filter(c => selectedColumns.has(c.key))

      // Build CSV header
      const header = columnsToExport.map(c => escapeCSV(c.label)).join(',')

      // Build CSV rows
      const rows = members.map(member => {
        return columnsToExport.map(col => escapeCSV(col.getValue(member, customFields))).join(',')
      })

      // Combine into CSV content
      const csvContent = [header, ...rows].join('\n')

      // Create blob and download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }) // BOM for Excel
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `members_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setOpen(false)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 !border !border-black/20 dark:!border-white/20">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">{t('export.button')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full !max-w-[420px] !border !border-black dark:!border-white">
        <DialogHeader>
          <DialogTitle>{t('export.title')}</DialogTitle>
          <DialogDescription>{t('export.description')}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="!border !border-black/20 dark:!border-white/20" onClick={selectAll}>
            {t('export.selectAll')}
          </Button>
          <Button variant="outline" size="sm" className="!border !border-black/20 dark:!border-white/20" onClick={selectNone}>
            {t('export.selectNone')}
          </Button>
        </div>

        <div
          className="h-[300px] border border-black/20 dark:border-white/20 rounded-lg p-3 overflow-y-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0,0,0,0.3) transparent',
          }}
        >
          <div className="space-y-3 pr-2">
            {exportColumns.map(column => (
              <div key={column.key} className="flex items-center space-x-3">
                <Checkbox
                  id={`export-${column.key}`}
                  checked={selectedColumns.has(column.key)}
                  onCheckedChange={() => toggleColumn(column.key)}
                />
                <Label
                  htmlFor={`export-${column.key}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {column.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="!justify-between">
          <span className="text-sm text-muted-foreground">
            {selectedColumns.size} {t('export.selected')}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" className="rounded-full" onClick={() => setOpen(false)}>
              {t('export.cancel')}
            </Button>
            <Button
              onClick={handleExport}
              disabled={selectedColumns.size === 0 || isExporting}
              className="!bg-brand hover:!bg-brand/90 !text-white dark:!text-black"
            >
              {isExporting ? t('export.exporting') : t('export.exportButton')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
