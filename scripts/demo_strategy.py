from decimal import Decimal as D

from src.strategy.close_call_strategy import decide


# Synthetic prices only. No network and no real trading.
prices = [D(str(x)) for x in [180, 180.2, 180.4, 180.7, 181.0, 181.4, 181.7, 182.0, 182.4, 182.8, 183.0, 183.4]]
result = decide(prices, D("183.00"), D("10000"))

print("CC26 SAFE MODE")
print("action:", result.action)
print("score:", result.score)
print("confidence:", result.confidence)
print("quantity:", result.quantity)
print("reason:", result.reason)
print("fast_ma:", result.fast_ma)
print("slow_ma:", result.slow_ma)
print("momentum:", result.momentum)
print("volatility:", result.volatility)
