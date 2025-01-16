import Ajv from 'ajv'
import type { preHandlerHookHandler } from 'fastify'
import { InvalidRequestError } from '../../lib/fastify-error-response/index.js'
import { micropub_get_request } from './routes/schemas.js'

// export interface ValidateAccessTokenConfig {
//   me: string
// }

export interface ValidateGetConfig {
  ajv: Ajv
}

export const defValidateGetRequest = (config: ValidateGetConfig) => {
  const { ajv } = config
  const validate = ajv.compile(micropub_get_request)

  const validateGetRequest: preHandlerHookHandler = (request, _reply, done) => {
    const valid = validate(request)

    if (!valid) {
      const errors = validate.errors || []
      const error_description = errors
        .map((error) => error.message || 'no error message')
        .join('; ')
      throw new InvalidRequestError({ error_description })
    }

    done()
  }

  return validateGetRequest
}

// export const defEnsureRequestHasScope = () => {
//   const ensureRequestHasScope: preHandlerHookHandler = (
//     request,
//     _reply,
//     done
//   ) => {
//     let action: Action = 'create'
//     if (request.body && (request.body as any).action) {
//       action = (request.body as any).action as Action
//     }

//     if (!hasScope(request, action)) {
//       const error_description = `Action '${action}' not allowed, since access token has no scope '${action}'.`
//       throw new InsufficientScopeError({ error_description })
//     }

//     return done()
//   }

//   return ensureRequestHasScope
// }
