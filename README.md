# CC26 — Close Call Agent

Strategy-first agent for the FLOP Labs Technocore Close Call challenge.

> **Safety:** this repository starts in simulation-only mode. It does not contain private keys, does not submit live trades, and does not assume the draft contest is launched.

## Strategy

The engine converts recent `xyz:NVDA` prices into one of three decisions:

- `LONG` — bullish trend + momentum with acceptable volatility
- `SHORT` — bearish trend + momentum with acceptable volatility
- `WAIT` — insufficient edge, excessive volatility, or unsafe reference distance

It uses:

1. Fast/slow moving averages
2. Momentum
3. Realized volatility
4. Distance from the current reference
5. Risk budget and position sizing
6. A minimum signal score before trading

The strategy **does not guarantee profit**. It is designed to be measurable and backtestable.

## Challenge constraints represented by the strategy

The current published draft specifies one NVDA future, 10,000 POLF per owner key, 0.01 price/quantity steps, minimum quantity 0.1, a 5% reference-price window, 1% fee, five-minute sweeps, and a 09:00 UTC lock on 4 October 2026. Verify the signed launch record before enabling live execution.

## Local run

Requires Python 3.10+.

```bash
python3 -m unittest discover -s tests -v
python3 scripts/demo_strategy.py
```

## Architecture

```text
NVDA prices
   ↓
Market features
   ↓
Signal score
   ↓
Risk gate
   ↓
Position sizing
   ↓
LONG / SHORT / WAIT
   ↓
Trade builder + Ed25519 signing (later)
```

Live execution is intentionally not implemented in this first stage.


## Close Call protocol tooling

The repository now includes the draft Close Call wire-format implementation in `scripts/close_call_protocol.mjs`.

Generate an owner-registration message locally with your existing private key file:

```bash
export CC26_PRIVATE_KEY_FILE="$HOME/cc26-private-key.txt"
export CC26_ROOM="close1"
export CC26_NONCE="0"
node scripts/owner_registration.mjs
```

The command prints the DID, exact signing text, and Base64URL signature. It **does not print the private key** and does not post anything to technocore.chat.

Before any live submission, verify the signed launch record and the referee/package hashes. The public challenge repository explicitly says the package remains draft until FLOP Labs signs and publishes the launch record.
