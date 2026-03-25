import { useState, useEffect } from 'react';
import { getProjectsAPI, getLabelsByProjectAPI, createLabelAPI, updateLabelAPI, deleteLabelAPI } from '../../api';

function LabelManagement() {
  const [projects, setProjects] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [formData, setFormData] = useState({ name: '', parentId: '' });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token');
        
        const response = await getProjectsAPI(token);
        const projectsList = response.items || response.data || [];
        setProjects(projectsList);
        
        if (projectsList.length > 0) {
          setSelectedProject(projectsList[0].id);
        }
        
        setLoading(false);
      } catch (err) {
        setProjects([]);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    
    const fetchLabels = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token');
        
        const response = await getLabelsByProjectAPI(selectedProject, token);
        const labelsList = response.items || response.data || [];
        if (Array.isArray(labelsList) && labelsList.length > 0) {
        }
        setLabels(labelsList);
      } catch (err) {
        setLabels([]);
      }
    };

    fetchLabels();
  }, [selectedProject]);

  const handleCreateLabel = () => {
    setEditingLabel(null);
    setFormData({ name: '', parentId: '' });
    setShowModal(true);
  };

  const handleEditLabel = (label) => {
    setEditingLabel(label);
    setFormData({
      name: label.name,
      parentId: label.parentId || ''
    });
    setShowModal(true);
  };

  const handleSaveLabel = async () => {
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên nhãn');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      if (editingLabel) {
        // Update existing label
        const labelData = {
          name: formData.name.trim(),
          parentId: formData.parentId ? parseInt(formData.parentId) : 0
        };
        await updateLabelAPI(editingLabel.id, labelData, token);
        setLabels(labels.map(l => 
          l.id === editingLabel.id ? { ...l, ...labelData } : l
        ));
      } else {
        // Create new label
        const labelData = {
          name: formData.name.trim(),
          parentId: formData.parentId ? parseInt(formData.parentId) : 0
        };
        const response = await createLabelAPI(selectedProject, labelData, token);
        const newLabel = response.data || response;
        setLabels([...labels, newLabel]);
      }
      setShowModal(false);
    } catch (err) {
      console.error('Error saving label:', err);
      alert('Lỗi khi lưu nhãn: ' + err.message);
    }
  };

  const handleDeleteLabel = async (labelId) => {
    if (!confirm('Bạn có chắc muốn xóa nhãn này?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      await deleteLabelAPI(labelId, token);
      setLabels(labels.filter(l => l.id !== labelId));
    } catch (err) {
      console.error('Error deleting label:', err);
      alert('Lỗi khi xóa nhãn: ' + err.message);
    }
  };

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>🏷️ Quản lý nhãn</h1>
        <p>Quản lý các nhãn gán nhãn cho dự án</p>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có dự án nào</p>
        </div>
      ) : (
        <>
          {/* Project Selector */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Chọn dự án</label>
              <select
                className="form-select"
                value={selectedProject}
                onChange={e => setSelectedProject(parseInt(e.target.value))}
                style={{ maxWidth: '400px' }}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Labels List */}
          {labels.length === 0 ? (
            <div className="empty-state">
              <p>Dự án này chưa có nhãn nào</p>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h3>Danh sách nhãn ({labels.length})</h3>
                <button className="btn btn-primary" onClick={handleCreateLabel}>
                  ➕ Tạo nhãn mới
                </button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Tên nhãn</th>
                    <th>Nhãn cha</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {labels.map(label => {
                    const parentLabel = labels.find(l => l.id === label.parentId);
                    return (
                      <tr key={label.id}>
                        <td>{label.name}</td>
                        <td>{parentLabel ? parentLabel.name : '(Không có)'}</td>
                        <td>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => handleEditLabel(label)}
                            style={{ marginRight: '8px' }}
                          >
                            ✏️ Sửa
                          </button>
                          <button 
                            className="btn btn-danger btn-sm" 
                            onClick={() => handleDeleteLabel(label.id)}
                          >
                            🗑️ Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingLabel ? '✏️ Chỉnh sửa nhãn' : '➕ Tạo nhãn mới'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Tên nhãn</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên nhãn"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nhãn cha</label>
                <select
                  className="form-select"
                  value={formData.parentId}
                  onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                >
                  <option value="">(Không có nhãn cha)</option>
                  {labels
                    .filter(l => l.id !== editingLabel?.id)
                    .map(label => (
                      <option key={label.id} value={label.id}>{label.name}</option>
                    ))
                  }
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveLabel}>
                {editingLabel ? 'Cập nhật' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LabelManagement;
