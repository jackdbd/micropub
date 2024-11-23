export type ActionType = 'delete' | 'undelete' | 'update' | 'create'

export interface UpdatePatch {
  delete?: string
  add?: Record<string, any>
  replace?: Record<string, any>
}
