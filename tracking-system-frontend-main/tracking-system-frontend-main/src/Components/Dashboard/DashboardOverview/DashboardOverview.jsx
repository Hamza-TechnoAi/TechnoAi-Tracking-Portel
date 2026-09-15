import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL, getAuthHeaders, getFriendlyErrorMessage } from '../../../Api/api';
import ServerErrorState from '../../Common/ServerErrorState/ServerErrorState';
import CircularStat from '../CircularStat/CircularStat';
import './DashboardOverview.scss';

const LINE_STATUS_ORDER = [
  'Processing',
  'Ready to Ship from Supplier',
  'In Transit',
  'In Inventory',
  'Ready for Delivery',
  'Delivered',
];

const LINE_STATUS_COLORS = {
  Processing: '#6366f1',
  'Ready to Ship from Supplier': '#8b5cf6',
  'In Transit': '#0ea5e9',
  'In Inventory': '#f59e0b',
  'Ready for Delivery': '#73ded6',
  Delivered: '#10b981',
};

const HERO_STATS = [
  {
    key: 'openPurchaseOrders',
    totalKey: 'totalPurchaseOrders',
    label: 'Open Purchase Orders',
    sublabel: 'Active shipments in progress',
    color: '#73ded6',
  },
  {
    key: 'closedPurchaseOrders',
    totalKey: 'totalPurchaseOrders',
    label: 'Closed Purchase Orders',
    sublabel: 'Fully delivered POs',
    color: '#10b981',
  },
  {
    key: 'deliveredLines',
    totalKey: 'totalLines',
    label: 'Delivered Lines',
    sublabel: 'Completed line items',
    color: '#2ebdb4',
  },
];

const SECONDARY_STATS = [
  {
    key: 'totalPurchaseOrders',
    totalKey: null,
    label: 'Total POs',
    sublabel: 'All purchase orders',
    color: '#0ea5e9',
    absolute: true,
  },
  {
    key: 'delayedPurchaseOrders',
    totalKey: 'openPurchaseOrders',
    label: 'Delayed POs',
    sublabel: 'Past overall PO ETA',
    color: '#ef4444',
  },
  {
    key: 'inTransitLines',
    totalKey: 'totalLines',
    label: 'In Transit Lines',
    sublabel: 'Currently shipping',
    color: '#8b5cf6',
  },
  {
    key: 'readyForDeliveryLines',
    totalKey: 'totalLines',
    label: 'Ready for Delivery',
    sublabel: 'Awaiting final delivery',
    color: '#f59e0b',
  },
];

export default function DashboardOverview() {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE_URL}/api/dashboard/summary`, {
        headers: getAuthHeaders(),
      });
      setSummary(response.data.data);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Unable to load dashboard data. Please refresh the page and try again.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  if (isLoading) {
    return (
      <div className="dashboard-overview__state">
        <div className="dashboard-overview__loader" aria-hidden />
        <p>Loading dashboard analytics...</p>
      </div>
    );
  }

  if (error) {
    return <ServerErrorState message={error} onRetry={loadSummary} retryLabel="Try again" />;
  }

  const totalLines = summary?.totalLines || 0;

  const orderedLineStatuses = LINE_STATUS_ORDER.map((status) => ({
    status,
    count: summary?.lineStatusCounts?.[status] ?? 0,
    color: LINE_STATUS_COLORS[status] || '#73ded6',
  }));

  return (
    <section className="dashboard-overview">
      <div className="dashboard-overview__head">
        <div>
          <span className="dashboard-overview__eyebrow">Analytics</span>
          <h1 className="dashboard-overview__title">Dashboard Overview</h1>
          <p className="dashboard-overview__subtitle">
            Real-time shipment and purchase order performance at a glance.
          </p>
        </div>
        <div className="dashboard-overview__head-badge">
          <span className="dashboard-overview__head-badge-value">
            {summary?.totalPurchaseOrders ?? 0}
          </span>
          <span className="dashboard-overview__head-badge-label">Total POs tracked</span>
        </div>
      </div>

      <div className="dashboard-overview__hero-grid">
        {HERO_STATS.map((stat) => {
          const value = summary?.[stat.key] ?? 0;
          const max = summary?.[stat.totalKey] ?? 0;

          return (
            <article key={stat.key} className="dashboard-overview__hero-card">
              <CircularStat
                value={value}
                max={max}
                label={stat.label}
                sublabel={stat.sublabel}
                color={stat.color}
                size="lg"
              />
            </article>
          );
        })}
      </div>

      <div className="dashboard-overview__secondary-grid">
        {SECONDARY_STATS.map((stat) => {
          const value = summary?.[stat.key] ?? 0;
          const max = stat.absolute ? Math.max(value, 1) : (summary?.[stat.totalKey] ?? 0);

          return (
            <article key={stat.key} className="dashboard-overview__secondary-card">
              <CircularStat
                value={value}
                max={max}
                label={stat.label}
                sublabel={stat.sublabel}
                color={stat.color}
                size="md"
                showPercent={!stat.absolute}
              />
            </article>
          );
        })}
      </div>

      <div className="dashboard-overview__section-head">
        <h2 className="dashboard-overview__section-title">Line Status Breakdown</h2>
        <p className="dashboard-overview__section-subtitle">
          Distribution across {totalLines} total line items
        </p>
      </div>

      <div className="dashboard-overview__status-grid">
        {orderedLineStatuses.map(({ status, count, color }) => (
          <article key={status} className="dashboard-overview__status-card">
            <CircularStat
              value={count}
              max={totalLines || 1}
              label={status}
              color={color}
              size="sm"
            />
          </article>
        ))}
      </div>
    </section>
  );
}
