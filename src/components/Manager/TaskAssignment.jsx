import { useState, useEffect } from 'react';
import { getProjectsAPI, getDatasetsByProjectAPI, getDataItemsAPI, assignDataItemsAPI, getManagerUsersAPI } from '../../api';

const API_BASE_URL = 'https://localhost:7076';

function TaskAssignment() {
  const [projects, setProjects] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [dataItems, setDataItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignData, setAssignData] = useState({ userId: '', role: 'Annotator' });
  const [selectedDataItem, setSelectedDataItem] = useState(null);
  const [error, setError] = useState('');
  const [assignmentError, setAssignmentError] = useState('');

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchDatasets(selectedProjectId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedDatasetId) {
      fetchDataItems(selectedDatasetId);
      setSelectedDataItem(null);
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
      const datasetsList = Array.isArray(datasetsData) ? datasetsData : [];
      setDatasets(datasetsList);
      setError('');

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
      const itemsData = response.items || response.data || response;
      const itemsList = Array.isArray(itemsData) ? itemsData : [];
      setDataItems(itemsList);
      setError('');
    } catch (err) {
      console.error('Error fetching data items:', err);
      setDataItems([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      const response = await getManagerUsersAPI(token);
      console.log('Manager users response:', response);
      
      let usersList = response.items || response.data || response;
      
      if (!Array.isArray(usersList)) {
        usersList = [];
      }
      
      console.log('All users before filter:', usersList);
      
      usersList = usersList.filter(user => {
        const isActive = user.status === 'Active';
        const isCorrectRole = user.role === 'Annotator' || user.role === 'Reviewer';
        console.log(`User ${user.username}: Active=${isActive}, Role=${user.role}, CorrectRole=${isCorrectRole}`);
        return isActive && isCorrectRole;
      });
      
      console.log('Filtered users:', usersList);
      setUsers(usersList);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
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

  const getRoleBadgeStyle = (role) => {
    if (role === 'Annotator') return { background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' };
    if (role === 'Reviewer') return { background: '#fce7f3', color: '#be185d', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' };
    return { background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' };
  };

  const handleOpenAssignModal = (dataItem) => {
    setSelectedDataItem(dataItem);
    setAssignData({ userId: '', role: 'Annotator' });
    setShowModal(true);
    setAssignmentError('');
  };

  const handleAssignWork = async () => {
    if (!assignData.userId) {
      setAssignmentError('Vui lòng chọn người thực hiện');
      return;
    }

    if (!selectedDataItem) {
      setAssignmentError('Không có hình ảnh được chọn');
      return;
    }

    try {
      setAssigning(true);
      setAssignmentError('');
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await assignDataItemsAPI({
        DataItemIds: [selectedDataItem.id],
        UserId: parseInt(assignData.userId),
        Role: assignData.role
      }, token);
      
      alert(`Đã phân công hình ảnh "${selectedDataItem.name || selectedDataItem.fileName}" thành công`);
      setShowModal(false);
      setAssigning(false);
      setSelectedDataItem(null);
      
      if (selectedDatasetId) {
        fetchDataItems(selectedDatasetId);
      }
    } catch (err) {
      console.error('Error assigning work:', err);
      const errorMessage = err.message || 'Lỗi không xác định';
      
      if (errorMessage.includes('already been assigned') || errorMessage.includes('đã được phân công')) {
        setAssignmentError(`Hình ảnh này đã được phân công cho người dùng này rồi.`);
      } else if (errorMessage.includes('Object reference') || errorMessage.includes('not set to an instance')) {
        setAssignmentError('Lỗi: Dữ liệu bộ dữ liệu không được tải đúng. Vui lòng tải lại trang và thử lại.');
        console.error('Backend data loading error:', err);
      } else if (errorMessage.includes('User not found')) {
        setAssignmentError('Lỗi: Người dùng không được tìm thấy. Vui lòng chọn người dùng khác.');
      } else if (errorMessage.includes('Data items not found') || errorMessage.includes('Data item')) {
        setAssignmentError('Lỗi: Hình ảnh không tồn tại hoặc đã bị xóa.');
      } else {
        setAssignmentError(`Lỗi: ${errorMessage}`);
      }
      setAssigning(false);
    }
  };

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Phân công công việc (Theo hình ảnh)</h1>
        <p>Phân công annotator và reviewer cho từng hình ảnh</p>
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
                  <h3>Chọn bộ dữ liệu</h3>
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

              {selectedDatasetId && dataItems.length === 0 ? (
                <div className="empty-state">
                  <p>Bộ dữ liệu này chưa có mục dữ liệu nào</p>
                </div>
              ) : selectedDatasetId ? (
                <>
                  {/* Data Items Display */}
                  <div className="card">
                    <div className="card-header">
                      <h3>Danh sách Hình ảnh - {getDatasetName(selectedDatasetId)} ({dataItems.length})</h3>
                    </div>

                    {error && (
                      <div style={{ padding: '12px 20px', background: '#fee2e2', color: '#dc2626', borderRadius: '4px', margin: '20px' }}>
                        {error}
                      </div>
                    )}

                    {dataItems.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                        Chưa có hình ảnh nào
                      </div>
                    ) : (
                      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                        {dataItems.map(item => (
                          <div 
                            key={item.id}
                            style={{
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column',
                              backgroundColor: '#ffffff'
                            }}
                          >
                            {/* Image Preview */}
                            <div style={{
                              width: '100%',
                              height: '180px',
                              background: '#f3f4f6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              position: 'relative'
                            }}>
                              {item.content ? (
                                <img 
                                  src={getImageUrl(item.content)} 
                                  alt={`Hình ảnh ${item.id}`}
                                  style={{ 
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => window.open(getImageUrl(item.content), '_blank')}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span style={{ color: '#9ca3af', fontSize: '13px' }}>Không có hình ảnh</span>
                              )}
                            </div>

                            {/* Card Details */}
                            <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>ID: {item.id}</div>
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#374151',
                                marginBottom: '6px',
                                wordBreak: 'break-word',
                                flex: 1
                              }}>
                                {item.name || item.fileName || 'N/A'}
                              </div>
                              <div style={{ marginBottom: '8px' }}>
                                <span className={`status-badge status-${item.status || 'unknown'}`} style={{ fontSize: '11px' }}>
                                  {item.status === 'assigned' ? 'Đã phân công' : item.status === 'active' ? 'Chưa phân công' : item.status || 'N/A'}
                                </span>
                              </div>
                              <button 
                                className="btn btn-success btn-sm" 
                                onClick={() => handleOpenAssignModal(item)}
                                style={{ width: '100%' }}
                              >
                                Phân công
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </>
          ) : null}
        </>
      )}

      {/* Modal for Assign Work */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Phân công: {selectedDataItem?.name || selectedDataItem?.fileName || 'Hình ảnh'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {assignmentError && (
                <div style={{
                  padding: '12px 16px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  borderLeft: '4px solid #dc2626',
                  fontSize: '14px'
                }}>
                  {assignmentError}
                </div>
              )}

              {users.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626', background: '#fee2e2', borderRadius: '6px' }}>
                  Không có Annotator hoặc Reviewer nào khả dụng
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Chọn người thực hiện</label>
                    <select
                      className="form-select"
                      value={assignData.userId}
                      onChange={e => {
                        const selectedUser = users.find(u => String(u.id) === e.target.value);
                        setAssignData({
                          userId: e.target.value,
                          role: selectedUser ? selectedUser.role : 'Annotator'
                        });
                        setAssignmentError('');
                      }}
                      disabled={assigning || users.length === 0}
                    >
                      <option value="">-- Chọn người --</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.username} - {user.role}
                        </option>
                      ))}
                    </select>
                  </div>
                  {assignData.userId && (
                    <div className="form-group">
                      <label className="form-label">Vai trò</label>
                      <div style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: '6px', fontSize: '14px' }}>
                        <span style={getRoleBadgeStyle(assignData.role)}>{assignData.role}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={assigning}>Hủy</button>
              <button className="btn btn-primary" onClick={handleAssignWork} disabled={assigning || users.length === 0 || !assignData.userId}>
                {assigning ? 'Đang xử lý...' : 'Phân công'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskAssignment;
