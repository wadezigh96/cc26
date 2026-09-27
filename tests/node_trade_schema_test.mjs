import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { test } from "node:test";
import { didFromPublicKey, verifyDidSignature } from "../scripts/did_key.mjs";
import { canonicalJson } from "../scripts/canonical_json.mjs";
import { isValidTradePayload, validateTradePayload } from "../scripts/trade_schema.mjs";

function validTrade() {
  return { type: "trade", season: "close-1", symbol: "xyz:NVDA", side: "LONG", quantity: "0.10", price: "180.00", timestamp: "1790497599447" };
}

test("valid trade payload passes schema and 5% reference gate", () => {
  assert.equal(validateTradePayload(validTrade(), { referencePrice: "180.00" }), true);
  assert.equal(isValidTradePayload({ ...validTrade(), price: "189.00" }, { referencePrice: "180.00" }), true);
  assert.equal(isValidTradePayload({ ...validTrade(), price: "189.01" }, { referencePrice: "180.00" }), false);
});

test("schema rejects tampered or malformed trade fields", () => {
  const cases = [["side", "BAD"], ["quantity", "0.09"], ["quantity", "0.105"], ["price", "0"], ["price", "180.001"], ["timestamp", "not-a-number"], ["symbol", "xyz:AAPL"]];
  for (const [field, value] of cases) assert.equal(isValidTradePayload({ ...validTrade(), [field]: value }), false, `${field}=${value} must be rejected`);
});

test("Ed25519 signature fails for every payload tamper", () => {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const spki = publicKey.export({ format: "der", type: "spki" });
  const did = didFromPublicKey(spki.subarray(-32));
  const original = validTrade();
  const message = Buffer.from(canonicalJson(original));
  const signature = sign(null, message, privateKey);
  assert.equal(verifyDidSignature(did, message, signature), true);
  for (const [field, value] of [["side", "SHORT"], ["quantity", "0.11"], ["price", "181.00"], ["timestamp", "1790497599448"]]) {
    const tampered = { ...original, [field]: value };
    assert.equal(verifyDidSignature(did, Buffer.from(canonicalJson(tampered)), signature), false, `signature must fail for ${field}`);
  }
});