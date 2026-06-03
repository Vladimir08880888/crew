import crypto from 'node:crypto';

export function randomHex(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function randomInviteCode() {
  const part = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `FAM-${part()}-${part()}`;
}
