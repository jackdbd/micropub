export const nowUTC = () => {
  return new Date().toISOString()
}

export const nowUTCHuman = () => {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1
  const day = now.getUTCDate()
  const hours = now.getUTCHours()
  const minutes = now.getUTCMinutes()
  const seconds = now.getUTCSeconds()
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`
}

// By definition, the Unix timestamp is the number of milliseconds since
// January 1, 1970, 00:00:00 UTC.
export const unixTimestamp = () => {
  return Math.floor(new Date().getTime() / 1000)
}

export const unixTimestampInSeconds = () => {
  return new Date().getTime()
}

export const msToUTCString = (ms: number) => {
  return new Date(ms).toUTCString()
}
