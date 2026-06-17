import { useState, useEffect } from 'react';
import api from '../api';

export default function OLTManagement() {
    const [olts, setOlts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showONUs, setShowONUs] = useState(null);
    const [onus, setOnus] = useState([]);
    const [onuLoading, setOnuLoading] = useState(false);
    const [syncing, setSyncing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({
        name: '', ip_address: '', port: 161,
        community: 'public', olt_type: 'BDCOM_GPON'
    });

    useEffect(() => { loadOLTs(); }, []);

    const loadOLTs = async () => {
        try {
            const res = await api.get('/olt');
            setOlts(res.data);
        } finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const res = await api.post('/olt', form);
            setShowModal(false);
            setForm({ name: '', ip_address: '', port: 161, community: 'public', olt_type: 'BDCOM_GPON' });
            await loadOLTs();
            alert(res.data.connected ? '✅ OLT Connected!' : '⚠️ Added but could not connect. Check IP/Community.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add OLT');
        } finally { setSaving(false); }
    };

    const handleSync = async (id, name) => {
        setSyncing(id);
        try {
            const res = await api.post(`/olt/${id}/sync`);
            alert(`✅ ${name} Synced!\nTotal: ${res.data.total}\nOnline: ${res.data.online}\nOffline: ${res.data.offline}`);
            await loadOLTs();
        } catch (err) {
            alert('❌ Sync failed');
        } finally { setSyncing(null); }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/olt/${id}`);
            await loadOLTs();
        } catch (err) {
            alert('❌ Delete failed');
        }
    };

    const handleViewONUs = async (id, name) => {
        setShowONUs({ id, name });
        setOnuLoading(true);
        setOnus([]);
        try {
            const res = await api.get(`/olt/${id}/onus`);
            setOnus(res.data.onus || []);
        } finally { setOnuLoading(false); }
    };

    const filteredOnus = onus.filter(o =>
        !search ||
        o.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.mac?.toLowerCase().includes(search.toLowerCase())
    );

    const signalColor = (dbm) => {
        if (dbm === 0) return 'var(--text3)';
        if (dbm >= -20) return 'var(--green)';
        if (dbm >= -25) return 'var(--amber)';
        return 'var(--red)';
    };

    const totalOnline = olts.reduce((a, o) => a + (o.status === 'online' ? 1 : 0), 0);

    return (
        <div className="page">
            <div className="page-header">
                <h2>📡 OLT Management</h2>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    ➕ Add OLT
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
                <div className="stat-card blue">
                    <div className="stat-top"><div className="stat-icon blue-bg">📡</div></div>
                    <div className="stat-value">{olts.length}</div>
                    <div className="stat-label">Total OLTs</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-top"><div className="stat-icon green-bg">✅</div></div>
                    <div className="stat-value">{totalOnline}</div>
                    <div className="stat-label">Online OLTs</div>
                </div>
                <div className="stat-card red">
                    <div className="stat-top"><div className="stat-icon red-bg">❌</div></div>
                    <div className="stat-value">{olts.length - totalOnline}</div>
                    <div className="stat-label">Offline OLTs</div>
                </div>
                <div className="stat-card amber">
                    <div className="stat-top"><div className="stat-icon amber-bg">📶</div></div>
                    <div className="stat-value">{onus.length > 0 ? onus.length : '—'}</div>
                    <div className="stat-label">Total ONUs</div>
                </div>
            </div>

            {/* OLT Table */}
            <div className="card">
                <div className="card-head">
                    <div className="card-title">📡 OLT List</div>
                </div>
                {loading ? (
                    <div className="loading-screen"><div className="spinner"></div> Loading...</div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>OLT Name</th>
                                <th>IP Address</th>
                                <th>Community</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Last Synced</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {olts.map((olt, i) => (
                                <tr key={olt.id}>
                                    <td className="text-muted">{i + 1}</td>
                                    <td><div className="username">{olt.name}</div></td>
                                    <td className="text-cyan">{olt.ip_address}</td>
                                    <td className="text-muted">{olt.community}</td>
                                    <td className="text-muted">{olt.olt_type}</td>
                                    <td>
                                        <span className={`badge ${olt.status === 'online' ? 'badge-active' : 'badge-blocked'}`}>
                                            {olt.status === 'online' ? '● Online' : '● Offline'}
                                        </span>
                                    </td>
                                    <td className="text-muted text-sm">
                                        {olt.last_synced_at ? new Date(olt.last_synced_at).toLocaleTimeString() : '—'}
                                    </td>
                                    <td>
                                        <div className="action-group">
                                            <button className="btn btn-success btn-xs" onClick={() => handleSync(olt.id, olt.name)} disabled={syncing === olt.id}>
                                                {syncing === olt.id ? '⏳' : '🔄 Sync'}
                                            </button>
                                            <button className="btn btn-ghost btn-xs" onClick={() => handleViewONUs(olt.id, olt.name)}>
                                                📋 ONUs
                                            </button>
                                            <button className="btn btn-danger btn-xs" onClick={() => handleDelete(olt.id, olt.name)}>
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {olts.length === 0 && !loading && (
                    <div className="no-data">No OLTs added yet. Click "Add OLT" to get started!</div>
                )}
            </div>

            {/* ONU List Modal */}
            {showONUs && (
                <div className="modal-overlay" onClick={() => { setShowONUs(null); setSearch(''); }}>
                    <div className="modal" style={{width:'800px',maxWidth:'95vw'}} onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <h3>📋 {showONUs.name} — ONU List</h3>
                            <button className="modal-close" onClick={() => { setShowONUs(null); setSearch(''); }}>✕</button>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'1rem'}}>
                            <div style={{background:'var(--bg3)',borderRadius:'8px',padding:'.6rem',textAlign:'center'}}>
                                <div style={{fontSize:'18px',fontWeight:'700',color:'var(--blue)'}}>{onus.length}</div>
                                <div style={{fontSize:'9px',color:'var(--text3)'}}>Total ONUs</div>
                            </div>
                            <div style={{background:'var(--bg3)',borderRadius:'8px',padding:'.6rem',textAlign:'center'}}>
                                <div style={{fontSize:'18px',fontWeight:'700',color:'var(--green)'}}>{onus.filter(o=>o.status==='online').length}</div>
                                <div style={{fontSize:'9px',color:'var(--text3)'}}>Online</div>
                            </div>
                            <div style={{background:'var(--bg3)',borderRadius:'8px',padding:'.6rem',textAlign:'center'}}>
                                <div style={{fontSize:'18px',fontWeight:'700',color:'var(--red)'}}>{onus.filter(o=>o.status==='offline').length}</div>
                                <div style={{fontSize:'9px',color:'var(--text3)'}}>Offline</div>
                            </div>
                        </div>
                        <div className="search-row" style={{marginBottom:'.75rem'}}>
                            <div className="search-bar">
                                <span>🔍</span>
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ONU name or MAC..." />
                                {search && <button onClick={() => setSearch('')} className="clear-btn">✕</button>}
                            </div>
                        </div>
                        {onuLoading ? (
                            <div className="loading-screen"><div className="spinner"></div> Loading ONUs...</div>
                        ) : (
                            <div style={{maxHeight:'400px',overflowY:'auto'}}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th>
                                            <th>MAC</th>
                                            <th>Status</th>
                                            <th>RX Power</th>
                                            <th>Distance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOnus.map((onu, i) => (
                                            <tr key={i}>
                                                <td className="text-muted">{i + 1}</td>
                                                <td><div className="username">{onu.name || '—'}</div></td>
                                                <td className="text-cyan" style={{fontSize:'10px'}}>{onu.mac || '—'}</td>
                                                <td>
                                                    <span className={`badge ${onu.status === 'online' ? 'badge-active' : 'badge-blocked'}`}>
                                                        {onu.status === 'online' ? '🟢 Online' : '🔴 Offline'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{color: signalColor(onu.rx_power), fontWeight:'700', fontSize:'11px'}}>
                                                        {onu.rx_power !== 0 ? `${onu.rx_power} dBm` : '—'}
                                                    </span>
                                                </td>
                                                <td className="text-muted">{onu.distance > 0 ? `${onu.distance}m` : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredOnus.length === 0 && <div className="no-data">No ONUs found</div>}
                            </div>
                        )}
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => { setShowONUs(null); setSearch(''); }}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add OLT Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <h3>📡 Add OLT</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {error && <div className="alert-error">{error}</div>}
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>OLT Name *</label>
                                    <input className="fi" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. BDCOM-01 Agrabad" required />
                                </div>
                                <div className="form-group">
                                    <label>IP Address *</label>
                                    <input className="fi" value={form.ip_address} onChange={e => setForm({...form, ip_address: e.target.value})} placeholder="e.g. 192.168.45.2" required />
                                </div>
                                <div className="form-group">
                                    <label>SNMP Port</label>
                                    <input className="fi" type="number" value={form.port} onChange={e => setForm({...form, port: parseInt(e.target.value)})} placeholder="161" />
                                </div>
                                <div className="form-group">
                                    <label>SNMP Community *</label>
                                    <input className="fi" value={form.community} onChange={e => setForm({...form, community: e.target.value})} placeholder="e.g. nmscloud" required />
                                </div>
                                <div className="form-group" style={{gridColumn:'span 2'}}>
                                    <label>OLT Type</label>
                                    <select className="fi" value={form.olt_type} onChange={e => setForm({...form, olt_type: e.target.value})}>
                                        <option value="BDCOM_GPON">BDCOM GPON</option>
                                        <option value="ZTE_GPON">ZTE GPON</option>
                                        <option value="HUAWEI_GPON">Huawei GPON</option>
                                        <option value="EPON">EPON</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{background:'rgba(59,130,246,.1)',border:'1px solid rgba(59,130,246,.2)',borderRadius:'7px',padding:'.65rem',fontSize:'10.5px',color:'var(--text2)',marginBottom:'1rem'}}>
                                ℹ️ SNMP must be enabled on OLT with the correct community string.
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
