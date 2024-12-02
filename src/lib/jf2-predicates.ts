import type { Jf2 } from '@paulrobertlloyd/mf2tojf2'

// export const isArticle = (jf2: Jf2) => {
//   if (jf2.content) {
//     return true
//   } else {
//     return false
//   }
// }

export const isBookmark = (jf2: Jf2) => {
  if (isEntry(jf2) && jf2['bookmark-of']) {
    return true
  } else {
    return false
  }
}

export const isCard = (jf2: Jf2) => {
  if (jf2.h === 'card') {
    return true
  } else {
    return false
  }
}

/**
 * @see https://indieweb.org/checkin
 */
export const isCheckin = (jf2: Jf2) => {
  if (isEntry(jf2) && jf2['checkin']) {
    return true
  } else {
    return false
  }
}

export const isCite = (jf2: Jf2) => {
  if (jf2.h === 'cite') {
    return true
  } else {
    return false
  }
}

export const isEntry = (jf2: Jf2) => {
  if (jf2.h === 'entry') {
    return true
  } else {
    return false
  }
}

export const isEvent = (jf2: Jf2) => {
  if (jf2.h === 'event') {
    return true
  } else {
    return false
  }
}

/**
 * @see https://indieweb.org/issue
 */
export const isIssue = (jf2: Jf2) => {
  if (isEntry(jf2) && jf2['in-reply-to']) {
    if (jf2['in-reply-to'].includes('github.com')) {
      return true
    }
  }

  return false
}

export const isLike = (jf2: Jf2) => {
  if (isEntry(jf2) && jf2['like-of']) {
    return true
  } else {
    return false
  }
}

export const isNote = (jf2: Jf2) => {
  if (!isEntry(jf2) || !jf2.content) {
    return false
  }

  // note is a very generic type. We can disambiguate it by checking if JF2 is
  // NOT one of the more specific types.
  if (isRead(jf2) || isReply(jf2) || isRepost(jf2) || isRsvp(jf2)) {
    return false
  }

  if (typeof jf2.content === 'string') {
    return true
  }

  if (jf2.content.html && jf2.content.text) {
    return true
  }

  return false
}

/**
 * @see https://indieweb.org/read
 */
export const isRead = (jf2: Jf2) => {
  if (!isEntry(jf2)) {
    return false
  }

  if (!jf2['read-of']) {
    return false
  }

  switch (jf2['read-status']) {
    case 'to-read':
    case 'reading':
    case 'finished': {
      return true
    }
    default: {
      return false
    }
  }
}

export const isReply = (jf2: Jf2) => {
  if (!isEntry(jf2)) {
    return false
  }

  if (!jf2['in-reply-to']) {
    return false
  }

  // reply is quite a generic type. We can disambiguate it from a RSVP by
  // checking that first.
  if (isRsvp(jf2)) {
    return false
  }

  return true
}

/**
 * @see https://indieweb.org/repost
 */
export const isRepost = (jf2: Jf2) => {
  if (isEntry(jf2) && jf2['repost-of']) {
    return true
  } else {
    return false
  }
}

/**
 * @see https://indieweb.org/rsvp
 */
export const isRsvp = (jf2: Jf2) => {
  if (!isEntry(jf2)) {
    return false
  }

  // rsvp is a subtype of reply
  if (!jf2['in-reply-to']) {
    return false
  }

  switch (jf2['rsvp']) {
    case 'yes':
    case 'no':
    case 'maybe':
    case 'interested': {
      return true
    }
    default: {
      return false
    }
  }
}
