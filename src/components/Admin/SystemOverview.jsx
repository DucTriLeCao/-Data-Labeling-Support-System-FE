import { useState, useEffect } from 'react';
import { getUsersAPI, getActivityLogsAPI, getProjectsAPI, getDatasetsByProjectAPI, getDataItemsAPI, getSubmittedQueueAPI } from '../../api';

function SystemOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalDatasets: 0,
    totalAnnotations: 0,
    totalDataItems: 0,
    totalReviews: 0,
    usersByRole: { admin: 0, manager: 0, annotator: 0, reviewer: 0 },
    annotationStats: { submitted: 0, approved: 0, rejected: 0 }
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token');

        // Fetch users
        const usersResponse = await getUsersAPI(token);
        
        let users = usersResponse.items;
        
        if (!Array.isArray(users)) {
          users = [];
        }

        // Calculate user statistics
        const usersByRole = {
          admin: users.filter(u => u.role?.toLowerCase() === 'admin').length,
          manager: users.filter(u => u.role?.toLowerCase() === 'manager').length,
          annotator: users.filter(u => u.role?.toLowerCase() === 'annotator').length,
          reviewer: users.filter(u => u.role?.toLowerCase() === 'reviewer').length,
        };

        // Fetch projects and calculate statistics
        let totalProjects = 0;
        let totalDatasets = 0;
        let totalDataItems = 0;
        const projectsResponse = await getProjectsAPI(token);
        const projects = projectsResponse.items || projectsResponse.data || projectsResponse || [];
        totalProjects = projects.length;

        // Fetch datasets and data items for each project
        for (const project of projects) {
          try {
            const datasetsResponse = await getDatasetsByProjectAPI(project.id, token);
            const datasets = datasetsResponse.items || datasetsResponse.data || [];
            totalDatasets += datasets.length;
            
            // Count data items in each dataset
            for (const dataset of datasets) {
              try {
                const dataItemsResponse = await getDataItemsAPI(dataset.id, token);
                const dataItems = dataItemsResponse.items || dataItemsResponse.data || [];
                totalDataItems += dataItems.length;
              } catch (err) {
              }
            }
          } catch (err) {
          }
        }

        // Fetch submitted annotations (for review statistics)
        const submittedResponse = await getSubmittedQueueAPI(token).catch(() => ({ data: [] }));
        const submittedAnnotations = submittedResponse.data || submittedResponse.items || [];
        const totalAnnotations = submittedAnnotations.length;

        // Fetch activity logs
        const logsResponse = await getActivityLogsAPI(token);
        let logs = logsResponse.items || logsResponse.data || logsResponse || [];
        if (!Array.isArray(logs)) {
          logs = [];
        }

        const newStats = {
          totalUsers: users.length,
          totalProjects: totalProjects,
          totalDatasets: totalDatasets,
          totalAnnotations: totalAnnotations,
          totalDataItems: totalDataItems,
          totalReviews: users.filter(u => u.role?.toLowerCase() === 'reviewer').length,
          usersByRole,
          annotationStats: {
            submitted: submittedAnnotations.filter(a => a.annotationStatus?.toLowerCase() === 'submitted').length,
            approved: submittedAnnotations.filter(a => a.annotationStatus?.toLowerCase() === 'approved').length,
            rejected: submittedAnnotations.filter(a => a.annotationStatus?.toLowerCase() === 'rejected').length
          }
        };
        
        setStats(newStats);

        // Map activity logs
        const activities = logs.slice(0, 4).map((log, idx) => ({
          id: log.id || idx + 1,
          icon: ['👤', '📝', '✅', '📁'][idx % 4],
          action: log.action || 'Hoạt động hệ thống',
          user: log.username || 'system',
          time: log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : 'Vừa xong'
        }));
        setRecentActivities(activities);
        setLoading(false);
      } catch (err) {
        console.error('CRITICAL Error fetching system overview data:', err);
        console.error('Error stack:', err.stack);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <>
      <h1>📊 Tổng quan hệ thống</h1>

      <div className="system-stats">
        <div className="system-stat-card users">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-label">Người dùng</div>
        </div>
        <div className="system-stat-card projects">
          <div className="stat-icon">📁</div>
          <div className="stat-value">{stats.totalProjects}</div>
          <div className="stat-label">Dự án</div>
        </div>
        <div className="system-stat-card datasets">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{stats.totalDatasets}</div>
          <div className="stat-label">Bộ dữ liệu</div>
        </div>
        <div className="system-stat-card annotations">
          <div className="stat-icon">🏷️</div>
          <div className="stat-value">{stats.totalAnnotations}</div>
          <div className="stat-label">Annotations</div>
        </div>
      </div>

      <div className="overview-grid">
        <div className="overview-card">
          <h3>👥 Phân bổ người dùng theo vai trò</h3>
          <div className="overview-list">
            <div className="overview-list-item">
              <div className="item-info">
                <div className="item-avatar">⚙️</div>
                <div className="item-details">
                  <h4>Admin</h4>
                  <p>Quản trị viên hệ thống</p>
                </div>
              </div>
              <strong>{stats.usersByRole.admin}</strong>
            </div>
            <div className="overview-list-item">
              <div className="item-info">
                <div className="item-avatar">📋</div>
                <div className="item-details">
                  <h4>Manager</h4>
                  <p>Quản lý dự án</p>
                </div>
              </div>
              <strong>{stats.usersByRole.manager}</strong>
            </div>
            <div className="overview-list-item">
              <div className="item-info">
                <div className="item-avatar">🏷️</div>
                <div className="item-details">
                  <h4>Annotator</h4>
                  <p>Người gán nhãn</p>
                </div>
              </div>
              <strong>{stats.usersByRole.annotator}</strong>
            </div>
            <div className="overview-list-item">
              <div className="item-info">
                <div className="item-avatar">🔍</div>
                <div className="item-details">
                  <h4>Reviewer</h4>
                  <p>Người duyệt</p>
                </div>
              </div>
              <strong>{stats.usersByRole.reviewer}</strong>
            </div>
          </div>
        </div>

        <div className="overview-card">
          <h3>📝 Trạng thái Annotations</h3>
          <div className="overview-list">
            <div className="overview-list-item">
              <div className="item-info">
                <div className="item-avatar" style={{ background: '#fef3c7' }}>⏳</div>
                <div className="item-details">
                  <h4>Đang chờ duyệt</h4>
                  <p>Submitted & pending review</p>
                </div>
              </div>
              <strong style={{ color: '#f59e0b' }}>{stats.annotationStats.submitted}</strong>
            </div>
            <div className="overview-list-item">
              <div className="item-info">
                <div className="item-avatar" style={{ background: '#d1fae5' }}>✅</div>
                <div className="item-details">
                  <h4>Đã duyệt</h4>
                  <p>Approved annotations</p>
                </div>
              </div>
              <strong style={{ color: '#059669' }}>{stats.annotationStats.approved}</strong>
            </div>
            <div className="overview-list-item">
              <div className="item-info">
                <div className="item-avatar" style={{ background: '#fee2e2' }}>❌</div>
                <div className="item-details">
                  <h4>Bị từ chối</h4>
                  <p>Rejected annotations</p>
                </div>
              </div>
              <strong style={{ color: '#dc2626' }}>{stats.annotationStats.rejected}</strong>
            </div>
          </div>
        </div>

        <div className="overview-card">
          <h3>📈 Thống kê dữ liệu</h3>
          <div className="overview-list">
            <div className="overview-list-item">
              <div className="item-info">
                <div className="item-avatar">🖼️</div>
                <div className="item-details">
                  <h4>Data Items</h4>
                  <p>Tổng số dữ liệu cần gán nhãn</p>
                </div>
              </div>
              <strong>{stats.totalDataItems}</strong>
            </div>
            <div className="overview-list-item">
              <div className="item-info">
                <div className="item-avatar">✓</div>
                <div className="item-details">
                  <h4>Reviews</h4>
                  <p>Tổng số lượt duyệt</p>
                </div>
              </div>
              <strong>{stats.totalReviews}</strong>
            </div>
          </div>
        </div>

        <div className="overview-card">
          <h3>🕐 Hoạt động gần đây</h3>
          <div className="overview-list">
            {recentActivities.map(activity => (
              <div key={activity.id} className="overview-list-item">
                <div className="item-info">
                  <div className="item-avatar">{activity.icon}</div>
                  <div className="item-details">
                    <h4>{activity.action}</h4>
                    <p>{activity.user} • {activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default SystemOverview;
