import { useState, useEffect } from 'react';
import api from '../api';

export default function Clients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => { loadClients(); }, []);

    const loadClients = async () => {
        try {
            const res = await api.get('/clients');
            setClients(res.data);
        } finally { setLoading(false); }
    };

    const handleBlock = async (id) => {
        if (!confirm('Block this client?')) return;
        await api.post(`/clients/${id}/block`);
        loadClients();
    };

    const handleUnblock = async (id) => {
        await api.post(`/clients/${id}/unblock`);
        loadClients();
    };

    const filtered = clients.filter(c =>
        c.username.toLowerCase().includes(search.toLowerCase()) ||
        (c.ip_address || '').includes(search)
    );

    return (
        <div className="page">
            <div className="page-header">
                <h2>Clients ({clients.length})</h2>
            </div>
            <input
                className="search-input"
                placeholder="Search username or IP..."
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
            {loading ? <div>Loading...</div> : (
                <table className="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Username</th>
                            <th>IP Address</th>
                            <th>Profile</th>
                            <th>Online</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((c, i) => (
                            <tr key={c.id}>
                                <td>{i + 1}</td>
                                <td>{c.username}</td>
                                <td>{c.ip_address || '—'}</td>
                                <td>{c.profile}</td>
                                <td>{c.is_online ? '🟢' : '⚫'}</td>
                                <td>
                                    <span className={`badge ${c.status}`}>
                                        {c.status}
                                    </span>
                                </td>
                                <td>
                                    {c.status === 'blocked'
                                        ? <button className="btn btn-success btn-sm" onClick={() => handleUnblock(c.id)}>Unblock</button>
                                        : <button className="btn btn-danger btn-sm" onClick={() => handleBlock(c.id)}>Block</button>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}