import { useState } from 'react';
import './Annotator.css';
import TaskList from './TaskList';
import AnnotationWorkspace from './AnnotationWorkspace';
import RejectedAnnotations from './RejectedAnnotations';
import AnnotatorHistory from './AnnotatorHistory';

function AnnotatorLayout({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('tasks');
  const [selectedTask, setSelectedTask] = useState(null);
  const [retryAnnotationId, setRetryAnnotationId] = useState(null);

  const menuItems = [
    { id: 'tasks', label: 'Danh sách công việc', icon: '' },
    { id: 'rejected', label: 'Bị từ chối', icon: '' },
    { id: 'workspace', label: 'Không gian gán nhãn', icon: '' },
    { id: 'history', label: 'Lịch sử', icon: '' },
  ];

  const handleStartAnnotation = (task) => {
    setSelectedTask(task);
    setRetryAnnotationId(null);
    setActiveMenu('workspace');
  };

  const handleRetryAnnotation = (task, annotationId) => {
    setSelectedTask(task);
    setRetryAnnotationId(annotationId);
    setActiveMenu('workspace');
  };

  const handleBackToTasks = () => {
    setSelectedTask(null);
    setRetryAnnotationId(null);
    setActiveMenu('tasks');
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'tasks':
        return <TaskList userId={user.id} onStartAnnotation={handleStartAnnotation} />;
      case 'rejected':
        return <RejectedAnnotations userId={user.id} onRetry={handleRetryAnnotation} />;
      case 'workspace':
        return (
          <AnnotationWorkspace 
            task={selectedTask} 
            userId={user.id} 
            onBack={handleBackToTasks}
            retryAnnotationId={retryAnnotationId}
          />
        );
      case 'history':
        return <AnnotatorHistory />;
      default:
        return <TaskList userId={user.id} onStartAnnotation={handleStartAnnotation} />;
    }
  };

  return (
    <div className="annotator-layout">
      <aside className="annotator-sidebar">
        <div className="annotator-sidebar-header">
          <h2>Annotator</h2>
          <p>Xin chào, {user.username}</p>
        </div>
        
        <nav className="annotator-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`annotator-nav-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="annotator-logout-btn" onClick={onLogout}>
          Đăng xuất
        </button>
      </aside>

      <main className="annotator-main">
        {renderContent()}
      </main>
    </div>
  );
}

export default AnnotatorLayout;
