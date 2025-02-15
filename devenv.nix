{
  config,
  inputs,
  lib,
  pkgs,
  ...
}: let
  cloudflare_r2 = builtins.fromJSON (builtins.readFile /run/secrets/cloudflare/r2);
  micropub = builtins.fromJSON (builtins.readFile /run/secrets/micropub);
  fly_micropub = builtins.fromJSON (builtins.readFile /run/secrets/fly/micropub);
  telegram = builtins.fromJSON (builtins.readFile /run/secrets/telegram/jackdbd_github_bot);
  turso = builtins.fromJSON (builtins.readFile /run/secrets/turso/micropub);
in {
  enterShell = ''
    versions
  '';

  enterTest = ''
    echo "Assert Node.js version is 20.11.1"
    node --version | grep "20.11.1"
  '';

  env = {
    ACCESS_TOKEN = micropub.access_token;
    BASE_URL = "http://localhost:${config.env.PORT}";
    CLOUDFLARE_ACCOUNT_ID = "43f9884041661b778e95a26992850715";
    CLOUDFLARE_R2_ACCESS_KEY_ID = cloudflare_r2.personal.access_key_id;
    CLOUDFLARE_R2_BUCKET_NAME = "giacomodebidda-content";
    CLOUDFLARE_R2_SECRET_ACCESS_KEY = cloudflare_r2.personal.secret_access_key;
    CODECOV_TOKEN = builtins.readFile /run/secrets/codecov/token;
    DEBUG = "micropub:*";
    FLY_API_TOKEN = fly_micropub.deploy_token;
    GITHUB_OAUTH_APP_CLIENT_ID = micropub.github_oauth_app_client_id_dev;
    GITHUB_OAUTH_APP_CLIENT_SECRET = micropub.github_oauth_app_client_secret_dev;
    GITHUB_OAUTH_APP_CLIENT_SECRET_PROD = micropub.github_oauth_app_client_secret_prod;
    GITHUB_OWNER = "jackdbd";
    GITHUB_REPO = "giacomodebidda-content";
    GITHUB_TOKEN = builtins.readFile /run/secrets/github-tokens/crud_contents_api;
    INCLUDE_ERROR_DESCRIPTION = true;
    JWKS = builtins.readFile /home/jack/repos/micropub/secrets/jwks.txt;
    # Since the fly CLI uses the LOG_LEVEL environment variable, I use a
    # different environment variable for pino.
    # https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-pino-to-log-node-js-applications/
    PINO_LOG_LEVEL = "debug";
    PORT = "3001";
    SECURE_SESSION_KEY_ONE = micropub.session_key_one;
    SECURE_SESSION_KEY_TWO = micropub.session_key_two;
    TELEGRAM_CHAT_ID = telegram.chat_id;
    TELEGRAM_TOKEN = telegram.token;
    TURSO_DATABASE_TOKEN = turso.database_token;
    TURSO_DATABASE_URL = "libsql://micropub-jackdbd.turso.io";
  };

  languages = {
    nix.enable = true;
  };

  packages = with pkgs; [
    atlas # tool for managing database schemas
    dive # tool for exploring each layer in a docker image
    entr # run arbitrary commands when files change
    git
    json-schema-for-humans # generate HTML documentation from a JSON schema
    nodejs
    trivy # vulnerability scanner for containers
    turso-cli # CLI for Turso DB
  ];

  pre-commit.hooks = {
    alejandra.enable = true;
    # deadnix.enable = true;
    hadolint.enable = true;
    # prettier.enable = true;
    statix.enable = true;
  };

  scripts = {
    build.exec = ''
      clean
      npm run build
    '';
    clean.exec = ''
      npm run clean
    '';
    container-build.exec = ''
      clean
      docker build --build-arg APP_NAME=micropub --file Dockerfile --tag micropub:latest .
    '';
    container-dive.exec = "dive micropub:latest";
    container-inspect.exec = ''
      docker inspect micropub:latest --format json | jq "."
    '';
    # JWKS must be passed as stringified.
    container-run.exec = ''
      docker run \
        --env CLOUDFLARE_ACCOUNT_ID=${config.env.CLOUDFLARE_ACCOUNT_ID} \
        --env CLOUDFLARE_R2_ACCESS_KEY_ID=${config.env.CLOUDFLARE_R2_ACCESS_KEY_ID} \
        --env CLOUDFLARE_R2_BUCKET_NAME=${config.env.CLOUDFLARE_R2_BUCKET_NAME} \
        --env CLOUDFLARE_R2_SECRET_ACCESS_KEY=${config.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY} \
        --env DEBUG="*" \
        --env GITHUB_OAUTH_APP_CLIENT_ID=${config.env.GITHUB_OAUTH_APP_CLIENT_ID} \
        --env GITHUB_OAUTH_APP_CLIENT_SECRET=${config.env.GITHUB_OAUTH_APP_CLIENT_SECRET} \
        --env GITHUB_OWNER=jackdbd \
        --env GITHUB_REPO=giacomodebidda-content \
        --env GITHUB_TOKEN=${config.env.GITHUB_TOKEN} \
        --env JWKS=${config.env.JWKS} \
        --env LOG_LEVEL=debug \
        --env NODE_ENV=production \
        --env PORT=${config.env.PORT} \
        --env SECURE_SESSION_KEY_ONE=${micropub.session_key_one} \
        --env SECURE_SESSION_KEY_TWO=${micropub.session_key_two} \
        --env TELEGRAM_CHAT_ID=${telegram.chat_id} \
        --env TELEGRAM_TOKEN=${telegram.token} \
        --env TURSO_DATABASE_TOKEN=${turso.database_token} \
        --env TURSO_DATABASE_URL=${config.env.TURSO_DATABASE_URL} \
        --network host \
        --rm -i -t \
        micropub:latest
    '';
    container-scan.exec = ''
      trivy image --severity MEDIUM,HIGH,CRITICAL -f table micropub:latest
    '';
    debug.exec = ''
      npm run clean
      npm run build
      NODE_ENV=development NODE_OPTIONS='--inspect' PINO_LOG_LEVEL=debug node dist/server.js | npx pino-pretty
      # Then attach to the running Node.js server using the configuration that
      # has "request": "attach" in launch.json
    '';
    "debug:prod".exec = ''
      npm run clean
      npm run build
      NODE_ENV=production NODE_OPTIONS='--inspect' PINO_LOG_LEVEL=debug node dist/server.js | npx pino-pretty
      # Then attach to the running Node.js server using the configuration that
      # has "request": "attach" in launch.json
    '';
    "debug:test".exec = ''
      echo "debug test file $1.js"
      echo "Don't forget to set some breakpoints and attach to the Node.js process using the configuration that has \"request\": \"attach\" in launch.json"
      NODE_ENV=test node --inspect-brk --test test/$1.js
    '';
    dev.exec = ''
      npm run watch
    '';
    fly-deploy.exec = "fly deploy --ha=false --debug --verbose";
    fly-secrets-set-cloudflare.exec = ''
      fly secrets set CLOUDFLARE_R2_ACCESS_KEY_ID="${cloudflare_r2.personal.access_key_id}"
      fly secrets set CLOUDFLARE_R2_SECRET_ACCESS_KEY="${cloudflare_r2.personal.secret_access_key}"
    '';
    fly-secrets-set-github.exec = ''
      fly secrets set GITHUB_TOKEN="${config.env.GITHUB_TOKEN}"
      fly secrets set GITHUB_OAUTH_APP_CLIENT_SECRET="${config.env.GITHUB_OAUTH_APP_CLIENT_SECRET_PROD}"
    '';
    fly-secrets-set-jwks.exec = ''
      fly secrets set JWKS="${config.env.JWKS}"
    '';
    fly-secrets-set-secure-session-keys.exec = ''
      fly secrets set SECURE_SESSION_KEY_ONE="${micropub.session_key_one}"
      fly secrets set SECURE_SESSION_KEY_TWO="${micropub.session_key_two}"
    '';
    fly-secrets-set-telegram.exec = ''
      fly secrets set TELEGRAM_CHAT_ID="${telegram.chat_id}"
      fly secrets set TELEGRAM_TOKEN="${telegram.token}"
    '';
    fly-secrets-set-turso.exec = ''
      fly secrets set TURSO_DATABASE_TOKEN="${config.env.TURSO_DATABASE_TOKEN}"
    '';
    prod.exec = ''
      npm run build && npm run start
    '';
    rotate-jwks.exec = ''
      npx tsm scripts/generate-jwks.ts
      npx tsm scripts/deploy-jwks.ts
    '';
    versions.exec = ''
      echo "=== Versions ==="
      atlas version
      dive --version
      docker --version
      fly version
      git --version
      echo "Node.js $(node --version)"
      turso --version
      echo "=== === ==="
    '';
  };
}
