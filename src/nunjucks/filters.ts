export const tap = (value: any, label = '') => {
  const s = label ? `TAP [${label}]` : 'TAP'
  console.log(`=== ${s} ===`, value)
  return value
}
