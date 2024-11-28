import sanitizeHtml from 'sanitize-html'
import TurndownService from 'turndown'

// https://github.com/mixmark-io/turndown?tab=readme-ov-file#options
const turndownService = new TurndownService({
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  headingStyle: 'atx'
})

turndownService.keep(['cite', 'del', 'ins'])

export const htmlToMarkdown = (str: string) => {
  const html = sanitizeHtml(str)
  return turndownService.turndown(html) as string
}
