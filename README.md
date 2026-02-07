# Plinko API (bbcasino)

This repository provides a Plinko-style game API intended to be embedded into a casino platform. The service exposes endpoints for configuration, session creation, and placing bets while integrating with a user/balance store.

## Quick start

```bash
npm install
npm run start
```

The service runs on `http://localhost:3000` by default.

## API overview

### `GET /health`
Returns a simple health response.

### `GET /api/plinko/config`
Returns supported rows, risk levels, and multiplier tables.

### `POST /api/plinko/session`
Creates a provably fair session.

**Body**
```json
{
  "userId": "demo"
}
```

### `POST /api/plinko/play`
Places a bet and resolves the Plinko outcome.

**Body**
```json
{
  "userId": "demo",
  "sessionId": "<session-id>",
  "betAmount": 5,
  "rows": 16,
  "risk": "low",
  "clientSeed": "optional"
}
```

### `GET /api/plinko/session/:sessionId`
Returns the server seed hash and current nonce for the session.

## Database integration

The service uses a storage adapter defined in `src/storage/index.js`. Replace the `memoryStore` with your casino platform's database logic to connect user records, balances, and bet history.

Key methods to implement:
- `getUser(userId)`
- `updateBalance(userId, amount)`
- `createSession({ userId, serverSeed })`
- `getSession(sessionId)`
- `incrementNonce(sessionId)`
- `recordBet(entry)`

## Provably fair notes

Each session generates a `serverSeed` and returns the `serverSeedHash` to the client. A `clientSeed` plus a monotonically increasing `nonce` determine the ball path for each bet.

## Deploying to Vercel

### Option A: Static casino site only (recommended)
The casino UI lives in `public/`, so you can deploy it as a static site.

1. Create a new Vercel project and import this repo.
2. Set **Framework Preset** to `Other`.
3. Leave **Build Command** empty.
4. Set **Output Directory** to `public`.
5. Deploy.

### Option B: API + static site
If you want to deploy the Express API alongside the static site, you will need to add a Vercel serverless entrypoint and routing (`api/` handler + `vercel.json`). Reach out and we can wire that up for you.
