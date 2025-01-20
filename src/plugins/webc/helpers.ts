/**
 * @file [Helper Functions](https://github.com/11ty/webc?tab=readme-ov-file#helper-functions) to attach to a WebC instance.
 */

export const tap = (value: any, label = '') => {
  const s = label ? `TAP [${label}]` : 'TAP'
  console.log(`=== ${s} ===`, value)
  return value
}
