import type { ModelRecord } from '@neevjs/client'

export interface User extends ModelRecord {
  id: number
  name: string
  email: string
  role: string
}
