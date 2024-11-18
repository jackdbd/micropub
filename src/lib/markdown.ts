// @ts-ignore-next-line
import markdownit from 'markdown-it'
// @ts-ignore-next-line
import TurndownService from 'turndown'

// https://github.com/markdown-it/markdown-it?tab=readme-ov-file#init-with-presets-and-options
const md = markdownit({
  html: true,
  breaks: true,
  typographer: true
})

// https://github.com/mixmark-io/turndown?tab=readme-ov-file#options
const turndownService = new TurndownService({
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  headingStyle: 'atx'
})

turndownService.keep(['cite', 'del', 'ins'])

export const markdownToHtml = (str: string) => {
  return md.render(str).trim() as string
}

export const htmlToMarkdown = (str: string) => {
  return turndownService.turndown(str) as string
}
