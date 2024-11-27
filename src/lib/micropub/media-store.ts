export interface BaseError {
  status_code?: number
  status_text?: string
  error_description?: string
}

export interface BaseValue {
  status_code?: number
  status_text?: string
  summary?: string
  payload?: any
  url?: string
}

export interface Failure<E> {
  error: E
  value?: undefined
}

export interface Success<V> {
  error?: undefined
  value: V
}

export type Result<E, V> = Failure<E> | Success<V>

export interface UploadConfig {
  /**
   * The file to upload.
   */
  body: Buffer

  /**
   * Content-Type of the file being uploaded to the Media endpoint.
   */
  contentType: string

  /**
   * Name of the file being uploaded to the Media endpoint. The Media Endpoint
   * MAY ignore the suggested filename that the client sends.
   */
  filename: string
}

/**
 * Uploads a file to the Media Endpoint.
 *
 * To upload a file, the Micropub client sends a `multipart/form-data` request
 * with one part named `file`.
 */
export type Upload<E, V> = (config: UploadConfig) => Promise<Result<E, V>>

/**
 * Deletes a file from the storage backend of the Media endpoint.
 *
 * @see https://indieweb.org/Micropub-extensions#Media_Endpoint_Extensions
 */
export type Delete<E, V> = (url: string) => Promise<Result<E, V>>

export interface Info {
  name: string
  public_root_url: string
}

export interface Store<
  StoreError extends BaseError = BaseError,
  StoreValue extends BaseValue = BaseValue
> {
  upload: Upload<StoreError, StoreValue>
  delete?: Delete<StoreError, StoreValue>
  info: Info
}
