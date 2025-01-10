export const recordIdentifier = (record: Record<string, any>) => {
  if (record.rowid) {
    return { key: 'rowid', value: record.rowid }
  }
  if (record.id) {
    return { key: 'id', value: record.id }
  }
  if (record.jti) {
    return { key: 'jti', value: record.jti }
  }
  if (record.me) {
    return { key: 'me', value: record.me }
  }
  return { key: 'default', value: 'without identifier' }
}
