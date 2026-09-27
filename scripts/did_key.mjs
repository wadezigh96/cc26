import { createPublicKey, verify } from "node:crypto";

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58btcEncode(buf) {
  let n = BigInt("0x" + buf.toString("hex"));
  let out = "";
  while (n > 0n) {
    out = ALPHABET[Number(n % 58n)] + out;
    n /= 58n;
  }
  for (const b of buf) {
    if (b !== 0) break;
    out = "1" + out;
  }
  return out || "1";
}

export function base58btcDecode(value) {
  let n = 0n;
  for (const ch of value) {
    const i = ALPHABET.indexOf(ch);
    if (i < 0) throw new Error("invalid base58btc character");
    n = n * 58n + BigInt(i);
  }
  const hex = n === 0n ? "" : n.toString(16).padStart(2, "0");
  const bytes = hex ? Buffer.from(hex.length % 2 ? "0" + hex : hex, "hex") : Buffer.alloc(0);
  let pad = 0;
  for (const ch of value) {
    if (ch !== "1") break;
    pad++;
  }
  return Buffer.concat([Buffer.alloc(pad), bytes]);
}

export function publicKeyFromDid(did) {
  if (!did.startsWith("did:key:z")) throw new Error("expected did:key:z...");
  const decoded = base58btcDecode(did.slice("did:key:z".length));
  if (decoded.length !== 34 || decoded[0] !== 0xed || decoded[1] !== 0x01) {
    throw new Error("DID is not an Ed25519 did:key");
  }
  return decoded.subarray(2);
}

export function didFromPublicKey(rawPublicKey) {
  if (rawPublicKey.length !== 32) throw new Error("Ed25519 public key must be 32 bytes");
  return "did:key:z" + base58btcEncode(Buffer.concat([Buffer.from([0xed, 0x01]), rawPublicKey]));
}

export function verifyDidSignature(did, message, signature) {
  const raw = publicKeyFromDid(did);
  const spki = Buffer.concat([
    Buffer.from("302a300506032b6570032100", "hex"),
    raw,
  ]);
  return verify(null, message, createPublicKey({ key: spki, format: "der", type: "spki" }), signature);
}
