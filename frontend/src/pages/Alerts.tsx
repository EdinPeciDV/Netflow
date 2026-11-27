import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useSocket } from '../hooks/useSocket';
import './Alerts.css';

interface AlertEvent {
  id: string;
  alertRuleId: string;
  deviceId: string | null;
  metric: string;
  value: number;
  createdAt: string;
  acknowledgedAt: string | null;
}

const metricLabels: Record<string, string> = {
  bytes_per_window: 'Bytes / window',
  packets_per_window: 'Packets / window',
  flow_count_per_window: 'Flows / window',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return d.toLocaleString();
}

export default function Alerts() {
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acking, setAcking] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'active' | 'acked'>('all');

  useEffect(() => {
    let cancelled = false;
    api
      .get<AlertEvent[]>('/alert-events', { params: { limit: 50 } })
      .then((res) => {
        if (!cancelled) setEvents(res.data);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load alerts');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onTriggered = useCallback((ev: AlertEvent) => {
    setEvents((prev) => [ev, ...prev]);
  }, []);

  const onAcknowledged = useCallback(
    (data: { eventId: string; acknowledgedAt: string }) => {
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === data.eventId
            ? { ...ev, acknowledgedAt: data.acknowledgedAt }
            : ev,
        ),
      );
      setAcking((prev) => {
        const next = new Set(prev);
        next.delete(data.eventId);
        return next;
      });
    },
    [],
  );

  const listeners = useMemo(
    () => ({
      'alerts:triggered': onTriggered,
      'alerts:acknowledged': onAcknowledged,
    }),
    [onTriggered, onAcknowledged],
  );

  const socket = useSocket('/alerts', listeners);

  const handleAck = (eventId: string) => {
    if (!socket || acking.has(eventId)) return;
    setAcking((prev) => new Set(prev).add(eventId));
    socket.emit('alerts:ack', { eventId });
  };

  const filtered = useMemo(() => {
    if (filter === 'active') return events.filter((e) => !e.acknowledgedAt);
    if (filter === 'acked') return events.filter((e) => e.acknowledgedAt);
    return events;
  }, [events, filter]);

  const activeCt = events.filter((e) => !e.acknowledgedAt).length;

  if (error) return <div className="alerts-error">{error}</div>;

  return (
    <div>
      <div className="alerts-header">
        <h2>
          Alerts
          {activeCt > 0 && <span className="alerts-count">{activeCt}</span>}
        </h2>
        <div className="alerts-filters">
          {(['all', 'active', 'acked'] as const).map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Acknowledged'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#888' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="alerts-empty">
          <p>
            {filter === 'all'
              ? 'No alert events yet.'
              : `No ${filter} alerts.`}
          </p>
        </div>
      ) : (
        <div className="alerts-list">
          {filtered.map((ev) => (
            <div
              key={ev.id}
              className={`alert-card ${ev.acknowledgedAt ? 'acked' : 'unacked'}`}
            >
              <div className="alert-info">
                <span className="alert-metric">
                  {metricLabels[ev.metric] ?? ev.metric}
                </span>
                <span className="alert-detail">
                  Value: {ev.value.toLocaleString()}
                  {ev.deviceId && ` · Device: ${ev.deviceId.slice(0, 8)}…`}
                </span>
                <span className="alert-time">{formatTime(ev.createdAt)}</span>
              </div>
              <div className="alert-actions">
                {!ev.acknowledgedAt ? (
                  <button
                    className="ack-btn"
                    disabled={acking.has(ev.id)}
                    onClick={() => handleAck(ev.id)}
                  >
                    {acking.has(ev.id) ? 'Acking…' : 'Acknowledge'}
                  </button>
                ) : (
                  <span className="alert-badge resolved">Acked</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
