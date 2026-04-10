import { useState, useEffect } from 'react';
import { getAssignedTasksAPI } from '../../api';

function TaskList({ userId, onStartAnnotation }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchTasks(currentPage);
  }, [userId, currentPage]);

  const fetchTasks = async (pageNumber) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await getAssignedTasksAPI(token, pageNumber, pageSize);
      const paginatedData = response.data || {};
      const tasksData = paginatedData.items || [];
      const filteredTasks = (Array.isArray(tasksData) ? tasksData : []).filter(task => task.hasAnnotation !== true);
      setTasks(filteredTasks);
      setTotalCount(filteredTasks.length);
      setTotalPages(paginatedData.totalPages || 0);
      setError('');
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'assigned': 'Đang chờ',
      'new': 'Mới',
      'completed': 'Đã hoàn thành',
      'submitted': 'Đã gửi',
      'pending': 'Chờ xử lý',
      'approved': 'Đã duyệt',
      'rejected': 'Bị từ chối',
      'need_rework': 'Cần sửa lại',
      'inprogress': 'Đang xử lý'
    };
    return statusMap[status?.toLowerCase()] || status;
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

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <>
      <h1>📋 Danh sách công việc</h1>
      {totalCount > 0 && (
        <div style={{ marginBottom: '16px', padding: '8px 12px', background: '#f3f4f6', borderRadius: '6px', fontSize: '14px' }}>
          Tổng cộng: {totalCount} công việc | Trang {currentPage} / {totalPages}
        </div>
      )}
      <div className="task-list-container">
        {tasks.map(task => (
          <div key={task.dataItemAssignmentId} className="task-card">
            <div className="task-info">
              <div className="task-thumbnail">
                {getImageIcon(task.dataContent || task.dataItemId)}
              </div>
              <div className="task-details">
                <h3>{task.dataContent?.split('/').pop() || `Công việc ${task.dataItemAssignmentId}`}</h3>
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
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
          <button 
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            style={{ padding: '8px 16px', background: currentPage === 1 ? '#d1d5db' : '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            ← Trang trước
          </button>
          <button 
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            style={{ padding: '8px 16px', background: currentPage === totalPages ? '#d1d5db' : '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            Trang sau →
          </button>
        </div>
      )}
    </>
  );
}

export default TaskList;
