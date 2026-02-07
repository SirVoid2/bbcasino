const memoryStore = require("./memoryStore");

const store = {
  getUser: memoryStore.getUser,
  updateBalance: memoryStore.updateBalance,
  createSession: memoryStore.createSession,
  getSession: memoryStore.getSession,
  incrementNonce: memoryStore.incrementNonce,
  recordBet: memoryStore.recordBet
};

module.exports = {
  store
};
