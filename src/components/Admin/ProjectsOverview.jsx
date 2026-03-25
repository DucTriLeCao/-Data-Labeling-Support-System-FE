import { useState, useEffect } from 'react';
import { getProjectsAPI } from '../../api';

function ProjectsOverview() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token');
        
        const response = await getProjectsAPI(token);
        const projectList = response.items || response.data || response || [];
        setProjects(Array.isArray(projectList) ? projectList : []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err.message);
        setProjects([]);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) return <div className="loading">Đang tải dự án...</div>;
  if (error) return <div className="error">{error}</div>;
  if (projects.length === 0) return <div className="empty-state">Chưa có dự án nào</div>;

  const projectsWithDetails = projects;

  const getRoleIcon = (role) => {
    switch (role) {
      case 'manager': return '📋';
      case 'annotator': return '🏷️';
      case 'reviewer': return '🔍';
      default: return '👤';
    }
  };

  return (
    <>
      <h1>📁 Tổng quan dự án</h1>

      <div className="system-stats" style={{ marginBottom: '30px' }}>
        <div className="system-stat-card projects">
          <div className="stat-icon">📁</div>
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">Tổng dự án</div>
        </div>
        <div className="system-stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{projects.reduce((sum, p) => sum + (p.datasets?.length || 0), 0)}</div>
          <div className="stat-label">Bộ dữ liệu</div>
        </div>
        <div className="system-stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{projects.reduce((sum, p) => sum + (p.members?.length || 0), 0)}</div>
          <div className="stat-label">Phân công</div>
        </div>
        <div className="system-stat-card datasets">
          <div className="stat-icon">🖼️</div>
          <div className="stat-value">{projects.reduce((sum, p) => sum + (p.dataItemCount || 0), 0)}</div>
          <div className="stat-label">Data items</div>
        </div>
      </div>

      {projectsWithDetails.length === 0 ? (
        <div className="admin-empty-state">
          <div className="empty-icon">📭</div>
          <h3>Chưa có dự án nào</h3>
          <p>Hệ thống chưa có dự án nào được tạo</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projectsWithDetails.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <h3>📁 {project.name}</h3>
                <span className={`project-status ${project.status}`}>
                  {project.status === 'active' ? 'Đang hoạt động' : 'Hoàn thành'}
                </span>
              </div>
              
              <p className="project-description">{project.description}</p>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                  👥 Thành viên ({project.members.length})
                </h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {project.members.map(member => (
                    <div 
                      key={member.id}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        padding: '4px 8px',
                        background: '#f3f4f6',
                        borderRadius: '16px',
                        fontSize: '12px'
                      }}
                    >
                      <span>{getRoleIcon(member.role_in_project)}</span>
                      <span>{member.user?.username || 'Unknown'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="project-stats">
                <div className="project-stat">
                  <div className="value">{project.datasets.length}</div>
                  <div className="label">Bộ dữ liệu</div>
                </div>
                <div className="project-stat">
                  <div className="value">{project.dataItemCount}</div>
                  <div className="label">Data items</div>
                </div>
                <div className="project-stat">
                  <div className="value" style={{ color: '#059669' }}>{project.approvedCount}</div>
                  <div className="label">Đã duyệt</div>
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  📅 Tạo ngày: {project.created_at}
                </div>
                {project.dataItemCount > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Tiến độ: {Math.round((project.approvedCount / project.dataItemCount) * 100)}%
                    </div>
                    <div style={{ 
                      height: '6px', 
                      background: '#e5e7eb', 
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(project.approvedCount / project.dataItemCount) * 100}%`,
                        height: '100%',
                        background: '#059669',
                        borderRadius: '3px'
                      }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default ProjectsOverview;
