export interface Config {
  summary: string
  details?: string[]
  suggestions?: string[]
}

const INDENTATION = '  '

const bulletPoint = (s: string) => `${INDENTATION}- ${s}`

const numberedItem = (s: string, i: number) => `${INDENTATION}${i + 1}. ${s}`

export const errorMessage = (config: Config) => {
  const { summary, details, suggestions } = config

  const lines = [summary]

  if (details) {
    lines.push('Details:')
    lines.push(details.map(numberedItem).join('\n'))
  }

  if (suggestions) {
    lines.push('Suggestions:')
    lines.push(suggestions.map(bulletPoint).join('\n'))
  }

  return lines.join('\n\n')
}
