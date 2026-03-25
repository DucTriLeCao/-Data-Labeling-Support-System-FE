import { useState } from 'react';
import './Manager.css';
import ProjectManagement from './ProjectManagement';
import DatasetManagement from './DatasetManagement';
import DataItemManagement from './DataItemManagement';
import LabelManagement from './LabelManagement';
import TaskAssignment from './TaskAssignment';
import QualityOverview from './QualityOverview';
import ExportData from './ExportData';

function ManagerLayout({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('projects');

  const menuItems = [
    { id: 'projects', label: 'Quản lý dự án', icon: '📁' },
    { id: 'datasets', label: 'Quản lý bộ dữ liệu', icon: '📊' },
    { id: 'dataitems', label: 'Quản lý Hình ảnh', icon: '📋' },
    { id: 'labels', label: 'Thiết lập bộ nhãn', icon: '🏷️' },
    { id: 'assignments', label: 'Phân công công việc', icon: '👥' },
    { id: 'quality', label: 'Chất lượng gán nhãn', icon: '✅' },
    { id: 'export', label: 'Xuất dữ liệu', icon: '📤' },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'projects':
        return <ProjectManagement />;
      case 'datasets':
        return <DatasetManagement />;
      case 'dataitems':
        return <DataItemManagement />;
      case 'labels':
        return <LabelManagement />;
      case 'assignments':
        return <TaskAssignment />;
      case 'quality':
        return <QualityOverview />;
      case 'export':
        return <ExportData />;
      default:
        return <ProjectManagement />;
    }
  };

  return (
    <div className="manager-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>🏷️ Data Labeling</h2>
          <p>Xin chào, {user.username}</p>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default ManagerLayout;
