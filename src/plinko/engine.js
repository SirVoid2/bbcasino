const crypto = require("crypto");
const { getMultipliers } = require("./multipliers");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function randomBytesFromSeed({ serverSeed, clientSeed, nonce }) {
  return crypto
    .createHmac("sha256", serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest();
}

function generatePath({ rows, serverSeed, clientSeed, nonce }) {
  const bytes = randomBytesFromSeed({ serverSeed, clientSeed, nonce });
  const path = [];
  let position = 0;

  for (let row = 0; row < rows; row += 1) {
    const byteIndex = row % bytes.length;
    const bit = (bytes[byteIndex] >> (row % 8)) & 1;
    const move = bit === 1 ? 1 : 0;
    position += move;
    path.push({ row, move, position });
  }

  return { path, landingIndex: position };
}

function resolvePlinko({ betAmount, rows, risk, serverSeed, clientSeed, nonce }) {
  const multipliers = getMultipliers(rows, risk);
  if (!multipliers) {
    throw new Error("Unsupported rows or risk level");
  }

  const { path, landingIndex } = generatePath({ rows, serverSeed, clientSeed, nonce });
  const multiplier = multipliers[landingIndex];
  const payout = Number((betAmount * multiplier).toFixed(2));

  return {
    path,
    landingIndex,
    multiplier,
    payout,
    serverSeedHash: sha256(serverSeed)
  };
}

module.exports = {
  sha256,
  resolvePlinko
};
