import { useEffect, useState } from 'react';
import api from '../api/client';
import './TopTalkers.css';

interface Talker {
  ip: string;
  direction: 'src' | 'dst';
  totalBytes: string;
  flowCount: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function TopTalkers() {
  const [talkers, setTalkers] = useState<Talker[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await api.get<Talker[]>('/flows/top-talkers', {
          params: { limit: 10 },
        });
        if (!cancelled) setTalkers(res.data);
      } catch {
        if (!cancelled) setError('Failed to load top talkers');
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="chart-error">{error}</div>;

  return (
    <div className="top-talkers">
      <h3>Top Talkers</h3>
      {talkers.length === 0 ? (
        <div className="chart-empty">No flow data yet</div>
      ) : (
        <table className="talkers-table">
          <thead>
            <tr>
              <th>IP Address</th>
              <th>Direction</th>
              <th>Traffic</th>
              <th>Flows</th>
            </tr>
          </thead>
          <tbody>
            {talkers.map((t) => (
              <tr key={`${t.ip}-${t.direction}`}>
                <td className="talker-ip">{t.ip}</td>
                <td>
                  <span className={`dir-badge dir-${t.direction}`}>
                    {t.direction === 'src' ? '↑ Source' : '↓ Dest'}
                  </span>
                </td>
                <td>{formatBytes(parseInt(t.totalBytes, 10) || 0)}</td>
                <td>{t.flowCount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
