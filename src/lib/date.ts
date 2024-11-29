import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc) // Extend Day.js with UTC support

// export const nowUTC = () => {
//   return new Date().toISOString()
// }

// export const nowUTCHuman = () => {
//   const now = new Date()
//   const year = now.getUTCFullYear()
//   const month = now.getUTCMonth() + 1
//   const day = now.getUTCDate()
//   const hours = now.getUTCHours()
//   const minutes = now.getUTCMinutes()
//   const seconds = now.getUTCSeconds()
//   return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`
// }

// UNIX timestamps are traditionally in seconds (non-leap seconds to be precise).
// https://en.wikipedia.org/wiki/Unix_time
// I always put a suffix to avoid any confusion.
export const unixTimestampInMs = (str?: string) => {
  const date = dayjs(str)
  return date.valueOf()
}

export const unixTimestampInSeconds = (str?: string) => {
  const date = dayjs(str)
  return date.unix()
}

export const iso8601 = (str?: string) => {
  const date = dayjs(str)
  return date.toISOString()
}

export const rfc3339 = (str?: string) => {
  const date = dayjs(str)
  return date.format('YYYY-MM-DDTHH:mm:ssZ')
}

// export const msToUTCString = (ms: number) => {
//   return new Date(ms).toUTCString()
// }

// export const secondsToUTCString = (s: number) => {
//   return new Date(s * 1000).toUTCString()
// }

export const msToUTCString = (ms: number): string => {
  return dayjs(ms).utc().format('ddd, DD MMM YYYY HH:mm:ss [GMT]')
}

export const secondsToUTCString = (s: number): string => {
  return dayjs(s * 1000)
    .utc()
    .format('ddd, DD MMM YYYY HH:mm:ss [GMT]')
}
