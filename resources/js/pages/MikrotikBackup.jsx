import { useState, useEffect } from 'react';
import api from '../api';

export default function MikrotikBackup() {
    const [servers, setServers] = useState([]);
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(null);
    const [selectedServer, setSelectedServer] = useState('');

    useEffect(() => {
        api.get('/mikrotik').then(r => setServers(r.data));
    }, []);

    const handleCreate = async () => {
        if (!selectedServer) return alert('Select a server!');
        setCreating(true);
        try {
            await api.post(`/mikrotik/${selectedServer}/backup`);
            alert('✅ Backup created!');
        } catch {
            alert('❌ Backup failed or not yet supported');
        } finally { setCreating(false); }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h2>💾 Server Backup</h2>
                    <div style={{fontSize:'11px',color:'var(--text3)',marginTop:'2px'}}>Create and manage Mikrotik configuration backups</div>
                </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                <div className="card">
                    <div className="card-head"><div className="card-title">➕ Create New Backup</div></div>
                    <div className="form-group" style={{marginBottom:'14px'}}>
                        <label className="form-label">Select Server *</label>
                        <select value={selectedServer} onChange={e => setSelectedServer(e.target.value)}>
                            <option value="">-- Select Server --</option>
                            {servers.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.ip_address})</option>
                            ))}
                        </select>
                    </div>
                    <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'8px',padding:'10px 14px',fontSize:'11px',color:'#1e40af',marginBottom:'14px'}}>
                        ℹ️ This will create a full backup of your Mikrotik configuration including routes, firewall rules, PPPoE settings and more.
                    </div>
                    <button className="btn btn-primary" onClick={handleCreate} disabled={!selectedServer || creating}>
                        {creating ? '⏳ Creating...' : '💾 Create Backup'}
                    </button>
                </div>

                <div className="card">
                    <div className="card-head"><div className="card-title">📂 Backup History</div></div>
                    {backups.length === 0 ? (
                        <div className="empty-state" style={{padding:'30px 20px'}}>
                            <div style={{fontSize:'32px',marginBottom:'8px'}}>💾</div>
                            <div style={{fontWeight:'600',color:'var(--text1)',marginBottom:'4px',fontSize:'13px'}}>No backups yet</div>
                            <div style={{color:'var(--text3)',fontSize:'11px'}}>Create your first backup to see it here</div>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr><th>Server</th><th>File Name</th><th>Time</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                {backups.map((b, i) => (
                                    <tr key={i}>
                                        <td>{b.server}</td>
                                        <td style={{fontFamily:'monospace',fontSize:'11px'}}>{b.filename}</td>
                                        <td style={{fontSize:'11px',color:'var(--text3)'}}>{b.created_at}</td>
                                        <td><button className="btn btn-sm btn-info">⬇️ Download</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
