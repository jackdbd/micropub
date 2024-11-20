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
    DEBUG = "micropub:*";
    FLY_API_TOKEN = fly_micropub.deploy_token;
    GITHUB_OWNER = "jackdbd";
    GITHUB_REPO = "giacomodebidda-content";
    GITHUB_TOKEN = builtins.readFile /run/secrets/github-tokens/crud_contents_api;
    LOG_LEVEL = "info";
    PORT = "3001";
    SECURE_SESSION_KEY_ONE = micropub.session_key_one;
    SECURE_SESSION_KEY_TWO = micropub.session_key_two;
    TELEGRAM_CHAT_ID = telegram.chat_id;
    TELEGRAM_TOKEN = telegram.token;
  };

  languages = {
    nix.enable = true;
  };

  packages = with pkgs; [
    dive # tool for exploring each layer in a docker image
    entr # run arbitrary commands when files change
    git
    nodejs
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
      npx tsc -p tsconfig.json
    '';
    clean.exec = ''
      rm -rfv dist/
    '';
    container-build.exec = ''
      clean
      docker build --build-arg APP_NAME=micropub --file Dockerfile --tag micropub:latest .
    '';
    container-dive.exec = "dive micropub:latest";
    container-inspect.exec = ''
      docker inspect micropub:latest --format json | jq "."
    '';
    container-run.exec = ''
      docker run \
        --env CLOUDFLARE_ACCOUNT_ID=${config.env.CLOUDFLARE_ACCOUNT_ID} \
        --env CLOUDFLARE_R2_ACCESS_KEY_ID=${config.env.CLOUDFLARE_R2_ACCESS_KEY_ID} \
        --env CLOUDFLARE_R2_BUCKET_NAME=${config.env.CLOUDFLARE_R2_BUCKET_NAME} \
        --env CLOUDFLARE_R2_SECRET_ACCESS_KEY=${config.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY} \
        --env DEBUG="*" \
        --env GITHUB_OWNER=jackdbd \
        --env GITHUB_REPO=giacomodebidda-content \
        --env GITHUB_TOKEN=${config.env.GITHUB_TOKEN} \
        --env LOG_LEVEL=debug \
        --env NODE_ENV=development \
        --env PORT=${config.env.PORT} \
        --env SECURE_SESSION_KEY_ONE=${micropub.session_key_one} \
        --env SECURE_SESSION_KEY_TWO=${micropub.session_key_two} \
        --env TELEGRAM_CHAT_ID=${telegram.chat_id} \
        --env TELEGRAM_TOKEN=${telegram.token} \
        --network host \
        --rm -i -t \
        micropub:latest
    '';
    container-scan.exec = ''
      trivy image --severity MEDIUM,HIGH,CRITICAL -f table micropub:latest
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
    '';
    fly-secrets-set-secure-session-keys.exec = ''
      fly secrets set SECURE_SESSION_KEY_ONE="${micropub.session_key_one}"
      fly secrets set SECURE_SESSION_KEY_TWO="${micropub.session_key_two}"
    '';
    fly-secrets-set-telegram.exec = ''
      fly secrets set TELEGRAM_CHAT_ID="${telegram.chat_id}"
      fly secrets set TELEGRAM_TOKEN="${telegram.token}"
    '';
    versions.exec = ''
      echo "=== Versions ==="
      dive --version
      docker --version
      fly version
      git --version
      echo "Node.js $(node --version)"
      echo "=== === ==="
    '';
  };
}
