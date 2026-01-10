/**
 * MARKET PAGE
 *
 * Shows a single market with price chart, order book, and trading form.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { markets as marketsApi } from '../api';
import OrderBook from '../components/OrderBook';
import TradeForm from '../components/TradeForm';
import PriceChart from '../components/PriceChart';
import { useRealtime } from '../hooks/useRealtime';

export default function Market() {
  const { ticker } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { prices, connected } = useRealtime();

  const loadMarket = async () => {
    try {
      const res = await marketsApi.get(ticker);
      setData(res.data);
    } catch (err) {
      setError('Market not found');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarket();
  }, [ticker]);

  // Refresh data after a trade
  const handleTradeComplete = () => {
    loadMarket();
  };

  if (loading) return <div className="loading">Loading market...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!data) return null;

  const { market, orderbook, recent_trades, stats } = data;
  const livePrice = prices[ticker] !== undefined ? prices[ticker] : market.last_price || 50;

  return (
    <div className="market-page">
      <Link to="/" className="back-link">
        ← Back to Markets
      </Link>

      <div className="market-header">
        <div className="market-title-row">
          <div>
            <span className="market-ticker">{market.ticker}</span>
            {connected && <span className="live-badge">LIVE</span>}
            <h1>{market.title}</h1>
          </div>
          <div className="market-price-display">
            <div className="price-large yes">{livePrice}¢</div>
            <div className="price-large no">{100 - livePrice}¢</div>
          </div>
        </div>
        <p className="market-description">{market.description}</p>

        <div className="market-meta">
          <span className="status">{market.status.toUpperCase()}</span>
          <span className="settlement">
            Settlement: {new Date(market.settlement_date).toLocaleDateString()}
          </span>
          <span className="volume">{stats.volume} contracts traded</span>
        </div>
      </div>

      {/* Price Chart - Like Kalshi */}
      <div className="market-chart-section">
        <PriceChart ticker={ticker} hours={168} />
      </div>

      <div className="market-content">
        <div className="market-left">
          <OrderBook orderbook={orderbook} />

          {recent_trades.length > 0 && (
            <div className="recent-trades">
              <h3>Recent Trades</h3>
              <table>
                <thead>
                  <tr>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_trades.slice(0, 10).map((trade, i) => (
                    <tr key={i}>
                      <td>{trade.price}¢</td>
                      <td>{trade.quantity}</td>
                      <td>
                        {new Date(trade.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="market-right">
          <TradeForm market={market} onTradeComplete={handleTradeComplete} />
        </div>
      </div>
    </div>
  );
}
