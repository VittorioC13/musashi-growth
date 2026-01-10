/**
 * ORDER BOOK COMPONENT
 *
 * Displays the current bids for YES and NO.
 * Shows market depth at each price level.
 */

export default function OrderBook({ orderbook }) {
  const { yes = [], no = [] } = orderbook || {};

  // Reverse YES bids so highest is at top
  const yesBids = [...yes].reverse();
  // Reverse NO bids so highest is at top
  const noBids = [...no].reverse();

  // Find max quantity for bar width calculation
  const maxQty = Math.max(
    ...yesBids.map((b) => b.quantity),
    ...noBids.map((b) => b.quantity),
    1
  );

  return (
    <div className="orderbook">
      <h3>Order Book</h3>

      <div className="orderbook-container">
        {/* YES Side */}
        <div className="orderbook-side yes-side">
          <div className="orderbook-header">
            <span>YES Bids</span>
            <span>Qty</span>
          </div>
          {yesBids.length === 0 ? (
            <div className="orderbook-empty">No bids</div>
          ) : (
            yesBids.map((bid, i) => (
              <div key={i} className="orderbook-row">
                <div
                  className="orderbook-bar yes-bar"
                  style={{ width: `${(bid.quantity / maxQty) * 100}%` }}
                />
                <span className="orderbook-price">{bid.price}¢</span>
                <span className="orderbook-qty">{bid.quantity}</span>
              </div>
            ))
          )}
        </div>

        {/* NO Side */}
        <div className="orderbook-side no-side">
          <div className="orderbook-header">
            <span>NO Bids</span>
            <span>Qty</span>
          </div>
          {noBids.length === 0 ? (
            <div className="orderbook-empty">No bids</div>
          ) : (
            noBids.map((bid, i) => (
              <div key={i} className="orderbook-row">
                <div
                  className="orderbook-bar no-bar"
                  style={{ width: `${(bid.quantity / maxQty) * 100}%` }}
                />
                <span className="orderbook-price">{bid.price}¢</span>
                <span className="orderbook-qty">{bid.quantity}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="orderbook-legend">
        <p>
          <strong>How to read:</strong> YES bid at 60¢ means someone will pay
          60¢ for YES (implying NO ask at 40¢).
        </p>
      </div>
    </div>
  );
}
