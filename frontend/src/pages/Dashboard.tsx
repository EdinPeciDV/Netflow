import { useEffect, useState } from 'react';
import api from '../api/client';
import TrafficChart from '../components/TrafficChart';
import './Dashboard.css';

interface Stats {
  totalFlows: number;
  totalBytes: number;
  totalPackets: number;
}

interface StatsCardProps {
  label: string;
  value: string | number;
}

function StatsCard({ label, value }: StatsCardProps) {
  return (
    <div className="stats-card">
      <span className="stats-label">{label}</span>
      <span className="stats-value">{value}</span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [deviceCount, setDeviceCount] = useState<number | null>(null);
  const [alertCount, setAlertCount] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [flowRes, devRes, alertRes] = await Promise.all([
          api.get<Stats>('/flows/stats'),
          api.get<{ id: string }[]>('/devices'),
          api.get<{ id: string }[]>('/alert-events'),
        ]);
        if (cancelled) return;
        setStats(flowRes.data);
        setDeviceCount(devRes.data.length);
        setAlertCount(alertRes.data.length);
      } catch {
        if (!cancelled) setError('Failed to load dashboard data');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="stats-grid">
        <StatsCard
          label="Devices"
          value={deviceCount ?? '—'}
        />
        <StatsCard
          label="Total Flows"
          value={stats?.totalFlows ?? '—'}
        />
        <StatsCard
          label="Traffic"
          value={stats ? formatBytes(stats.totalBytes) : '—'}
        />
        <StatsCard
          label="Packets"
          value={stats?.totalPackets ?? '—'}
        />
        <StatsCard
          label="Alerts"
          value={alertCount ?? '—'}
        />
      </div>
      <TrafficChart />
    </div>
  );
}
