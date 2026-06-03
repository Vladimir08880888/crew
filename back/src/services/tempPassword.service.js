import crypto from 'node:crypto';

// Alphabet sans caractères ambigus (0/O, 1/l/I, etc.)
const ALPHABET = 'abcdefghkmnpqrstuvwxyz23456789ABCDEFGHKMNPQRSTUVWXYZ';

export function generateTempPassword(length = 10) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}
