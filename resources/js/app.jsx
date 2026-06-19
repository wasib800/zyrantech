import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import MikrotikServers from './pages/MikrotikServers';
import MikrotikImport from './pages/MikrotikImport';
import MikrotikBulkImport from './pages/MikrotikBulkImport';
import MikrotikBackup from './pages/MikrotikBackup';
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
                    <Route path="mikrotik/import" element={<MikrotikImport />} />
                    <Route path="mikrotik/bulk-import" element={<MikrotikBulkImport />} />
                    <Route path="mikrotik/backup" element={<MikrotikBackup />} />
                    <Route path="olt" element={<OLTManagement />} />
                    <Route path="olt/users" element={<OLTManagement defaultTab="onus" />} />
                    <Route path="olt/signal" element={<OLTManagement defaultTab="signal" />} />
                    <Route path="olt/ports" element={<OLTManagement defaultTab="ports" />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);
