import { getChurches } from './actions'
import { ChurchesClient } from './ChurchesClient'

export default async function ChurchesPage() {
  const { data: churches, error } = await getChurches()

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return <ChurchesClient initialChurches={churches || []} />
}
