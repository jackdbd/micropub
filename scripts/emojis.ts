// 🚧❌🚨⛔❗🔐🧑🧑‍💻👤🗣️🆘🚩✅🔎🗑️➖🔁🔃♻️🗄️🌐
// https://emojis.wiki/
export const EMOJI: Record<string, string> = {
  ACCESS_TOKEN: '🔑',
  AUTHORIZATION_CODE: '🔢',
  APPENDED: '➕',
  CLIENT_APPLICATION: '📱',
  CREATED: '🆕',
  DEBUG: '🔎',
  DELETED: '🗑️',
  ERROR: '❌',
  EXCEPTION: '🚨',
  EXIT_ONE: '🚩',
  EXIT_ZERO: '🏁',
  ID: '🆔',
  INFO: 'ℹ️',
  JTI: '🔑',
  ME: '👤',
  PROFILE: '👤',
  QUERY: '❓',
  REFRESH_TOKEN: '🌱',
  REMOVED: '🚮',
  RETRIEVED: '📤',
  REVOKED: '🚫',
  ROWID: '🆔',
  SEARCH: '🔎',
  STORED: '📥',
  TEST: '🧪',
  TOKEN_ISSUED: '🔑',
  UNDELETED: '🔁',
  UNKNOWN: '🤷',
  UPDATED: '🆙',
  ALL_TOKENS_REVOKED: '🚧'
}

export const toEmoji = (str: string) => {
  const k = str.toUpperCase().trim()
  return EMOJI[k] || EMOJI.EXIT_ONE
}
