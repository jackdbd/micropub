import fs from 'node:fs/promises'

export const readJSON = async <V>(filepath: string) => {
  try {
    const json = await fs.readFile(filepath, { encoding: 'utf8' })
    return { value: JSON.parse(json) as V }
  } catch (err: any) {
    return { error: err as Error }
  }
}

export const writeJSON = async (filepath: string, data: any) => {
  try {
    await fs.writeFile(filepath, JSON.stringify(data), 'utf8')
    return { value: { message: `wrote ${filepath}` } }
  } catch (err: any) {
    return { error: err as Error }
  }
}

interface AppendJTIConfig {
  jti: string
  path: string
}

export const appendJTI = async (cfg: AppendJTIConfig) => {
  try {
    const json = await fs.readFile(cfg.path, 'utf8')
    const arr = JSON.parse(json)
    arr.push(cfg.jti)
    await fs.writeFile(cfg.path, JSON.stringify(arr), 'utf8')
    return { value: { message: `persisted jti ${cfg.jti} to ${cfg.path}` } }
  } catch (err: any) {
    return { error: err as Error }
  }
}

interface CleanupConfig {
  blacklist_path: string
  issuelist_path: string
}

export const cleanup = async (config: CleanupConfig) => {
  const { blacklist_path, issuelist_path } = config

  try {
    await fs.rm(blacklist_path)
    await fs.rm(issuelist_path)
    return { value: { message: `cleanup complete` } }
  } catch (err: any) {
    return { error: err as Error }
  }
}

interface ResetConfig {
  blacklist: string[]
  blacklist_path: string
  issuelist: string[]
  issuelist_path: string
}

export const reset = async (config: ResetConfig) => {
  const { blacklist, blacklist_path, issuelist, issuelist_path } = config

  const { error: blacklist_error } = await writeJSON(blacklist_path, blacklist)

  if (blacklist_error) {
    return { error: blacklist_error }
  }

  let { error: issuelist_error } = await writeJSON(issuelist_path, issuelist)

  if (issuelist_error) {
    return { error: issuelist_error }
  }

  return { value: { message: `reset completed successfully` } }
}
