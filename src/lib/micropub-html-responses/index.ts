export interface SuccessPageOptions {
  base_url?: string
  title?: string
  summary?: string
  payload?: any
}

export const successPage = (options?: SuccessPageOptions) => {
  const opt = options || {}
  const base_url = opt.base_url || ''
  const summary = opt.summary || 'Your request was successful.'
  const title = opt.title || 'Success'

  const layout_css_href = `${base_url}/styles/layout.css`

  const payload = opt.payload
    ? [
        `<h2>Payload</h2>`,
        `<pre><code>${JSON.stringify(opt.payload, null, 2)}</code></pre>`
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
