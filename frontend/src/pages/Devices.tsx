import { useEffect, useState } from 'react';
import api from '../api/client';
import './Devices.css';

interface Device {
  id: string;
  name: string;
  ipAddress: string;
  lastSeenAt: string | null;
}

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  const diff = Date.now() - new Date(lastSeen).getTime();
  return diff < 5 * 60 * 1000;
}

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return 'Never';
  const d = new Date(lastSeen);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return d.toLocaleDateString();
}

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get<Device[]>('/devices')
      .then((res) => {
        if (!cancelled) setDevices(res.data);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load devices');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <div className="devices-error">{error}</div>;

  return (
    <div>
      <div className="devices-header">
        <h2>Devices</h2>
      </div>

      {loading ? (
        <p style={{ color: '#888' }}>Loading…</p>
      ) : devices.length === 0 ? (
        <div className="devices-empty">
          <p>No devices registered yet.</p>
        </div>
      ) : (
        <table className="devices-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>IP Address</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td>
                  <span
                    className={`device-status ${isOnline(d.lastSeenAt) ? 'online' : 'offline'}`}
                  />
                </td>
                <td>{d.name}</td>
                <td>{d.ipAddress}</td>
                <td>
                  <span className="last-seen">
                    {formatLastSeen(d.lastSeenAt)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
