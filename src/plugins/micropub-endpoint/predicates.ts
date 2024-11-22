export const isLocalRequest = (src: string, dest: string) => {
  return new URL(src).origin === new URL(dest).origin
}
