interface Service {
  name: string
  url: string
  photo?: string
}

interface User {
  name: string
  url: string
  photo?: string
}

export interface SyndicateToItem {
  uid: string
  name: string
  service?: Service
  user?: User
}
