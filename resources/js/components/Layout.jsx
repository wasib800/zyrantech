import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
    const location = useLocation();
    const isActive = (path) => location.pathname.startsWith(path) ? 'active' : '';

    return (
        <div className="app-layout">
            <nav className="sidebar">
                <div className="sidebar-brand">
                    <div className="brand-icon">⚡</div>
                    <div>
                        <div className="brand-name">ZyranTech</div>
                        <div className="brand-sub">ISP Manager v1.0</div>
                    </div>
                </div>

                <div className="nav-section">NETWORK</div>
                <Link to="/dashboard" className={`nav-item ${isActive('/dashboard')}`}>
                    <span className="nav-icon">📊</span> Dashboard
                </Link>
                <Link to="/clients" className={`nav-item ${isActive('/clients')}`}>
                    <span className="nav-icon">👥</span> Client Management
                </Link>
                <Link to="/billing" className="nav-item disabled">
                    <span className="nav-icon">🧾</span> Billing
                    <span className="nav-badge soon">Soon</span>
                </Link>
                <Link to="/mikrotik" className={`nav-item ${isActive('/mikrotik')}`}>
                    <span className="nav-icon">🖥️</span> Mikrotik Server
                </Link>
                <Link to="/olt" className={`nav-item ${isActive('/olt')}`}>
                    <span className="nav-icon">📡</span> OLT Management
                </Link>
                <Link to="/network" className="nav-item disabled">
                    <span className="nav-icon">🌐</span> Network Diagram
                    <span className="nav-badge soon">Soon</span>
                </Link>

                <div className="nav-section">AUTOMATION</div>
                <Link to="/automation" className="nav-item disabled">
                    <span className="nav-icon">🤖</span> Automation Engine
                    <span className="nav-badge new">NEW</span>
                </Link>
                <Link to="/payment" className="nav-item disabled">
                    <span className="nav-icon">💳</span> Payment Gateway
                    <span className="nav-badge new">NEW</span>
                </Link>
                <Link to="/sms" className="nav-item disabled">
                    <span className="nav-icon">📱</span> SMS & Alerts
                </Link>

                <div className="nav-section">OPERATIONS</div>
                <Link to="/tickets" className="nav-item disabled">
                    <span className="nav-icon">🎫</span> Support Tickets
                </Link>
                <Link to="/tasks" className="nav-item disabled">
                    <span className="nav-icon">📋</span> Tasks
                </Link>
                <Link to="/pop" className="nav-item disabled">
                    <span className="nav-icon">🗼</span> POP Management
                </Link>

                <div className="nav-section">HR & FINANCE</div>
                <Link to="/attendance" className="nav-item disabled">
                    <span className="nav-icon">🕐</span> Attendance
                </Link>
                <Link to="/hrm" className="nav-item disabled">
                    <span className="nav-icon">👔</span> HRM & Payroll
                </Link>
                <Link to="/inventory" className="nav-item disabled">
                    <span className="nav-icon">📦</span> Inventory
                </Link>
                <Link to="/accounting" className="nav-item disabled">
                    <span className="nav-icon">💰</span> Accounting
                </Link>
                <Link to="/reports" className="nav-item disabled">
                    <span className="nav-icon">📈</span> Reports
                </Link>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">AD</div>
                        <div>
                            <div className="user-name">Admin User</div>
                            <div className="user-role">Super Admin</div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="main-wrapper">
                <header className="topbar">
                    <div className="topbar-title">ZyranTech ISP Manager</div>
                    <div className="topbar-right">
                        <div className="tb-badge warning">⚠️ Unpaid Invoice</div>
                        <div className="tb-badge danger">🔴 OLT Alert</div>
                        <div className="tb-badge info">🎫 Open Ticket</div>
                        <div className="tb-badge primary">📡 Live Monitor</div>
                        <div className="tb-badge">🔔 12</div>
                    </div>
                </header>
                <main className="content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
