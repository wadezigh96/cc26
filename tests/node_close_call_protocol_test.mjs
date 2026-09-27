import assert from "node:assert/strict";
import { test } from "node:test";
import { generateKeyPairSync } from "node:crypto";
import {
  ownerText,
  termsPayload,
  termsText,
  makerSigningText,
  takerSigningText,
  signMakerTerms,
  signTakerTerms,
  buildTradeMessage,
  verifyCloseCallTrade,
  signRoomMessage,
  verifyRoomMessage,
  didFromPublicKey,
} from "../scripts/close_call_protocol.mjs";

function identity() {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const spki = publicKey.export({ format: "der", type: "spki" });
  return { privateKey, did: didFromPublicKey(spki.subarray(-32)) };
}

test("owner registration is exact canonical JSON", () => {
  const a = identity();
  assert.equal(ownerText(a.did), `{"key":"${a.did}","season":"close-1","t":"owner"}`);
});

test("room signature uses exact room|nonce|text framing", () => {
  const a = identity();
  const text = ownerText(a.did);
  const signed = signRoomMessage(a, "close1", 7, text);
  assert.equal(signed.signature.length, 86);
  assert.equal(verifyRoomMessage(signed), true);
  assert.equal(verifyRoomMessage({ ...signed, nonce: 8 }), false);
  assert.equal(verifyRoomMessage({ ...signed, text: text.replace("owner", "trade") }), false);
});

test("terms and maker/taker signing match Close Call protocol", () => {
  const maker = identity();
  const taker = identity();
  const terms = termsPayload({
    id: "a7f3",
    maker: maker.did,
    px: "181.20",
    qty: "2",
    side: "sell",
    taker: "any",
    until: 1236,
  });
  assert.equal(
    termsText(terms),
    `{"id":"a7f3","maker":"${maker.did}","px":"181.20","qty":"2","side":"sell","taker":"any","until":1236}`,
  );
  const ms = signMakerTerms(maker, terms);
  const ts = signTakerTerms(taker, terms);
  const trade = buildTradeMessage(terms, taker.did, ms.signature, ts.signature);
  assert.equal(verifyCloseCallTrade(trade), true);
  assert.equal(verifyCloseCallTrade({ ...trade, taker_sig: ms.signature }), false);
  assert.equal(verifyCloseCallTrade({ ...trade, taker: maker.did }), false);
});

test("named taker must match countersigner", () => {
  const maker = identity();
  const taker = identity();
  const other = identity();
  const terms = termsPayload({
    id: "named",
    maker: maker.did,
    px: "181.20",
    qty: "0.10",
    side: "buy",
    taker: taker.did,
    until: 1236,
  });
  const ms = signMakerTerms(maker, terms);
  const ts = signTakerTerms(taker, terms);
  const trade = buildTradeMessage(terms, taker.did, ms.signature, ts.signature);
  assert.equal(verifyCloseCallTrade(trade), true);
  const wrong = buildTradeMessage(terms, other.did, ms.signature, ts.signature);
  assert.equal(verifyCloseCallTrade(wrong), false);
});

test("official trade shape is separate from legacy internal trade schema", () => {
  const maker = identity();
  const taker = identity();
  const terms = termsPayload({ id: "legacy-gap", maker: maker.did, px: "180.00", qty: "0.10", side: "buy", taker: "any", until: 2556 });
  const ms = signMakerTerms(maker, terms);
  const ts = signTakerTerms(taker, terms);
  const trade = buildTradeMessage(terms, taker.did, ms.signature, ts.signature);
  assert.equal(Object.keys(trade).sort().join(","), "maker_sig,season,taker,taker_sig,t,terms");
});
