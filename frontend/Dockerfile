FROM ghcr.io/voidzero-dev/vite-plus:1.4.0@sha256:5dfa2031f7d014b6376407fd99e0747bed329d792c79c184a65ec9a0765bee0e AS base
WORKDIR /app
COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml .node-version ./

FROM base AS prod-deps
RUN vp install --prod --frozen-lockfile

FROM base AS build
RUN vp install --frozen-lockfile
COPY --chown=vp:vp . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN vp run build
RUN cp "$(vp env which node | head -1)" /tmp/node

FROM debian:bookworm-slim@sha256:99c0b25c46d0214d5a2091092e7908907dcaecd6a962cde0ac700acee222b6f3 AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends libatomic1 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY --from=build /tmp/node /usr/local/bin/node
COPY --from=build /app/package.json /app/package.json
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
USER nobody
EXPOSE 3000
CMD ["node", "node_modules/@react-router/serve/bin.cjs", "./build/server/index.js"]
