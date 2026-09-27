import assert from "node:assert/strict";
import { test } from "node:test";
import { canonicalJson } from "../scripts/canonical_json.mjs";

test("canonical JSON sorts trade fields like Python", () => {
  const payload = {
    type: "trade",
    season: "close-1",
    symbol: "xyz:NVDA",
    side: "LONG",
    quantity: "0.10",
    price: "0",
    timestamp: "1234567890",
  };

  assert.equal(
    canonicalJson(payload),
    '{"price":"0","quantity":"0.10","season":"close-1","side":"LONG","symbol":"xyz:NVDA","timestamp":"1234567890","type":"trade"}',
  );
});
