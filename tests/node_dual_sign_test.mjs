import assert from "node:assert/strict";
import { test } from "node:test";
import { createDualSignedTrade, keyIdentity, verifyDualSignedTrade } from "../scripts/dual_sign.mjs";

function payload() {
  return { type:"trade", season:"close-1", symbol:"xyz:NVDA", side:"LONG", quantity:"0.10", price:"180.00", timestamp:"1790497599447" };
}

test("maker and taker sign identical canonical bytes", () => {
  const maker = keyIdentity();
  const taker = keyIdentity();
  const bundle = createDualSignedTrade(payload(), maker, taker);
  assert.notEqual(bundle.maker.did, bundle.taker.did);
  assert.equal(bundle.maker.message, bundle.taker.message);
  assert.equal(verifyDualSignedTrade(bundle), true);
});

test("dual signature rejects payload or signature tampering", () => {
  const bundle = createDualSignedTrade(payload(), keyIdentity(), keyIdentity());
  assert.equal(verifyDualSignedTrade(bundle), true);
  const tamperedPayload = { ...bundle, payload: { ...bundle.payload, quantity:"0.11" } };
  assert.equal(verifyDualSignedTrade(tamperedPayload), false);
  const tamperedMessage = { ...bundle, message: bundle.message.replace("0.10","0.11") };
  assert.equal(verifyDualSignedTrade(tamperedMessage), false);
  const tamperedSig = { ...bundle, maker: { ...bundle.maker, signature: bundle.taker.signature } };
  assert.equal(verifyDualSignedTrade(tamperedSig), false);
});