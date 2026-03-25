import { useState, useEffect } from 'react';
import { getProjectsAPI, getDatasetsByProjectAPI, getDataItemsAPI, createDataItemAPI } from '../../api';

const API_BASE_URL = 'https://localhost:7076';

function DataItemManagement() {
  const [projects, setProjects] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [dataItems, setDataItems] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ image: null });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchDatasets(selectedProjectId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedDatasetId) {
      fetchDataItems(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      const response = await getProjectsAPI(token);
      const projectsData = response.items || response.data || response;
      const projectsList = Array.isArray(projectsData) ? projectsData : [];
      setProjects(projectsList);
      
      if (projectsList.length > 0) {
        setSelectedProjectId(projectsList[0].id);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setProjects([]);
      setLoading(false);
    }
  };

  const fetchDatasets = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      const response = await getDatasetsByProjectAPI(projectId, token);
      const datasetsData = response.items || response.data || response;
      setDatasets(Array.isArray(datasetsData) ? datasetsData : []);
      
      if (Array.isArray(datasetsData) && datasetsData.length > 0) {
        setSelectedDatasetId(datasetsData[0].id);
      } else {
        setSelectedDatasetId(null);
        setDataItems([]);
      }
    } catch (err) {
      console.error('Error fetching datasets:', err);
      setDatasets([]);
      setSelectedDatasetId(null);
      setDataItems([]);
    }
  };

  const fetchDataItems = async (datasetId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      const response = await getDataItemsAPI(datasetId, token);
      const itemsData = response.items || response.data || response;
      if (Array.isArray(itemsData) && itemsData.length > 0) {
      }
      setDataItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (err) {
      console.error('Error fetching data items:', err);
      setDataItems([]);
    }
  };

  const handleAddDataItem = () => {
    if (!selectedDatasetId) {
      alert('Vui lòng chọn bộ dữ liệu trước');
      return;
    }
    setFormData({ image: null });
    setShowModal(true);
  };

  const handleSaveDataItem = async () => {
    if (!formData.image) {
      alert('Vui lòng chọn hình ảnh để tải lên');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      // Create FormData to send file
      const uploadData = new FormData();
      uploadData.append('file', formData.image);
      
      await createDataItemAPI(selectedDatasetId, uploadData, token);
      await fetchDataItems(selectedDatasetId);
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

  const getDatasetName = (datasetId) => {
    const dataset = datasets.find(d => d.id === datasetId);
    return dataset ? dataset.name : 'N/A';
  };

  const getImageUrl = (contentPath) => {
    if (!contentPath) return '';
    // If it's already a full URL, return as-is
    if (contentPath.startsWith('http://') || contentPath.startsWith('https://')) {
      return contentPath;
    }
    // Otherwise, prepend the API base URL
    return `${API_BASE_URL}${contentPath}`;
  };

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>📋 Quản lý Hình ảnh</h1>
        <p>Xem và thêm hình ảnh vào bộ dữ liệu</p>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có dự án nào</p>
        </div>
      ) : (
        <>
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

          {selectedProjectId && datasets.length === 0 ? (
            <div className="empty-state">
              <p>Dự án này chưa có bộ dữ liệu nào</p>
            </div>
          ) : selectedProjectId ? (
            <>
              {/* Dataset Selector */}
              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header">
                  <h3>Chọn bộ dữ liệu - {getProjectName(selectedProjectId)}</h3>
                </div>
                <div style={{ padding: '20px' }}>
                  <select 
                    value={selectedDatasetId || ''} 
                    onChange={(e) => setSelectedDatasetId(parseInt(e.target.value))}
                    className="form-select"
                    style={{ maxWidth: '300px' }}
                  >
                    <option value="">-- Chọn bộ dữ liệu --</option>
                    {datasets.map(dataset => (
                      <option key={dataset.id} value={dataset.id}>
                        {dataset.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedDatasetId && (
                <div className="card">
                  <div className="card-header">
                    <h3>Danh sách Hình ảnh - {getDatasetName(selectedDatasetId)} ({dataItems.length})</h3>
                    <button className="btn btn-primary" onClick={handleAddDataItem}>
                      ➕ Thêm Hình ảnh
                    </button>
                  </div>

                  {dataItems.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      Chưa có hình ảnh nào
                    </div>
                  ) : (
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Hình ảnh</th>
                            <th>Trạng thái</th>
                            <th>Ngày tạo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dataItems.map(item => {
                            return (
                            <tr key={item.id}>
                              <td>{item.id}</td>
                              <td>
                                {item.content ? (
                                  <img 
                                    src={getImageUrl(item.content)} 
                                    alt={`Data item ${item.id}`}
                                    style={{ maxWidth: '100px', maxHeight: '100px', cursor: 'pointer', borderRadius: '4px' }}
                                    onClick={() => window.open(getImageUrl(item.content), '_blank')}
                                    onError={(e) => {
                                      console.error('Image load error for:', item.content);
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <span style={{ color: '#999' }}>Không có hình ảnh</span>
                                )}
                              </td>
                              <td>
                                <span className={`status-badge status-${item.status || item.Status || 'unassigned'}`}>
                                  {item.status || item.Status || 'unassigned'}
                                </span>
                              </td>
                              <td>{item.created_at || item.createdAt || item.CreatedAt || 'N/A'}</td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </>
      )}

      {/* Modal for Adding Data Item */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Thêm Hình ảnh mới</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Tải lên hình ảnh</label>
                <input
                  type="file"
                  className="form-input"
                  accept="image/*"
                  onChange={e => setFormData({ ...formData, image: e.target.files[0] })}
                  disabled={saving}
                />
                {formData.image && (
                  <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                    Tệp được chọn: <strong>{formData.image.name}</strong>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveDataItem} disabled={saving}>
                {saving ? 'Đang tải lên...' : 'Tải lên'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataItemManagement;
