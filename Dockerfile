FROM oven/bun:latest

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN bun install

COPY . .

EXPOSE 3000

CMD ["bun", "run", "dev"]
