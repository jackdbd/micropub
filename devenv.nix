{
  config,
  inputs,
  lib,
  pkgs,
  ...
}: let
  fly_micropub = builtins.fromJSON (builtins.readFile /run/secrets/fly/micropub);
in {
  enterShell = ''
    versions
  '';

  enterTest = ''
    echo "Assert Node.js version is 20.11.1"
    node --version | grep "20.11.1"
  '';

  env = {
    ACCESS_TOKEN = "todo";
    DEBUG = "*";
    FLY_API_TOKEN = fly_micropub.deploy_token;
    LOG_LEVEL = "debug";
    PORT = "3001";
    BASE_URL = "http://localhost:${config.env.PORT}";
    TELEGRAM = builtins.readFile /run/secrets/telegram/jackdbd_github_bot;
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
        --env DEBUG="micropub:*" \
        --env LOG_LEVEL=debug \
        --env NODE_ENV=development \
        --env PORT=${config.env.PORT} \
        --network host \
        --rm -i -t \
        micropub:latest
    '';
    container-scan.exec = ''
      trivy image --severity MEDIUM,HIGH,CRITICAL -f table micropub:latest
    '';
    dev.exec = ''
      clean
      npx tsm ./src/server.ts
    '';
    fly-deploy.exec = "fly deploy --ha=false --debug --verbose";
    # fly-secrets-set.exec = ''
    #   fly secrets set SECRET="${config.env.SECRET}"
    # '';
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
