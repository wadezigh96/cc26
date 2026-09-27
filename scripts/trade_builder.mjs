import { canonicalJson } from "./canonical_json.mjs";
import { validateTradePayload } from "./trade_schema.mjs";

export function buildTrade({ side, quantity, price, timestamp, season = "close-1", symbol = "xyz:NVDA" }, { referencePrice = null } = {}) {
  const payload = { type: "trade", season, symbol, side, quantity, price, timestamp };
  validateTradePayload(payload, { referencePrice });
  return payload;
}

export function tradeBytes(payload, options = {}) {
  validateTradePayload(payload, options);
  return Buffer.from(canonicalJson(payload), "utf8");
}