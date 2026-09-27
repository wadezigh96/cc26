import { createHash } from "node:crypto";
import { canonicalJson } from "./canonical_json.mjs";
import { validateTradePayload } from "./trade_schema.mjs";

export function settlementId(envelope) {
  return createHash("sha256").update(canonicalJson(envelope), "utf8").digest("hex");
}

export class ReplayGuard {
  constructor() {
    this.seen = new Set();
  }

  accept(envelope) {
    const id = settlementId(envelope);
    if (this.seen.has(id)) return false;
    this.seen.add(id);
    return true;
  }

  has(envelope) {
    return this.seen.has(settlementId(envelope));
  }
}

export function validateSettlementEnvelope(envelope, { referencePrice = null } = {}) {
  if (!envelope || envelope.version !== "cc26-settlement-v1") {
    throw new Error("invalid settlement envelope version");
  }
  if (!envelope.maker || !envelope.taker) {
    throw new Error("settlement envelope requires maker and taker");
  }
  if (typeof envelope.message !== "string") {
    throw new Error("settlement message must be a string");
  }
  const payload = JSON.parse(envelope.message);
  validateTradePayload(payload, { referencePrice });
  if (envelope.maker.message !== envelope.message || envelope.taker.message !== envelope.message) {
    throw new Error("maker/taker messages must match settlement message");
  }
  return true;
}
