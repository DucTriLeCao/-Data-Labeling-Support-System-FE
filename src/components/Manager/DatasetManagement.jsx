import { useState, useEffect } from 'react';
import { getDatasetsByProjectAPI, createDatasetAPI, updateDatasetAPI, getProjectsAPI, deleteDatasetAPI, bulkDeleteDatasetsAPI } from '../../api';
import ProjectSearchSelect from './ProjectSearchSelect';

function DatasetManagement() {
  const [datasets, setDatasets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDataset, setEditingDataset] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', projectId: '' });
  const [selectedDatasets, setSelectedDatasets] = useState(new Set());

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
          setSelectedProjectId(projects[0].id);
        }
      } catch (err) {
        console.error('Error auto-loading projects:', err);
      }
    };
    autoLoadFirstProject();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchDatasets(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchDatasets = async (projectId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      const response = await getDatasetsByProjectAPI(projectId, token);
      console.log('Datasets API response:', response);
      // Backend returns lowercase camelCase: items, totalCount, pageNumber, pageSize, totalPages
      const datasetsList = response.items || [];
      console.log('Extracted datasets:', datasetsList);
      const sortedDatasets = Array.isArray(datasetsList) ? [...datasetsList].sort((a, b) => a.id - b.id) : [];
      setDatasets(sortedDatasets);
      setError('');
    } catch (err) {
      console.error('Error fetching datasets:', err);
      setError(err.message);
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

  const handleDeleteDataset = async (datasetId) => {
    if (!confirm('Bạn có chắc muốn xóa bộ dữ liệu này?')) return;

    try {
      const token = localStorage.getItem('token');
      await deleteDatasetAPI(datasetId, token);
      setDatasets(datasets.filter(d => d.id !== datasetId));
      setSelectedDatasets(new Set([...selectedDatasets].filter(id => id !== datasetId)));
    } catch (err) {
      alert('Lỗi xóa bộ dữ liệu: ' + err.message);
    }
  };

  const handleBulkDeleteDatasets = async () => {
    if (selectedDatasets.size === 0) {
      alert('Vui lòng chọn ít nhất một bộ dữ liệu');
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa ${selectedDatasets.size} bộ dữ liệu đã chọn?`)) return;

    try {
      const token = localStorage.getItem('token');
      const ids = Array.from(selectedDatasets);
      const result = await bulkDeleteDatasetsAPI(ids, token);
      alert(`Xóa thành công: ${result.successCount}, Thất bại: ${result.failureCount}`);
      setDatasets(datasets.filter(d => !selectedDatasets.has(d.id)));
      setSelectedDatasets(new Set());
    } catch (err) {
      alert('Lỗi xóa hàng loạt: ' + err.message);
    }
  };

  const toggleDatasetSelection = (datasetId) => {
    const newSet = new Set(selectedDatasets);
    if (newSet.has(datasetId)) {
      newSet.delete(datasetId);
    } else {
      newSet.add(datasetId);
    }
    setSelectedDatasets(newSet);
  };

  const toggleSelectAllDatasets = () => {
    if (selectedDatasets.size === datasets.length) {
      setSelectedDatasets(new Set());
    } else {
      setSelectedDatasets(new Set(datasets.map(d => d.id)));
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
        <h1>Quản lý bộ dữ liệu</h1>
        <p>Quản lý các bộ dữ liệu của dự án gán nhãn</p>
      </div>

      {error && <div className="error-message" style={{ margin: '20px 0' }}>{error}</div>}

      {/* Project Selector */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h3>Chọn dự án</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <ProjectSearchSelect
            value={selectedProjectId}
            onChange={setSelectedProjectId}
            disabled={false}
          />
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
            <>
              {datasets.length > 0 && (
                <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '10px' }}>
                  {selectedDatasets.size > 0 && (
                    <button className="btn btn-danger" onClick={handleBulkDeleteDatasets}>
                      🗑️ Xóa ({selectedDatasets.size})
                    </button>
                  )}
                </div>
              )}
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedDatasets.size === datasets.length && datasets.length > 0}
                          onChange={toggleSelectAllDatasets}
                        />
                      </th>
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
                      <tr><td colSpan="7" style={{ textAlign: 'center' }}>Không có bộ dữ liệu nào</td></tr>
                    ) : (
                      datasets.map(dataset => {
                        const datasetName = dataset.name || 'N/A';
                        const datasetDesc = (dataset.description || '').substring(0, 50);
                        const datasetStatus = dataset.status || 'unknown';
                        const createdDate = (dataset.createdAt || dataset.created_at || '').substring(0, 10) || 'N/A';
                        
                        return (
                          <tr key={dataset.id}>
                            <td style={{ width: '40px' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedDatasets.has(dataset.id)}
                                onChange={() => toggleDatasetSelection(dataset.id)}
                              />
                            </td>
                            <td>{dataset.id}</td>
                            <td><strong>{datasetName}</strong></td>
                            <td>{datasetDesc || 'N/A'}</td>
                            <td>
                              <span className={`status-badge status-${datasetStatus}`}>
                                {datasetStatus === 'active' ? 'Hoạt động' : datasetStatus === 'assigned' ? 'Đã phân công' : 'Không hoạt động'}
                              </span>
                            </td>
                            <td>{createdDate}</td>
                            <td>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(dataset)} style={{ marginRight: '4px' }}>
                                Sửa
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteDataset(dataset.id)}>
                                🗑️ Xóa
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDataset ? 'Chỉnh sửa bộ dữ liệu' : 'Thêm bộ dữ liệu'}</h3>
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
