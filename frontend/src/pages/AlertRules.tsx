import { useEffect, useState, FormEvent } from 'react';
import api from '../api/client';
import './AlertRules.css';

interface AlertRule {
  id: string;
  name: string;
  deviceId: string | null;
  metric: string;
  threshold: number;
  windowSeconds: number;
  protocol: number | null;
  cooldownSeconds: number;
  enabled: boolean;
  createdAt: string;
}

interface Device {
  id: string;
  name: string;
  ipAddress: string;
}

const metricOptions = [
  { value: 'bytes_per_window', label: 'Bytes / window' },
  { value: 'packets_per_window', label: 'Packets / window' },
  { value: 'flow_count_per_window', label: 'Flows / window' },
];

const metricLabels: Record<string, string> = {
  bytes_per_window: 'Bytes / window',
  packets_per_window: 'Packets / window',
  flow_count_per_window: 'Flows / window',
};

export default function AlertRules() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [metric, setMetric] = useState('bytes_per_window');
  const [threshold, setThreshold] = useState('');
  const [windowSeconds, setWindowSeconds] = useState('300');
  const [cooldownSeconds, setCooldownSeconds] = useState('300');
  const [enabled, setEnabled] = useState(true);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<AlertRule[]>('/alert-rules'),
      api.get<Device[]>('/devices'),
    ])
      .then(([rulesRes, devicesRes]) => {
        if (!cancelled) {
          setRules(rulesRes.data);
          setDevices(devicesRes.data);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load alert rules');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  function resetForm() {
    setName('');
    setDeviceId('');
    setMetric('bytes_per_window');
    setThreshold('');
    setWindowSeconds('300');
    setCooldownSeconds('300');
    setEnabled(true);
    setFormError('');
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(rule: AlertRule) {
    setName(rule.name);
    setDeviceId(rule.deviceId ?? '');
    setMetric(rule.metric);
    setThreshold(String(rule.threshold));
    setWindowSeconds(String(rule.windowSeconds));
    setCooldownSeconds(String(rule.cooldownSeconds));
    setEnabled(rule.enabled);
    setEditingId(rule.id);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    const body: Record<string, unknown> = {
      name,
      metric,
      threshold: Number(threshold),
      windowSeconds: Number(windowSeconds),
      cooldownSeconds: Number(cooldownSeconds),
      enabled,
    };
    if (deviceId) body.deviceId = deviceId;
    try {
      if (editingId) {
        const res = await api.patch<AlertRule>(`/alert-rules/${editingId}`, body);
        setRules((prev) => prev.map((r) => (r.id === editingId ? res.data : r)));
      } else {
        const res = await api.post<AlertRule>('/alert-rules', body);
        setRules((prev) => [...prev, res.data]);
      }
      resetForm();
    } catch {
      setFormError(editingId ? 'Failed to update rule' : 'Failed to create rule');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/alert-rules/${id}`);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError('Failed to delete rule');
    }
  }

  async function handleToggle(rule: AlertRule) {
    try {
      const res = await api.patch<AlertRule>(`/alert-rules/${rule.id}`, {
        enabled: !rule.enabled,
      });
      setRules((prev) => prev.map((r) => (r.id === rule.id ? res.data : r)));
    } catch {
      setError('Failed to toggle rule');
    }
  }

  function deviceName(id: string | null): string {
    if (!id) return 'All devices';
    const d = devices.find((dev) => dev.id === id);
    return d ? d.name : id.slice(0, 8) + '…';
  }

  function formatWindow(secs: number): string {
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${secs / 60}m`;
    return `${secs / 3600}h`;
  }

  if (error) return <div className="rules-error">{error}</div>;

  return (
    <div>
      <div className="rules-header">
        <h2>Alert Rules</h2>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          + New Rule
        </button>
      </div>

      {showForm && (
        <form className="rule-form" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Rule' : 'Create Rule'}</h3>
          <div className="form-grid">
            <div className="field">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. High traffic" required />
            </div>
            <div className="field">
              <label>Device</label>
              <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
                <option value="">All devices</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.ipAddress})</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Metric</label>
              <select value={metric} onChange={(e) => setMetric(e.target.value)}>
                {metricOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Threshold</label>
              <input type="number" min="1" value={threshold} onChange={(e) => setThreshold(e.target.value)} required />
            </div>
            <div className="field">
              <label>Window (seconds)</label>
              <input type="number" min="60" max="86400" value={windowSeconds} onChange={(e) => setWindowSeconds(e.target.value)} required />
            </div>
            <div className="field">
              <label>Cooldown (seconds)</label>
              <input type="number" min="0" max="86400" value={cooldownSeconds} onChange={(e) => setCooldownSeconds(e.target.value)} required />
            </div>
          </div>
          <div className="form-actions">
            <label className="toggle-label">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              Enabled
            </label>
            <div>
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
          {formError && <p className="form-error">{formError}</p>}
        </form>
      )}

      {loading ? (
        <p style={{ color: '#888', marginTop: '1rem' }}>Loading…</p>
      ) : rules.length === 0 ? (
        <div className="rules-empty">
          <p>No alert rules configured yet.</p>
        </div>
      ) : (
        <table className="rules-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>Metric</th>
              <th>Threshold</th>
              <th>Window</th>
              <th>Device</th>
              <th>Cooldown</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className={r.enabled ? '' : 'disabled-row'}>
                <td>
                  <button className={`toggle-btn ${r.enabled ? 'on' : 'off'}`} onClick={() => handleToggle(r)}>
                    {r.enabled ? 'ON' : 'OFF'}
                  </button>
                </td>
                <td>{r.name}</td>
                <td>{metricLabels[r.metric] ?? r.metric}</td>
                <td>{Number(r.threshold).toLocaleString()}</td>
                <td>{formatWindow(r.windowSeconds)}</td>
                <td>{deviceName(r.deviceId)}</td>
                <td>{formatWindow(r.cooldownSeconds)}</td>
                <td className="actions-cell">
                  <button className="btn-edit" onClick={() => startEdit(r)}>Edit</button>
                  <button className="btn-danger" onClick={() => handleDelete(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
