schema "main" {
}

table "access_tokens" {
  schema = schema.main

  column "id" {
    null = false
    type = integer
    auto_increment = true
  }

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
      column.id
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

  column "id" {
    null = false
    type = integer
    auto_increment = true
  }

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
      column.id
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

  column "id" {
    null = false
    type = integer
    auto_increment = true
  }
  
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
      column.id
    ]
  }
}

table "posts" {
  schema = schema.main

  column "id" {
    null = false
    type = integer
    auto_increment = true
  }

  column "mf2" {
    null = false
    type = json
  }

  column "created_at" {
    null = true
    type = integer
  }

  column "updated_at" {
    null = true
    type = integer
  }

  primary_key {
    columns = [
      column.id
    ]
  }
}

table "profiles" {
  schema = schema.main

  column "id" {
    null = false
    type = integer
    auto_increment = true
  }

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
      column.id
    ]
  }
}

table "refresh_tokens" {
  schema = schema.main

  column "id" {
    null = false
    type = integer
    auto_increment = true
  }

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
      column.id
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