variable "token" {
  type    = string
  default = getenv("TURSO_DATABASE_TOKEN")
}

env "dev" {
  url     = "sqlite://micropub-dev.db"
}

env "prod" {
  url     = "libsql+wss://micropub-jackdbd.turso.io?authToken=${var.token}"
  exclude = ["_litestream*"]
}