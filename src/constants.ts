import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config as LibSqlClientConfig } from '@libsql/client'
import type { TObject } from '@sinclair/typebox'
import { Atom, defAtom } from '@thi.ng/atom'
import type {
  AccessTokenMutableRecord,
  AuthorizationCodeMutableRecord,
  ClientApplicationMutableRecord,
  RefreshTokenMutableRecord,
  UserProfileMutableRecord
} from './lib/storage-api/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const assets_dir = path.join(__dirname, '..', 'assets')

export enum StorageBackend {
  'fs-json' = 'fs-json',
  'fs-jsonl' = 'fs-jsonl',
  'mem-atom' = 'mem-atom',
  'sqlite' = 'sqlite'
}

export type Environment = 'dev' | 'prod'

export interface HashMapSchemas {
  access_token: TObject
  authorization_code: TObject
  client_application: TObject
  refresh_token: TObject
  user_profile: TObject
}

export const ATOM: Record<keyof HashMapSchemas, Atom<any>> = {
  access_token: defAtom<Record<string, AccessTokenMutableRecord>>({}),
  authorization_code: defAtom<Record<string, AuthorizationCodeMutableRecord>>(
    {}
  ),
  client_application: defAtom<Record<string, ClientApplicationMutableRecord>>(
    {}
  ),
  refresh_token: defAtom<Record<string, RefreshTokenMutableRecord>>({}),
  user_profile: defAtom<Record<string, UserProfileMutableRecord>>({})
}

export const ATOM_RECORD_KEY: Record<keyof HashMapSchemas, string> = {
  access_token: 'jti',
  authorization_code: 'code',
  client_application: 'client_id',
  refresh_token: 'refresh_token',
  user_profile: 'me'
}

export const JSON_FILEPATH: Record<keyof HashMapSchemas, string> = {
  access_token: path.join(assets_dir, 'access-tokens.json'),
  authorization_code: path.join(assets_dir, 'authorization-codes.json'),
  client_application: path.join(assets_dir, 'clients.json'),
  refresh_token: path.join(assets_dir, 'refresh-tokens.json'),
  user_profile: path.join(assets_dir, 'profiles.json')
}

export const JSON_RECORD_KEY: Record<keyof HashMapSchemas, string> = {
  access_token: 'jti',
  authorization_code: 'code',
  client_application: 'client_id',
  refresh_token: 'refresh_token',
  user_profile: 'me'
}

export const JSON_LINES_FILEPATH: Record<keyof HashMapSchemas, string> = {
  access_token: path.join(assets_dir, 'access-tokens.jsonl'),
  authorization_code: path.join(assets_dir, 'authorization-codes.jsonl'),
  client_application: path.join(assets_dir, 'clients.jsonl'),
  refresh_token: path.join(assets_dir, 'refresh-tokens.jsonl'),
  user_profile: path.join(assets_dir, 'profiles.jsonl')
}

// https://github.com/tursodatabase/libsql-client-ts?tab=readme-ov-file#examples
export const SQLITE_DATABASE: Record<Environment, LibSqlClientConfig> = {
  dev: { url: 'file:micropub-dev.db' } as LibSqlClientConfig,
  prod: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_DATABASE_TOKEN!
  } as LibSqlClientConfig
}

export const SQLITE_DATABASE_TABLE: Record<keyof HashMapSchemas, string> = {
  access_token: 'access_tokens',
  authorization_code: 'authorization_codes',
  client_application: 'clients',
  refresh_token: 'refresh_tokens',
  user_profile: 'profiles'
}
