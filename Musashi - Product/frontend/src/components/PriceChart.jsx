/**
 * PRICE CHART COMPONENT
 *
 * Displays price history chart like Kalshi.
 * Uses recharts for visualization.
 */

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PriceChart({ ticker, hours = 24 }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [ticker, hours]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_URL ||
        (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');
      const res = await fetch(`${API_BASE}/realtime/history/${ticker}?hours=${hours}`);
      const json = await res.json();

      // Transform data for recharts - include both YES and NO prices
      const chartData = json.history.map((point) => ({
        time: new Date(point.timestamp).getTime(),
        yes: point.price,
        no: 100 - point.price,
        label: formatTime(new Date(point.timestamp)),
      }));

      setData(chartData);
    } catch (error) {
      console.error('Failed to load price history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return <div className="chart-loading">Loading chart...</div>;
  }

  if (data.length === 0) {
    return <div className="chart-empty">No price history available</div>;
  }

  const latestYes = data[data.length - 1]?.yes || 50;
  const firstYes = data[0]?.yes || 50;
  const priceChange = latestYes - firstYes;
  const priceChangePercent = firstYes !== 0 ? ((priceChange / firstYes) * 100).toFixed(1) : 0;

  const latestNo = data[data.length - 1]?.no || 50;

  return (
    <div className="price-chart">
      <div className="chart-header">
        <div className="chart-prices">
          <div className="current-price yes-price-label">
            <span className="price-label">YES</span>
            <span className="price-value yes-color">{latestYes}¢</span>
            <span className={`price-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange}¢ ({priceChangePercent}%)
            </span>
          </div>
          <div className="current-price no-price-label">
            <span className="price-label">NO</span>
            <span className="price-value no-color">{latestNo}¢</span>
          </div>
        </div>
        <div className="time-selector">
          <span className="time-label">{hours}H</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis
            dataKey="label"
            stroke="#666"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#666"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => `${value}¢`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111',
              border: '1px solid #333',
              borderRadius: '4px',
              padding: '8px',
              color: '#fff',
            }}
            formatter={(value, name) => [`${value}¢`, name.toUpperCase()]}
          />
          <Line
            type="monotone"
            dataKey="yes"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: '#10b981' }}
            name="YES"
          />
          <Line
            type="monotone"
            dataKey="no"
            stroke="#ef4444"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: '#ef4444' }}
            name="NO"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
