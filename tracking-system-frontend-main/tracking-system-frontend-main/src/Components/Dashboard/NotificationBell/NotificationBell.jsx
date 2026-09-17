import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdNotificationsNone, MdClose } from 'react-icons/md';
import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from '../../../Api/api';
import { useAuth } from '../../../Context/AuthContext';
import './NotificationBell.scss';

export default function NotificationBell() {
  const { user, handleDashboardMenuChange } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const root = useRef(null);
  const bell = useRef(null);
  const version = useRef(0);

  useEffect(() => {
    if (!user) return;
    let stopped = false;
    let timer;
    const controller = new AbortController();
    const poll = async () => {
      const requestVersion = version.current;
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/notifications`, {
          headers: getAuthHeaders(), signal: controller.signal,
        });
        if (!stopped && version.current === requestVersion) {
          setItems(data.data || []);
          setCount(data.unreadCount || 0);
          setError('');
        }
      } catch {
        if (!stopped) setError('Unable to refresh notifications. Retrying shortly.');
      } finally {
        if (!stopped) { setLoading(false); timer = setTimeout(poll, 30000); }
      }
    };
    poll();
    return () => { stopped = true; clearTimeout(timer); controller.abort(); };
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const dismiss = event => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    const escape = event => {
      if (event.key === 'Escape') { setOpen(false); bell.current?.focus(); }
    };
    const closeOnScroll = event => {
      const panel = root.current?.querySelector('.notification-bell__panel');
      if (!panel?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    document.addEventListener('wheel', closeOnScroll, { capture: true, passive: true });
    document.addEventListener('scroll', closeOnScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
      document.removeEventListener('wheel', closeOnScroll, true);
      document.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [open]);

  const markRead = async item => {
    if (item.readAt) return;
    version.current += 1;
    await axios.patch(`${API_BASE_URL}/api/notifications/${item._id}/read`, {}, { headers: getAuthHeaders() });
    version.current += 1;
    setItems(previous => previous.map(entry => entry._id === item._id ? { ...entry, readAt: new Date().toISOString() } : entry));
    setCount(previous => Math.max(0, previous - 1));
  };
  const act = async (item, visit) => {
    setBusy(item._id);
    try { await markRead(item); setError(''); }
    catch { setError('Could not mark this notification as read. Please retry.'); }
    finally { setBusy(null); }
    if (visit) {
      handleDashboardMenuChange('purchase-orders');
      navigate(`/dashboard?po=${encodeURIComponent(item.purchaseOrder)}&notification=${item._id}`);
      setOpen(false);
    }
  };

  return <div className="notification-bell" ref={root}>
    <button ref={bell} type="button" className="notification-bell__trigger"
      aria-label={`Notifications, ${count} unread`} aria-expanded={open} aria-controls="staff-notifications"
      onClick={() => setOpen(previous => !previous)}>
      <MdNotificationsNone aria-hidden="true" />
      {count > 0 && <span className="notification-bell__badge">{count > 99 ? '99+' : count}</span>}
    </button>
    {open && <section id="staff-notifications" className="notification-bell__panel" aria-label="Recent notifications">
      <div className="notification-bell__heading"><strong>Notifications ({count} unread)</strong>
        <button type="button" aria-label="Close notifications" onClick={() => { setOpen(false); bell.current?.focus(); }}><MdClose /></button>
      </div>
      {error && <p role="status" className="notification-bell__error">{error}</p>}
      {loading ? <p>Loading notifications?</p> : !items.length && <p>No notifications yet.</p>}
      <ul>{items.map(item => <li key={item._id} className={item.readAt ? '' : 'is-unread'}>
        <button type="button" className="notification-bell__item" disabled={busy !== null} onClick={() => act(item, true)}>
          <span>{item.message}</span><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
        </button>
        {!item.readAt && <button type="button" className="notification-bell__read" disabled={busy !== null}
          onClick={() => act(item, false)}>Mark as read</button>}
      </li>)}</ul>
    </section>}
  </div>;
}
