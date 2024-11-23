// import { UpdatePatch } from '../micropub/index.js'

export interface ErrorPageOptions {
  base_url: string
  error?: string
  error_description?: string
}

export const errorPage = (options: ErrorPageOptions) => {
  const { base_url } = options

  const title = options.error ? `Error: ${options.error}` : 'Error'

  const layout_css_href = `${base_url}/styles/layout.css`

  const details = options.error_description
    ? [`<h2>Error description</h2>`, `<p>${options.error_description}</p>`]
    : []

  const xs = [
    `<!doctype html>`,
    `<html lang="en">`,
    `<head>`,
    `<meta charset="utf-8">`,
    `<title>${title}</title>`,
    `<link rel="stylesheet" href="https://unpkg.com/mvp.css"> `,
    `<link rel="stylesheet" href=${layout_css_href}>`,
    `</head>`,
    `<body>`,
    `<h1>${title}</h1>`,
    `<p>Your request was not successful.</p>`,
    details.join(''),
    `</body>`,
    `</html>`
  ]
  return xs.join('')
}

export interface SuccessPageOptions {
  base_url?: string
  title?: string
  summary?: string
  payload?: any
}

export const successPage = (options: SuccessPageOptions) => {
  console.log(
    '=== successPage options (TODO: check base_url in production) ===',
    options
  )
  const { base_url } = options
  const layout_css_href = `${base_url}/styles/layout.css`
  const summary = options.summary || 'Your request was successful.'
  const title = options.title || 'Success'

  const payload = options.payload
    ? [
        `<h2>Payload</h2>`,
        `<pre><code>${JSON.stringify(options.payload, null, 2)}</code></pre>`
      ]
    : []

  const xs = [
    `<!doctype html>`,
    `<html lang="en">`,
    `<head>`,
    `<meta charset="utf-8">`,
    `<title>${title}</title>`,
    `<link rel="stylesheet" href="https://unpkg.com/mvp.css"> `,
    `<link rel="stylesheet" href=${layout_css_href}>`,
    `</head>`,
    `<body>`,
    `<h1>${title}</h1>`,
    `<p>${summary}</p>`,
    payload.join(''),
    `</body>`,
    `</html>`
  ]
  return xs.join('')
}

export const deleteSuccessPage = (options: SuccessPageOptions) => {
  return successPage({ ...options, title: 'Delete Success' })
}

export const undeleteSuccessPage = (options: SuccessPageOptions) => {
  return successPage({ ...options, title: 'Undelete Success' })
}

export const updateSuccessPage = (options: SuccessPageOptions) => {
  return successPage({ ...options, title: 'Update Success' })
}
