import unittest
from decimal import Decimal as D

from src.strategy.close_call_strategy import decide


class StrategyTests(unittest.TestCase):
    def test_waits_without_history(self):
        result = decide([D("180"), D("181")], D("181"), D("10000"))
        self.assertEqual(result.action, "WAIT")
        self.assertEqual(result.reason, "insufficient_history")

    def test_rejects_price_outside_reference_window(self):
        prices = [D("200")] * 12
        result = decide(prices, D("180"), D("10000"))
        self.assertEqual(result.action, "WAIT")
        self.assertEqual(result.reason, "outside_reference_window")

    def test_rejects_high_volatility(self):
        prices = [D("180"), D("195"), D("175"), D("198"), D("172"), D("200"), D("170"), D("202"), D("168"), D("204"), D("166"), D("205")]
        result = decide(prices, D("185"), D("10000"))
        self.assertEqual(result.action, "WAIT")
        self.assertEqual(result.reason, "volatility_gate")

    def test_quantity_is_step_aligned(self):
        prices = [D("180") + D(i) for i in range(12)]
        result = decide(prices, D("191"), D("10000"))
        self.assertIn(result.action, {"LONG", "SHORT", "WAIT"})
        self.assertEqual(result.quantity % D("0.01"), D("0"))


if __name__ == "__main__":
    unittest.main()
