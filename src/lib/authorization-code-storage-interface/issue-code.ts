import type { AddToIssuedCodes, IssueCode } from './schemas.js'

export interface Config {
  /**
   * The function that performs the effect of persisting the authorization code
   * to some storage (e.g. storing it in a database).
   */
  addToIssuedCodes: AddToIssuedCodes
}

export const defIssueCode = (config: Config) => {
  const { addToIssuedCodes } = config

  const issueCode: IssueCode = async ({ code, exp }) => {
    const { error } = await addToIssuedCodes({ code, exp })

    if (error) {
      return { error }
    }

    return {
      value: {
        message: `Authorization code added to the issue table`
      }
    }
  }

  return issueCode
}
