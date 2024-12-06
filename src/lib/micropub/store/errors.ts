export const errorIfMethodNotImplementedInStore = (
  store: any,
  method: string
) => {
  if (!store || !store[method]) {
    const code = 501
    const body = {
      error: 'Not Implemented',
      error_description: `provided store does not implement '${method}'.`
    }
    return { code, body }
  }
}
