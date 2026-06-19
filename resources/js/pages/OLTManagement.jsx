import { useState, useEffect } from 'react';
import api from '../api';

export default function OLTManagement({ defaultTab = 'list' }) {
    const [olts, setOlts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(defaultTab);

    // Sync tab when route changes
    useEffect(() => { setActiveTab(defaultTab); }, [defaultTab]);
    const [showModal, setShowModal] = useState(false);
    const [syncing, setSyncing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [selectedOlt, setSelectedOlt] = useState('');
    const [onus, setOnus] = useState([]);
    const [onuLoading, setOnuLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [form, setForm] = useState({ name:'', ip_address:'', port:161, community:'public', olt_type:'BDCOM_GPON' });

    useEffect(() => { loadOLTs(); }, []);

    const loadOLTs = async () => {
        try { const res = await api.get('/olt'); setOlts(res.data); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true); setError('');
        try {
            const res = await api.post('/olt', form);
            setShowModal(false);
            setForm({ name:'', ip_address:'', port:161, community:'public', olt_type:'BDCOM_GPON' });
            await loadOLTs();
            alert(res.data.connected ? '✅ OLT Connected!' : '⚠️ Added but could not connect.');
        } catch (err) { setError(err.response?.data?.message || 'Failed to add OLT'); }
        finally { setSaving(false); }
    };

    const handleSync = async (id, name) => {
        setSyncing(id);
        try {
            const res = await api.post(`/olt/${id}/sync`);
            alert(`✅ ${name} Synced!\nTotal: ${res.data.total}\nOnline: ${res.data.online}\nOffline: ${res.data.offline}`);
            await loadOLTs();
        } catch { alert('❌ Sync failed'); }
        finally { setSyncing(null); }
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Delete "${name}"?`)) return;
        try { await api.delete(`/olt/${id}`); await loadOLTs(); }
        catch { alert('❌ Delete failed'); }
    };

    const loadONUs = async (id) => {
        setOnuLoading(true); setOnus([]);
        try { const res = await api.get(`/olt/${id}/onus`); setOnus(res.data.onus || []); }
        finally { setOnuLoading(false); }
    };

    const handleOltSelect = (id) => {
        setSelectedOlt(id);
        if (id) loadONUs(id);
    };

    const signalColor = (dbm) => {
        if (!dbm || dbm === 0) return '#94a3b8';
        if (dbm >= -20) return '#16a34a';
        if (dbm >= -25) return '#d97706';
        return '#dc2626';
    };

    const signalBars = (dbm) => {
        if (!dbm || dbm === 0) return 0;
        if (dbm >= -20) return 4;
        if (dbm >= -22) return 3;
        if (dbm >= -25) return 2;
        return 1;
    };

    const filteredOnus = onus.filter(o => {
        const matchSearch = !search || o.name?.toLowerCase().includes(search.toLowerCase()) || o.mac?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalOnus = olts.reduce((a, o) => a + (o.total_onus || 0), 0);
    const onlineOnus = olts.reduce((a, o) => a + (o.online_onus || 0), 0);
    const offlineOnus = olts.reduce((a, o) => a + (o.offline_onus || 0), 0);
    const onlineOlts = olts.filter(o => o.status === 'online').length;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h2>📡 OLT Management</h2>
                    <div style={{fontSize:'11px',color:'var(--text3)',marginTop:'2px'}}>Manage GPON/EPON OLTs via SNMP · BDCOM, ZTE, Huawei supported</div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add OLT</button>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card blue">
                    <div className="stat-top"><div className="stat-icon blue-bg">📡</div></div>
                    <div className="stat-value">{olts.length}</div>
                    <div className="stat-label">Total OLTs</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-top"><div className="stat-icon green-bg">✅</div></div>
                    <div className="stat-value">{onlineOlts}</div>
                    <div className="stat-label">Online OLTs</div>
                </div>
                <div className="stat-card teal">
                    <div className="stat-top"><div className="stat-icon teal-bg">📶</div></div>
                    <div className="stat-value">{onlineOnus}</div>
                    <div className="stat-label">Online ONUs</div>
                </div>
                <div className="stat-card red">
                    <div className="stat-top"><div className="stat-icon red-bg">❌</div></div>
                    <div className="stat-value">{offlineOnus}</div>
                    <div className="stat-label">Offline ONUs</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tab-bar">
                {[
                    {key:'list',    label:'📡 OLT List'},
                    {key:'onus',    label:'📋 OLT Users (ONUs)'},
                    {key:'signal',  label:'📊 Signal Monitor'},
                    {key:'ports',   label:'🔌 Port Status'},
                ].map(t => (
                    <button key={t.key} className={`tab-btn ${activeTab===t.key?'active':''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
                ))}
            </div>

            {/* OLT List Tab */}
            {activeTab === 'list' && (
                <div className="card">
                    <div className="card-head">
                        <div className="card-title">📡 OLT Devices</div>
                        <button className="btn btn-sm btn-info" onClick={loadOLTs}>🔄 Refresh</button>
                    </div>
                    {loading ? <div className="loading-screen"><div className="spinner"></div> Loading...</div> :
                    olts.length === 0 ? (
                        <div className="empty-state">
                            <div style={{fontSize:'40px',marginBottom:'12px'}}>📡</div>
                            <div style={{fontWeight:'600',color:'var(--text1)',marginBottom:'6px'}}>No OLTs added yet</div>
                            <div style={{color:'var(--text3)',fontSize:'12px',marginBottom:'16px'}}>Add your first GPON/EPON OLT to get started</div>
                            <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add OLT</button>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr><th>#</th><th>OLT Name</th><th>IP Address</th><th>Community</th><th>Type</th><th>ONUs</th><th>Status</th><th>Last Synced</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                {olts.map((olt, i) => (
                                    <tr key={olt.id}>
                                        <td style={{color:'var(--text3)'}}>{i+1}</td>
                                        <td>
                                            <div style={{fontWeight:'600',color:'var(--text1)'}}>{olt.name}</div>
                                            <div style={{fontSize:'10px',color:'var(--text3)'}}>SNMP v2c</div>
                                        </td>
                                        <td style={{fontFamily:'monospace',color:'var(--blue)',fontSize:'12px'}}>{olt.ip_address}</td>
                                        <td style={{color:'var(--text2)'}}>{olt.community}</td>
                                        <td><span style={{background:'#eff6ff',color:'#1e40af',padding:'2px 8px',borderRadius:'99px',fontSize:'10px',fontWeight:'700'}}>{olt.olt_type}</span></td>
                                        <td>
                                            <div style={{fontSize:'12px'}}>
                                                <span style={{color:'var(--green)',fontWeight:'700'}}>{olt.online_onus||0}</span>
                                                <span style={{color:'var(--text3)'}}>/</span>
                                                <span style={{color:'var(--text2)'}}>{olt.total_onus||0}</span>
                                            </div>
                                        </td>                                        <td><span className={`badge ${olt.status==='online'?'badge-active':'badge-offline'}`}>
                                            <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'currentColor',display:'inline-block',marginRight:'4px'}}></span>
                                            {olt.status==='online'?'Online':'Offline'}
                                        </span></td>
                                        <td style={{color:'var(--text3)',fontSize:'11px'}}>{olt.last_synced_at ? new Date(olt.last_synced_at).toLocaleTimeString() : '—'}</td>
                                        <td>
                                            <div className="action-group">
                                                <button className="btn btn-sm btn-success" onClick={() => handleSync(olt.id, olt.name)} disabled={syncing===olt.id}>
                                                    {syncing===olt.id ? '⏳' : '🔄 Sync'}
                                                </button>
                                                <button className="btn btn-sm btn-info" onClick={() => { setActiveTab('onus'); handleOltSelect(olt.id); }}>
                                                    📋 ONUs
                                                </button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(olt.id, olt.name)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ONUs Tab */}
            {activeTab === 'onus' && (
                <div className="card">
                    <div className="card-head">
                        <div className="card-title">📋 OLT Users (ONUs/ONTs)</div>
                        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                            <select value={selectedOlt} onChange={e => handleOltSelect(e.target.value)} style={{padding:'5px 10px',borderRadius:'7px',border:'1px solid var(--border2)',fontSize:'12px',color:'var(--text1)',background:'#fff'}}>
                                <option value="">-- Select OLT --</option>
                                {olts.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {selectedOlt && (
                        <div style={{display:'flex',gap:'8px',marginBottom:'14px',flexWrap:'wrap'}}>
                            <div style={{flex:1,minWidth:'160px'}}>
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search ONU name or MAC..." style={{padding:'7px 12px'}} />
                            </div>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{padding:'7px 12px',borderRadius:'7px',border:'1px solid var(--border2)',fontSize:'12px',color:'var(--text1)',background:'#fff'}}>
                                <option value="all">All Status</option>
                                <option value="online">Online Only</option>
                                <option value="offline">Offline Only</option>
                            </select>
                            <div style={{display:'flex',gap:'8px',alignItems:'center',fontSize:'12px',color:'var(--text2)'}}>
                                <span style={{color:'var(--green)',fontWeight:'700'}}>{onus.filter(o=>o.status==='online').length} Online</span>
                                <span>·</span>
                                <span style={{color:'var(--red)',fontWeight:'700'}}>{onus.filter(o=>o.status==='offline').length} Offline</span>
                            </div>
                        </div>
                    )}

                    {!selectedOlt ? (
                        <div className="empty-state"><div style={{fontSize:'32px',marginBottom:'8px'}}>📋</div><div style={{color:'var(--text3)'}}>Select an OLT to view ONUs</div></div>
                    ) : onuLoading ? (
                        <div className="loading-screen"><div className="spinner"></div> Loading ONUs...</div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr><th>#</th><th>ONU Name</th><th>MAC Address</th><th>Status</th><th>RX Power</th><th>Signal</th><th>Distance</th></tr>
                            </thead>
                            <tbody>
                                {filteredOnus.map((onu, i) => (
                                    <tr key={i}>
                                        <td style={{color:'var(--text3)'}}>{i+1}</td>
                                        <td style={{fontWeight:'600',color:'var(--text1)'}}>{onu.name || '—'}</td>
                                        <td style={{fontFamily:'monospace',fontSize:'11px',color:'var(--blue)'}}>{onu.mac || '—'}</td>
                                        <td><span className={`badge ${onu.status==='online'?'badge-active':'badge-offline'}`}>
                                            <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'currentColor',display:'inline-block',marginRight:'4px'}}></span>
                                            {onu.status==='online'?'Online':'Offline'}
                                        </span></td>
                                        <td style={{color:signalColor(onu.rx_power),fontWeight:'700',fontSize:'12px'}}>
                                            {onu.rx_power ? `${onu.rx_power} dBm` : '—'}
                                        </td>
                                        <td>
                                            <div style={{display:'flex',gap:'2px',alignItems:'flex-end'}}>
                                                {[1,2,3,4].map(b => (
                                                    <div key={b} style={{width:'5px',height:`${b*4}px`,borderRadius:'2px',background:b<=signalBars(onu.rx_power)?signalColor(onu.rx_power):'#e2e8f0',transition:'all 0.2s'}}></div>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{color:'var(--text3)',fontSize:'11px'}}>{onu.distance>0?`${onu.distance}m`:'—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {selectedOlt && !onuLoading && filteredOnus.length === 0 && (
                        <div className="empty-state"><div style={{color:'var(--text3)'}}>No ONUs found</div></div>
                    )}
                </div>
            )}

            {/* Signal Monitor Tab */}
            {activeTab === 'signal' && (
                <div className="card">
                    <div className="card-head">
                        <div className="card-title">📊 Signal Monitor (RX Power)</div>
                        <select value={selectedOlt} onChange={e => handleOltSelect(e.target.value)} style={{padding:'5px 10px',borderRadius:'7px',border:'1px solid var(--border2)',fontSize:'12px',color:'var(--text1)',background:'#fff'}}>
                            <option value="">-- Select OLT --</option>
                            {olts.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    </div>

                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'16px'}}>
                        {[
                            {label:'Good Signal',range:'>= -20 dBm',color:'#16a34a',bg:'#f0fdf4',border:'#bbf7d0',count:onus.filter(o=>o.rx_power>=-20&&o.rx_power!==0).length},
                            {label:'Weak Signal',range:'-20 to -25 dBm',color:'#d97706',bg:'#fffbeb',border:'#fde68a',count:onus.filter(o=>o.rx_power<-20&&o.rx_power>=-25).length},
                            {label:'Critical Signal',range:'< -25 dBm',color:'#dc2626',bg:'#fef2f2',border:'#fecaca',count:onus.filter(o=>o.rx_power<-25).length},
                        ].map(s => (
                            <div key={s.label} style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:'10px',padding:'14px',textAlign:'center'}}>
                                <div style={{fontSize:'24px',fontWeight:'700',color:s.color}}>{s.count}</div>
                                <div style={{fontWeight:'600',color:s.color,fontSize:'12px',marginBottom:'3px'}}>{s.label}</div>
                                <div style={{fontSize:'10px',color:s.color,opacity:0.7}}>{s.range}</div>
                            </div>
                        ))}
                    </div>

                    {!selectedOlt ? (
                        <div className="empty-state"><div style={{fontSize:'32px',marginBottom:'8px'}}>📊</div><div style={{color:'var(--text3)'}}>Select an OLT to view signal data</div></div>
                    ) : onuLoading ? (
                        <div className="loading-screen"><div className="spinner"></div> Loading signal data...</div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr><th>#</th><th>ONU Name</th><th>MAC</th><th>RX Power</th><th>Signal Quality</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {[...onus].sort((a,b) => (a.rx_power||0)-(b.rx_power||0)).map((onu,i) => (
                                    <tr key={i}>
                                        <td style={{color:'var(--text3)'}}>{i+1}</td>
                                        <td style={{fontWeight:'600',color:'var(--text1)'}}>{onu.name||'—'}</td>
                                        <td style={{fontFamily:'monospace',fontSize:'11px',color:'var(--blue)'}}>{onu.mac||'—'}</td>
                                        <td style={{color:signalColor(onu.rx_power),fontWeight:'700'}}>{onu.rx_power?`${onu.rx_power} dBm`:'—'}</td>
                                        <td style={{width:'180px'}}>
                                            <div style={{height:'6px',background:'#f1f5f9',borderRadius:'99px',overflow:'hidden'}}>
                                                <div style={{
                                                    height:'100%',
                                                    width:`${onu.rx_power?Math.max(0,Math.min(100,((onu.rx_power+30)/15)*100)):0}%`,
                                                    background:signalColor(onu.rx_power),
                                                    borderRadius:'99px',
                                                    transition:'width 0.5s ease'
                                                }}></div>
                                            </div>
                                        </td>
                                        <td><span className={`badge ${onu.status==='online'?'badge-active':'badge-offline'}`}>{onu.status==='online'?'Online':'Offline'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Ports Tab */}
            {activeTab === 'ports' && (
                <div className="card">
                    <div className="card-head">
                        <div className="card-title">🔌 Port Status</div>
                        <select value={selectedOlt} onChange={e => handleOltSelect(e.target.value)} style={{padding:'5px 10px',borderRadius:'7px',border:'1px solid var(--border2)',fontSize:'12px',color:'var(--text1)',background:'#fff'}}>
                            <option value="">-- Select OLT --</option>
                            {olts.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    </div>
                    {!selectedOlt ? (
                        <div className="empty-state"><div style={{fontSize:'32px',marginBottom:'8px'}}>🔌</div><div style={{color:'var(--text3)'}}>Select an OLT to view port status</div></div>
                    ) : onuLoading ? (
                        <div className="loading-screen"><div className="spinner"></div> Loading ports...</div>
                    ) : (
                        <>
                        {/* Port summary */}
                        {(() => {
                            const ports = {};
                            const selectedOltData = olts.find(o => o.id == selectedOlt);
                            const isBDCOM = selectedOltData?.olt_type?.includes('BDCOM');
                            onus.forEach(o => {
                                let p;
                                if (isBDCOM && o.port) {
                                    p = o.port;
                                } else if (isBDCOM) {
                                    // Parse from EPON0/1:4 format
                                    const m = o.name.match(/EPON0\/(\d+):/);
                                    p = m ? parseInt(m[1]) : null;
                                } else {
                                    // Air Media: epon1:0 format
                                    const match = o.name.match(/epon(\d+):/);
                                    p = match ? parseInt(match[1]) : 1;
                                }
                                if (!p || p <= 0) return;
                                if (!ports[p]) ports[p] = {total:0, online:0};
                                ports[p].total++;
                                if (o.status === 'online') ports[p].online++;
                            });
                            const portNums = Object.keys(ports).map(Number).sort((a,b)=>a-b);
                            return (
                                <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:'8px'}}>
                                    {portNums.map(p => {
                                        const {total, online} = ports[p];
                                        const offline = total - online;
                                        const allOnline = offline === 0 && total > 0;
                                        const hasOffline = offline > 0 && online > 0;
                                        const allOffline = online === 0;
                                        const bg = allOnline ? '#f0fdf4' : hasOffline ? '#fffbeb' : '#fef2f2';
                                        const border = allOnline ? '#bbf7d0' : hasOffline ? '#fde68a' : '#fecaca';
                                        const color = allOnline ? '#16a34a' : hasOffline ? '#d97706' : '#dc2626';
                                        return (
                                            <div key={p} style={{background:bg, border:`1px solid ${border}`, borderRadius:'10px', padding:'12px', textAlign:'center'}}>
                                                <div style={{fontSize:'10px',fontWeight:'700',color:'#94a3b8',marginBottom:'6px'}}>PON {p}</div>
                                                <div style={{fontSize:'22px',fontWeight:'700',color,lineHeight:1}}>{total}</div>
                                                <div style={{fontSize:'9px',color:'#94a3b8',marginTop:'4px'}}>ONUs</div>
                                                <div style={{display:'flex',justifyContent:'center',gap:'4px',marginTop:'6px'}}>
                                                    <span style={{fontSize:'9px',color:'#16a34a',fontWeight:'700'}}>↑{online}</span>
                                                    <span style={{fontSize:'9px',color:'#dc2626',fontWeight:'700'}}>↓{offline}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                        </>
                    )}
                </div>
            )}

            {/* Add OLT Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <div className="modal-title">📡 Add OLT Device</div>
                            <button onClick={() => setShowModal(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'18px',color:'var(--text3)',lineHeight:1}}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#991b1b',borderRadius:'8px',padding:'10px 14px',marginBottom:'14px',fontSize:'12px'}}>❌ {error}</div>}
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}}>
                                <div className="form-group">
                                    <label className="form-label">OLT Name *</label>
                                    <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="e.g. BDCOM-01 Agrabad" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">IP Address *</label>
                                    <input value={form.ip_address} onChange={e => setForm({...form,ip_address:e.target.value})} placeholder="e.g. 192.168.45.2" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">SNMP Port</label>
                                    <input type="number" value={form.port} onChange={e => setForm({...form,port:parseInt(e.target.value)})} placeholder="161" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">SNMP Community *</label>
                                    <input value={form.community} onChange={e => setForm({...form,community:e.target.value})} placeholder="e.g. nmscloud" required />
                                </div>
                                <div className="form-group" style={{gridColumn:'span 2'}}>
                                    <label className="form-label">OLT Type</label>
                                    <select value={form.olt_type} onChange={e => setForm({...form,olt_type:e.target.value})}>
                                        <optgroup label="── BDCOM ──">
                                            <option value="BDCOM_GPON">BDCOM GPON</option>
                                            <option value="BDCOM_EPON">BDCOM EPON</option>
                                        </optgroup>
                                        <optgroup label="── ZTE ──">
                                            <option value="ZTE_GPON">ZTE GPON</option>
                                            <option value="ZTE_EPON">ZTE EPON</option>
                                        </optgroup>
                                        <optgroup label="── Huawei ──">
                                            <option value="HUAWEI_GPON">Huawei GPON</option>
                                        </optgroup>
                                        <optgroup label="── VSOL ──">
                                            <option value="VSOL_GPON">VSOL GPON</option>
                                            <option value="VSOL_EPON">VSOL EPON</option>
                                        </optgroup>
                                        <optgroup label="── Quantico ──">
                                            <option value="QUANTICO_GPON">Quantico GPON</option>
                                            <option value="QUANTICO_EPON">Quantico EPON</option>
                                        </optgroup>
                                        <optgroup label="── Air Media ──">
                                            <option value="AIRMEDIA_GPON">Air Media GPON</option>
                                            <option value="AIRMEDIA_EPON">Air Media EPON</option>
                                        </optgroup>
                                        <optgroup label="── C-Data ──">
                                            <option value="CDATA_EPON">C-Data EPON</option>
                                        </optgroup>
                                        <optgroup label="── FiberHome ──">
                                            <option value="FIBERHOME_GPON">FiberHome GPON</option>
                                        </optgroup>
                                        <optgroup label="── Generic ──">
                                            <option value="EPON">Generic EPON</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>
                            <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'8px',padding:'10px 14px',fontSize:'11px',color:'#1e40af',marginBottom:'14px'}}>
                                ℹ️ SNMP must be enabled on OLT with the correct community string for data polling.
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
