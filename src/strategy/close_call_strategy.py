from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from math import sqrt
from statistics import pstdev
from typing import Sequence


D = Decimal


@dataclass(frozen=True)
class StrategyConfig:
    fast_window: int = 5
    slow_window: int = 12
    momentum_window: int = 4
    volatility_window: int = 10
    max_volatility: Decimal = D("0.035")
    min_score: int = 3
    max_risk_fraction: Decimal = D("0.10")
    max_position_fraction: Decimal = D("0.25")
    fee_rate: Decimal = D("0.01")
    reference_window: Decimal = D("0.05")
    min_qty: Decimal = D("0.1")
    qty_step: Decimal = D("0.01")


@dataclass(frozen=True)
class Decision:
    action: str  # LONG, SHORT, WAIT
    score: int
    confidence: Decimal
    quantity: Decimal
    reason: str
    fast_ma: Decimal | None = None
    slow_ma: Decimal | None = None
    momentum: Decimal | None = None
    volatility: Decimal | None = None


def _ma(values: Sequence[Decimal], n: int) -> Decimal:
    return sum(values[-n:], D(0)) / D(n)


def _momentum(values: Sequence[Decimal], n: int) -> Decimal:
    return values[-1] / values[-1 - n] - D(1)


def _volatility(values: Sequence[Decimal], n: int) -> Decimal:
    sample = values[-(n + 1):]
    returns = [sample[i] / sample[i - 1] - D(1) for i in range(1, len(sample))]
    if len(returns) < 2:
        return D(0)
    return D(str(pstdev([float(x) for x in returns]))) * D(str(sqrt(len(returns))))


def _floor_step(value: Decimal, step: Decimal) -> Decimal:
    return (value // step) * step


def decide(
    prices: Sequence[Decimal],
    reference: Decimal,
    free_cash: Decimal,
    config: StrategyConfig = StrategyConfig(),
) -> Decision:
    """Return a conservative Close Call decision from recent prices.

    The function is deterministic and has no network or wallet side effects.
    """
    needed = max(config.slow_window, config.volatility_window + 1, config.momentum_window + 1)
    if len(prices) < needed:
        return Decision("WAIT", 0, D(0), D(0), "insufficient_history")
    if reference <= 0 or prices[-1] <= 0 or free_cash <= 0:
        return Decision("WAIT", 0, D(0), D(0), "invalid_market_state")

    px = prices[-1]
    distance = abs(px - reference) / reference
    if distance > config.reference_window:
        return Decision("WAIT", 0, D(0), D(0), "outside_reference_window")

    fast = _ma(prices, config.fast_window)
    slow = _ma(prices, config.slow_window)
    mom = _momentum(prices, config.momentum_window)
    vol = _volatility(prices, config.volatility_window)

    if vol > config.max_volatility:
        return Decision("WAIT", 0, D(0), D(0), "volatility_gate", fast, slow, mom, vol)

    score = 0
    if fast > slow:
        score += 1
    elif fast < slow:
        score -= 1
    if mom > D("0.002"):
        score += 2
    elif mom < D("-0.002"):
        score -= 2
    if px > fast:
        score += 1
    elif px < fast:
        score -= 1

    if abs(score) < config.min_score:
        return Decision("WAIT", score, D(abs(score)) / D(4), D(0), "weak_signal", fast, slow, mom, vol)

    action = "LONG" if score > 0 else "SHORT"
    confidence = min(D(1), D(abs(score)) / D(4))

    # Risk budget: reserve most cash and include the 1% per-side fee.
    risk_cash = free_cash * config.max_risk_fraction * confidence
    max_position_value = free_cash * config.max_position_fraction
    value = min(risk_cash, max_position_value)
    qty = _floor_step(value / px, config.qty_step)
    if qty < config.min_qty:
        return Decision("WAIT", score, confidence, D(0), "position_too_small", fast, slow, mom, vol)

    return Decision(action, score, confidence, qty, "signal_confirmed", fast, slow, mom, vol)
