const { store } = require("../storage");

function debit(userId, amount) {
  return store.updateBalance(userId, -Math.abs(amount));
}

function credit(userId, amount) {
  return store.updateBalance(userId, Math.abs(amount));
}

module.exports = {
  debit,
  credit
};
