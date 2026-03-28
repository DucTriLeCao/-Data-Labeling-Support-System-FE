import { useState, useEffect } from 'react';
import { getSubmittedQueueAPI } from '../../api';

function QualityOverview() {
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token');
        
        const response = await getSubmittedQueueAPI(token);
        const annotationsList = response.items || response.data || [];
        setAnnotations(annotationsList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching annotations:', err);
        setAnnotations([]);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

  // Calculate statistics
  const totalAnnotations = annotations.length;
  const approvedAnnotations = annotations.filter(a => a.status === 'approved').length;
  const pendingAnnotations = annotations.filter(a => a.status === 'submitted').length;
  
  const approvalRate = totalAnnotations > 0 ? Math.round((approvedAnnotations / totalAnnotations) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <h1>Tổng quan chất lượng gán nhãn</h1>
        <p>Theo dõi và đánh giá chất lượng công việc gán nhãn</p>
      </div>

      {/* Quality Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Tổng annotations</h4>
          <div className="stat-value">{totalAnnotations}</div>
        </div>
        <div className="stat-card">
          <h4>Đã phê duyệt</h4>
          <div className="stat-value" style={{ color: '#059669' }}>{approvedAnnotations}</div>
        </div>
        <div className="stat-card">
          <h4>Đang chờ duyệt</h4>
          <div className="stat-value" style={{ color: '#d97706' }}>{pendingAnnotations}</div>
        </div>
        <div className="stat-card">
          <h4>Tỷ lệ chấp nhận</h4>
          <div className="stat-value" style={{ color: '#5B6BE6' }}>{approvalRate}%</div>
        </div>
      </div>

      {/* Quality Metrics */}
      <div className="card">
        <div className="card-header">
          <h3>Chỉ số chất lượng</h3>
        </div>

        <div className="quality-grid">
          <div className="quality-item">
            <div className="value">{approvalRate}%</div>
            <div className="label">Tỷ lệ phê duyệt</div>
          </div>
          <div className="quality-item">
            <div className="value">{pendingAnnotations}</div>
            <div className="label">Đang chờ duyệt</div>
          </div>
          <div className="quality-item">
            <div className="value">{totalAnnotations}</div>
            <div className="label">Tổng Annotations</div>
          </div>
        </div>
      </div>

      {/* Annotations List */}
      {annotations.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có annotations nào</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3>Danh sách Annotations</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Trạng thái</th>
                <th>Loại nhãn</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {annotations.map(ann => (
                <tr key={ann.id}>
                  <td>{ann.id}</td>
                  <td>
                    <span className={`status-badge status-${ann.status || 'pending'}`}>
                      {getStatusLabel(ann.status || 'pending')}
                    </span>
                  </td>
                  <td>{ann.labelType || 'N/A'}</td>
                  <td>{ann.createdAt ? new Date(ann.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
  
  const getStatusLabel = (status) => {
    const statusMap = {
      'pending': 'Chờ xử lý',
      'submitted': 'Chờ duyệt',
      'approved': 'Đã duyệt',
      'rejected': 'Bị từ chối',
      'need_rework': 'Cần sửa lại',
      'inprogress': 'Đang xử lý'
    };
    return statusMap[status?.toLowerCase()] || status;
  }
}

export default QualityOverview;
