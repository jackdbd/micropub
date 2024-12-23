import { Static, Type } from '@sinclair/typebox'
import { DEFAULT } from './constants-dev.js'
// import { telegram } from './schemas-shared.js'

export const youch_options = Type.Object({
  /**
   * Number of lines to be displayed above the error in the stack trace.
   */
  preLines: Type.Optional(
    Type.Number({ minimum: 0, default: DEFAULT.PRE_LINES })
  ),

  /**
   * Number of lines to be displayed below the error in the stack trace.
   */
  postLines: Type.Optional(
    Type.Number({ minimum: 0, default: DEFAULT.POST_LINES })
  )

  // telegram: Type.Optional(telegram)
})

export type YouchOptions = Static<typeof youch_options>

export const options = Type.Object({
  ...youch_options.properties,

  logPrefix: Type.Optional(Type.String({ default: DEFAULT.LOG_PREFIX })),

  stackOverflowTag: Type.Optional(
    Type.String({ minLength: 1, default: DEFAULT.STACK_OVERFLOW_TAG })
  ),

  toggleShowAllFrames: Type.Optional(
    Type.Boolean({ default: DEFAULT.TOGGLE_SHOW_ALL_FRAMES })
  )
})

export type Options = Static<typeof options>

export interface Frame {
  callee: string
  calleeShort: string
  classes: string
  column: number
  context: Object
  file: string
  filePath: string
  isApp: boolean
  isModule: boolean
  isNative: boolean
  line: number
}

export interface Data {
  cause: any
  frames: Frame[]
  help: any
  message: string
  name: string
  status: any
}
