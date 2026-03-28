import { useState, useEffect } from 'react';
import { getProjectsAPI, getQualityOverviewAPI } from '../../api';

function QualityOverview() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [qualityData, setQualityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token');
        
        const response = await getProjectsAPI(token, 1, 100);
        const projectsList = response.items || response.data || [];
        setProjects(Array.isArray(projectsList) ? projectsList : []);
        
        if (projectsList.length > 0) {
          setSelectedProjectId(projectsList[0].id);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Không thể tải danh sách dự án');
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Fetch quality overview when project is selected
  useEffect(() => {
    if (!selectedProjectId) return;

    const fetchQualityData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token');
        
        const response = await getQualityOverviewAPI(selectedProjectId, token);
        setQualityData(response);
        setError('');
      } catch (err) {
        console.error('Error fetching quality overview:', err);
        setError(err.message || 'Không thể tải dữ liệu chất lượng');
        setQualityData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQualityData();
  }, [selectedProjectId]);

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'N/A';
  };

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

  const totalAnnotations = qualityData?.totalAnnotations || 0;
  const approvedCount = qualityData?.approvedCount || 0;
  const rejectedCount = qualityData?.rejectedCount || 0;
  const approvalRate = qualityData?.approvalRate || 0;
  const pendingCount = totalAnnotations - approvedCount - rejectedCount;

  return (
    <div>
      <div className="page-header">
        <h1>Tổng quan chất lượng gán nhãn</h1>
        <p>Theo dõi và đánh giá chất lượng công việc gán nhãn</p>
      </div>

      {/* Project Selector */}
      {projects.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h3>Chọn dự án</h3>
          </div>
          <div style={{ padding: '20px' }}>
            <select 
              value={selectedProjectId || ''} 
              onChange={(e) => setSelectedProjectId(parseInt(e.target.value))}
              className="form-select"
              style={{ maxWidth: '300px' }}
            >
              <option value="">-- Chọn dự án --</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && (
        <div style={{ 
          background: '#fee2e2', 
          color: '#dc2626', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          borderLeft: '4px solid #dc2626'
        }}>
          {error}
        </div>
      )}

      {!selectedProjectId ? (
        <div className="empty-state">
          <p>Vui lòng chọn một dự án để xem chất lượng gán nhãn</p>
        </div>
      ) : (
        <>
          {/* Quality Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Tổng annotations</h4>
              <div className="stat-value">{totalAnnotations}</div>
            </div>
            <div className="stat-card">
              <h4>Đã phê duyệt</h4>
              <div className="stat-value" style={{ color: '#059669' }}>{approvedCount}</div>
            </div>
            <div className="stat-card">
              <h4>Bị từ chối</h4>
              <div className="stat-value" style={{ color: '#dc2626' }}>{rejectedCount}</div>
            </div>
            <div className="stat-card">
              <h4>Tỷ lệ chấp nhận</h4>
              <div className="stat-value" style={{ color: '#5B6BE6' }}>{approvalRate.toFixed(1)}%</div>
            </div>
          </div>

          {/* Quality Metrics */}
          <div className="card">
            <div className="card-header">
              <h3>Chỉ số chất lượng - {getProjectName(selectedProjectId)}</h3>
            </div>

            <div className="quality-grid">
              <div className="quality-item">
                <div className="value">{approvalRate.toFixed(1)}%</div>
                <div className="label">Tỷ lệ phê duyệt</div>
              </div>
              <div className="quality-item">
                <div className="value">{approvedCount}</div>
                <div className="label">Đã phê duyệt</div>
              </div>
              <div className="quality-item">
                <div className="value">{rejectedCount}</div>
                <div className="label">Bị từ chối</div>
              </div>
              <div className="quality-item">
                <div className="value">{totalAnnotations}</div>
                <div className="label">Tổng Annotations</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default QualityOverview;
