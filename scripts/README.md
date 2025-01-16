# scripts

Various scripts for development and testing.

> [!TIP]
> If a script is written in TypeScript, you can use [tsm](https://github.com/lukeed/tsm) to launch it without having to compile it first.

## Seeding data

Seed the storage layer with some authorization codes, access tokens, refresh refresh, client applications, user profiles.

Seed with some fake data the local SQLite database used in development.

```sh
npx tsm ./scripts/seed.ts --backend sqlite -e dev
```

Seed as before, but also reset all data first, and add an additional user profile about myself.

```sh
npx tsm ./scripts/seed.ts -b sqlite -e dev --me --reset
```

Seed the production database.

```sh
npx tsm ./scripts/seed.ts -b sqlite -e prod
```

## Token revocation

Revoke all access tokens and all refresh tokens that are currently stored in the SQLite database used in development. Add also an optional reason for their revocation.

```sh
npx tsm ./scripts/revoke-tokens.ts -b sqlite -e dev \
  --revoke-all \
  --revocation-reason "security breach"
```

## CRUD

Small CRUD scripts. Useful when developing / testing / troubleshooting a storage backend.

Example:

```sh
npx tsm ./scripts/crud-access-token.ts --backend fs-jsonl --reset
```

Other examples:

```sh
npx tsm ./scripts/crud-authorization-code.ts -b fs-jsonl --reset
npx tsm ./scripts/crud-client.ts --b fs-jsonl --reset
npx tsm ./scripts/crud-refresh-token.ts -b fs-jsonl --reset
npx tsm ./scripts/crud-user-profile.ts -b fs-jsonl --reset
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

TODO: use [open](https://www.npmjs.com/package/open) to open https://jwt.io/ in the browser.

Verify a JWT using the public JWKS.

```sh
npx tsm ./scripts/verify-jwt.ts
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

Build the IndieAuth [authorization request URL](https://indieauth.spec.indieweb.org/#authorization-request).

```sh
npx tsm ./scripts/indieauth-authorization-request.ts
```

Build the IndieAuth authorization request URL using a custom `me`.

```sh
npx tsm ./scripts/indieauth-authorization-request.ts --me https://aaronparecki.com/
```
