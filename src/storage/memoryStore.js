const crypto = require("crypto");

const users = new Map([
  ["demo", { id: "demo", balance: 1000 }]
]);

const sessions = new Map();
const bets = [];

function getUser(userId) {
  return users.get(userId) || null;
}

function updateBalance(userId, amount) {
  const user = users.get(userId);
  if (!user) {
    throw new Error("User not found");
  }
  user.balance = Number((user.balance + amount).toFixed(2));
  users.set(userId, user);
  return user.balance;
}

function createSession({ userId, serverSeed }) {
  const sessionId = crypto.randomUUID();
  const session = { id: sessionId, userId, serverSeed, nonce: 0 };
  sessions.set(sessionId, session);
  return session;
}

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

function incrementNonce(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }
  session.nonce += 1;
  sessions.set(sessionId, session);
  return session.nonce;
}

function recordBet(entry) {
  bets.push(entry);
}

module.exports = {
  getUser,
  updateBalance,
  createSession,
  getSession,
  incrementNonce,
  recordBet
};
