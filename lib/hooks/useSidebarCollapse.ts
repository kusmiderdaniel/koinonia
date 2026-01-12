'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect, useState } from 'react'

interface SidebarCollapseStore {
  isCollapsed: boolean
  toggle: () => void
  setCollapsed: (collapsed: boolean) => void
}

const useSidebarCollapseStore = create<SidebarCollapseStore>()(
  persist(
    (set) => ({
      isCollapsed: true, // Default to collapsed
      toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
    }),
    {
      name: 'sidebar-collapse',
    }
  )
)

// Wrapper hook that handles hydration properly
export function useSidebarCollapse() {
  const store = useSidebarCollapseStore()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydration guard pattern
    setIsHydrated(true)
  }, [])

  return {
    // During SSR and initial hydration, use default (collapsed)
    // After hydration, use the persisted value
    isCollapsed: isHydrated ? store.isCollapsed : true,
    toggle: store.toggle,
    setCollapsed: store.setCollapsed,
  }
}
