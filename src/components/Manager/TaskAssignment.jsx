import { useState, useEffect } from 'react';
import { getProjectsAPI, getDatasetsByProjectAPI, assignDatasetAPI, getManagerUsersAPI, getDatasetAssignmentsAPI } from '../../api';

function TaskAssignment() {
  const [projects, setProjects] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [assignData, setAssignData] = useState({ userId: '', role: 'Annotator' });
  const [assignmentsMap, setAssignmentsMap] = useState({});

  useEffect(() => {
    fetchProjects();
    fetchUsers();
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

      // Fetch assignments for all datasets
      fetchAllAssignments(datasetsList, token);
    } catch (err) {
      console.error('Error fetching datasets:', err);
      setDatasets([]);
    }
  };

  const fetchAllAssignments = async (datasetsList, token) => {
    const newMap = {};
    await Promise.all(
      datasetsList.map(async (dataset) => {
        try {
          const response = await getDatasetAssignmentsAPI(dataset.id, token);
          // Backend returns List<DatasetAssignmentDto> directly, or {items: [...]}
          newMap[dataset.id] = Array.isArray(response) ? response : (response.items || []);
        } catch {
          newMap[dataset.id] = [];
        }
      })
    );
    setAssignmentsMap(newMap);
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      const response = await getManagerUsersAPI(token);
      console.log('Manager users response:', response);
      
      // Handle paginated response format: { items: [...], totalCount, pageNumber, pageSize, totalPages }
      let usersList = response.items || response.data || response;
      
      // Ensure it's an array
      if (!Array.isArray(usersList)) {
        usersList = [];
      }
      
      console.log('All users before filter:', usersList);
      
      // Filter to only show active Annotators and Reviewers
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

  const handleOpenAssignModal = (dataset) => {
    setSelectedDataset(dataset);
    setAssignData({ userId: '', role: 'Annotator' });
    setShowModal(true);
  };

  const getRoleBadgeStyle = (role) => {
    if (role === 'Annotator') return { background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' };
    if (role === 'Reviewer') return { background: '#fce7f3', color: '#be185d', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' };
    return { background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' };
  };

  const handleAssignWork = async () => {
    if (!assignData.userId) {
      alert('Vui lòng chọn người thực hiện');
      return;
    }

    try {
      setAssigning(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      // Call API to assign dataset with PascalCase property names for .NET backend
      const response = await assignDatasetAPI(selectedDataset.id, {
        UserId: parseInt(assignData.userId),
        Role: assignData.role
      }, token);
      
      alert('Đã phân công công việc thành công');
      setShowModal(false);
      setAssigning(false);
      // Refresh assignments after successful assign
      const token2 = localStorage.getItem('token');
      if (token2) fetchAllAssignments(datasets, token2);
    } catch (err) {
      console.error('Error assigning work:', err);
      alert('Lỗi: ' + err.message);
      setAssigning(false);
    }
  };

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Phân công công việc</h1>
        <p>Phân công annotator và reviewer cho các bộ dữ liệu</p>
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
              {/* Datasets Table */}
              <div className="card">
                <div className="card-header">
                  <h3>Danh sách bộ dữ liệu - {getProjectName(selectedProjectId)} ({datasets.length})</h3>
                </div>

                {datasets.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    Chưa có bộ dữ liệu nào
                  </div>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Tên bộ dữ liệu</th>
                          <th>Mô tả</th>
                          <th>Trạng thái</th>
                          <th>Người được phân công</th>
                          <th>Ngày tạo</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datasets.map(dataset => {
                          const datasetName = dataset.name || 'N/A';
                          const datasetDesc = (dataset.description || '').substring(0, 50);
                          const datasetStatus = dataset.status || 'unknown';
                          const createdDate = (dataset.createdAt || dataset.created_at || '').substring(0, 10) || 'N/A';
                          const assignments = assignmentsMap[dataset.id] || [];
                          
                          return (
                            <tr key={dataset.id}>
                              <td>{dataset.id}</td>
                              <td><strong>{datasetName}</strong></td>
                              <td>{datasetDesc || 'N/A'}</td>
                              <td>
                                <span className={`status-badge status-${datasetStatus}`}>
                                  {datasetStatus === 'active' ? 'Hoạt động' : datasetStatus === 'assigned' ? 'Đã phân công' : 'Không hoạt động'}
                                </span>
                              </td>
                              <td>
                                {assignments.length === 0 ? (
                                  <span style={{ color: '#9ca3af', fontSize: '13px' }}>Chưa phân công</span>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {assignments.map(a => (
                                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '13px' }}>{a.username}</span>
                                        <span style={getRoleBadgeStyle(a.role)}>{a.role}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td>{createdDate}</td>
                              <td>
                                <button 
                                  className="btn btn-success btn-sm" 
                                  onClick={() => handleOpenAssignModal(dataset)}
                                >
                                  👤 Phân công
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </>
      )}

      {/* Modal for Assign Work */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Phân công - {selectedDataset?.name}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {/* Current assignments */}
              {selectedDataset && (assignmentsMap[selectedDataset.id] || []).length > 0 && (
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#374151' }}>Đã phân công:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(assignmentsMap[selectedDataset.id] || []).map(a => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px' }}>👤 {a.username}</span>
                        <span style={getRoleBadgeStyle(a.role)}>{a.role}</span>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{(a.assignedAt || '').substring(0, 10)}</span>
                      </div>
                    ))}
                  </div>
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
              <button className="btn btn-primary" onClick={handleAssignWork} disabled={assigning || users.length === 0}>
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
