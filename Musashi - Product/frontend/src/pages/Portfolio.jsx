/**
 * PORTFOLIO PAGE
 *
 * Shows user's positions and trade history.
 */

import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { portfolio as portfolioApi, orders as ordersApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Portfolio() {
  const { user } = useAuth();
  const [portfolioData, setPortfolioData] = useState(null);
  const [openOrders, setOpenOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('positions');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [portfolioRes, ordersRes, historyRes] = await Promise.all([
        portfolioApi.get(),
        ordersApi.list({ status: 'open' }),
        portfolioApi.history(),
      ]);

      setPortfolioData(portfolioRes.data);
      setOpenOrders(ordersRes.data.orders);
      setHistory(historyRes.data.trades);
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await ordersApi.cancel(orderId);
      loadData();
    } catch (err) {
      console.error('Failed to cancel order:', err);
    }
  };

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (loading) return <div className="loading">Loading portfolio...</div>;

  const formatCents = (cents) => {
    const isNegative = cents < 0;
    const abs = Math.abs(cents);
    return (isNegative ? '-' : '') + '$' + (abs / 100).toFixed(2);
  };

  return (
    <div className="portfolio-page">
      <h1>Your Portfolio</h1>

      {/* Summary */}
      {portfolioData && (
        <div className="portfolio-summary">
          <div className="summary-card">
            <span className="label">Cash Balance</span>
            <span className="value">{formatCents(portfolioData.balance)}</span>
          </div>
          <div className="summary-card">
            <span className="label">Positions Value</span>
            <span className="value">
              {formatCents(portfolioData.summary.total_value)}
            </span>
          </div>
          <div className="summary-card">
            <span className="label">Total Value</span>
            <span className="value">
              {formatCents(portfolioData.summary.portfolio_value)}
            </span>
          </div>
          <div className="summary-card">
            <span className="label">Unrealized P&L</span>
            <span
              className={`value ${
                portfolioData.summary.total_unrealized_pnl >= 0
                  ? 'positive'
                  : 'negative'
              }`}
            >
              {formatCents(portfolioData.summary.total_unrealized_pnl)}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === 'positions' ? 'active' : ''}
          onClick={() => setActiveTab('positions')}
        >
          Positions
        </button>
        <button
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={() => setActiveTab('orders')}
        >
          Open Orders ({openOrders.length})
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          Trade History
        </button>
      </div>

      {/* Positions Tab */}
      {activeTab === 'positions' && portfolioData && (
        <div className="positions-table">
          {portfolioData.positions.length === 0 ? (
            <div className="empty-state">
              <p>No positions yet.</p>
              <Link to="/" className="btn btn-primary">
                Browse Markets
              </Link>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Side</th>
                  <th>Qty</th>
                  <th>Avg Price</th>
                  <th>Current</th>
                  <th>Value</th>
                  <th>P&L</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData.positions.map((pos) => (
                  <tr key={`${pos.market_id}-${pos.side}`}>
                    <td>
                      <Link to={`/market/${pos.market_ticker}`}>
                        {pos.market_title.substring(0, 40)}...
                      </Link>
                    </td>
                    <td className={pos.side}>{pos.side.toUpperCase()}</td>
                    <td>{pos.quantity}</td>
                    <td>{pos.avg_price}¢</td>
                    <td>{pos.current_price}¢</td>
                    <td>{formatCents(pos.current_value)}</td>
                    <td className={pos.unrealized_pnl >= 0 ? 'positive' : 'negative'}>
                      {formatCents(pos.unrealized_pnl)} ({pos.pnl_percent}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Open Orders Tab */}
      {activeTab === 'orders' && (
        <div className="orders-table">
          {openOrders.length === 0 ? (
            <div className="empty-state">
              <p>No open orders.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Side</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Filled</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {openOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link to={`/market/${order.market_ticker}`}>
                        {order.market_ticker}
                      </Link>
                    </td>
                    <td className={order.side}>{order.side.toUpperCase()}</td>
                    <td>{order.price}¢</td>
                    <td>{order.quantity}</td>
                    <td>{order.filled_quantity}</td>
                    <td>{order.status}</td>
                    <td>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="history-table">
          {history.length === 0 ? (
            <div className="empty-state">
              <p>No trades yet.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Market</th>
                  <th>Side</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {history.map((trade) => (
                  <tr key={trade.id}>
                    <td>
                      {new Date(trade.created_at).toLocaleString()}
                    </td>
                    <td>{trade.market_ticker}</td>
                    <td className={trade.side}>{trade.side.toUpperCase()}</td>
                    <td>{trade.price}¢</td>
                    <td>{trade.quantity}</td>
                    <td>{formatCents(trade.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
