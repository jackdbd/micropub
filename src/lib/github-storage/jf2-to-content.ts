import { jf2ToContentWithFrontmatter } from '@jackdbd/micropub'
import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'
import { utf8ToBase64 } from '../encoding.js'

/**
 * The GitHub Contents API requires content to be Base64-encoded.
 */
export const jf2ToContent = (jf2: Jf2) => {
  const content = jf2ToContentWithFrontmatter(jf2)
  return utf8ToBase64(content)
}
