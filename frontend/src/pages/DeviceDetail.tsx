import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import TrafficChart from '../components/TrafficChart';
import './DeviceDetail.css';

interface Device {
  id: string;
  name: string;
  ipAddress: string;
  lastSeenAt: string | null;
}

interface DeviceStats {
  totalFlows: number;
  totalBytes: number;
  totalPackets: number;
}

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString();
}

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<Device | null>(null);
  const [stats, setStats] = useState<DeviceStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [devRes, statsRes] = await Promise.all([
          api.get<Device>(`/devices/${id}`),
          api.get<DeviceStats>('/flows/stats', { params: { deviceId: id } }),
        ]);
        if (cancelled) return;
        setDevice(devRes.data);
        setStats(statsRes.data);
      } catch {
        if (!cancelled) setError('Failed to load device');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (error) return <div className="detail-error">{error}</div>;
  if (!device) return <p style={{ color: '#888' }}>Loading…</p>;

  const online = isOnline(device.lastSeenAt);

  return (
    <div>
      <Link to="/devices" className="back-link">← Devices</Link>

      <div className="detail-header">
        <h2>
          <span className={`device-dot ${online ? 'online' : 'offline'}`} />
          {device.name}
        </h2>
        <span className="detail-ip">{device.ipAddress}</span>
      </div>

      <div className="detail-meta">
        <div className="meta-item">
          <span className="meta-label">Status</span>
          <span className={`meta-value ${online ? 'text-green' : 'text-gray'}`}>
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Last Seen</span>
          <span className="meta-value">{formatDate(device.lastSeenAt)}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Flows</span>
          <span className="meta-value">{stats?.totalFlows ?? '—'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Traffic</span>
          <span className="meta-value">{stats ? formatBytes(stats.totalBytes) : '—'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Packets</span>
          <span className="meta-value">{stats?.totalPackets ?? '—'}</span>
        </div>
      </div>

      <h3 className="section-title">Traffic History</h3>
      <TrafficChart deviceId={id} />
    </div>
  );
}
