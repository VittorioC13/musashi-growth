/**
 * HOME PAGE
 *
 * Lists all available markets with real-time price updates.
 * Features a large "trending" market at the top with price chart.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { markets as marketsApi } from '../api';
import { useRealtime } from '../hooks/useRealtime';
import PriceChart from '../components/PriceChart';

export default function Home() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { prices, connected } = useRealtime();

  useEffect(() => {
    loadMarkets();
  }, []);

  const loadMarkets = async () => {
    try {
      const res = await marketsApi.list();
      setMarkets(res.data.markets);
    } catch (err) {
      setError('Failed to load markets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading markets...</div>;
  if (error) return <div className="error">{error}</div>;

  // Featured market is the first one
  const featuredMarket = markets[0];
  const featuredPrice = featuredMarket ? (prices[featuredMarket.ticker] !== undefined ? prices[featuredMarket.ticker] : featuredMarket.last_price) : 50;
  const otherMarkets = markets.slice(1);

  return (
    <div className="home-page">
      <div className="home-header">
        <h1>Crypto Prediction Markets</h1>
        <p className="subtitle">Trade on the future of cryptocurrency</p>
        {connected && <div className="live-indicator">🟢 LIVE</div>}
      </div>

      {/* Featured Market - Large card with chart */}
      {featuredMarket && (
        <Link to={`/market/${featuredMarket.ticker}`} className="featured-market">
          <div className="featured-market-left">
            <div className="market-category">{featuredMarket.category}</div>
            <h2 className="featured-title">{featuredMarket.title}</h2>
            <div className="featured-prices">
              <div className="featured-price-item yes">
                <span className="label">YES</span>
                <span className="value">{featuredPrice}¢</span>
              </div>
              <div className="featured-price-item no">
                <span className="label">NO</span>
                <span className="value">{100 - featuredPrice}¢</span>
              </div>
            </div>
            <div className="featured-meta">
              <span>{featuredMarket.volume} contracts traded</span>
              <span>Settles: {new Date(featuredMarket.settlement_date).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="featured-market-right">
            <PriceChart ticker={featuredMarket.ticker} hours={168} />
          </div>
        </Link>
      )}

      {/* Grid of smaller market cards - 4 per row */}
      <div className="markets-grid">
        {otherMarkets.map((market) => {
          const livePrice = prices[market.ticker] !== undefined ? prices[market.ticker] : market.last_price;

          return (
            <Link
              to={`/market/${market.ticker}`}
              key={market.ticker}
              className="market-card"
            >
              <div className="market-category">{market.category}</div>
              <h3 className="market-title">{market.title}</h3>

              <div className="market-prices">
                <div className="price-box yes-price">
                  <span className="label">YES</span>
                  <span className="value">{livePrice}¢</span>
                </div>
                <div className="price-box no-price">
                  <span className="label">NO</span>
                  <span className="value">{100 - livePrice}¢</span>
                </div>
              </div>

              <div className="market-footer">
                <span className="volume">{market.volume} traded</span>
              </div>
            </Link>
          );
        })}
      </div>

      {markets.length === 0 && (
        <div className="no-markets">
          <p>No markets available yet.</p>
        </div>
      )}
    </div>
  );
}
