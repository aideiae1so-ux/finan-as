import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ContextType = 'PERSONAL' | 'CONDOMINIUM' | null

interface AppContextState {
  contextType: ContextType
  contextId: string | null
  condominiumId: string | null
  setContext: (type: ContextType, contextId: string | null, condominiumId?: string | null) => void
  clearContext: () => void
}

export const useContextStore = create<AppContextState>()(
  persist(
    (set) => ({
      contextType: null,
      contextId: null,
      condominiumId: null,
      setContext: (type, contextId, condominiumId = null) => 
        set({ contextType: type, contextId, condominiumId }),
      clearContext: () => set({ contextType: null, contextId: null, condominiumId: null }),
    }),
    {
      name: 'finance-app-context',
    }
  )
)
