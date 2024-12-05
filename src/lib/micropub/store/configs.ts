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
