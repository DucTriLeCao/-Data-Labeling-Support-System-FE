import { useState, useEffect } from 'react';
import { getActivityLogsAPI } from '../../api';

function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token');

        const response = await getActivityLogsAPI(token);
        const logsData = response.items || response.data || response || [];
        
        setLogs(logsData);
        setError('');
      } catch (err) {
        console.error('Error fetching activity logs:', err);
        setError(err.message || 'Không thể tải nhật ký hoạt động');
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const getActionLabel = (action) => {
    const actionMap = {
      'create': 'Tạo',
      'update': 'Cập nhật',
      'delete': 'Xóa',
      'login': 'Đăng nhập',
      'logout': 'Đăng xuất',
      'submit': 'Gửi',
      'approve': 'Phê duyệt',
      'reject': 'Từ chối'
    };
    return actionMap[action?.toLowerCase()] || action;
  };

  const getActionEmoji = (action) => {
    const emojiMap = {
      'create': '➕',
      'update': '✏️',
      'delete': '🗑️',
      'login': '🔓',
      'logout': '🔐',
      'submit': '📤',
      'approve': '✅',
      'reject': '❌'
    };
    return emojiMap[action?.toLowerCase()] || '📝';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <>
      <div className="activity-logs-header">
        <h1>Quản lý nhật ký hoạt động</h1>
      </div>

      {loading && <div className="loading">Đang tải nhật ký hoạt động...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && logs.length === 0 && !error && (
        <div className="empty-state">
          <p>Chưa có nhật ký hoạt động nào</p>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <div className="activity-logs-table">
          <table>
            <thead>
              <tr>
                <th>Hành động</th>
                <th>Người dùng</th>
                <th>Tài nguyên</th>
                <th>Chi tiết</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={log.id || index}>
                  <td>
                    <span className="action-badge">
                      {getActionEmoji(log.action)} {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td>{log.username || log.userId || '-'}</td>
                  <td>{log.resourceType || '-'}</td>
                  <td className="details-cell">
                    <span className="details-text">{log.details || log.description || '-'}</span>
                  </td>
                  <td>{formatDate(log.createdAt || log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .activity-logs-header {
          margin-bottom: 24px;
        }

        .activity-logs-header h1 {
          margin: 0;
          color: #1f2937;
          font-size: 24px;
        }

        .activity-logs-table {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .activity-logs-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .activity-logs-table thead {
          background: #f3f4f6;
          border-bottom: 2px solid #e5e7eb;
        }

        .activity-logs-table th {
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .activity-logs-table tbody tr {
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s;
        }

        .activity-logs-table tbody tr:hover {
          background-color: #fafafa;
        }

        .activity-logs-table td {
          padding: 14px 16px;
          font-size: 14px;
          color: #6b7280;
        }

        .action-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          background: #e0e7ff;
          color: #3730a3;
          font-weight: 500;
          font-size: 13px;
        }

        .details-cell {
          max-width: 300px;
        }

        .details-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: block;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          color: #9ca3af;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #6b7280;
          font-size: 16px;
        }

        .error {
          background: #fee2e2;
          color: #dc2626;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #dc2626;
        }
      `}</style>
    </>
  );
}

export default ActivityLogs;
