# scripts

Various scripts for development and testing.

> [!TIP]
> If a script is written in TypeScript, you can use [tsm](https://github.com/lukeed/tsm) to launch it without having to compile it first.

## JSON Schemas

Generate JSON schemas from TypeBox schemas, then generate HTML pages from those JSON schemas using [json-schema-for-humans](https://github.com/coveooss/json-schema-for-humans).

> [!WARNING]
> This script is very incomplete at the moment.

```sh
npx tsm ./scripts/schemas-to-html.ts
```

## JWT

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

## JWKS

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
npx tsm ./scripts/relmeauth-discovery.ts --me https://giacomodebidda.com/
```

Try also with these `me` URLs:

- https://aaronparecki.com/
- https://www.jvt.me/
- https://barryfrost.com/
- https://marksuth.dev/

## IndieAuth

Perform IndieAuth discovery on a given profile URL.

```sh
npx tsm ./scripts/indieauth-discovery.ts --me https://giacomodebidda.com/
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
