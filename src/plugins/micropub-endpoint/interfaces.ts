export interface UpdatePatch {
  action: 'delete' | 'add' | 'replace'
  delete?: string
  add?: Record<string, any>
  replace?: Record<string, any>
}
