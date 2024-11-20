import { mf2tojf2referenced } from '@paulrobertlloyd/mf2tojf2'
import type { Mf2 } from '@paulrobertlloyd/mf2tojf2'

export const jf2FromMf2 = async (mf2: Mf2) => {
  //   const jf2 = mf2tojf2(mf2)
  try {
    const jf2_with_references = await mf2tojf2referenced(mf2)
    // console.log('=== mf2 => jf2 conversion ===', {
    //   mf2,
    //   jf2,
    //   jf2_with_references
    // })
    return { value: jf2_with_references }
  } catch (err) {
    return { error: err as Error }
  }
}
