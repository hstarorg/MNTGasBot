# MNTGasBot
A MNT exchange bot worked on telegram

## Tg Webhook

```bash
# webhook URL
http://{host}:4004/api/bot-webhook/{botId}

# secretToken
hmacSha256(botId, Envs.APP_SECRET)
```

## Installation

```bash
$ pnpm install
```

## Running the app

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Test

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```
