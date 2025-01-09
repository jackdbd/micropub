import { Static, Type } from '@sinclair/typebox'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { client_id } from '../indieauth/index.js'
import { failure } from '../schemas/failure.js'
import { conformResult } from '../validators.js'
import { client_record, type ClientRecord } from './schemas.js'

const success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({ message: Type.Optional(Type.String({ minLength: 1 })) })
})

const register_client_result_promise = Type.Promise(
  Type.Union([failure, success])
)

const DESCRIPTION = `Function that stores the IndieAuth client metadata to some storage (e.g. a database).`

export const register_client_param = Type.Object({
  ...client_record.properties,
  client_id
})

export type RegisterClientParam = Static<typeof register_client_param>

const registerClient_ = Type.Function(
  [register_client_param],
  register_client_result_promise,
  { description: DESCRIPTION }
)

/**
 * Registers an IndieAuth client.
 *
 * This function persists the IndieAuth client metadata to some storage, for
 * example a database.
 *
 * @see [How IndieLogin registers clients in its database](https://github.com/aaronpk/indielogin.com/blob/main/app/Authenticate.php)
 */
export type RegisterClient = Static<typeof registerClient_>

export const registerClient = Type.Any({ description: DESCRIPTION })

export type GetRecord = (
  client_id: string
) => Promise<
  | { error: Error; value: undefined }
  | { error: undefined; value: ClientRecord | undefined }
>

export type SetRecord = (
  client_id: string,
  record: ClientRecord
) => Promise<{ error: Error } | { error: undefined }>

export interface Config {
  ajv?: Ajv
  getRecord: GetRecord
  log?: (payload: any, message: string) => void
  prefix?: string
  report_all_ajv_errors?: boolean
  setRecord: SetRecord
}

export const defRegisterClient = (config: Config) => {
  const { getRecord, report_all_ajv_errors, setRecord } = config
  // const log = config.log || console.log
  const log = config.log || (() => {})
  const prefix = config.prefix ?? 'register-client '

  let ajv: Ajv
  if (config.ajv) {
    ajv = config.ajv
  } else {
    ajv = addFormats(new Ajv({ allErrors: report_all_ajv_errors }), ['uri'])
  }

  const registerClient: RegisterClient = async (param) => {
    log(param, 'param')

    const { error } = conformResult(
      { prefix },
      ajv,
      register_client_param,
      param
    )

    if (error) {
      return { error }
    }

    const { client_id, ...record } = param

    log(client_id, 'client_id')
    const { error: read_error, value } = await getRecord(client_id)

    if (read_error) {
      return { error: read_error }
    }

    if (value) {
      return {
        value: { message: `client ${client_id} has already been registered` }
      }
    }

    const { error: write_error } = await setRecord(client_id, record)

    if (write_error) {
      return { error: write_error }
    }

    return { value: { message: `registered client ${client_id}` } }
  }

  return registerClient
}
