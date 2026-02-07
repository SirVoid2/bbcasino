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
