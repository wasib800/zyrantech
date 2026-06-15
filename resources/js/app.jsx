import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
// Import এ add করো (line 5 এর পরে):
import MikrotikServers from './pages/MikrotikServers';

// Route এ add করো (clients route এর পরে):
<Route path="mikrotik" element={<MikrotikServers />} />
import Layout from './components/Layout';
import './app.css';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="mikrotik" element={<MikrotikServers />} />
                <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="clients" element={<Clients />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);