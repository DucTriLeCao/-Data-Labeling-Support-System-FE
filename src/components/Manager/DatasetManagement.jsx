import { useState, useEffect } from 'react';
import { getDatasetsByProjectAPI, createDatasetAPI, updateDatasetAPI, getProjectsAPI } from '../../api';

function DatasetManagement() {
  const [datasets, setDatasets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDataset, setEditingDataset] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', projectId: '' });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchDatasets(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      const response = await getProjectsAPI(token);
      const projectsData = response.items || response.data || response;
      const projectsList = Array.isArray(projectsData) ? projectsData : [];
      setProjects(projectsList);
      
      // Auto-select first project
      if (projectsList.length > 0) {
        setSelectedProjectId(projectsList[0].id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchDatasets = async (projectId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      const response = await getDatasetsByProjectAPI(projectId, token);
      const datasetsData = response.items || response.data || response;
      if (Array.isArray(datasetsData) && datasetsData.length > 0) {
      }
      setDatasets(Array.isArray(datasetsData) ? datasetsData : []);
      setError('');
    } catch (err) {
      setError(err.message);
      console.error('Error fetching datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (!selectedProjectId) {
      alert('Vui lòng chọn dự án trước');
      return;
    }
    setEditingDataset(null);
    setFormData({ name: '', description: '', projectId: selectedProjectId });
    setShowModal(true);
  };

  const handleEdit = (dataset) => {
    setEditingDataset(dataset);
    setFormData({
      name: dataset.name,
      description: dataset.description,
      projectId: selectedProjectId
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên bộ dữ liệu');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const projectId = editingDataset ? selectedProjectId : formData.projectId;
      
      if (editingDataset) {
        await updateDatasetAPI(editingDataset.id, formData, token);
        setDatasets(datasets.map(d => 
          d.id === editingDataset.id ? { ...d, ...formData } : d
        ));
      } else {
        const response = await createDatasetAPI(projectId, formData, token);
        setDatasets([...datasets, response.data || response]);
      }

      setShowModal(false);
      setSaving(false);
    } catch (err) {
      alert('Lỗi: ' + err.message);
      setSaving(false);
    }
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'N/A';
  };

  if (!selectedProjectId && projects.length > 0) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>📊 Quản lý bộ dữ liệu</h1>
        <p>Quản lý các bộ dữ liệu của dự án gán nhãn</p>
      </div>

      {error && <div className="error-message" style={{ margin: '20px 0' }}>{error}</div>}

      {/* Project Selector */}
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

      {selectedProjectId && (
        <div className="card">
          <div className="card-header">
            <h3>Danh sách bộ dữ liệu - {getProjectName(selectedProjectId)}</h3>
            <button className="btn btn-primary" onClick={handleAdd}>
              ➕ Thêm bộ dữ liệu
            </button>
          </div>

          {loading ? (
            <div className="loading">Đang tải bộ dữ liệu...</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên bộ dữ liệu</th>
                    <th>Mô tả</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center' }}>Không có bộ dữ liệu nào</td></tr>
                  ) : (
                    datasets.map(dataset => {
                      const datasetName = dataset.name || 'N/A';
                      const datasetDesc = (dataset.description || '').substring(0, 50);
                      const datasetStatus = dataset.status || 'unknown';
                      const createdDate = (dataset.createdAt || dataset.created_at || '').substring(0, 10) || 'N/A';
                      
                      return (
                        <tr key={dataset.id}>
                          <td>{dataset.id}</td>
                          <td><strong>{datasetName}</strong></td>
                          <td>{datasetDesc || 'N/A'}</td>
                          <td>
                            <span className={`status-badge status-${datasetStatus}`}>
                              {datasetStatus === 'active' ? '🟢 Hoạt động' : datasetStatus === 'assigned' ? '🔵 Đã phân công' : '🔴 Không hoạt động'}
                            </span>
                          </td>
                          <td>{createdDate}</td>
                          <td>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(dataset)}>
                              ✏️ Sửa
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDataset ? '✏️ Chỉnh sửa bộ dữ liệu' : '➕ Thêm bộ dữ liệu mới'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {!editingDataset && (
                <div className="form-group">
                  <label className="form-label">Dự án</label>
                  <select
                    className="form-select"
                    value={formData.projectId}
                    onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                    disabled={saving}
                  >
                    <option value="">-- Chọn dự án --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Tên bộ dữ liệu</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên bộ dữ liệu"
                  disabled={saving}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập mô tả bộ dữ liệu"
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

export default DatasetManagement;
