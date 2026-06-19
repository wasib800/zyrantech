import { useState, useEffect } from 'react';
import api from '../api';

export default function MikrotikImport() {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(null);
    const [results, setResults] = useState(null);
    const [selectedServer, setSelectedServer] = useState('');
    const [protocol, setProtocol] = useState('all');

    useEffect(() => {
        api.get('/mikrotik').then(r => { setServers(r.data); setLoading(false); });
    }, []);

    const handleImport = async () => {
        if (!selectedServer) return alert('Please select a server!');
        setImporting(true); setResults(null);
        try {
            const pppoe = await api.post(`/mikrotik/${selectedServer}/import`);
            const queue = await api.post(`/mikrotik/${selectedServer}/import-queue`);
            setResults({
                pppoe: pppoe.data.count || 0,
                static: queue.data.imported || 0,
                skipped: queue.data.skipped || 0,
            });
        } catch { alert('❌ Import failed'); }
        finally { setImporting(false); }
    };

    const server = servers.find(s => s.id == selectedServer);

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h2>📥 Import From Mikrotik</h2>
                    <div style={{fontSize:'11px',color:'var(--text3)',marginTop:'2px'}}>Import PPPoE and Static IP clients from your Mikrotik routers</div>
                </div>
            </div>

            {/* Steps */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px'}}>
                {[
                    {n:'1',title:'Select Server',desc:'Choose which Mikrotik router to import from',icon:'🖥️'},
                    {n:'2',title:'Choose Protocol',desc:'Select PPPoE, Static IP or both',icon:'🔌'},
                    {n:'3',title:'Import Clients',desc:'Clients will be added to your database',icon:'✅'},
                ].map(s => (
                    <div key={s.n} className="card" style={{display:'flex',gap:'14px',alignItems:'flex-start'}}>
                        <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#eff6ff',color:'#2563eb',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'14px',flexShrink:0}}>{s.n}</div>
                        <div>
                            <div style={{fontWeight:'600',fontSize:'13px',color:'var(--text1)',marginBottom:'3px'}}>{s.title}</div>
                            <div style={{fontSize:'11px',color:'var(--text3)'}}>{s.desc}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="card-head">
                    <div className="card-title">📥 Import Settings</div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'16px'}}>
                    <div className="form-group">
                        <label className="form-label">Select Mikrotik Server *</label>
                        <select value={selectedServer} onChange={e => setSelectedServer(e.target.value)}>
                            <option value="">-- Select Server --</option>
                            {servers.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.ip_address}) {s.is_connected ? '✅' : '❌'}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Protocol</label>
                        <select value={protocol} onChange={e => setProtocol(e.target.value)}>
                            <option value="all">All (PPPoE + Static IP)</option>
                            <option value="pppoe">PPPoE Only</option>
                            <option value="static">Static IP (Queue) Only</option>
                        </select>
                    </div>
                </div>

                {selectedServer && server && (
                    <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'8px',padding:'12px 16px',marginBottom:'16px',display:'flex',gap:'12px',alignItems:'center'}}>
                        <span style={{fontSize:'20px'}}>✅</span>
                        <div>
                            <div style={{fontWeight:'600',color:'#166534',fontSize:'13px'}}>{server.name}</div>
                            <div style={{fontSize:'11px',color:'#16a34a'}}>{server.ip_address}:{server.port} · {server.is_connected ? 'Connected' : 'Disconnected'}</div>
                        </div>
                    </div>
                )}

                <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'8px',padding:'10px 14px',fontSize:'11px',color:'#1e40af',marginBottom:'16px'}}>
                    ℹ️ Import will add new clients from Mikrotik to your database. Existing clients will be skipped (no duplicates).
                </div>

                <button className="btn btn-primary" onClick={handleImport} disabled={!selectedServer || importing}>
                    {importing ? '⏳ Importing...' : '📥 Start Import'}
                </button>
            </div>

            {results && (
                <div className="card">
                    <div className="card-head"><div className="card-title">✅ Import Results</div></div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px'}}>
                        <div style={{textAlign:'center',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'16px'}}>
                            <div style={{fontSize:'28px',fontWeight:'700',color:'#16a34a'}}>{results.pppoe}</div>
                            <div style={{fontSize:'11px',color:'#166534',marginTop:'4px'}}>PPPoE Clients Imported</div>
                        </div>
                        <div style={{textAlign:'center',background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'10px',padding:'16px'}}>
                            <div style={{fontSize:'28px',fontWeight:'700',color:'#2563eb'}}>{results.static}</div>
                            <div style={{fontSize:'11px',color:'#1e40af',marginTop:'4px'}}>Static IP Clients Imported</div>
                        </div>
                        <div style={{textAlign:'center',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'10px',padding:'16px'}}>
                            <div style={{fontSize:'28px',fontWeight:'700',color:'#d97706'}}>{results.skipped}</div>
                            <div style={{fontSize:'11px',color:'#92400e',marginTop:'4px'}}>Skipped (Already Exist)</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
