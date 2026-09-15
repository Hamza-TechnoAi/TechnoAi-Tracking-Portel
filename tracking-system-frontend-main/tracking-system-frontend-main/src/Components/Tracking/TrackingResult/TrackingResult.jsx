import { useState } from 'react';
import { formatLineCount, formatPoDate } from '../../../Utils/formatters';
import ShipmentTrackingLink from '../../Common/ShipmentTrackingLink/ShipmentTrackingLink';
import SubscribeUpdatesModal from '../SubscribeUpdatesModal/SubscribeUpdatesModal';
import './TrackingResult.scss';

export default function TrackingResult({ order }) {
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);

  return (
    <section className="tracking-result" aria-labelledby="tracking-result-title">
      <div className="tracking-result__header">
        <h2 id="tracking-result-title" className="tracking-result__po-number">
          PO number: {order.poNumber}
        </h2>
        <button
          type="button"
          className="tracking-result__updates-btn"
          onClick={() => setIsSubscribeOpen(true)}
        >
          Get Updates
        </button>
      </div>

      <div className="tracking-result__status">
        <p className="tracking-result__status-label">
          PO Status: {order.poStatusPercent}%
        </p>
        <div
          className="tracking-result__progress"
          role="progressbar"
          aria-valuenow={order.poStatusPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`PO status ${order.poStatusPercent} percent`}
        >
          <div
            className="tracking-result__progress-fill"
            style={{ width: `${order.poStatusPercent}%` }}
          />
        </div>
      </div>

      <p className="tracking-result__line-count">
        Number of Lines: {order.numberOfLines || formatLineCount(order.items.length)}
      </p>

      <div className="tracking-result__table-wrap">
        <table className="tracking-result__table">
          <thead>
            <tr>
              <th scope="col">Line No</th>
              <th scope="col">Item Description</th>
              <th scope="col">Qty</th>
              <th scope="col">Status</th>
              <th scope="col">ETA</th>
              <th scope="col">Tracking</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.lineNo}>
                <td>{item.lineNo}</td>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{item.status}</td>
                <td>{formatPoDate(item.eta)}</td>
                <td>
                  <ShipmentTrackingLink
                    value={item.shipmentTrackingLink}
                    className="tracking-result__tracking-link"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="tracking-result__po-closing-date">
        PO Closing date: {formatPoDate(order.poClosingDate)}
      </p>

      <SubscribeUpdatesModal
        poNumber={order.poNumber}
        isOpen={isSubscribeOpen}
        onClose={() => setIsSubscribeOpen(false)}
      />
    </section>
  );
}
