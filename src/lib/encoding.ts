export const utf8ToBase64 = (str: string) => {
  return Buffer.from(str, 'utf-8').toString('base64')
}

export const base64ToUtf8 = (str: string) => {
  return Buffer.from(str, 'base64').toString('utf-8')
}
