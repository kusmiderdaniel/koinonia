'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import { createOfflineMember } from './actions'

interface OfflineMemberDialogProps {
  trigger?: React.ReactNode
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

export function OfflineMemberDialog({ trigger, weekStartsOn = 0 }: OfflineMemberDialogProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    sex: '',
  })

  // Prevent hydration mismatch from Radix UI random IDs
  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First name and last name are required')
      return
    }

    setLoading(true)
    const result = await createOfflineMember({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      dateOfBirth: formData.dateOfBirth || null,
      sex: formData.sex || null,
    })
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${formData.firstName} ${formData.lastName} has been added`)
      setOpen(false)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        sex: '',
      })
      router.refresh()
    }
  }

  // Show placeholder button until mounted to prevent hydration mismatch
  if (!mounted) {
    return trigger || (
      <Button variant="outline" className="!border !border-black dark:!border-white">
        <UserPlus className="h-4 w-4 mr-2" />
        Add Offline Member
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="!border !border-black dark:!border-white">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Offline Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Offline Member</DialogTitle>
            <DialogDescription>
              Add a church member who doesn&apos;t have an account (e.g., children). They can be linked to an account later if they sign up.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <DatePicker
                  id="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(value) => setFormData({ ...formData, dateOfBirth: value })}
                  placeholder="Select date"
                  disabled={loading}
                  weekStartsOn={weekStartsOn}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">Gender</Label>
                <Select
                  value={formData.sex}
                  onValueChange={(value) => setFormData({ ...formData, sex: value })}
                >
                  <SelectTrigger id="sex" className="w-full">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="!border !border-black dark:!border-white" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="!bg-brand hover:!bg-brand/90 !text-white !border !border-brand">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
