import { getUsers } from './actions'
import { UsersClient } from './UsersClient'

export default async function UsersPage() {
  const { data: users, error } = await getUsers()

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return <UsersClient initialUsers={users || []} />
}
