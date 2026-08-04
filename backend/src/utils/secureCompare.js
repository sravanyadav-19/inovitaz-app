/**
 * Constant-time string/buffer comparison for signatures and HMACs.
 *
 * Avoids timing side-channels that arise from `===` / `!==` on secrets.
 * Length is checked first and returns early WITHOUT comparing contents,
 * so an attacker cannot learn the expected length via timing.
 */
const crypto = require('crypto');

const secureCompare = (a, b) => {
  const bufA = Buffer.from(String(a ?? ''), 'utf8');
  const bufB = Buffer.from(String(b ?? ''), 'utf8');

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
};

module.exports = { secureCompare };
