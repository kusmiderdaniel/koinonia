import type { Ministry } from '../types'

export type { Ministry }

export interface MinistriesInitialData {
  ministries: Ministry[]
  role: string
}

export interface MinistriesPageClientProps {
  initialData: MinistriesInitialData
}
