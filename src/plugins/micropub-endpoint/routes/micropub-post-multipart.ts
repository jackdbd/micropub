import assert from 'node:assert'
import { FastifyRequest } from 'fastify'
import formAutoContent from 'form-auto-content'
import { areSameOrigin } from '../../../lib/fastify-request-predicates/index.js'
// import { normalizeJf2 } from '../../../lib/micropub/index.js'
import { isAudio, isVideo } from '../../../lib/mime-types.js'
import type { PostRequestBody } from '../request.js'

interface Config {
  media_endpoint: string
  micropub_endpoint: string
  prefix: string
}

type Value = number | string | any[]
type Data = Record<string, Value>

interface UploadedMedia {
  // mimetype of a file uploaded to the Media endpoint.
  mimetype: string
  // URL of a file uploaded to the Media endpoint.
  location: string
}

/**
 * Creates a function that parses a multipart request, collects all `field`
 * parts into a request body, and uploads all `file` parts to a media endpoint.
 *
 * IndiePass supports multi-photo, multi-audio, multi-video.
 *
 * Quill seems NOT to support multi-photo. I tried to create a multi-photo post
 * in Quill and it did upload both files to the media endpoint, but it didn't
 * even try to call my Micropub endpoint and failed with a runtime error.
 * @see https://github.com/aaronpk/Quill/blob/8ecaed3d2f5a19bf1a5c4cb077658e1bd3bc8438/lib/helpers.php#L402
 */
export const defMultipartRequestBody = (config: Config) => {
  const { media_endpoint, micropub_endpoint, prefix } = config

  const multipartRequestBody = async (request: FastifyRequest) => {
    assert.ok(request.headers['content-type']!.includes('multipart/form-data'))

    const data: Data = {}

    // A single multipart request to the Micropub endpoint can result in N
    // requests to the Media endpoint (e.g. a multi-photo post).
    // https://indieweb.org/multi-photo
    const uploaded: UploadedMedia[] = []

    for await (const part of request.parts()) {
      if (part.type === 'field') {
        const { fieldname, value } = part

        if (fieldname.includes('[]')) {
          const k = fieldname.split('[]')[0]

          if (data[k]) {
            assert.ok(Array.isArray(data[k]))
            request.log.debug(`${prefix}update ${k} array`)
            if (Array.isArray(value)) {
              data[k].push(...value)
            } else {
              data[k].push(value)
            }
          } else {
            request.log.debug(`${prefix}set ${k} array`)
            if (Array.isArray(value)) {
              data[k] = value
            } else {
              data[k] = [value]
            }
          }
        } else {
          data[fieldname] = value as Value
          request.log.debug(`${prefix}collected ${fieldname}=${value}`)
        }
      } else if (part.type === 'file') {
        const { fieldname, file, filename, mimetype } = part

        request.log.debug(
          `${prefix}received file ${filename} in field ${fieldname}. Uploading it to the media endpoint ${media_endpoint}`
        )

        // let response: LightMyRequestResponse | Response
        // See:
        // - networkless HTTP (https://www.youtube.com/watch?v=65WoHVTwbtI)
        // - https://github.com/mcollina/fastify-undici-dispatcher
        if (areSameOrigin(micropub_endpoint, media_endpoint)) {
          request.log.debug(
            `${prefix}make request to LOCAL media endpoint ${media_endpoint} (inject)`
          )

          // I find this quite clanky to use...
          const form = formAutoContent(
            {
              file: {
                value: file,
                options: {
                  filename,
                  contentType: mimetype
                }
              }
            },
            { forceMultiPart: true }
          )

          // TODO: error handling.
          // What if the media endpoint returns a 4xx or 5xx status code?
          // Or, even worse, if it throws an exception?

          const response = await request.server.inject({
            url: media_endpoint,
            method: 'POST',
            headers: {
              ...form.headers,
              authorization: request.headers.authorization
            },
            payload: form.payload
          })

          const location = response.headers.location
          if (location) {
            uploaded.push({ location: location.toString(), mimetype })
          }
        } else {
          request.log.debug(
            `${prefix}make request to REMOTE media endpoint ${media_endpoint} (fetch)`
          )

          const form = formAutoContent(
            {
              file: {
                value: file,
                options: {
                  filename: filename,
                  contentType: mimetype
                }
              }
            },
            { forceMultiPart: true }
          )

          // I am afraid this fetch is not correct
          const response = await fetch(media_endpoint, {
            method: 'POST',
            headers: {
              ...form.headers,
              Authorization: request.headers.authorization!
              // 'Content-Disposition': `form-data; name="${fieldname}"; filename="${filename}"`,
              // 'Content-Type': 'multipart/form-data'
            },
            body: await part.toBuffer()
          })

          const location = response.headers.get('location') || undefined
          if (location) {
            uploaded.push({ location, mimetype })
          }
        }

        if (uploaded.length > 0) {
          data['audio[]'] = []
          data['video[]'] = []
          // TODO: each photo might have an alternate text. I think it should be
          // in data['photo[][alt]']. I should try making requests from
          // different Micrpub clients (e.g. IndiePass, Quill).
          data['photo[]'] = []
          // data['photo[]'] = [{ alt: '', value: '' }]
          for (const { location, mimetype } of uploaded) {
            if (isAudio(mimetype)) {
              data['audio[]'].push(location)
            } else if (isVideo(mimetype)) {
              data['video[]'].push(location)
            } else {
              data['photo[]'].push(location)
            }
          }
          request.log.info(
            {
              audio: data['audio[]'],
              photo: data['photo[]'],
              video: data['video[]']
            },
            `${prefix}${uploaded.length} files uploaded to media endpoint`
          )
        }
      }
    }

    // Since we might have added audio[], video[], and photo[] fields, we need
    // to convert them into JS arrays. But since we have to do it anyway later
    // on in the POST /micropub handler, it's not necessary to do it here.
    // const jf2 = normalizeJf2(data)

    return data as any as PostRequestBody
  }

  return multipartRequestBody
}
