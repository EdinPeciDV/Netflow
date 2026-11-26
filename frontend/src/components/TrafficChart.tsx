import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../api/client';
import './TrafficChart.css';

interface Bucket {
  bucket: string;
  flowCount: number;
  totalBytes: string;
  totalPackets: number;
}

interface ChartPoint {
  time: string;
  bytes: number;
  flows: number;
  packets: number;
}

type BucketSize = 'hour' | 'day' | 'week';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatTime(iso: string, bucket: BucketSize): string {
  const d = new Date(iso);
  if (bucket === 'hour') {
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface TrafficChartProps {
  deviceId?: string;
}

export default function TrafficChart({ deviceId }: TrafficChartProps = {}) {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [bucket, setBucket] = useState<BucketSize>('hour');
  const [metric, setMetric] = useState<'bytes' | 'flows' | 'packets'>('bytes');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await api.get<Bucket[]>('/flows/aggregate', {
          params: { bucket, ...(deviceId ? { deviceId } : {}) },
        });
        if (cancelled) return;
        setData(
          res.data.map((b) => ({
            time: formatTime(b.bucket, bucket),
            bytes: parseInt(b.totalBytes, 10) || 0,
            flows: b.flowCount,
            packets: b.totalPackets,
          })),
        );
        setError('');
      } catch {
        if (!cancelled) setError('Failed to load chart data');
      }
    }

    load();
    return () => { cancelled = true; };
  }, [bucket, deviceId]);

  const colors: Record<string, string> = {
    bytes: '#6366f1',
    flows: '#22d3ee',
    packets: '#f59e0b',
  };

  const formatYAxis = (val: number) => {
    if (metric === 'bytes') return formatBytes(val);
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return String(val);
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Traffic Over Time</h3>
        <div className="chart-controls">
          <div className="chart-toggle">
            {(['bytes', 'flows', 'packets'] as const).map((m) => (
              <button
                key={m}
                className={metric === m ? 'active' : ''}
                onClick={() => setMetric(m)}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          <div className="chart-toggle">
            {(['hour', 'day', 'week'] as const).map((b) => (
              <button
                key={b}
                className={bucket === b ? 'active' : ''}
                onClick={() => setBucket(b)}
              >
                {b.charAt(0).toUpperCase() + b.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error && <div className="chart-error">{error}</div>}
      {!error && data.length === 0 && (
        <div className="chart-empty">No flow data yet</div>
      )}
      {!error && data.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[metric]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors[metric]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a40" />
            <XAxis dataKey="time" tick={{ fill: '#888', fontSize: 12 }} />
            <YAxis tickFormatter={formatYAxis} tick={{ fill: '#888', fontSize: 12 }} width={70} />
            <Tooltip
              contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 8 }}
              labelStyle={{ color: '#888' }}
              formatter={(value: number) => [
                metric === 'bytes' ? formatBytes(value) : value.toLocaleString(),
                metric.charAt(0).toUpperCase() + metric.slice(1),
              ]}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={colors[metric]}
              strokeWidth={2}
              fill={`url(#grad-${metric})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
