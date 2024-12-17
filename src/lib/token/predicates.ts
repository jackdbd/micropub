import { unixTimestampInSeconds } from '../date.js'

export const isExpired = (exp: number) => {
  return exp - unixTimestampInSeconds() < 0 ? true : false
}
