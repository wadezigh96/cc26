import { createPrivateKey, createPublicKey } from "node:crypto";
import { readFileSync } from "node:fs";
import { signRoomMessage, ownerText } from "./close_call_protocol.mjs";
import { didFromPublicKey } from "./did_key.mjs";

const keyPath = process.env.CC26_PRIVATE_KEY_FILE;
const room = process.env.CC26_ROOM ?? "close1";
const nonceRaw = process.env.CC26_NONCE ?? "0";
const season = process.env.CC26_SEASON ?? "close-1";

if (!keyPath) {
  console.error("Set CC26_PRIVATE_KEY_FILE to your local PKCS8 base64 private-key file.");
  process.exit(2);
}

const nonce = Number(nonceRaw);
if (!Number.isInteger(nonce) || nonce < 0) {
  console.error("CC26_NONCE must be a non-negative integer.");
  process.exit(2);
}

const privateKey = createPrivateKey({
  key: Buffer.from(readFileSync(keyPath, "utf8").trim(), "base64"),
  format: "der",
  type: "pkcs8",
});
const publicKey = createPublicKey(privateKey);
const rawPublicKey = publicKey.export({ format: "der", type: "spki" }).subarray(-32);
const did = didFromPublicKey(rawPublicKey);
const text = ownerText(did, season);
const signed = signRoomMessage({ privateKey, did }, room, nonce, text);

console.log("DID:", did);
console.log("ROOM:", room);
console.log("NONCE:", nonce);
console.log("TEXT:", text);
console.log("SIGNING_TEXT:", `${room}|${nonce}|${text}`);
console.log("SIGNATURE_BASE64URL:", signed.signature);
console.log("PRIVATE_KEY_USED: yes (not printed)");
console.log("");
console.log("POST PAYLOAD:");
console.log(JSON.stringify({ t: "owner", season, key: did }));
