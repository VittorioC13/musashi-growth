/**
 * TRADE FORM COMPONENT
 *
 * Form for placing orders (buying YES or NO).
 */

import { useState } from 'react';
import { orders } from '../api';
import { useAuth } from '../context/AuthContext';

export default function TradeForm({ market, onTradeComplete }) {
  const { user, refreshUser } = useAuth();
  const [side, setSide] = useState('yes');
  const [price, setPrice] = useState(50);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setMessage({ type: 'error', text: 'Please login to trade' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await orders.create({
        market_ticker: market.ticker,
        side,
        price: parseInt(price),
        quantity: parseInt(quantity),
      });

      setMessage({ type: 'success', text: res.data.message });
      await refreshUser(); // Update balance
      if (onTradeComplete) onTradeComplete();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to place order',
      });
    } finally {
      setLoading(false);
    }
  };

  const maxCost = price * quantity;
  const potentialProfit = (100 - price) * quantity;

  return (
    <form className="trade-form" onSubmit={handleSubmit}>
      <h3>Place Order</h3>

      {/* Side Selection */}
      <div className="side-selector">
        <button
          type="button"
          className={`side-btn yes-btn ${side === 'yes' ? 'active' : ''}`}
          onClick={() => setSide('yes')}
        >
          YES
        </button>
        <button
          type="button"
          className={`side-btn no-btn ${side === 'no' ? 'active' : ''}`}
          onClick={() => setSide('no')}
        >
          NO
        </button>
      </div>

      {/* Price Input */}
      <div className="form-group">
        <label>Price (1-99¢)</label>
        <input
          type="range"
          min="1"
          max="99"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <div className="price-display">
          <span className={side === 'yes' ? 'highlight' : ''}>
            YES: {price}¢
          </span>
          <span className={side === 'no' ? 'highlight' : ''}>
            NO: {100 - price}¢
          </span>
        </div>
      </div>

      {/* Quantity Input */}
      <div className="form-group">
        <label>Quantity (contracts)</label>
        <input
          type="number"
          min="1"
          max="1000"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
        />
      </div>

      {/* Cost Summary */}
      <div className="trade-summary">
        <div className="summary-row">
          <span>Max Cost:</span>
          <span>{maxCost}¢ (${(maxCost / 100).toFixed(2)})</span>
        </div>
        <div className="summary-row">
          <span>If {side.toUpperCase()} wins:</span>
          <span className="profit">+{potentialProfit}¢ profit</span>
        </div>
        <div className="summary-row">
          <span>If {side === 'yes' ? 'NO' : 'YES'} wins:</span>
          <span className="loss">-{maxCost}¢ loss</span>
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <button
        type="submit"
        className={`btn btn-trade ${side === 'yes' ? 'btn-yes' : 'btn-no'}`}
        disabled={loading || !user}
      >
        {loading ? 'Placing...' : `Buy ${quantity} ${side.toUpperCase()} @ ${side === 'yes' ? price : 100 - price}¢`}
      </button>

      {!user && (
        <p className="login-prompt">Please login to trade</p>
      )}
    </form>
  );
}
