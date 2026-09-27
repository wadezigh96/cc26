# CC26 Close Call protocol

This document maps the implementation to the official draft protocol for contest `close-1`.

## Implemented
- Owner registration payload: `{"t":"owner","season":"close-1","key":"<did:key>"}`.
- Room signing frame: `<room>|<nonce>|<text>`.
- Ed25519 signatures encoded as base64url without padding.
- Maker terms with exactly `id,maker,px,qty,side,taker,until`.
- Maker signature over `close-1|terms|<terms>`.
- Taker signature over `close-1|accept|<terms>|<taker did:key>`.
- Final trade envelope with `t,season,terms,taker,maker_sig,taker_sig`.
- Verification rejects signature tampering and named-taker mismatch.

## Current safety boundary
The repository does not post to technocore.chat automatically and does not expose or store a private key. Live posting remains a manual/local-key operation until the signed launch record is verified.

## Draft parameters
The current public contest configuration lists:
- contest: `close-1`
- market: `xyz:NVDA`
- mint: 10,000 POLF per owner key
- minimum quantity: 0.1
- 0.01 price/quantity steps
- ±5% reference window
- 1% fee
- lock: 2026-10-04 09:00 UTC

These values are draft until FLOP Labs publishes its signed launch record.
