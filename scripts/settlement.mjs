import { validateTradePayload } from "./trade_schema.mjs";
import { canonicalJson } from "./canonical_json.mjs";

export function validateTimestampWindow(timestamp, { nowMs = Date.now(), maxAgeMs = 5 * 60 * 1000 } = {}) {
  if (typeof timestamp !== "string" || !/^\d+$/.test(timestamp)) return false;
  const t = Number(timestamp);
  if (!Number.isSafeInteger(t) || t <= 0) return false;
  return Math.abs(nowMs - t) <= maxAgeMs;
}

export function createSettlementEnvelope(bundle, { referencePrice = null, nowMs = Date.now(), maxAgeMs = 5 * 60 * 1000 } = {}) {
  validateTradePayload(bundle.payload, { referencePrice });
  if (!validateTimestampWindow(bundle.payload.timestamp, { nowMs, maxAgeMs })) {
    throw new Error("trade timestamp outside settlement window");
  }
  return {
    version: "cc26-settlement-v1",
    message: canonicalJson(bundle.payload),
    maker: bundle.maker,
    taker: bundle.taker,
  };
}

export function settlementId(envelope) {
  return canonicalJson(envelope);
}
