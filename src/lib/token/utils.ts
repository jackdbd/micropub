import { unixTimestampInSeconds } from '../date.js'

interface ExpiredConfig {
  exp: number
}

export const isExpired = ({ exp }: ExpiredConfig) => {
  return exp - unixTimestampInSeconds() < 0 ? true : false
}
