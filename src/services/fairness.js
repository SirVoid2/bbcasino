const crypto = require("crypto");
const { sha256 } = require("../plinko/engine");
const { store } = require("../storage");

function createSession(userId) {
  const serverSeed = crypto.randomBytes(32).toString("hex");
  const session = store.createSession({ userId, serverSeed });
  return {
    sessionId: session.id,
    serverSeedHash: sha256(serverSeed)
  };
}

function getSession(sessionId) {
  return store.getSession(sessionId);
}

function nextNonce(sessionId) {
  return store.incrementNonce(sessionId);
}

module.exports = {
  createSession,
  getSession,
  nextNonce
};
