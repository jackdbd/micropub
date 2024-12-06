import { Static, Type } from '@sinclair/typebox'
import { jf2 } from './jf2.js'

const content = Type.String({ minLength: 1 })

const jf2ToContent_ = Type.Function([jf2], content)

export type JF2ToContent = Static<typeof jf2ToContent_>

export const jf2ToContent = Type.Any()
