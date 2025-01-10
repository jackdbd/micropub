import { Static, Type, type TSchema } from '@sinclair/typebox'

export const record_id = Type.Union([
  // bigint is problematic, both for JSON schema and for JSON.stringify
  // Type.BigInt({ minimum: BigInt(1) }),
  // I should read these issues:
  // https://github.com/ajv-validator/ajv/issues/1116
  // https://github.com/tc39/proposal-bigint/issues/162
  Type.Number({ minimum: 1 }),
  Type.String({ minLength: 1 })
])

export type RecordId = Static<typeof record_id>
// export type RecordId = string | number | bigint

export const timestamp_ms = Type.Number({
  minimum: 1,
  description: 'Timestamp in milliseconds since UNIX epoch'
})

export const immutable_record = Type.Object({
  created_at: timestamp_ms,
  id: record_id
})

export type ImmutableRecord = Static<typeof immutable_record>

const nullable = <S extends TSchema = TSchema>(schema: S) =>
  Type.Union([schema, Type.Null()])

// export const sqlite_rowid = Type.Integer({ minimum: 1 })

// export type SQLiteRowId = Static<typeof sqlite_rowid>

export const mutable_record = Type.Object({
  created_at: Type.Union([timestamp_ms, Type.Null()]),
  deleted_at: Type.Optional(nullable(timestamp_ms)),
  //   id: Type.Optional(record_id),
  //   rowid: Type.Optional(sqlite_rowid),
  undeleted_at: Type.Optional(nullable(timestamp_ms)),
  updated_at: Type.Optional(nullable(timestamp_ms))
})

export type MutableRecord = Static<typeof mutable_record>
