import { useEffect, useState } from 'react';
import api from '../api/client';
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

  if (error) return <div className="alerts-error">{error}</div>;

  return (
    <div>
      <h2>Alerts</h2>

      {loading ? (
        <p style={{ color: '#888' }}>Loading…</p>
      ) : events.length === 0 ? (
        <div className="alerts-empty">
          <p>No alert events yet.</p>
        </div>
      ) : (
        <div className="alerts-list">
          {events.map((ev) => (
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
              <span
                className={`alert-badge ${ev.acknowledgedAt ? 'resolved' : 'active'}`}
              >
                {ev.acknowledgedAt ? 'Acked' : 'Active'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
