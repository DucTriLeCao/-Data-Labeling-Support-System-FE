import { useState, useEffect } from 'react';
import { getAssignedTasksAPI } from '../../api';

function TaskList({ userId, onStartAnnotation }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await getAssignedTasksAPI(token);
      // Extract tasks from API response where data is an array
      const tasksData = response.data || [];
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setError('');
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'assigned': return 'Đang chờ';
      case 'completed': return 'Đã hoàn thành';
      case 'new': return 'Mới';
      default: return status;
    }
  };

  const getImageIcon = (content) => {
    if (content.includes('lion')) return '🦁';
    if (content.includes('elephant')) return '🐘';
    if (content.includes('tiger')) return '🐯';
    if (content.includes('zebra')) return '🦓';
    return '🖼️';
  };

  if (loading) {
    return <div className="loading">Đang tải công việc...</div>;
  }

  if (error) {
    return (
      <>
        <h1>📋 Danh sách công việc</h1>
        <div className="error-message" style={{ padding: '20px' }}>{error}</div>
      </>
    );
  }

  if (tasks.length === 0) {
    return (
      <>
        <h1>📋 Danh sách công việc</h1>
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Chưa có công việc nào</h3>
          <p>Bạn chưa được gán công việc gán nhãn nào</p>
        </div>
      </>
    );
  }

  return (
    <>
      <h1>📋 Danh sách công việc</h1>
      <div className="task-list-container">
        {tasks.map(task => (
          <div key={task.dataItemAssignmentId} className="task-card">
            <div className="task-info">
              <div className="task-thumbnail">
                {getImageIcon(task.dataContent || task.dataItemId)}
              </div>
              <div className="task-details">
                <h3>{task.dataContent?.split('/').pop() || `Task ${task.dataItemAssignmentId}`}</h3>
                <p>Bộ dữ liệu: {task.datasetName || 'Unknown'}</p>
                <span className={`task-status ${task.status}`}>
                  {getStatusLabel(task.status)}
                </span>
              </div>
            </div>
            <div className="task-actions">
              {(task.status === 'assigned' || task.status === 'new') && (
                <button onClick={() => onStartAnnotation(task)}>
                  Bắt đầu gán nhãn
                </button>
              )}
              {task.status === 'submitted' && (
                <button onClick={() => onStartAnnotation(task)} style={{ background: '#f59e0b' }}>
                  Chờ duyệt
                </button>
              )}
              {task.status === 'approved' && (
                <button onClick={() => onStartAnnotation(task)} style={{ background: '#10b981' }}>
                  Đã duyệt
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default TaskList;
