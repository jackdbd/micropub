/**
 * A Micropub server MUST respond to successful delete requests with HTTP 200,
 * 201 or 204.
 *
 * @see https://micropub.spec.indieweb.org/#response-1
 */
export type DeleteSuccess = 200 | 201 | 204

/**
 * A Micropub server MUST respond to successful undelete requests with HTTP 200,
 * 201 or 204.
 *
 * @see https://micropub.spec.indieweb.org/#response-1
 */
export type UndeleteSuccess = 200 | 201 | 204

/**
 * A Micropub server MUST respond to successful update requests with HTTP 200,
 * 201 or 204.
 *
 * @see https://micropub.spec.indieweb.org/#response-0
 */
export type UpdateSuccess = 200 | 201 | 204

/**
 * If there was an error with the request, a Micropub server MUST return an
 * appropriate HTTP status code, typically 400, 401, or 403.
 *
 * @see https://micropub.spec.indieweb.org/#error-response
 */
export type ClientError = 400 | 401 | 403
