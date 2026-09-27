import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "mot de passe"');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 32);
process.stdout.write(`${salt.toString("base64url")}.${hash.toString("base64url")}\n`);
