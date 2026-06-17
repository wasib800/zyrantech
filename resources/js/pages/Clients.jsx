import { useState, useEffect, useCallback } from 'react';
import api from '../api';

export default function Clients() {
    const [clients, setClients] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [onlineFilter, setOnlineFilter] = useState('');
    const [page, setPage] = useState(1);
    const [actionLoading, setActionLoading] = useState(null);
    const [editClient, setEditClient] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadClients();
    }, [search, statusFilter, onlineFilter, page]);

    const loadClients = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);
            if (onlineFilter) params.append('is_online', onlineFilter);
            params.append('page', page);

            const res = await api.get(`/clients?${params}`);
            setClients(res.data.data || []);
            setMeta({
                total: res.data.total,
                last_page: res.data.last_page,
                current_page: res.data.current_page,
            });
        } finally { setLoading(false); }
    };

    const handleBlock = async (id, username) => {
        if (!confirm(`Block "${username}"?`)) return;
        setActionLoading(id + '_block');
        try {
            await api.post(`/clients/${id}/block`);
            await loadClients();
        } finally { setActionLoading(null); }
    };

    const handleUnblock = async (id, username) => {
        if (!confirm(`Unblock "${username}"?`)) return;
        setActionLoading(id + '_unblock');
        try {
            await api.post(`/clients/${id}/unblock`);
            await loadClients();
        } finally { setActionLoading(null); }
    };

    const handleEdit = (client) => {
        setEditClient(client);
        setEditForm({
            name: client.name || '',
            phone: client.phone || '',
            email: client.email || '',
            address: client.address || '',
            zone: client.zone || '',
            nid: client.nid || '',
            monthly_bill: client.monthly_bill || '',
            bill_date: client.bill_date || 1,
            expire_date: client.expire_date ? client.expire_date.split('T')[0] : '',
            notes: client.notes || '',
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/clients/${editClient.id}`, editForm);
            setEditClient(null);
            await loadClients();
        } finally { setSaving(false); }
    };

    const signalColor = (dbm) => {
        if (!dbm || dbm === 0) return 'var(--text3)';
        if (dbm >= -20) return 'var(--green)';
        if (dbm >= -25) return 'var(--amber)';
        return 'var(--red)';
    };

    return (
        <div className="page">
            <div className="page-header">
                <h2>👥 Client Management</h2>
                <div className="btn-group">
                    <button className="btn btn-ghost">📊 Excel</button>
                    <button className="btn btn-primary">➕ Add Client</button>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{marginBottom:'9px'}}>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                    <div className="search-bar" style={{flex:1,minWidth:'200px'}}>
                        <span>🔍</span>
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search username, name, phone, IP, MAC..."
                        />
                        {search && <button onClick={() => setSearch('')} className="clear-btn">✕</button>}
                    </div>
                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="filter-select">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <select value={onlineFilter} onChange={e => { setOnlineFilter(e.target.value); setPage(1); }} className="filter-select">
                        <option value="">All</option>
                        <option value="true">Online</option>
                        <option value="false">Offline</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                {loading ? (
                    <div className="loading-screen"><div className="spinner"></div> Loading clients...</div>
                ) : (
                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Username</th>
                                    <th>Name / Phone</th>
                                    <th>IP Address</th>
                                    <th>MAC</th>
                                    <th>Zone</th>
                                    <th>Profile</th>
                                    <th>Bill</th>
                                    <th>Online</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map((c, i) => (
                                    <tr key={c.id}>
                                        <td className="text-muted">{((page-1)*50) + i + 1}</td>
                                        <td>
                                            <div className="username">{c.username}</div>
                                        </td>
                                        <td>
                                            <div style={{fontSize:'11px',color:'var(--text)'}}>{c.name || '—'}</div>
                                            <div style={{fontSize:'9.5px',color:'var(--text3)'}}>{c.phone || ''}</div>
                                        </td>
                                        <td className="text-cyan">{c.ip_address || '—'}</td>
                                        <td style={{fontSize:'9.5px',color:'var(--text3)'}}>{c.mac_address || '—'}</td>
                                        <td className="text-muted text-sm">{c.zone || '—'}</td>
                                        <td className="text-muted text-sm">{c.profile || '—'}</td>
                                        <td style={{fontSize:'10px',color:'var(--amber)'}}>
                                            {c.monthly_bill > 0 ? `৳${c.monthly_bill}` : '—'}
                                        </td>
                                        <td>
                                            <span className={`online-dot ${c.is_online ? 'on' : 'off'}`}></span>
                                            <span className={c.is_online ? 'text-green' : 'text-muted'} style={{fontSize:'10px'}}>
                                                {c.is_online ? 'Online' : 'Offline'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${c.status}`}>{c.status}</span>
                                        </td>
                                        <td>
                                            <div className="action-group">
                                                <button
                                                    className="btn btn-ghost btn-xs"
                                                    onClick={() => handleEdit(c)}
                                                >
                                                    ✏️
                                                </button>
                                                {c.status === 'blocked' ? (
                                                    <button
                                                        className="btn btn-success btn-xs"
                                                        onClick={() => handleUnblock(c.id, c.username)}
                                                        disabled={actionLoading === c.id + '_unblock'}
                                                    >
                                                        {actionLoading === c.id + '_unblock' ? '⏳' : '▶'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-danger btn-xs"
                                                        onClick={() => handleBlock(c.id, c.username)}
                                                        disabled={actionLoading === c.id + '_block'}
                                                    >
                                                        {actionLoading === c.id + '_block' ? '⏳' : '⛔'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {clients.length === 0 && <div className="no-data">No clients found</div>}
                    </div>
                )}

                {/* Pagination */}
                {meta && meta.last_page > 1 && (
                    <div style={{display:'flex',justifyContent:'center',gap:'6px',marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid var(--border)'}}>
                        <button className="btn btn-ghost btn-xs" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>← Prev</button>
                        <span style={{fontSize:'10px',color:'var(--text2)',padding:'4px 8px'}}>
                            Page {page} of {meta.last_page} ({meta.total} clients)
                        </span>
                        <button className="btn btn-ghost btn-xs" onClick={() => setPage(p => p+1)} disabled={page === meta.last_page}>Next →</button>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editClient && (
                <div className="modal-overlay" onClick={() => setEditClient(null)}>
                    <div className="modal" style={{width:'600px'}} onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <h3>✏️ Edit Client — {editClient.username}</h3>
                            <button className="modal-close" onClick={() => setEditClient(null)}>✕</button>
                        </div>

                        {/* Client Info */}
                        <div style={{background:'var(--bg3)',borderRadius:'8px',padding:'.75rem',marginBottom:'1rem',fontSize:'10.5px'}}>
                            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px'}}>
                                <div><span style={{color:'var(--text3)'}}>IP: </span><span style={{color:'var(--cyan)'}}>{editClient.ip_address || '—'}</span></div>
                                <div><span style={{color:'var(--text3)'}}>MAC: </span><span style={{color:'var(--text2)'}}>{editClient.mac_address || '—'}</span></div>
                                <div><span style={{color:'var(--text3)'}}>Profile: </span><span style={{color:'var(--text2)'}}>{editClient.profile || '—'}</span></div>
                                <div><span style={{color:'var(--text3)'}}>Status: </span>
                                    <span className={`badge badge-${editClient.status}`}>{editClient.status}</span>
                                </div>
                                <div><span style={{color:'var(--text3)'}}>Online: </span>
                                    <span style={{color: editClient.is_online ? 'var(--green)' : 'var(--text3)'}}>
                                        {editClient.is_online ? '🟢 Online' : '⚫ Offline'}
                                    </span>
                                </div>
                                <div><span style={{color:'var(--text3)'}}>Server: </span><span style={{color:'var(--text2)'}}>{editClient.server?.name || '—'}</span></div>
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input className="fi" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="e.g. Abdul Karim" />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input className="fi" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="01XXXXXXXXX" />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input className="fi" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} placeholder="email@example.com" />
                            </div>
                            <div className="form-group">
                                <label>Zone / Area</label>
                                <input className="fi" value={editForm.zone} onChange={e => setEditForm({...editForm, zone: e.target.value})} placeholder="e.g. Agrabad" />
                            </div>
                            <div className="form-group" style={{gridColumn:'span 2'}}>
                                <label>Address</label>
                                <input className="fi" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} placeholder="Full address" />
                            </div>
                            <div className="form-group">
                                <label>NID Number</label>
                                <input className="fi" value={editForm.nid} onChange={e => setEditForm({...editForm, nid: e.target.value})} placeholder="NID" />
                            </div>
                            <div className="form-group">
                                <label>Monthly Bill (৳)</label>
                                <input className="fi" type="number" value={editForm.monthly_bill} onChange={e => setEditForm({...editForm, monthly_bill: e.target.value})} placeholder="500" />
                            </div>
                            <div className="form-group">
                                <label>Bill Date</label>
                                <input className="fi" type="number" min="1" max="31" value={editForm.bill_date} onChange={e => setEditForm({...editForm, bill_date: e.target.value})} placeholder="1" />
                            </div>
                            <div className="form-group">
                                <label>Expire Date</label>
                                <input className="fi" type="date" value={editForm.expire_date} onChange={e => setEditForm({...editForm, expire_date: e.target.value})} />
                            </div>
                            <div className="form-group" style={{gridColumn:'span 2'}}>
                                <label>Notes</label>
                                <input className="fi" value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} placeholder="Any notes..." />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setEditClient(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? '⏳ Saving...' : '💾 Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
