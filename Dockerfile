# syntax = docker/dockerfile:1

# Adjust BUN_VERSION as desired
ARG BUN_VERSION=1.2.11
FROM oven/bun:${BUN_VERSION}-slim AS base

LABEL fly_launch_runtime="Bun/Prisma"

# Bun/Prisma app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Accept build version for cache busting (e.g. git hash)
ARG BUILD_VERSION=prod
ENV BUILD_VERSION=$BUILD_VERSION


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential openssl pkg-config python-is-python3

# Install node modules
COPY bun.lock package.json ./
RUN bun install --ci

# Copy application code
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Build application
RUN bun build --minify --target bun --outdir build src/index.ts

# Build CSS with Tailwind v4
RUN bunx @tailwindcss/cli@next -i ./src/styles/main.css -o ./public/styles.css

# Remove development dependencies
RUN rm -rf node_modules && \
    bun install --ci --production


# Final stage for app image
FROM base

# Install packages needed for deployment
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y openssl && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Copy built application
COPY --from=build /app/build/index.js /app
COPY --from=build /app/prisma /app/prisma
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/src/views /app/src/views
COPY --from=build /app/public /app/public
COPY --from=build /app/package.json /app/package.json

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "bun", "run", "index.js" ]