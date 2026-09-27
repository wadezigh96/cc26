import { sign, verify } from "node:crypto";
import { canonicalJson } from "./canonical_json.mjs";
import { didFromPublicKey, verifyDidSignature } from "./did_key.mjs";
import { validateTradePayload } from "./trade_schema.mjs";

const DID_RE = /^did:key:z6Mk[1-9A-HJ-NP-Za-km-z]{44}$/;
const TRADE_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const DECIMAL_RE = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

export const CLOSE_CALL_ROOMS = {
  trading: ["close1"],
  referee: [
    "d-close1-flow",
    "d-close1-state",
    "d-close1-price",
    "d-close1-positions",
    "d-close1-pnl",
  ],
};

export function encodeSignature(signature) {
  return signature.toString("base64url");
}

export function decodeSignature(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{86}$/.test(value)) {
    throw new Error("signature must be 86-character base64url without padding");
  }
  return Buffer.from(value, "base64url");
}

export function signingText(room, nonce, text) {
  if (typeof room !== "string" || !room) throw new Error("room required");
  if (!Number.isInteger(nonce) || nonce < 0) throw new Error("nonce must be a non-negative integer");
  if (typeof text !== "string" || !text || text.includes("\n") || text.includes("\r")) {
    throw new Error("text must be non-empty single-line UTF-8");
  }
  return `${room}|${nonce}|${text}`;
}

export function signRoomMessage(identity, room, nonce, text) {
  const message = signingText(room, nonce, text);
  return {
    did: identity.did,
    room,
    nonce,
    text,
    signature: encodeSignature(sign(null, Buffer.from(message, "utf8"), identity.privateKey)),
  };
}

export function verifyRoomMessage(message) {
  try {
    const bytes = decodeSignature(message.signature);
    return verifyDidSignature(
      message.did,
      Buffer.from(signingText(message.room, message.nonce, message.text), "utf8"),
      bytes,
    );
  } catch {
    return false;
  }
}

export function ownerPayload(did, season = "close-1") {
  if (!DID_RE.test(did)) throw new Error("invalid did:key");
  return { t: "owner", season, key: did };
}

export function ownerText(did, season = "close-1") {
  return canonicalJson(ownerPayload(did, season));
}

export function termsPayload({ id, maker, px, qty, side, taker = "any", until }) {
  if (!TRADE_ID_RE.test(id)) throw new Error("invalid trade id");
  if (!DID_RE.test(maker)) throw new Error("invalid maker did:key");
  if (!DECIMAL_RE.test(px) || Number(px) <= 0) throw new Error("invalid px");
  if (!DECIMAL_RE.test(qty) || Number(qty) < 0.1) throw new Error("invalid qty");
  if (side !== "buy" && side !== "sell") throw new Error("side must be buy or sell");
  if (taker !== "any" && !DID_RE.test(taker)) throw new Error("invalid taker");
  if (!Number.isInteger(until) || until < 1) throw new Error("invalid until");
  return { id, maker, px, qty, side, taker, until };
}

export function termsText(terms) {
  return canonicalJson(termsPayload(terms));
}

export function makerSigningText(terms) {
  return `close-1|terms|${termsText(terms)}`;
}

export function takerSigningText(terms, takerDid) {
  if (!DID_RE.test(takerDid)) throw new Error("invalid taker did:key");
  return `close-1|accept|${termsText(terms)}|${takerDid}`;
}

export function signMakerTerms(identity, terms) {
  const text = termsText(terms);
  return {
    did: identity.did,
    signature: encodeSignature(sign(null, Buffer.from(makerSigningText(terms), "utf8"), identity.privateKey)),
    text,
  };
}

export function signTakerTerms(identity, terms) {
  return {
    did: identity.did,
    signature: encodeSignature(sign(null, Buffer.from(takerSigningText(terms, identity.did), "utf8"), identity.privateKey)),
  };
}

export function buildTradeMessage(terms, takerDid, makerSig, takerSig) {
  if (!DID_RE.test(takerDid)) throw new Error("invalid taker did:key");
  const normalized = termsPayload(terms);
  if (!makerSig || !takerSig) throw new Error("both signatures required");
  return {
    t: "trade",
    season: "close-1",
    terms: normalized,
    taker: takerDid,
    maker_sig: makerSig,
    taker_sig: takerSig,
  };
}

export function verifyCloseCallTrade(trade) {
  try {
    if (!trade || trade.t !== "trade" || trade.season !== "close-1") return false;
    const terms = termsPayload(trade.terms);
    if (!DID_RE.test(trade.taker)) return false;
    if (terms.taker !== "any" && terms.taker !== trade.taker) return false;
    const makerSig = decodeSignature(trade.maker_sig);
    const takerSig = decodeSignature(trade.taker_sig);
    const makerBytes = Buffer.from(makerSigningText(terms), "utf8");
    const takerBytes = Buffer.from(takerSigningText(terms, trade.taker), "utf8");
    if (!verifyDidSignature(terms.maker, makerBytes, makerSig)) return false;
    return verifyDidSignature(trade.taker, takerBytes, takerSig);
  } catch {
    return false;
  }
}

