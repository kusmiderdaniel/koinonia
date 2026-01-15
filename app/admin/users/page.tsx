import { getUsers, getUsersGrowthData } from './actions'
import { UsersClient } from './UsersClient'

export default async function UsersPage() {
  const [{ data: users, error }, { data: growthData }] = await Promise.all([
    getUsers(),
    getUsersGrowthData(),
  ])

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <UsersClient
      initialUsers={users || []}
      growthData={growthData || []}
    />
  )
}
