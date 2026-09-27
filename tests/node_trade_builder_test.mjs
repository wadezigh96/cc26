import assert from "node:assert/strict";
import { test } from "node:test";
import { buildTrade, tradeBytes } from "../scripts/trade_builder.mjs";
import { createDualSignedTrade, keyIdentity, verifyDualSignedTrade } from "../scripts/dual_sign.mjs";

test("trade builder validates and emits deterministic payload", () => {
  const trade = buildTrade({ side:"LONG", quantity:"0.10", price:"180.00", timestamp:"1790497599447" }, { referencePrice:"180.00" });
  assert.equal(trade.type, "trade");
  assert.equal(trade.symbol, "xyz:NVDA");
  assert.equal(tradeBytes(trade, { referencePrice:"180.00" }).toString(), JSON.stringify({price:"180.00",quantity:"0.10",season:"close-1",side:"LONG",symbol:"xyz:NVDA",timestamp:"1790497599447",type:"trade"}));
});

test("invalid reference-window trade cannot reach dual signing", () => {
  assert.throws(() => buildTrade({ side:"LONG", quantity:"0.10", price:"190.01", timestamp:"1790497599447" }, { referencePrice:"180.00" }));
});

test("validated trade flows through maker+taker signing", () => {
  const trade = buildTrade({ side:"SHORT", quantity:"0.10", price:"180.00", timestamp:"1790497599448" }, { referencePrice:"180.00" });
  const bundle = createDualSignedTrade(trade, keyIdentity(), keyIdentity());
  assert.equal(verifyDualSignedTrade(bundle), true);
});