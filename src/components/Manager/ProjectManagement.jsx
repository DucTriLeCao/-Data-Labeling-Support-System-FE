import { useState, useEffect } from 'react';
import { getProjectsAPI, createProjectAPI, updateProjectAPI } from '../../api';

function ProjectManagement() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await getProjectsAPI(token);
      const projects = response.items || response.data || response;
      if (Array.isArray(projects) && projects.length > 0) {
      }
      setProjects(Array.isArray(projects) ? projects : []);
      setError('');
    } catch (err) {
      setError(err.message);
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProject(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({ name: project.name, description: project.description });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên dự án');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      if (editingProject) {
        await updateProjectAPI(editingProject.id, formData, token);
        setProjects(projects.map(p => 
          p.id === editingProject.id ? { ...p, ...formData } : p
        ));
      } else {
        const response = await createProjectAPI(formData, token);
        const newProject = response.data || response;
        setProjects([...projects, newProject]);
      }

      setShowModal(false);
      setSaving(false);
    } catch (err) {
      alert('Lỗi: ' + err.message);
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Đang tải dự án...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>📁 Quản lý dự án gán nhãn</h1>
        <p>Tạo và quản lý các dự án gán nhãn dữ liệu</p>
      </div>

      {error && <div className="error-message" style={{ margin: '20px 0' }}>{error}</div>}

      <div className="card">
        <div className="card-header">
          <h3>Danh sách dự án</h3>
          <button className="btn btn-primary" onClick={handleAdd}>
            ➕ Tạo dự án mới
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên dự án</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>Chưa có dự án nào</td></tr>
              ) : (
                projects.map(project => (
                  <tr key={project.id}>
                    <td>{project.id}</td>
                    <td><strong>{project.name}</strong></td>
                    <td>{project.description?.substring(0, 50) || 'Không có mô tả'}...</td>
                    <td>
                      <span className={`status-badge status-${project.status}`}>
                        {project.status === 'active' ? '🟢 Hoạt động' : '🔴 Không hoạt động'}
                      </span>
                    </td>
                    <td>{project.createdAt?.substring(0, 10) || project.created_at?.substring(0, 10) || 'N/A'}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(project)}>
                        ✏️ Sửa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProject ? '✏️ Chỉnh sửa dự án' : '➕ Tạo dự án mới'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Tên dự án</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên dự án"
                  disabled={saving}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập mô tả dự án"
                  disabled={saving}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectManagement;
