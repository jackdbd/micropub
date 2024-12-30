import type { Atom } from '@thi.ng/atom'
import type { RevokeAllTokens } from '../schemas/index.js'
import type { AccessTokenTable } from '../token-storage-interface/index.js'

interface Config {
  atom: Atom<AccessTokenTable>
}

export const defRevokeAllTokens = (config: Config) => {
  const { atom } = config

  const revokeAllTokens: RevokeAllTokens = async (options) => {
    const opt = options ?? {}

    atom.swap((before) => {
      return Object.entries(before).reduce((table, [jti, record]) => {
        // Avoid revoking a token that has already been revoked. We want to keep
        // the original revocatioon reason, if present.
        const rec = record
        if (!record.revoked) {
          rec.revoked = true
          rec.revocation_reason = opt.revocation_reason
        }
        return { ...table, [jti]: rec }
      }, {} as AccessTokenTable)
    })

    return { value: { message: `All tokens revoked` } }
  }

  return revokeAllTokens
}
