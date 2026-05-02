import React, { createContext, useContext } from 'react'
import type { NeevClientInterface } from '@neevjs/shared'

export const NeevContext = createContext<NeevClientInterface | null>(null)

export interface NeevProviderProps {
  client: NeevClientInterface
  children: React.ReactNode
}

export function NeevProvider({ client, children }: NeevProviderProps): React.ReactElement {
  return (
    <NeevContext.Provider value={client}>
      {children}
    </NeevContext.Provider>
  )
}

export function useNeevClient(): NeevClientInterface {
  const client = useContext(NeevContext)
  if (!client) {
    throw new Error(
      '[NeevJS] useNeevClient must be used inside <NeevProvider>. ' +
      'Make sure you have wrapped your app with <NeevProvider client={client}>.'
    )
  }
  return client
}
