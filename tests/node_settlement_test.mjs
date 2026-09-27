import assert from "node:assert/strict";
import { test } from "node:test";
import { keyIdentity, createDualSignedTrade } from "../scripts/dual_sign.mjs";
import { createSettlementEnvelope, settlementId, validateSettlementEnvelope, ReplayGuard } from "../scripts/settlement.mjs";

function payload() {
  return { type:"trade", season:"close-1", symbol:"xyz:NVDA", side:"LONG", quantity:"0.10", price:"180.00", timestamp:"1790497599447" };
}

test("settlement envelope validates and produces deterministic ID", () => {
  const bundle = createDualSignedTrade(payload(), keyIdentity(), keyIdentity());
  const envelope = createSettlementEnvelope(bundle, { referencePrice:"180.00", nowMs:1790497599447 });
  assert.equal(validateSettlementEnvelope(envelope, { referencePrice:"180.00" }), true);
  assert.equal(settlementId(envelope), settlementId({ ...envelope }),);
});

test("replay guard accepts once and rejects the same settlement", () => {
  const bundle = createDualSignedTrade(payload(), keyIdentity(), keyIdentity());
  const envelope = createSettlementEnvelope(bundle, { nowMs:1790497599447 });
  const guard = new ReplayGuard();
  assert.equal(guard.accept(envelope), true);
  assert.equal(guard.accept(envelope), false);
  assert.equal(guard.has(envelope), true);
});

test("settlement rejects message tampering and stale timestamps", () => {
  const bundle = createDualSignedTrade(payload(), keyIdentity(), keyIdentity());
  const envelope = createSettlementEnvelope(bundle, { nowMs:1790497599447 });
  const tampered = { ...envelope, message: envelope.message.replace("0.10", "0.11") };
  assert.throws(() => validateSettlementEnvelope(tampered));
  assert.throws(() => createSettlementEnvelope(bundle, { nowMs:1790497599447 + 300001 }));
});
