const TRADE_KEYS = ["type", "season", "symbol", "side", "quantity", "price", "timestamp"];
const DECIMAL_RE = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

function fail(message) { throw new Error(message); }

function decimalToCents(value, field) {
  if (typeof value !== "string" || !DECIMAL_RE.test(value)) fail(`${field} must be a canonical non-negative decimal string`);
  const [whole, fraction = ""] = value.split(".");
  if (fraction.length > 2) fail(`${field} must use at most 2 decimal places`);
  return BigInt(whole) * 100n + BigInt((fraction + "00").slice(0, 2));
}

export function validateTradePayload(payload, { referencePrice = null } = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) fail("trade payload must be an object");
  const keys = Object.keys(payload).sort();
  const expected = [...TRADE_KEYS].sort();
  if (keys.length !== expected.length || keys.some((key, i) => key !== expected[i])) fail(`trade payload fields must be exactly: ${TRADE_KEYS.join(", ")}`);
  if (payload.type !== "trade") fail("type must be trade");
  if (payload.season !== "close-1") fail("season must be close-1");
  if (payload.symbol !== "xyz:NVDA") fail("symbol must be xyz:NVDA");
  if (payload.side !== "LONG" && payload.side !== "SHORT") fail("side must be LONG or SHORT");
  const quantityCents = decimalToCents(payload.quantity, "quantity");
  if (quantityCents < 10n) fail("quantity must be at least 0.10");
  const priceCents = decimalToCents(payload.price, "price");
  if (priceCents <= 0n) fail("price must be greater than 0");
  if (typeof payload.timestamp !== "string" || !/^\d+$/.test(payload.timestamp) || BigInt(payload.timestamp) <= 0n) fail("timestamp must be a positive integer string");
  if (referencePrice !== null) {
    const ref = decimalToCents(String(referencePrice), "referencePrice");
    if (ref <= 0n) fail("referencePrice must be greater than 0");
    const distance = priceCents >= ref ? priceCents - ref : ref - priceCents;
    if (distance * 100n > ref * 5n) fail("price is outside the 5% reference window");
  }
  return true;
}

export function isValidTradePayload(payload, options = {}) {
  try { return validateTradePayload(payload, options); } catch { return false; }
}

export { TRADE_KEYS };