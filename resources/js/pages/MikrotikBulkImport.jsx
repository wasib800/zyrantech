import { useState } from 'react';

export default function MikrotikBulkImport() {
    const [dragOver, setDragOver] = useState(false);
    const [file, setFile] = useState(null);

    const handleDrop = (e) => {
        e.preventDefault(); setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) setFile(f);
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h2>📦 Bulk Client Import</h2>
                    <div style={{fontSize:'11px',color:'var(--text3)',marginTop:'2px'}}>Import multiple clients at once via CSV or Excel file</div>
                </div>
                <a href="#" className="btn btn-primary" style={{textDecoration:'none'}}>⬇️ Download Template</a>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'12px'}}>
                <div className="card">
                    <div className="card-head"><div className="card-title">📤 Upload File</div></div>

                    <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        style={{
                            border: `2px dashed ${dragOver ? '#2563eb' : '#e2e8f0'}`,
                            borderRadius: '10px',
                            padding: '40px',
                            textAlign: 'center',
                            background: dragOver ? '#eff6ff' : '#f8fafc',
                            transition: 'all 0.2s ease',
                            marginBottom: '16px',
                            cursor: 'pointer',
                        }}
                        onClick={() => document.getElementById('fileInput').click()}
                    >
                        <div style={{fontSize:'36px',marginBottom:'10px'}}>📂</div>
                        <div style={{fontWeight:'600',color:'var(--text1)',marginBottom:'5px'}}>
                            {file ? file.name : 'Drop your CSV or Excel file here'}
                        </div>
                        <div style={{fontSize:'11px',color:'var(--text3)'}}>or click to browse · .csv, .xlsx supported</div>
                        <input id="fileInput" type="file" accept=".csv,.xlsx" style={{display:'none'}} onChange={e => setFile(e.target.files[0])} />
                    </div>

                    {file && (
                        <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'8px',padding:'10px 14px',marginBottom:'14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <span style={{color:'#166534',fontWeight:'600',fontSize:'12px'}}>📄 {file.name}</span>
                            <button onClick={() => setFile(null)} style={{background:'none',border:'none',color:'#dc2626',cursor:'pointer',fontSize:'16px'}}>×</button>
                        </div>
                    )}

                    <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'8px',padding:'10px 14px',fontSize:'11px',color:'#92400e',marginBottom:'16px'}}>
                        ⚠️ This feature is coming soon. You can download the template to prepare your data.
                    </div>

                    <button className="btn btn-primary" disabled={!file}>
                        📦 Import Clients
                    </button>
                </div>

                <div className="card">
                    <div className="card-head"><div className="card-title">📋 Required Columns</div></div>
                    {[
                        {col:'username',req:true,desc:'PPPoE username'},
                        {col:'password',req:true,desc:'PPPoE password'},
                        {col:'full_name',req:true,desc:'Client full name'},
                        {col:'phone',req:false,desc:'Phone number'},
                        {col:'address',req:false,desc:'Client address'},
                        {col:'package',req:false,desc:'Speed package name'},
                        {col:'ip_address',req:false,desc:'Static IP (optional)'},
                    ].map(c => (
                        <div key={c.col} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:'12px'}}>
                            <div>
                                <span style={{fontFamily:'monospace',fontWeight:'600',color:'var(--text1)'}}>{c.col}</span>
                                <div style={{fontSize:'10px',color:'var(--text3)'}}>{c.desc}</div>
                            </div>
                            <span className={`badge ${c.req ? 'badge-active' : 'badge-inactive'}`}>{c.req ? 'Required' : 'Optional'}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
