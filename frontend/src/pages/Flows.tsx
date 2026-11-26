import { useEffect, useState } from 'react';
import api from '../api/client';
import './Flows.css';

interface Flow {
  id: string;
  srcAddr: string;
  dstAddr: string;
  srcPort: number;
  dstPort: number;
  protocol: number;
  bytes: number;
  packets: number;
  createdAt: string;
}

const PROTOCOL_NAMES: Record<number, string> = {
  1: 'ICMP',
  6: 'TCP',
  17: 'UDP',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function Flows() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const limit = 50;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<Flow[]>('/flows', { params: { limit, offset: page * limit } })
      .then((res) => {
        if (!cancelled) setFlows(res.data);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load flows');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page]);

  if (error) return <div className="flows-error">{error}</div>;

  return (
    <div>
      <h2>Flow Records</h2>

      {loading ? (
        <p style={{ color: '#888', marginTop: '1rem' }}>Loading…</p>
      ) : flows.length === 0 ? (
        <div className="flows-empty">No flow records yet.</div>
      ) : (
        <>
          <table className="flows-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Protocol</th>
                <th>Bytes</th>
                <th>Packets</th>
              </tr>
            </thead>
            <tbody>
              {flows.map((f) => (
                <tr key={f.id}>
                  <td className="flow-time">{formatTime(f.createdAt)}</td>
                  <td className="flow-addr">{f.srcAddr}:{f.srcPort}</td>
                  <td className="flow-addr">{f.dstAddr}:{f.dstPort}</td>
                  <td>{PROTOCOL_NAMES[f.protocol] ?? f.protocol}</td>
                  <td>{formatBytes(f.bytes)}</td>
                  <td>{f.packets}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flows-pagination">
            <button
              className="btn-secondary"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </button>
            <span className="page-info">Page {page + 1}</span>
            <button
              className="btn-secondary"
              disabled={flows.length < limit}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
