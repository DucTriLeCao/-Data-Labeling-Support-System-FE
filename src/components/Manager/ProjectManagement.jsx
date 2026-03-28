import { useState, useEffect } from 'react';
import { getProjectsAPI, createProjectAPI, updateProjectAPI, deleteProjectAPI, bulkDeleteProjectsAPI } from '../../api';

function ProjectManagement() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjects, setSelectedProjects] = useState(new Set());

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
      const sortedProjects = Array.isArray(projects) ? [...projects].sort((a, b) => a.id - b.id) : [];
      setProjects(sortedProjects);
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

  const handleDelete = async (projectId) => {
    if (!confirm('Bạn có chắc muốn xóa dự án này?')) return;

    try {
      const token = localStorage.getItem('token');
      await deleteProjectAPI(projectId, token);
      setProjects(projects.filter(p => p.id !== projectId));
      setSelectedProjects(new Set([...selectedProjects].filter(id => id !== projectId)));
    } catch (err) {
      alert('Lỗi xóa dự án: ' + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProjects.size === 0) {
      alert('Vui lòng chọn ít nhất một dự án');
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa ${selectedProjects.size} dự án đã chọn?`)) return;

    try {
      const token = localStorage.getItem('token');
      const ids = Array.from(selectedProjects);
      const result = await bulkDeleteProjectsAPI(ids, token);
      alert(`Xóa thành công: ${result.successCount}, Thất bại: ${result.failureCount}`);
      setProjects(projects.filter(p => !selectedProjects.has(p.id)));
      setSelectedProjects(new Set());
    } catch (err) {
      alert('Lỗi xóa hàng loạt: ' + err.message);
    }
  };

  const toggleProjectSelection = (projectId) => {
    const newSet = new Set(selectedProjects);
    if (newSet.has(projectId)) {
      newSet.delete(projectId);
    } else {
      newSet.add(projectId);
    }
    setSelectedProjects(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedProjects.size === filteredProjects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(filteredProjects.map(p => p.id)));
    }
  };

  if (loading) return <div className="loading">Đang tải dự án...</div>;

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className="page-header">
        <h1>Quản lý dự án gán nhãn</h1>
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

        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Tìm kiếm dự án theo tên hoặc mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              maxWidth: '500px',
              padding: '10px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          {selectedProjects.size > 0 && (
            <button className="btn btn-danger" onClick={handleBulkDelete}>
              🗑️ Xóa ({selectedProjects.size})
            </button>
          )}
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedProjects.size === filteredProjects.length && filteredProjects.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>ID</th>
                <th>Tên dự án</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>
                  {projects.length === 0 ? 'Chưa có dự án nào' : 'Không tìm thấy dự án nào'}
                </td></tr>
              ) : (
                filteredProjects.map(project => (
                  <tr key={project.id}>
                    <td style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedProjects.has(project.id)}
                        onChange={() => toggleProjectSelection(project.id)}
                      />
                    </td>
                    <td>{project.id}</td>
                    <td><strong>{project.name}</strong></td>
                    <td>{project.description?.substring(0, 50) || 'Không có mô tả'}...</td>
                    <td>
                      <span className={`status-badge status-${project.status}`}>
                        {project.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td>{project.createdAt?.substring(0, 10) || project.created_at?.substring(0, 10) || 'N/A'}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(project)} style={{ marginRight: '4px' }}>
                        Sửa
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(project.id)}>
                        🗑️ Xóa
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
              <h3>{editingProject ? 'Chỉnh sửa dự án' : 'Tạo dự án mới'}</h3>
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
