import { useState } from 'react';
import './Reviewer.css';
import PendingReviews from './PendingReviews';
import ReviewWorkspace from './ReviewWorkspace';

function ReviewerLayout({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('pending');
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);

  const menuItems = [
    { id: 'pending', label: 'Chờ duyệt', icon: '📋' },
    { id: 'workspace', label: 'Không gian duyệt', icon: '🔍' },
  ];

  const handleStartReview = (annotation) => {
    setSelectedAnnotation(annotation);
    setActiveMenu('workspace');
  };

  const handleBackToPending = () => {
    setSelectedAnnotation(null);
    setActiveMenu('pending');
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'pending':
        return <PendingReviews userId={user.id} onStartReview={handleStartReview} />;
      case 'workspace':
        return <ReviewWorkspace annotation={selectedAnnotation} userId={user.id} onBack={handleBackToPending} />;
      default:
        return <PendingReviews userId={user.id} onStartReview={handleStartReview} />;
    }
  };

  return (
    <div className="reviewer-layout">
      <aside className="reviewer-sidebar">
        <div className="reviewer-sidebar-header">
          <h2>🔍 Reviewer</h2>
          <p>Xin chào, {user.username}</p>
        </div>
        
        <nav className="reviewer-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`reviewer-nav-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="reviewer-logout-btn" onClick={onLogout}>
          🚪 Đăng xuất
        </button>
      </aside>

      <main className="reviewer-main">
        {renderContent()}
      </main>
    </div>
  );
}

export default ReviewerLayout;
