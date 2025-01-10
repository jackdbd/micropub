import { unixTimestampInSeconds } from './date.js'

export const isExpired = (
  exp: number,
  now: number = unixTimestampInSeconds()
) => {
  return now > exp
}
