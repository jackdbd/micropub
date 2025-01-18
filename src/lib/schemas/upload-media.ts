import { Static, Type } from '@sinclair/typebox'
import { failure } from './failure.js'
import { url } from './url.js'

const success = Type.Object({
  error: Type.Optional(Type.Undefined()),
  value: Type.Object({
    url: { ...url, description: 'The URL of the uploaded media.' }
  })
})

const result_promise = Type.Promise(Type.Union([failure, success]))

export const upload_config = Type.Object({
  body: Type.Any({ description: 'The file to upload.' }),
  contentType: Type.String({
    description:
      'Content-Type of the file being uploaded to the Media endpoint.'
  }),
  filename: Type.String({
    description:
      'Name of the file being uploaded to the Media endpoint. The Media Endpoint MAY ignore the suggested filename that the client sends.'
  })
})

export interface UploadConfig extends Static<typeof upload_config> {
  body: Buffer
}

export const uploadMedia = Type.Function([upload_config], result_promise)

export type UploadMedia = Static<typeof uploadMedia>
