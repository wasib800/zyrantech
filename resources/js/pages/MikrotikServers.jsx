import { useState, useEffect } from 'react';
import api from '../api';

export default function MikrotikServers() {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [syncing, setSyncing] = useState(null);
    const [importing, setImporting] = useState(null);
    const [form, setForm] = useState({
        name: '', ip_address: '', port: 256,
        username: '', password: ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { loadServers(); }, []);

    const loadServers = async () => {
        try {
            const res = await api.get('/mikrotik');
            setServers(res.data);
        } finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const res = await api.post('/mikrotik', form);
            setShowModal(false);
            setForm({ name: '', ip_address: '', port: 256, username: '', password: '' });
            await loadServers();
            if (res.data.connected) {
                alert('✅ Server added and connected!');
            } else {
                alert('⚠️ Added but could not connect. Check IP/credentials.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add server');
        } finally { setSaving(false); }
    };

    const handleSync = async (id, name) => {
        setSyncing(id);
        try {
            const res = await api.post(`/mikrotik/${id}/sync`);
            alert(`✅ ${name} synced!\nOnline: ${res.data.online_count} clients`);
            await loadServers();
        } catch(err) {
            alert('❌ Sync failed');
        } finally { setSyncing(null); }
    };

    const handleImport = async (id, name) => {
        if (!confirm(`Import all clients from "${name}"?\n\nThis will import:\n• PPPoE clients\n• Static IP (Queue) clients`)) return;
        setImporting(id);
        try {
            const pppoe = await api.post(`/mikrotik/${id}/import`);
            const queue = await api.post(`/mikrotik/${id}/import-queue`);
            alert(
                `✅ Import Complete!\n\n` +
                `PPPoE: ${pppoe.data.count || 0}\n` +
                `Static IP: ${queue.data.imported || 0}\n` +
                `Skipped: ${queue.data.skipped || 0}`
            );
        } catch(err) {
            alert('❌ Import failed');
        } finally { setImporting(null); }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}"? All clients from this server will also be deleted!`)) return;
        try {
            await api.delete(`/mikrotik/${id}`);
            await loadServers();
        } catch(err) {
            alert('❌ Delete failed');
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h2>🖥️ Mikrotik Servers</h2>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    ➕ Add Server
                </button>
            </div>

            <div className="stats-grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
                <div className="stat-card blue">
                    <div className="stat-top"><div className="stat-icon blue-bg">🖥️</div></div>
                    <div className="stat-value">{servers.length}</div>
                    <div className="stat-label">Total Servers</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-top"><div className="stat-icon green-bg">✅</div></div>
                    <div className="stat-value">{servers.filter(s => s.is_connected).length}</div>
                    <div className="stat-label">Connected</div>
                </div>
                <div className="stat-card red">
                    <div className="stat-top"><div className="stat-icon red-bg">❌</div></div>
                    <div className="stat-value">{servers.filter(s => !s.is_connected).length}</div>
                    <div className="stat-label">Disconnected</div>
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <div className="loading-screen"><div className="spinner"></div> Loading...</div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Server Name</th>
                                <th>IP Address</th>
                                <th>Port</th>
                                <th>Username</th>
                                <th>Status</th>
                                <th>Last Synced</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {servers.map((s, i) => (
                                <tr key={s.id}>
                                    <td className="text-muted">{i + 1}</td>
                                    <td><div className="username">{s.name}</div></td>
                                    <td className="text-cyan">{s.ip_address}</td>
                                    <td className="text-muted">{s.port}</td>
                                    <td className="text-muted">{s.username}</td>
                                    <td>
                                        <span className={`badge ${s.is_connected ? 'badge-active' : 'badge-blocked'}`}>
                                            {s.is_connected ? '● Connected' : '● Disconnected'}
                                        </span>
                                    </td>
                                    <td className="text-muted text-sm">
                                        {s.last_synced_at ? new Date(s.last_synced_at).toLocaleTimeString() : '—'}
                                    </td>
                                    <td>
                                        <div className="action-group">
                                            <button className="btn btn-success btn-xs" onClick={() => handleSync(s.id, s.name)} disabled={syncing === s.id}>
                                                {syncing === s.id ? '⏳' : '🔄 Sync'}
                                            </button>
                                            <button className="btn btn-ghost btn-xs" onClick={() => handleImport(s.id, s.name)} disabled={importing === s.id}>
                                                {importing === s.id ? '⏳' : '📥 Import'}
                                            </button>
                                            <button className="btn btn-danger btn-xs" onClick={() => handleDelete(s.id, s.name)}>
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {servers.length === 0 && !loading && (
                    <div className="no-data">No servers added. Click "Add Server" to get started!</div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <h3>🖥️ Add Mikrotik Server</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {error && <div className="alert-error">{error}</div>}
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Server Name *</label>
                                    <input className="fi" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Main Router" required />
                                </div>
                                <div className="form-group">
                                    <label>IP Address *</label>
                                    <input className="fi" value={form.ip_address} onChange={e => setForm({...form, ip_address: e.target.value})} placeholder="e.g. 103.224.55.88" required />
                                </div>
                                <div className="form-group">
                                    <label>API Port *</label>
                                    <input className="fi" type="number" value={form.port} onChange={e => setForm({...form, port: parseInt(e.target.value)})} placeholder="256" required />
                                </div>
                                <div className="form-group">
                                    <label>Username *</label>
                                    <input className="fi" value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="e.g. admin" required />
                                </div>
                                <div className="form-group" style={{gridColumn:'span 2'}}>
                                    <label>Password *</label>
                                    <input className="fi" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" required />
                                </div>
                            </div>
                            <div style={{background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.2)',borderRadius:'7px',padding:'.65rem',fontSize:'10.5px',color:'var(--text2)',marginBottom:'1rem'}}>
                                ℹ️ Make sure WWW service is enabled on Mikrotik (IP → Services → www) for REST API access.
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? '⏳ Connecting...' : '➕ Add & Test Connection'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
