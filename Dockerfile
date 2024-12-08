# === STAGE 1 ================================================================ #
FROM node:20.1-bullseye AS builder

LABEL maintainer="giacomo@giacomodebidda.com"

# An ARG instruction goes out of scope at the end of the build stage where it
# was defined.
# To use an arg in multiple stages, EACH STAGE must include the ARG instruction.
# https://docs.docker.com/engine/reference/builder/#scope
ARG APP_NAME=micropub
RUN if [ -z "${APP_NAME}" ] ; then echo "The APP_NAME argument is missing!" ; exit 1; fi

# RUN apt-get update && apt-get install --quiet --assume-yes sudo \
#   tree

ENV APP_DIR=/usr/src/app

WORKDIR ${APP_DIR}

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install --location=global typescript@5.6.3 && \
    npm install --omit=dev && \
    npm install --save-dev @types/node@22.7.7

# If we bake the public JWKS into the container image, then we need to rebuild
# the container image every time we want to rotate the keys. So it's probably
# not a great idea.
# COPY assets/jwks-pub.json ./assets/jwks-pub.json
COPY src/templates ./dist/templates
COPY src/public ./dist/public
COPY custom-types ./custom-types
COPY src ./src

# This is for troubleshooting TypeScript configuration
# RUN tsc --project tsconfig.json \
#     --typeRoots ${APP_DIR}/node_modules/@types \
#     --typeRoots ${APP_DIR}/custom-types \
#     --showConfig

RUN tsc --project tsconfig.json \
    --typeRoots ${APP_DIR}/node_modules/@types \
    --typeRoots ${APP_DIR}/custom-types

# check source code (TS), compiled code (JS), don't show dependencies and types
# https://zaiste.net/posts/tree-ignore-directories-patterns/
# RUN tree -I 'custom-types|node_modules' -a -L 3 ${APP_DIR}

# === STAGE 2 ================================================================ #
FROM node:20.1-bullseye-slim

# Each ARG goes out of scope at the end of the build stage where it was
# defined. That's why we have to repeat it here in this stage.
ARG APP_NAME

# RUN apt-get update && apt-get install --quiet --assume-yes sudo \
#   lsb-release \
#   tree

ENV APP_GROUP=micropub-group \
    APP_USER=micropub-user \
    APP_PORT=8080 \
    BUILDER_APP_DIR=/usr/src/app

# add a non-privileged user
RUN groupadd --system ${APP_GROUP} && \
    useradd --system --gid ${APP_GROUP} --create-home ${APP_USER} --comment "container user account" && \
    mkdir -p /home/${APP_USER}/${APP_NAME}

WORKDIR /home/${APP_USER}/${APP_NAME}

# open a non-privileged port for the app to listen to
EXPOSE ${APP_PORT}

# Baking the JWKS into the image is probably not a good idea. See comment at stage 1.
# COPY --from=builder ${BUILDER_APP_DIR}/assets/jwks-pub.json ./assets/jwks-pub.json
COPY --from=builder ${BUILDER_APP_DIR}/package.json ./
COPY --from=builder ${BUILDER_APP_DIR}/node_modules ./node_modules
COPY --from=builder ${BUILDER_APP_DIR}/dist ./dist

RUN chown -R ${APP_USER} ./

# RUN echo "RUNNER APP_NAME is ${APP_NAME} and WORKDIR is /home/${APP_USER}/${APP_NAME}"

# run everything AFTER as non-privileged user
USER ${APP_USER}

# check source code and installed dependencies
# RUN tree -a -L 3 .
# check permissions
# RUN ls -1la

# I like to keep this line for troubleshooting
# RUN echo "App ${APP_NAME} will be run by user $(whoami) on $(lsb_release -i -s) $(lsb_release -r -s) and will listen on port ${APP_PORT}"

ENTRYPOINT ["node", "dist/server.js"]
