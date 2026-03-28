import { useState, useEffect } from 'react';
import { getProjectsAPI, getLabelsByProjectAPI, createLabelAPI, updateLabelAPI, deleteLabelAPI, bulkDeleteLabelsAPI } from '../../api';
import ProjectSearchSelect from './ProjectSearchSelect';

function LabelManagement() {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [formData, setFormData] = useState({ name: '', parentId: '' });
  const [selectedLabels, setSelectedLabels] = useState(new Set());

  useEffect(() => {
    // Auto-load first project on mount
    const autoLoadFirstProject = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await getProjectsAPI(token, 1, 20, '');
        // Backend returns PagedResult with PascalCase: Items, TotalCount, PageNumber, PageSize
        const projects = response.Items || response.data?.Items || response.items || [];
        if (projects.length > 0) {
          setSelectedProject(projects[0].id);
        }
      } catch (err) {
        console.error('Error auto-loading projects:', err);
      }
    };
    autoLoadFirstProject();
    setLoading(false);
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
        const sortedLabels = Array.isArray(labelsList) ? [...labelsList].sort((a, b) => a.id - b.id) : [];
        setLabels(sortedLabels);
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
      setSelectedLabels(new Set([...selectedLabels].filter(id => id !== labelId)));
    } catch (err) {
      console.error('Error deleting label:', err);
      alert('Lỗi khi xóa nhãn: ' + err.message);
    }
  };

  const handleBulkDeleteLabels = async () => {
    if (selectedLabels.size === 0) {
      alert('Vui lòng chọn ít nhất một nhãn');
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa ${selectedLabels.size} nhãn đã chọn?`)) return;

    try {
      const token = localStorage.getItem('token');
      const ids = Array.from(selectedLabels);
      const result = await bulkDeleteLabelsAPI(ids, token);
      alert(`Xóa thành công: ${result.successCount}, Thất bại: ${result.failureCount}`);
      setLabels(labels.filter(l => !selectedLabels.has(l.id)));
      setSelectedLabels(new Set());
    } catch (err) {
      alert('Lỗi xóa hàng loạt: ' + err.message);
    }
  };

  const toggleLabelSelection = (labelId) => {
    const newSet = new Set(selectedLabels);
    if (newSet.has(labelId)) {
      newSet.delete(labelId);
    } else {
      newSet.add(labelId);
    }
    setSelectedLabels(newSet);
  };

  const toggleSelectAllLabels = () => {
    if (selectedLabels.size === labels.length) {
      setSelectedLabels(new Set());
    } else {
      setSelectedLabels(new Set(labels.map(l => l.id)));
    }
  };

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Quản lý nhãn</h1>
        <p>Quản lý các nhãn gán nhãn cho dự án</p>
      </div>

      <>
        {/* Project Selector */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Chọn dự án</label>
            <ProjectSearchSelect
              value={selectedProject}
              onChange={setSelectedProject}
              disabled={false}
            />
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
              {selectedLabels.size > 0 && (
                <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '10px' }}>
                  <button className="btn btn-danger" onClick={handleBulkDeleteLabels}>
                    🗑️ Xóa ({selectedLabels.size})
                  </button>
                </div>
              )}
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedLabels.size === labels.length && labels.length > 0}
                        onChange={toggleSelectAllLabels}
                      />
                    </th>
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
                        <td style={{ width: '40px' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedLabels.has(label.id)}
                            onChange={() => toggleLabelSelection(label.id)}
                          />
                        </td>
                        <td>{label.name}</td>
                        <td>{parentLabel ? parentLabel.name : '(Không có)'}</td>
                        <td>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => handleEditLabel(label)}
                            style={{ marginRight: '4px' }}
                          >
                            Sửa
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

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingLabel ? 'Chỉnh sửa nhãn' : 'Tạo nhãn mới'}</h3>
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
