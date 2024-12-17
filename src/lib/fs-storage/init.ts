import fs from 'node:fs/promises'
import path from 'node:path'

export interface Config {
  dirpath: string
  filename: string
}

export const init = async (config: Config) => {
  const { dirpath, filename } = config
  const filepath = path.join(dirpath, filename)

  try {
    await fs.access(filepath)
  } catch {
    // console.log(`File ${filepath} does not exist. Creating it now...`)
    await fs.writeFile(filepath, JSON.stringify({}), 'utf8')
  }

  return filepath
}
