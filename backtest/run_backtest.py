from __future__ import annotations

import json
from decimal import Decimal
from pathlib import Path

FEE = Decimal("0.01")
START = Decimal("10000")


def run(rows: list[dict], qty: Decimal = Decimal("1")) -> dict:
    if not rows:
        raise ValueError("rows must not be empty")

    cash = START
    position = Decimal("0")
    entry = Decimal("0")
    fees = Decimal("0")
    trades = 0
    wins = 0
    equity_peak = START
    max_drawdown = Decimal("0")

    for row in rows:
        ref = Decimal(row["reference"])
        close = Decimal(row["close"])
        px = Decimal(row["signalPrice"])
        if abs(px - ref) / ref > Decimal("0.05"):
            continue

        # Deterministic example policy: follow the next observed close direction.
        # This is a test harness, not a live predictive signal.
        side = Decimal("1") if close > ref else Decimal("-1")
        if position == 0:
            position = side * qty
            entry = px
            fee = px * qty * FEE
            cash -= fee
            fees += fee
            trades += 1
        elif position != side:
            pnl = (px - entry) * position
            fee = px * qty * FEE
            cash += pnl - fee
            fees += fee
            wins += int(pnl > 0)
            position = side * qty
            entry = px
            trades += 1

        mark = cash + ((close - entry) * position if position else Decimal("0"))
        equity_peak = max(equity_peak, mark)
        max_drawdown = max(max_drawdown, equity_peak - mark)

    final = cash + ((Decimal(rows[-1]["close"]) - entry) * position if position else Decimal("0"))
    return {
        "final_balance": str(final),
        "net_pnl": str(final - START),
        "trades": trades,
        "wins": wins,
        "fees": str(fees),
        "max_drawdown": str(max_drawdown),
        "position": str(position),
    }


if __name__ == "__main__":
    rows = json.loads(Path(__file__).with_name("sample-sweeps.json").read_text())
    print(json.dumps(run(rows), indent=2))
