import unittest
from decimal import Decimal as D

from backtest.run_backtest import START, run


class BacktestTests(unittest.TestCase):
    def test_empty_rows_is_not_allowed(self):
        with self.assertRaises(IndexError):
            run([])

    def test_sample_rows_produce_deterministic_result(self):
        rows = [
            {"reference": "100", "close": "101", "signalPrice": "100"},
            {"reference": "100", "close": "102", "signalPrice": "101"},
            {"reference": "100", "close": "99", "signalPrice": "100"},
        ]
        result = run(rows, qty=D("1"))
        self.assertEqual(result["trades"], 2)
        self.assertEqual(result["fees"], "2.00")
        self.assertEqual(result["final_balance"], "9999.00")
        self.assertEqual(result["net_pnl"], "-1.00")
        self.assertEqual(result["position"], "-1")
        self.assertEqual(result["max_drawdown"], "2.00")


if __name__ == "__main__":
    unittest.main()
