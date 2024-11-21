// @ts-ignore-next-line
import markdownit from 'markdown-it'

// https://github.com/markdown-it/markdown-it?tab=readme-ov-file#init-with-presets-and-options
const md = markdownit({
  html: true,
  breaks: true,
  typographer: true
})

export const markdownToHtml = (str: string) => {
  return md.render(str).trim() as string
}
