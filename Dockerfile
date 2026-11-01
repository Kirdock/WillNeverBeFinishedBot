# ---- Client (Angular) ----
FROM node:24-alpine AS client-build
WORKDIR /app/client

# Newer node images don't ship yarn; --force avoids an error if the image does include it
RUN --mount=type=cache,target=/root/.npm npm install -g --force yarn@1.22.22

COPY client/package.json client/yarn.lock ./
RUN --mount=type=cache,target=/tmp/yarn-cache \
    YARN_CACHE_FOLDER=/tmp/yarn-cache yarn install --frozen-lockfile

COPY shared/ /app/shared/
COPY client/ ./
RUN yarn run build

# ---- Server ----
FROM node:24 AS main-build

# System deps first: rarely changes, so this layer stays cached
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/bot/server

# Install dependencies before copying sources so code changes don't invalidate this layer
COPY server/package.json server/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY shared/ /app/bot/shared/
COPY server/ ./
COPY --from=client-build /app/client/dist /app/bot/client/dist
RUN npm run build

# Only values that are actually set at build time need an ARG.
ARG version="develop"
ARG logLevel="debug"

# Runtime config, declared as ENV so tools like Synology Container Manager list
# them in the container setup. Secrets are declared EMPTY on purpose: they show up
# in the UI as fields to fill in, but no secret value ever ends up in the image.
ENV ROOT_DIR=/app/bot \
    VERSION=$version \
    LOG_LEVEL=$logLevel \
    HOST="http://localhost:5000" \
    PORT=4599 \
    SCOPE="identify" \
    DATABASE_NAME="willneverbefinishedbot" \
    DATABASE_USER="root" \
    CLIENT_TOKEN="" \
    CLIENT_SECRET="" \
    DATABASE_PASSWORD="" \
    WEBTOKEN_SECRET=""

EXPOSE 4599

CMD ["npm", "run", "start:production"]