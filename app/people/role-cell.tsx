'use client'

interface RoleCellProps {
  value: string
  onSave: (value: string) => Promise<void>
}

export function RoleCell({ value, onSave }: RoleCellProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-700'
      case 'admin':
        return 'bg-blue-100 text-blue-700'
      case 'leader':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await onSave(e.target.value)
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      className={`rounded-full px-3 text-xs font-semibold ${getRoleBadgeColor(
        value
      )} cursor-pointer hover:opacity-80`}
      style={{ height: '28px', padding: '4px 12px' }}
    >
      <option value="member">Member</option>
      <option value="leader">Leader</option>
      <option value="admin">Admin</option>
      <option value="owner">Owner</option>
    </select>
  )
}
