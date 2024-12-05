import { unixTimestampInSeconds } from '../date.js'

interface ExpiredConfig {
  exp: number
}

export const isExpired = ({ exp }: ExpiredConfig) => {
  return exp - unixTimestampInSeconds() < 0 ? true : false
}

export interface BlacklistedConfig {
  jwt: string
}

// TODO: this should be implemented in a token store, not here.
export const isBlacklisted = async (_config: BlacklistedConfig) => {
  // TODO: implement this
  // const blacklisted = await Promise.resolve(true)
  const blacklisted = await Promise.resolve(false)

  return blacklisted
}
