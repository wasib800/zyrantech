import { useState, useEffect } from 'react';
import api from '../api';

export default function MikrotikServers() {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [syncing, setSyncing] = useState(null);
    const [importing, setImporting] = useState(null);
    const [activeTab, setActiveTab] = useState('servers');
    const [form, setForm] = useState({ name: '', ip_address: '', port: 256, username: '', password: '' });
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
        setSaving(true); setError('');
        try {
            const res = await api.post('/mikrotik', form);
            setShowModal(false);
            setForm({ name: '', ip_address: '', port: 256, username: '', password: '' });
            await loadServers();
            alert(res.data.connected ? '✅ Server added and connected!' : '⚠️ Added but could not connect.');
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
        } catch { alert('❌ Sync failed'); }
        finally { setSyncing(null); }
    };

    const handleImport = async (id, name) => {
        if (!confirm(`Import all clients from "${name}"?`)) return;
        setImporting(id);
        try {
            const pppoe = await api.post(`/mikrotik/${id}/import`);
            const queue = await api.post(`/mikrotik/${id}/import-queue`);
            alert(`✅ Import Complete!\nPPPoE: ${pppoe.data.count || 0}\nStatic IP: ${queue.data.imported || 0}`);
        } catch { alert('❌ Import failed'); }
        finally { setImporting(null); }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}"?`)) return;
        try {
            await api.delete(`/mikrotik/${id}`);
            await loadServers();
        } catch { alert('❌ Delete failed'); }
    };

    const connected = servers.filter(s => s.is_connected).length;
    const disconnected = servers.filter(s => !s.is_connected).length;

    return (
        <div className="page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h2>🖥️ Mikrotik Servers</h2>
                    <div style={{fontSize:'11px',color:'var(--text3)',marginTop:'2px'}}>Manage your Mikrotik routers via REST API</div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    ➕ Add Server
                </button>
            </div>

            {/* Stat Cards */}
            <div className="stats-grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
                <div className="stat-card blue">
                    <div className="stat-top"><div className="stat-icon blue-bg">🖥️</div></div>
                    <div className="stat-value">{servers.length}</div>
                    <div className="stat-label">Total Servers</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-top"><div className="stat-icon green-bg">✅</div></div>
                    <div className="stat-value">{connected}</div>
                    <div className="stat-label">Connected</div>
                </div>
                <div className="stat-card red">
                    <div className="stat-top"><div className="stat-icon red-bg">❌</div></div>
                    <div className="stat-value">{disconnected}</div>
                    <div className="stat-label">Disconnected</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tab-bar">
                {[
                    {key:'servers', label:'🖥️ Server List'},
                    {key:'import', label:'📥 Import From Mikrotik'},
                    {key:'bulk', label:'📦 Bulk Client Import'},
                    {key:'backup', label:'💾 Server Backup'},
                ].map(t => (
                    <button
                        key={t.key}
                        className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(t.key)}
                    >{t.label}</button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'servers' && (
                <div className="card">
                    {loading ? (
                        <div className="loading-screen"><div className="spinner"></div> Loading servers...</div>
                    ) : servers.length === 0 ? (
                        <div className="empty-state">
                            <div style={{fontSize:'40px',marginBottom:'12px'}}>🖥️</div>
                            <div style={{fontWeight:'600',color:'var(--text1)',marginBottom:'6px'}}>No servers added yet</div>
                            <div style={{color:'var(--text3)',fontSize:'12px',marginBottom:'16px'}}>Add your first Mikrotik router to get started</div>
                            <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Server</button>
                        </div>
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
                                        <td style={{color:'var(--text3)',fontSize:'12px'}}>{i+1}</td>
                                        <td>
                                            <div style={{fontWeight:'600',color:'var(--text1)',fontSize:'13px'}}>{s.name}</div>
                                            <div style={{fontSize:'10px',color:'var(--text3)'}}>REST API</div>
                                        </td>
                                        <td style={{fontFamily:'monospace',color:'var(--blue)',fontSize:'12px'}}>{s.ip_address}</td>
                                        <td style={{color:'var(--text2)'}}>{s.port}</td>
                                        <td style={{color:'var(--text2)'}}>{s.username}</td>
                                        <td>
                                            <span className={`badge ${s.is_connected ? 'badge-active' : 'badge-offline'}`}>
                                                <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'currentColor',display:'inline-block',marginRight:'4px'}}></span>
                                                {s.is_connected ? 'Connected' : 'Disconnected'}
                                            </span>
                                        </td>
                                        <td style={{color:'var(--text3)',fontSize:'11px'}}>
                                            {s.last_synced_at ? new Date(s.last_synced_at).toLocaleTimeString() : '—'}
                                        </td>
                                        <td>
                                            <div className="action-group">
                                                <button className="btn btn-sm btn-success" onClick={() => handleSync(s.id, s.name)} disabled={syncing===s.id}>
                                                    {syncing===s.id ? '⏳' : '🔄 Sync'}
                                                </button>
                                                <button className="btn btn-sm btn-info" onClick={() => handleImport(s.id, s.name)} disabled={importing===s.id}>
                                                    {importing===s.id ? '⏳' : '📥 Import'}
                                                </button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id, s.name)}>
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {activeTab === 'import' && (
                <div className="card">
                    <div className="card-head">
                        <div className="card-title">📥 Import From Mikrotik</div>
                    </div>
                    <div className="empty-state">
                        <div style={{fontSize:'40px',marginBottom:'12px'}}>📥</div>
                        <div style={{fontWeight:'600',color:'var(--text1)',marginBottom:'6px'}}>Import Clients from Mikrotik</div>
                        <div style={{color:'var(--text3)',fontSize:'12px',marginBottom:'16px'}}>Select a server and import PPPoE or Static IP clients</div>
                        <div style={{display:'flex',gap:'8px',justifyContent:'center',flexWrap:'wrap'}}>
                            {servers.map(s => (
                                <button key={s.id} className="btn btn-primary" onClick={() => handleImport(s.id, s.name)} disabled={importing===s.id}>
                                    {importing===s.id ? '⏳ Importing...' : `📥 Import from ${s.name}`}
                                </button>
                            ))}
                            {servers.length === 0 && <div style={{color:'var(--text3)'}}>No servers found. Add a server first.</div>}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'bulk' && (
                <div className="card">
                    <div className="card-head">
                        <div className="card-title">📦 Bulk Client Import</div>
                        <span className="nav-badge soon" style={{fontSize:'10px',padding:'3px 8px',borderRadius:'99px',background:'rgba(217,119,6,0.1)',color:'#d97706',border:'1px solid rgba(217,119,6,0.3)'}}>Coming Soon</span>
                    </div>
                    <div className="empty-state">
                        <div style={{fontSize:'40px',marginBottom:'12px'}}>📦</div>
                        <div style={{fontWeight:'600',color:'var(--text1)',marginBottom:'6px'}}>Bulk Import via CSV/Excel</div>
                        <div style={{color:'var(--text3)',fontSize:'12px'}}>Upload a CSV or Excel file to import multiple clients at once. This feature is coming soon.</div>
                    </div>
                </div>
            )}

            {activeTab === 'backup' && (
                <div className="card">
                    <div className="card-head">
                        <div className="card-title">💾 Server Backup</div>
                        <span style={{fontSize:'10px',padding:'3px 8px',borderRadius:'99px',background:'rgba(217,119,6,0.1)',color:'#d97706',border:'1px solid rgba(217,119,6,0.3)',fontWeight:'700'}}>Coming Soon</span>
                    </div>
                    <div className="empty-state">
                        <div style={{fontSize:'40px',marginBottom:'12px'}}>💾</div>
                        <div style={{fontWeight:'600',color:'var(--text1)',marginBottom:'6px'}}>Mikrotik Server Backup</div>
                        <div style={{color:'var(--text3)',fontSize:'12px'}}>Backup your Mikrotik configuration files directly from the panel. Coming soon.</div>
                    </div>
                </div>
            )}

            {/* Add Server Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <div className="modal-title">🖥️ Add Mikrotik Server</div>
                            <button onClick={() => setShowModal(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'18px',color:'var(--text3)',lineHeight:1}}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#991b1b',borderRadius:'8px',padding:'10px 14px',marginBottom:'14px',fontSize:'12px'}}>
                                    ❌ {error}
                                </div>
                            )}
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}}>
                                <div className="form-group">
                                    <label className="form-label">Server Name *</label>
                                    <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="e.g. Main Router" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">IP Address *</label>
                                    <input value={form.ip_address} onChange={e => setForm({...form,ip_address:e.target.value})} placeholder="e.g. 103.224.55.88" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">API Port *</label>
                                    <input type="number" value={form.port} onChange={e => setForm({...form,port:parseInt(e.target.value)})} placeholder="256" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Username *</label>
                                    <input value={form.username} onChange={e => setForm({...form,username:e.target.value})} placeholder="e.g. admin" required />
                                </div>
                                <div className="form-group" style={{gridColumn:'span 2'}}>
                                    <label className="form-label">Password *</label>
                                    <input type="password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} placeholder="••••••••" required />
                                </div>
                            </div>
                            <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'8px',padding:'10px 14px',fontSize:'11px',color:'#1e40af',marginBottom:'14px'}}>
                                ℹ️ Make sure WWW service is enabled on Mikrotik (IP → Services → www) for REST API access.
                            </div>
                            <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
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
