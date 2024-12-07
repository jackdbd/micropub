import type { Atom } from '@thi.ng/atom'
import type { MarkTokenAsRevoked } from '../schemas/index.js'
import type { IssueTable } from '../token-storage-interface/index.js'

interface Config {
  atom: Atom<IssueTable>
}

export const defMarkTokenAsRevoked = (config: Config) => {
  const { atom } = config

  const markTokenAsRevoked: MarkTokenAsRevoked = async (jti, options) => {
    const opt = options || {}

    const record = atom.deref()[jti]

    // The specs say:
    // The authorization server responds with HTTP status code 200 if the token
    // has been revoked successfully or if the client submitted an invalid token.
    // https://datatracker.ietf.org/doc/html/rfc7009#section-2.2
    // I guess a non-existent token counts as invalid.
    if (!record) {
      return {
        value: {
          message: `among issued tokens there isn't one that has jti ${jti}`
        }
      }
    }

    atom.swap((state) => {
      return {
        ...state,
        [jti]: {
          ...record,
          revoked: true,
          revocation_reason: opt.revocation_reason
        }
      }
    })

    return { value: { message: `token ${jti} is revoked` } }
  }

  return markTokenAsRevoked
}
