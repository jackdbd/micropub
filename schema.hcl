schema "main" {
}

table "access_tokens" {
  schema = schema.main

  column "jti" {
    type = text
  }

  column "client_id" {
    type = text
  }

  column "redirect_uri" {
    type = text
  }

  column "revoked" {
    type = boolean
    default = false
  }

  column "revocation_reason" {
    type = text
    null = true
  }

  column "created_at" {
    type = int
    null = true
  }

  column "updated_at" {
    type = int
    null = true
  }

  primary_key {
    columns = [
      column.jti
    ]
  }

  index "access_tokens_client_id_idx" {
    columns = [
      column.client_id
    ]
  }
}

table "authorization_codes" {
  schema = schema.main

  column "code" {
    type = text
  }

  column "client_id" {
    type = text
  }

  column "code_challenge" {
    type = text
  }

  column "code_challenge_method" {
    type = text
  }

  column "exp" {
    type = int
  }

  column "iss" {
    type = text
    null = true
  }

  column "me" {
    type = text
  }

  column "redirect_uri" {
    type = text
  }

  column "scope" {
    type = text
  }

  column "used" {
    type = boolean
    default = false
  }

  column "created_at" {
    type = int
    null = true
  }

  column "updated_at" {
    type = int
    null = true
  }

  primary_key {
    columns = [
      column.code
    ]
  }

  index "authorization_codes_client_id_idx" {
    columns = [
      column.client_id
    ]
  }
}

table "clients" {
  schema = schema.main

  column "client_id" {
    type = text
  }

  column "me" {
    type = text
  }

  column "redirect_uri" {
    type = text
  }

  column "created_at" {
    type = int
    null = true
  }

  column "updated_at" {
    type = int
    null = true
  }

  primary_key {
    columns = [
      column.client_id
    ]
  }
}

table "profiles" {
  schema = schema.main

  column "me" {
    type = text
  }

  column "name" {
    type = text
  }

  column "photo" {
    type = text
  }

  column "url" {
    type = text
  }

  column "email" {
    type = text
  }

  column "created_at" {
    type = int
    null = true
  }

  column "updated_at" {
    type = int
    null = true
  }

  primary_key {
    columns = [
      column.me
    ]
  }
}

table "refresh_tokens" {
  schema = schema.main

  column "refresh_token" {
    type = text
  }

  column "client_id" {
    type = text
  }

  column "exp" {
    type = int
  }

  column "iss" {
    type = text
  }

  column "jti" {
    type = text
  }

  column "me" {
    type = text
  }

  column "redirect_uri" {
    type = text
  }

  column "revoked" {
    type = boolean
    default = false
  }

  column "revocation_reason" {
    type = text
    null = true
  }

  column "scope" {
    type = text
  }

  column "created_at" {
    type = int
    null = true
  }

  column "updated_at" {
    type = int
    null = true
  }

  primary_key {
    columns = [
      column.refresh_token
    ]
  }

  index "refresh_tokens_client_id_idx" {
    columns = [
      column.client_id
    ]
  }

  index "refresh_tokens_client_jti_idx" {
    columns = [
      column.jti
    ]
  }
}