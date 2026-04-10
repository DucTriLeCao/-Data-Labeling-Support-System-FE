import { useState, useEffect } from 'react';
import { getProjectsAPI, getDatasetsByProjectAPI, getDataItemsAPI, createDataItemAPI, deleteDataItemAPI, bulkDeleteDataItemsAPI } from '../../api';
import ProjectSearchSelect from './ProjectSearchSelect';
import DatasetSearchSelect from './DatasetSearchSelect';

const API_BASE_URL = 'https://localhost:7076';

function DataItemManagement() {
  const [datasets, setDatasets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [dataItems, setDataItems] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ image: null });
  const [selectedDataItems, setSelectedDataItems] = useState(new Set());

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
    setLoading(false);
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

  const fetchDatasets = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      const response = await getDatasetsByProjectAPI(projectId, token);
      console.log('Datasets API response:', response);
      // Backend returns lowercase camelCase: items, totalCount, pageNumber, pageSize, totalPages
      const datasetsList = response.items || [];
      console.log('Extracted datasets:', datasetsList);
      setDatasets(Array.isArray(datasetsList) ? datasetsList : []);
      
      if (datasetsList.length > 0) {
        setSelectedDatasetId(datasetsList[0].id);
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
      console.log('Data items API response:', response);
      const itemsList = response.items || [];
      console.log('Extracted data items:', itemsList);
      const sortedItems = Array.isArray(itemsList) ? [...itemsList].sort((a, b) => a.id - b.id) : [];
      setDataItems(sortedItems);
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

  const handleDeleteDataItem = async (dataItemId) => {
    if (!confirm('Bạn có chắc muốn xóa mục dữ liệu này?')) return;

    try {
      const token = localStorage.getItem('token');
      await deleteDataItemAPI(dataItemId, token);
      setDataItems(dataItems.filter(di => di.id !== dataItemId));
      setSelectedDataItems(new Set([...selectedDataItems].filter(id => id !== dataItemId)));
    } catch (err) {
      alert('Lỗi xóa mục dữ liệu: ' + err.message);
    }
  };

  const handleBulkDeleteDataItems = async () => {
    if (selectedDataItems.size === 0) {
      alert('Vui lòng chọn ít nhất một mục dữ liệu');
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa ${selectedDataItems.size} mục dữ liệu đã chọn?`)) return;

    try {
      const token = localStorage.getItem('token');
      const ids = Array.from(selectedDataItems);
      const result = await bulkDeleteDataItemsAPI(ids, token);
      alert(`Xóa thành công: ${result.successCount}, Thất bại: ${result.failureCount}`);
      setDataItems(dataItems.filter(di => !selectedDataItems.has(di.id)));
      setSelectedDataItems(new Set());
    } catch (err) {
      alert('Lỗi xóa hàng loạt: ' + err.message);
    }
  };

  const toggleDataItemSelection = (dataItemId) => {
    const newSet = new Set(selectedDataItems);
    if (newSet.has(dataItemId)) {
      newSet.delete(dataItemId);
    } else {
      newSet.add(dataItemId);
    }
    setSelectedDataItems(newSet);
  };

  const toggleSelectAllDataItems = () => {
    if (selectedDataItems.size === dataItems.length) {
      setSelectedDataItems(new Set());
    } else {
      setSelectedDataItems(new Set(dataItems.map(di => di.id)));
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
    if (contentPath.startsWith('http://') || contentPath.startsWith('https://')) {
      return contentPath;
    }
    return `${API_BASE_URL}${contentPath}`;
  };

  const getDataItemStatusLabel = (status) => {
    const statusMap = {
      'pending': 'Chờ xử lý',
      'unassigned': 'Chưa phân công',
      'assigned': 'Đã phân công',
      'annotated': 'Đã gán nhãn',
      'submitted': 'Chờ duyệt',
      'approved': 'Đã duyệt',
      'rejected': 'Bị từ chối',
      'need_rework': 'Cần sửa lại'
    };
    return statusMap[status?.toLowerCase()] || status;
  };

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Quản lý Hình ảnh</h1>
        <p>Xem và thêm hình ảnh vào bộ dữ liệu</p>
      </div>

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

      {selectedProjectId ? (
        <>
          {/* Dataset Selector */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h3>Chọn bộ dữ liệu - {getProjectName(selectedProjectId)}</h3>
            </div>
            <div style={{ padding: '20px' }}>
              <DatasetSearchSelect
                projectId={selectedProjectId}
                value={selectedDatasetId}
                onChange={setSelectedDatasetId}
                disabled={false}
              />
            </div>
          </div>

          {selectedDatasetId && (
            <div className="card">
              <div className="card-header">
                <h3>Danh sách Hình ảnh - {getDatasetName(selectedDatasetId)} ({dataItems.length})</h3>
                <button className="btn btn-primary" onClick={handleAddDataItem}>
                  Thêm Hình ảnh
                </button>
              </div>

              {dataItems.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  Chưa có hình ảnh nào
                </div>
              ) : (
                <>
                  {selectedDataItems.size > 0 && (
                    <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '10px' }}>
                      <button className="btn btn-danger" onClick={handleBulkDeleteDataItems}>
                        🗑️ Xóa ({selectedDataItems.size})
                      </button>
                    </div>
                  )}
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>
                            <input 
                              type="checkbox" 
                              checked={selectedDataItems.size === dataItems.length && dataItems.length > 0}
                              onChange={toggleSelectAllDataItems}
                            />
                          </th>
                          <th>ID</th>
                          <th>Hình ảnh</th>
                          <th>Trạng thái</th>
                          <th>Ngày tạo</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataItems.map(item => (
                          <tr key={item.id}>
                            <td style={{ width: '40px' }}>
                              <input 
                                type="checkbox" 
                                checked={selectedDataItems.has(item.id)}
                                onChange={() => toggleDataItemSelection(item.id)}
                              />
                            </td>
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
                                {getDataItemStatusLabel(item.status || item.Status || 'unassigned')}
                              </span>
                            </td>
                            <td>{item.created_at || item.createdAt || item.CreatedAt || 'N/A'}</td>
                            <td>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteDataItem(item.id)}>
                                🗑️ Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      ) : null}

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
