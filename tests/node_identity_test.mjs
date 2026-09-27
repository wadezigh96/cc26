import assert from "node:assert/strict";
import { test } from "node:test";
import { generateKeyPairSync, sign } from "node:crypto";
import { didFromPublicKey, publicKeyFromDid, verifyDidSignature } from "../scripts/did_key.mjs";

test("Ed25519 did:key roundtrip and signature verification", () => {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const spki = publicKey.export({ format: "der", type: "spki" });
  const rawPublicKey = spki.subarray(-32);

  assert.equal(rawPublicKey.length, 32);

  const did = didFromPublicKey(rawPublicKey);
  assert.match(did, /^did:key:z/);
  assert.deepEqual(publicKeyFromDid(did), rawPublicKey);

  const message = Buffer.from('{"type":"trade","season":"close-1","symbol":"xyz:NVDA","side":"LONG","quantity":"0.10"}');
  const signature = sign(null, message, privateKey);

  assert.equal(signature.length, 64);
  assert.equal(verifyDidSignature(did, message, signature), true);
  assert.equal(verifyDidSignature(did, Buffer.from(message.toString().replace("0.10", "0.11")), signature), false);
});
