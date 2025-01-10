# scripts

Various scripts for development and testing.

> [!TIP]
> If a script is written in TypeScript, you can use [tsm](https://github.com/lukeed/tsm) to launch it without having to compile it first.

## Seeding data

Seed the storage layer with some authorization codes, access tokens, refresh refresh, client applications, user profiles.

Seed the filesystem storage.

```sh
npx tsm ./scripts/seed.ts --storage fs
```

Seed the in-memory storage, produce verbose output.

```sh
npx tsm ./scripts/seed.ts --storage mem --verbose
```

Seed the development database.

```sh
npx tsm ./scripts/seed.ts --storage sqlite-dev
```

Seed the production database.

```sh
npx tsm ./scripts/seed.ts --storage sqlite-prod
```

Revoke all access tokens that are currently stored in the filesystem.

```sh
npx tsm ./scripts/revoke-tokens.ts --storage fs --access-tokens
```

Revoke all access tokens and all refresh tokens that are currently stored in the development database; give a reason for their revocation; produce verbose output.

```sh
npx tsm ./scripts/revoke-tokens.ts --storage sqlite-dev \
  --access-tokens \
  --refresh-tokens \
  --revocation-reason testing-revoke-all \
  --verbose
```

## CRUD

Small CRUD demos to test various storage implementations.

```sh
npx tsm ./scripts/crud-access-token.ts --backend fs-jsonl --reset

npx tsm ./scripts/crud-authorization-code.ts --backend fs-jsonl --reset

npx tsm ./scripts/crud-client.ts --backend fs-jsonl --reset

npx tsm ./scripts/crud-user-profile.ts --backend fs-jsonl --reset

npx tsm ./scripts/crud-user-profile.ts --backend sqlite --env dev

npx tsm ./scripts/crud-refresh-token.ts --backend fs-jsonl --reset

npx tsm ./scripts/crud-access-token.ts --backend mem
```

## JSON Schemas

Generate JSON schemas from TypeBox schemas, then generate HTML pages from those JSON schemas using [json-schema-for-humans](https://github.com/coveooss/json-schema-for-humans).

> [!WARNING]
> This script is very incomplete at the moment.

```sh
npx tsm ./scripts/schemas-to-html.ts
```

## JSON Web Tokens

Sign a JWT using a random private key from the private JWKS.

```sh
npx tsm ./scripts/sign-jwt.ts
```

Verify a JWT using the public JWKS.

```sh
npx tsm ./scripts/verify-jwt.ts
```

Issue a JWT and immediately revoke it.

```sh
npx tsm ./scripts/issue-and-revoke-jwt.ts --impl fs
npx tsm ./scripts/issue-and-revoke-jwt.ts --impl mem
```

## JSON Web Key Set (JWKS)

Generate a public [JWKS](https://datatracker.ietf.org/doc/html/rfc7517#section-5) and a private JWKS and store them on the filesystem. The public JWKS will be stored in [assets](../assets/README.md). The private JWKS will be stored in [secrets](../secrets/README.md).

```sh
npx tsm ./scripts/generate-jwks.ts
```

Deploy the public JWKS to Cloudflare R2, and set the private JWKS as [Fly secret](https://fly.io/docs/apps/secrets/).

```sh
npx tsm ./scripts/deploy-jwks.ts
```

## RelMeAuth

Perform RelMeAuth discovery on a given profile URL.

```sh
npx tsm ./scripts/relmeauth-discovery.ts https://giacomodebidda.com/
```

Try also with these `me` URLs:

- https://aaronparecki.com/
- https://www.jvt.me/
- https://barryfrost.com/
- https://marksuth.dev/

## IndieAuth

Perform IndieAuth discovery on a given profile URL.

```sh
npx tsm ./scripts/indieauth-discovery.ts https://giacomodebidda.com/
```

Try also with these `me` URLs:

- https://aaronparecki.com/
- https://paulrobertlloyd.com/
- https://www.jvt.me/

Register an IndieAuth client.

```sh
npx tsm ./scripts/register-client.ts \
  --me https://giacomodebidda.com/ \
  --client-id http://localhost:3001/id \
  --redirect-id http://localhost:3001/auth/callback
```

Build the IndieAuth [authorization request URL](https://indieauth.spec.indieweb.org/#authorization-request).

```sh
npx tsm ./scripts/indieauth-authorization-request.ts

npx tsm ./scripts/indieauth-authorization-request.ts --me https://aaronparecki.com/
```

Store information about a profile URL.

```sh
npx tsm ./scripts/store-profile.ts --impl fs \
  --me https://giacomodebidda.com/ \
  --name "Giacomo Debidda" \
  --photo "https://avatars.githubusercontent.com/u/5048090" \
  --url "https://www.giacomodebidda.com/" \
  --email "giacomo@giacomodebidda.com"
```

```sh
npx tsm ./scripts/store-profile.ts --impl turso \
  --me https://giacomodebidda.com/ \
  --name "Giacomo Debidda" \
  --photo "https://avatars.githubusercontent.com/u/5048090" \
  --url "https://www.giacomodebidda.com/" \
  --email "giacomo@giacomodebidda.com"
```

Should my profile URL be something like `https://giacomodebidda.com/me`?
