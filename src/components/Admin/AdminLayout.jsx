import { useState } from 'react';
import './Admin.css';
import UserManagement from './UserManagement';
import ActivityLogs from './ActivityLogs';

function AdminLayout({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('users');

  const menuItems = [
    { id: 'users', label: 'Quản lý người dùng', icon: '👥' },
    { id: 'logs', label: 'Quản lý nhật ký hoạt động', icon: '📋' },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'users':
        return <UserManagement />;
      case 'logs':
        return <ActivityLogs />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>⚙️ Admin Panel</h2>
          <p>Xin chào, {user.username}</p>
        </div>
        
        <nav className="admin-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`admin-nav-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="admin-logout-btn" onClick={onLogout}>
          🚪 Đăng xuất
        </button>
      </aside>

      <main className="admin-main">
        {renderContent()}
      </main>
    </div>
  );
}

export default AdminLayout;
