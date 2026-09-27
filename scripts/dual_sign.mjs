import { generateKeyPairSync, sign } from "node:crypto";
import { canonicalJson } from "./canonical_json.mjs";
import { didFromPublicKey, verifyDidSignature } from "./did_key.mjs";

function keyIdentity() {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const spki = publicKey.export({ format: "der", type: "spki" });
  return { privateKey, did: didFromPublicKey(spki.subarray(-32)) };
}

export function buildTrade(payload) {
  return canonicalJson(payload);
}

export function signTrade(identity, payload) {
  const message = buildTrade(payload);
  return { did: identity.did, message, signature: sign(null, Buffer.from(message, "utf8"), identity.privateKey).toString("base64") };
}

export function verifyTradeSignature(signed) {
  return verifyDidSignature(signed.did, Buffer.from(signed.message, "utf8"), Buffer.from(signed.signature, "base64"));
}

export function createDualSignedTrade(payload, maker, taker) {
  const message = buildTrade(payload);
  return {
    payload,
    message,
    maker: signTrade(maker, payload),
    taker: signTrade(taker, payload),
  };
}

export function verifyDualSignedTrade(bundle) {
  const expected = buildTrade(bundle.payload);
  if (bundle.message !== expected) return false;
  if (bundle.maker.message !== expected || bundle.taker.message !== expected) return false;
  if (bundle.maker.did === bundle.taker.did) return false;
  return verifyTradeSignature(bundle.maker) && verifyTradeSignature(bundle.taker);
}

export { keyIdentity };