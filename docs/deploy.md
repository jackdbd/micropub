# Deploy

The GitHub Workflow [ci.yaml](../.github/workflows/ci.yaml) takes care of deploying the app to Fly.io every time a new commit is pushed to the `main` branch of the remote repository.

## Secrets

Whenever you need to update secrets on Fly.io, run these commands (see `devenv.nix`):

```sh
fly-secrets-set-github
fly-secrets-set-cloudflare
fly-secrets-set-secure-session-keys
fly-secrets-set-telegram
fly-secrets-set-turso
```
