'use client'

import { create } from 'zustand'
import { ReactNode } from 'react'

interface MobileHeaderContentStore {
  content: ReactNode | null
  setContent: (content: ReactNode | null) => void
  clear: () => void
}

export const useMobileHeaderContent = create<MobileHeaderContentStore>((set) => ({
  content: null,
  setContent: (content) => set({ content }),
  clear: () => set({ content: null }),
}))
