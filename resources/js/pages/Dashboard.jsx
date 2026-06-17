import { useState, useEffect } from 'react';
import api from '../api';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        try {
            const res = await api.get('/dashboard/stats');
            setStats(res.data);
            setLastSync(new Date().toLocaleTimeString('en-BD'));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const syncMikrotik = async () => {
        setSyncing(true);
        try {
            await api.post('/mikrotik/2/sync');
            await loadStats();
        } finally { setSyncing(false); }
    };

    if (loading) return (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',gap:'12px',color:'var(--text2)'}}>
            <div className="spinner"></div> Loading real-time data...
        </div>
    );

    const total = stats?.total_clients || 1;
    const onlinePct = Math.round((stats?.online_clients / total) * 100);
    const blockedPct = Math.round((stats?.blocked_clients / total) * 100);
    const activePct = Math.round((stats?.active_clients / total) * 100);
    const onuPct = stats?.total_onus ? Math.round((stats?.online_onus / stats?.total_onus) * 100) : 0;

    return (
        <div className="page">
            <div className="page-header">
                <h2>📊 Dashboard</h2>
                <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                    {lastSync && <span style={{fontSize:'10px',color:'var(--text3)'}}>Last sync: {lastSync}</span>}
                    <button className="btn btn-primary" onClick={syncMikrotik} disabled={syncing}>
                        {syncing ? '⏳ Syncing...' : '🔄 Sync Mikrotik'}
                    </button>
                </div>
            </div>

            {/* Row 1 - Mikrotik Stats */}
            <div style={{fontSize:'10px',color:'var(--text3)',marginBottom:'6px',fontWeight:'600',letterSpacing:'.05em'}}>🖥️ MIKROTIK</div>
            <div className="stats-grid">
                <div className="stat-card blue">
                    <div className="stat-top">
                        <div className="stat-icon blue-bg">👥</div>
                        <div className="stat-trend up">+30 ▲</div>
                    </div>
                    <div className="stat-value">{stats?.total_clients?.toLocaleString()}</div>
                    <div className="stat-label">Total Clients</div>
                    <div className="stat-bar"><div className="stat-bar-fill blue" style={{width:'78%'}}></div></div>
                </div>
                <div className="stat-card green">
                    <div className="stat-top">
                        <div className="stat-icon green-bg">🟢</div>
                        <div className="stat-trend up">{onlinePct}% ▲</div>
                    </div>
                    <div className="stat-value">{stats?.online_clients?.toLocaleString()}</div>
                    <div className="stat-label">Online Clients</div>
                    <div className="stat-bar"><div className="stat-bar-fill green" style={{width:onlinePct+'%'}}></div></div>
                </div>
                <div className="stat-card amber">
                    <div className="stat-top">
                        <div className="stat-icon amber-bg">⚠️</div>
                        <div className="stat-trend down">{blockedPct}% ▼</div>
                    </div>
                    <div className="stat-value">{stats?.blocked_clients?.toLocaleString()}</div>
                    <div className="stat-label">Blocked Clients</div>
                    <div className="stat-bar"><div className="stat-bar-fill amber" style={{width:blockedPct+'%'}}></div></div>
                </div>
                <div className="stat-card red">
                    <div className="stat-top">
                        <div className="stat-icon red-bg">🔴</div>
                        <div className="stat-trend down">Offline</div>
                    </div>
                    <div className="stat-value">{(stats?.total_clients - stats?.online_clients)?.toLocaleString()}</div>
                    <div className="stat-label">Offline Clients</div>
                    <div className="stat-bar"><div className="stat-bar-fill red" style={{width:(100-onlinePct)+'%'}}></div></div>
                </div>
            </div>

            {/* Row 2 - OLT Stats */}
            <div style={{fontSize:'10px',color:'var(--text3)',marginBottom:'6px',marginTop:'4px',fontWeight:'600',letterSpacing:'.05em'}}>📡 OLT / GPON</div>
            <div className="stats-grid">
                <div className="stat-card purple">
                    <div className="stat-top"><div className="stat-icon purple-bg">📡</div></div>
                    <div className="stat-value">{stats?.total_olts}</div>
                    <div className="stat-label">Total OLTs</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-top">
                        <div className="stat-icon green-bg">✅</div>
                        <div className="stat-trend up">{onuPct}% ▲</div>
                    </div>
                    <div className="stat-value">{stats?.online_onus?.toLocaleString()}</div>
                    <div className="stat-label">Online ONUs</div>
                    <div className="stat-bar"><div className="stat-bar-fill green" style={{width:onuPct+'%'}}></div></div>
                </div>
                <div className="stat-card red">
                    <div className="stat-top"><div className="stat-icon red-bg">❌</div></div>
                    <div className="stat-value">{stats?.offline_onus}</div>
                    <div className="stat-label">Offline ONUs</div>
                </div>
                <div className="stat-card teal">
                    <div className="stat-top"><div className="stat-icon teal-bg">📶</div></div>
                    <div className="stat-value">{stats?.total_onus}</div>
                    <div className="stat-label">Total ONUs</div>
                </div>
            </div>

            {/* Row 3 - Details */}
            <div className="grid-21">
                <div className="card">
                    <div className="card-head">
                        <div className="card-title">🖥️ Mikrotik Status</div>
                        <div className="live-badge"><span className="pulse"></span> Live</div>
                    </div>
                    <div className="server-item" style={{marginBottom:'1rem'}}>
                        <div className="server-dot online"></div>
                        <div className="server-info">
                            <div className="server-name">My Mikrotik — 103.224.55.88</div>
                            <div className="server-ip">Port: 256 · REST API · Connected ✓</div>
                        </div>
                        <span style={{marginLeft:'auto',fontSize:'10px',color:'var(--green)'}}>● Online</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px',marginBottom:'1rem'}}>
                        {[
                            {label:'Total',val:stats?.total_clients,color:'var(--blue)'},
                            {label:'Online',val:stats?.online_clients,color:'var(--green)'},
                            {label:'Blocked',val:stats?.blocked_clients,color:'var(--red)'},
                            {label:'Active',val:stats?.active_clients,color:'var(--amber)'},
                        ].map(s => (
                            <div key={s.label} style={{textAlign:'center',background:'var(--bg3)',borderRadius:'7px',padding:'.5rem'}}>
                                <div style={{fontSize:'16px',fontWeight:'700',color:s.color}}>{s.val?.toLocaleString()}</div>
                                <div style={{fontSize:'9px',color:'var(--text3)',marginTop:'2px'}}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                        {[
                            {label:'Online Rate',pct:onlinePct,color:'var(--green)'},
                            {label:'Block Rate',pct:blockedPct,color:'var(--red)'},
                            {label:'Active Rate',pct:activePct,color:'var(--blue)'},
                        ].map(p => (
                            <div key={p.label}>
                                <div style={{display:'flex',justifyContent:'space-between',fontSize:'10px',marginBottom:'3px'}}>
                                    <span style={{color:'var(--text2)'}}>{p.label}</span>
                                    <span style={{color:p.color}}>{p.pct}%</span>
                                </div>
                                <div style={{height:'4px',background:'var(--border)',borderRadius:'2px'}}>
                                    <div style={{height:'100%',width:p.pct+'%',background:p.color,borderRadius:'2px',transition:'width .5s'}}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{display:'flex',flexDirection:'column',gap:'9px'}}>
                    <div className="card">
                        <div className="card-head">
                            <div className="card-title">📡 OLT Status</div>
                            <div className="live-badge"><span className="pulse"></span> Live</div>
                        </div>
                        <div className="server-item" style={{marginBottom:'8px'}}>
                            <div className="server-dot online"></div>
                            <div className="server-info">
                                <div className="server-name">BDCOM P3600</div>
                                <div className="server-ip">192.168.45.2 · SNMP · nmscloud</div>
                            </div>
                            <span style={{fontSize:'10px',color:'var(--green)'}}>● Online</span>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px'}}>
                            {[
                                {label:'Total ONUs',val:stats?.total_onus,color:'var(--blue)'},
                                {label:'Online',val:stats?.online_onus,color:'var(--green)'},
                                {label:'Offline',val:stats?.offline_onus,color:'var(--red)'},
                            ].map(s => (
                                <div key={s.label} style={{textAlign:'center',background:'var(--bg3)',borderRadius:'7px',padding:'.5rem'}}>
                                    <div style={{fontSize:'14px',fontWeight:'700',color:s.color}}>{s.val}</div>
                                    <div style={{fontSize:'9px',color:'var(--text3)',marginTop:'2px'}}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{marginTop:'8px'}}>
                            <div style={{display:'flex',justifyContent:'space-between',fontSize:'10px',marginBottom:'3px'}}>
                                <span style={{color:'var(--text2)'}}>ONU Online Rate</span>
                                <span style={{color:'var(--green)'}}>{onuPct}%</span>
                            </div>
                            <div style={{height:'4px',background:'var(--border)',borderRadius:'2px'}}>
                                <div style={{height:'100%',width:onuPct+'%',background:'var(--green)',borderRadius:'2px'}}></div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-head">
                            <div className="card-title">⚙️ System Info</div>
                        </div>
                        {[
                            {label:'Mikrotik API',val:'REST API ✓',color:'var(--green)'},
                            {label:'OLT SNMP',val:'Connected ✓',color:'var(--green)'},
                            {label:'Database',val:'MySQL ✓',color:'var(--green)'},
                            {label:'Last Sync',val:lastSync||'—',color:'var(--text2)'},
                            {label:'Version',val:'ZyranTech v1.0',color:'var(--blue)'},
                        ].map(i => (
                            <div key={i.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'.4rem 0',borderBottom:'1px solid rgba(26,45,74,.4)',fontSize:'10.5px'}}>
                                <span style={{color:'var(--text2)'}}>{i.label}</span>
                                <span style={{color:i.color,fontWeight:'600'}}>{i.val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 4 */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'9px'}}>
                <div className="card">
                    <div className="card-head">
                        <div className="card-title">🎫 Support Tickets</div>
                        <div className="live-badge">View all</div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'5px'}}>
                        {[{l:'Total',v:3,c:'var(--blue)'},{l:'Pending',v:0,c:'var(--amber)'},{l:'Processing',v:3,c:'var(--purple)'},{l:'Solved',v:0,c:'var(--green)'}].map(s=>(
                            <div key={s.l} style={{textAlign:'center',background:'var(--bg3)',borderRadius:'6px',padding:'.45rem'}}>
                                <div style={{fontSize:'16px',fontWeight:'700',color:s.c}}>{s.v}</div>
                                <div style={{fontSize:'9px',color:'var(--text3)'}}>{s.l}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="card">
                    <div className="card-head">
                        <div className="card-title">💻 Device Health</div>
                        <div className="live-badge"><span className="pulse"></span> Live</div>
                    </div>
                    {[
                        {label:'CPU Core-SW',val:'23%',color:'var(--green)'},
                        {label:'RAM Core-SW',val:'67%',color:'var(--amber)'},
                        {label:'BW Download',val:'8.7 Gbps',color:'var(--blue)'},
                        {label:'BW Upload',val:'3.2 Gbps',color:'var(--blue)'},
                        {label:'Core Uptime',val:'47d 3h',color:'var(--green)'},
                    ].map(i=>(
                        <div key={i.label} style={{display:'flex',justifyContent:'space-between',padding:'.35rem 0',borderBottom:'1px solid rgba(26,45,74,.4)',fontSize:'10.5px'}}>
                            <span style={{color:'var(--text2)'}}>{i.label}</span>
                            <span style={{color:i.color,fontWeight:'700'}}>{i.val}</span>
                        </div>
                    ))}
                </div>
                <div className="card">
                    <div className="card-head">
                        <div className="card-title">🕐 Attendance Today</div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'5px'}}>
                        {[{l:'Present',v:14,c:'var(--green)'},{l:'Absent',v:2,c:'var(--red)'},{l:'Late',v:1,c:'var(--amber)'}].map(s=>(
                            <div key={s.l} style={{textAlign:'center',background:'var(--bg3)',borderRadius:'6px',padding:'.45rem'}}>
                                <div style={{fontSize:'18px',fontWeight:'700',color:s.c}}>{s.v}</div>
                                <div style={{fontSize:'9px',color:'var(--text3)'}}>{s.l}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{fontSize:'10.5px',color:'var(--text3)',textAlign:'center',marginTop:'.5rem'}}>HRM module coming soon</div>
                </div>
            </div>
        </div>
    );
}
