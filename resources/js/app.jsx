import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import MikrotikServers from './pages/MikrotikServers';
import OLTManagement from './pages/OLTManagement';
import './app.css';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="clients" element={<Clients />} />
                    <Route path="mikrotik" element={<MikrotikServers />} />
                    <Route path="olt" element={<OLTManagement />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);
