import fs from 'node:fs/promises'
import * as lockfile from 'proper-lockfile'

const lock_options = { retries: 15 }

export const readJSON = async <V>(filepath: string) => {
  try {
    const json = await fs.readFile(filepath, { encoding: 'utf8' })
    return { value: JSON.parse(json) as V }
  } catch (err: any) {
    return { error: err as Error }
  }
}

export const writeJSON = async (filepath: string, data: any) => {
  let release: (() => Promise<void>) | undefined
  try {
    release = await lockfile.lock(filepath, lock_options)
    // console.log(`=== 🔒 acquired lock on ${filepath} ===`)
    await fs.writeFile(filepath, JSON.stringify(data), 'utf8')
    return { value: { message: `wrote ${filepath}` } }
  } catch (err: any) {
    return { error: err as Error }
  } finally {
    if (release) {
      // console.log(`=== 🔓 release lock on ${filepath} ===`)
      await release()
    }
  }
}
