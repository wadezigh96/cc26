# CC26 Backtest

This directory defines the deterministic backtest contract for the Close Call strategy.

## Metrics

For each parameter set report:

- final POLF balance
- net PnL after fees
- number of trades
- wins/losses
- win rate
- maximum drawdown
- gross notional
- fees paid
- average holding time
- LONG/SHORT/WAIT counts

## Important

The official contest uses exact decimal arithmetic and a 1% fee per side. A trade is only eligible when its price is within 5% of the previous sweep reference. The draft rules also require at least 0.1 quantity and 0.01 quantity/price steps.

Backtests must not treat simulated results as a guarantee of future profit. The strategy should be selected using out-of-sample data rather than the highest in-sample PnL.
