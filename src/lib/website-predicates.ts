const is = ({ url, key }: { url: string; key: string }) => {
  const [_domain, ...splits] = url.split('/').slice(2)
  if (splits && splits.at(0) === key) {
    return true
  } else {
    return false
  }
}

export const isBookmark = (url: string) => is({ url, key: 'bookmarks' })

export const isCard = (url: string) => is({ url, key: 'cards' })

export const isCheckin = (url: string) => is({ url, key: 'check-ins' })

export const isCite = (url: string) => is({ url, key: 'cites' })

export const isEvent = (url: string) => is({ url, key: 'events' })

export const isLike = (url: string) => is({ url, key: 'likes' })

export const isNote = (url: string) => is({ url, key: 'notes' })

export const isRead = (url: string) => is({ url, key: 'reads' })

export const isReply = (url: string) => is({ url, key: 'replies' })

export const isRepost = (url: string) => is({ url, key: 'reposts' })

// watch out, I don't think there is a plural for RSVP
export const isRsvp = (url: string) => is({ url, key: 'rsvp' })
