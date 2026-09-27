import { createPrivateKey, createPublicKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { didFromPublicKey } from "./did_key.mjs";

const keyPath = process.env.CC26_PRIVATE_KEY_FILE;
if (!keyPath) {
  console.error("Set CC26_PRIVATE_KEY_FILE to a local file containing PRIVATE_KEY_PKCS8_BASE64.");
  process.exit(2);
}

const privateKeyBase64 = readFileSync(keyPath, "utf8").trim();
const privateKey = createPrivateKey({
  key: Buffer.from(privateKeyBase64, "base64"),
  format: "der",
  type: "pkcs8",
});

// A private key must be converted to a public KeyObject before exporting SPKI.
const publicKey = createPublicKey(privateKey);
const rawPublicKey = publicKey.export({ format: "der", type: "spki" }).subarray(-32);
const did = didFromPublicKey(rawPublicKey);

const payload = {
  type: "trade",
  season: "close-1",
  symbol: "xyz:NVDA",
  side: process.env.CC26_SIDE ?? "LONG",
  quantity: process.env.CC26_QUANTITY ?? "0.10",
  price: process.env.CC26_PRICE ?? "0",
  timestamp: process.env.CC26_TIMESTAMP ?? String(Date.now()),
};

const message = JSON.stringify(payload);
const signature = sign(null, Buffer.from(message), privateKey);

console.log("DID:", did);
console.log("TRADE_MESSAGE:", message);
console.log("SIGNATURE_BASE64:", signature.toString("base64"));
console.log("PRIVATE_KEY_USED: yes (not printed)");
