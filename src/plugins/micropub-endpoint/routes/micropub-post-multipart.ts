import assert from 'node:assert'
import { FastifyRequest } from 'fastify'
import formAutoContent from 'form-auto-content'
import { areSameOrigin } from '../../../lib/fastify-request-predicates/index.js'
import { PostRequestBody } from '../request.js'
import { isAudio, isVideo } from '../../../lib/mime-types.js'

interface Config {
  media_endpoint: string
  micropub_endpoint: string
  prefix: string
}

/**
 * Creates a function that parses a multipart request, collects all `field`
 * parts into a request body, and uploads all `file` parts to a media endpoint.
 */
export const defMultipartRequestBody = (config: Config) => {
  const { media_endpoint, micropub_endpoint, prefix } = config

  const multipartRequestBody = async (request: FastifyRequest) => {
    assert.ok(request.headers['content-type']!.includes('multipart/form-data'))

    const data: Record<string, any> = {}

    for await (const part of request.parts()) {
      if (part.type === 'field') {
        const { fieldname, value } = part

        if (fieldname.includes('[]')) {
          const k = fieldname.split('[]')[0]
          if (data[k]) {
            data[k].push(value)
          } else {
            data[k] = [value]
          }
          request.log.debug(`${prefix}collected ${k}[]=${value}`)
        } else {
          data[fieldname] = value
          request.log.debug(`${prefix}collected ${fieldname}=${value}`)
        }
      } else if (part.type === 'file') {
        const { file, filename, mimetype } = part

        request.log.debug(
          `${prefix}received file ${filename}. Uploading it to the media endpoint ${media_endpoint}`
        )

        // let response: LightMyRequestResponse | Response
        // See:
        // - networkless HTTP (https://www.youtube.com/watch?v=65WoHVTwbtI)
        // - https://github.com/mcollina/fastify-undici-dispatcher
        let location: string | undefined = undefined
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

          if (response.headers.location) {
            location = response.headers.location.toString()
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

          location = response.headers.get('location') || undefined
        }

        request.log.debug(
          `${prefix}file location got from media endpoint: ${location}`
        )

        if (location) {
          if (isAudio(mimetype)) {
            data['audio'] = location
          } else if (isVideo(mimetype)) {
            data['video'] = location
          } else {
            data['photo'] = location
          }
        }

        // I could create a photos array:
        // 1. collect the photo alt text when part.type === 'field'. Maybe use
        // a field like mp-photo-alt-text? It should match the number of photo
        // files. E.g. set two mp-photo-alt-text[] for two photo files.
        // 2. make a request to the /media endpoint and use
        // response.header.location as the photo url
        // 3. push photo {alt, url} to the photos array
        // 4. set `photos` as `photo` in the `request body`
        // It seems that Quill takes a similar approach.
        // https://github.com/aaronpk/Quill/blob/8ecaed3d2f5a19bf1a5c4cb077658e1bd3bc8438/views/new-post.php#L448

        // data.photo = response.headers.location

        // data.photo = {
        //   alt: 'TODO: where to get the alternate text?',
        //   url: location
        // }
      }
    }

    return data as PostRequestBody
  }

  return multipartRequestBody
}
