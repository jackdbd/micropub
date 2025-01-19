import type { Ajv, Schema, ValidateFunction } from 'ajv'
import stringify from 'fast-safe-stringify'
import { nanoid } from 'nanoid'
import { validationErrors } from './lib/validators.js'
import { defAjv } from './ajv.js'

export interface Options {
  separator?: string
  schema?: Schema
}

/**
 * Creates the `exInfo`, `exMessage`, and `exData` functions for handling
 * structured exception data.
 *
 * You can optionally provide a JSON schema to validate the exception data.
 *
 * Inspired by the `ex-info`, `ex-message`, and `ex-data` functions from
 * Clojure's core library.
 *
 * @see [ex-info](https://clojuredocs.org/clojure.core/ex-info)
 * @see [ex-data](https://clojuredocs.org/clojure.core/ex-data)
 * @see [ex-message](https://clojuredocs.org/clojure.core/ex-message)
 */
export const defEx = (options?: Options) => {
  const opt = options ?? {}
  const separator = opt.separator ?? nanoid()

  let ajv: Ajv | undefined
  let validate: ValidateFunction | undefined
  if (opt.schema) {
    ajv = defAjv()
    validate = ajv.compile(opt.schema)
  }

  const exInfo = (message: string, data: Record<string, any>) => {
    if (opt.schema && ajv && validate) {
      validate(data)
      const errors = validationErrors(ajv, opt.schema, data)
      errors.forEach((str) => {
        console.error(`❌ ${str}`)
      })
    }
    return new Error(`${message}${separator}${stringify(data)}`)
  }

  const exMessage = (ex: any) => {
    if (ex) {
      if (typeof ex === 'string') {
        return ex
      }
      if (ex.message) {
        const [message, _data] = ex.message.split(separator)
        return message as string
      }
    }
  }

  const exData = (ex: any) => {
    if (ex && ex.message) {
      const [_message, data] = ex.message.split(separator)
      if (data) {
        // optionally validate data with Ajv or similar
        return JSON.parse(data) as Record<string, any>
      }
    }

    return undefined
  }

  return { exInfo, exMessage, exData, separator }
}

export const { exData, exInfo, exMessage } = defEx()
