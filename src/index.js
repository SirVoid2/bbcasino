const express = require("express");
const crypto = require("crypto");
const { DEFAULT_ROWS, DEFAULT_RISK, getMultipliers } = require("./plinko/multipliers");
const { resolvePlinko, sha256 } = require("./plinko/engine");
const { store } = require("./storage");
const { createSession, getSession, nextNonce } = require("./services/fairness");
const { debit, credit } = require("./services/ledger");

const app = express();
app.use(express.json());
app.use(express.static("public"));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/plinko/config", (req, res) => {
  res.json({
    rows: DEFAULT_ROWS,
    riskLevels: DEFAULT_RISK,
    multipliers: DEFAULT_ROWS.reduce((acc, rows) => {
      acc[rows] = DEFAULT_RISK.reduce((riskAcc, risk) => {
        riskAcc[risk] = getMultipliers(rows, risk);
        return riskAcc;
      }, {});
      return acc;
    }, {})
  });
});

app.post("/api/plinko/session", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  const user = store.getUser(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const session = createSession(userId);
  return res.json(session);
});

app.post("/api/plinko/play", (req, res) => {
  const { userId, betAmount, rows, risk, clientSeed, sessionId } = req.body;

  if (!userId || !sessionId) {
    return res.status(400).json({ error: "userId and sessionId are required" });
  }

  if (!betAmount || betAmount <= 0) {
    return res.status(400).json({ error: "betAmount must be greater than 0" });
  }

  const session = getSession(sessionId);
  if (!session || session.userId !== userId) {
    return res.status(404).json({ error: "Session not found" });
  }

  const user = store.getUser(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.balance < betAmount) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  const nonce = nextNonce(sessionId);
  const safeClientSeed = clientSeed || crypto.randomBytes(16).toString("hex");

  const outcome = resolvePlinko({
    betAmount,
    rows,
    risk,
    serverSeed: session.serverSeed,
    clientSeed: safeClientSeed,
    nonce
  });

  debit(userId, betAmount);
  if (outcome.payout > 0) {
    credit(userId, outcome.payout);
  }

  store.recordBet({
    userId,
    betAmount,
    rows,
    risk,
    clientSeed: safeClientSeed,
    nonce,
    payout: outcome.payout,
    multiplier: outcome.multiplier,
    serverSeedHash: outcome.serverSeedHash,
    createdAt: new Date().toISOString()
  });

  return res.json({
    outcome: {
      landingIndex: outcome.landingIndex,
      multiplier: outcome.multiplier,
      payout: outcome.payout,
      path: outcome.path
    },
    balance: store.getUser(userId).balance,
    fairness: {
      serverSeedHash: outcome.serverSeedHash,
      clientSeed: safeClientSeed,
      nonce
    }
  });
});

app.get("/api/plinko/session/:sessionId", (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  return res.json({
    sessionId: session.id,
    userId: session.userId,
    serverSeedHash: sha256(session.serverSeed),
    nonce: session.nonce
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Plinko API listening on port ${port}`);
});
