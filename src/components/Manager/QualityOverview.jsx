import { useState, useEffect } from 'react';
import { getQualityOverviewByProjectAPI, getQualityOverviewByDatasetAPI, getQualityOverviewByDataItemAPI, getQualityOverviewByAnnotatorAPI } from '../../api';

const API_BASE_URL = 'https://localhost:7076';

function QualityOverview() {
  const [activeTab, setActiveTab] = useState('project');
  const [projectData, setProjectData] = useState([]);
  const [datasetData, setDatasetData] = useState([]);
  const [dataItemData, setDataItemData] = useState([]);
  const [annotatorData, setAnnotatorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllQualityData();
  }, []);

  const fetchAllQualityData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');
      
      const [projectRes, datasetRes, dataItemRes, annotatorRes] = await Promise.all([
        getQualityOverviewByProjectAPI(token),
        getQualityOverviewByDatasetAPI(token),
        getQualityOverviewByDataItemAPI(token),
        getQualityOverviewByAnnotatorAPI(token)
      ]);

      setProjectData(Array.isArray(projectRes) ? projectRes : []);
      setDatasetData(Array.isArray(datasetRes) ? datasetRes : []);
      setDataItemData(Array.isArray(dataItemRes) ? dataItemRes : []);
      setAnnotatorData(Array.isArray(annotatorRes) ? annotatorRes : []);
      setError('');
    } catch (err) {
      console.error('Error fetching quality overview:', err);
      setError(err.message || 'Không thể tải dữ liệu chất lượng');
      setProjectData([]);
      setDatasetData([]);
      setDataItemData([]);
      setAnnotatorData([]);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (contentPath) => {
    if (!contentPath) return '';
    if (contentPath.startsWith('http://') || contentPath.startsWith('https://')) {
      return contentPath;
    }
    return `${API_BASE_URL}${contentPath}`;
  };

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Tổng quan chất lượng gán nhãn</h1>
        <p>Theo dõi và đánh giá chất lượng công việc gán nhãn theo nhiều khía cạnh</p>
      </div>

      {error && (
        <div style={{ 
          background: '#fee2e2', 
          color: '#dc2626', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          borderLeft: '4px solid #dc2626'
        }}>
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0' }}>
          <button 
            onClick={() => setActiveTab('project')}
            style={{
              flex: 1,
              padding: '16px',
              background: activeTab === 'project' ? '#ffffff' : '#f9fafb',
              border: 'none',
              borderBottom: activeTab === 'project' ? '3px solid #3b82f6' : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: activeTab === 'project' ? '#3b82f6' : '#6b7280'
            }}
          >
            Theo Dự án
          </button>
          <button 
            onClick={() => setActiveTab('dataset')}
            style={{
              flex: 1,
              padding: '16px',
              background: activeTab === 'dataset' ? '#ffffff' : '#f9fafb',
              border: 'none',
              borderBottom: activeTab === 'dataset' ? '3px solid #3b82f6' : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: activeTab === 'dataset' ? '#3b82f6' : '#6b7280'
            }}
          >
            Theo Bộ dữ liệu
          </button>
          <button 
            onClick={() => setActiveTab('dataitem')}
            style={{
              flex: 1,
              padding: '16px',
              background: activeTab === 'dataitem' ? '#ffffff' : '#f9fafb',
              border: 'none',
              borderBottom: activeTab === 'dataitem' ? '3px solid #3b82f6' : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: activeTab === 'dataitem' ? '#3b82f6' : '#6b7280'
            }}
          >
            Theo Mục Dữ liệu
          </button>
          <button 
            onClick={() => setActiveTab('annotator')}
            style={{
              flex: 1,
              padding: '16px',
              background: activeTab === 'annotator' ? '#ffffff' : '#f9fafb',
              border: 'none',
              borderBottom: activeTab === 'annotator' ? '3px solid #3b82f6' : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              color: activeTab === 'annotator' ? '#3b82f6' : '#6b7280'
            }}
          >
            Theo Người dùng
          </button>
        </div>
      </div>

      {/* Tab Content - By Project */}
      {activeTab === 'project' && (
        <div className="card">
          <div className="card-header">
            <h3>Chất lượng theo dự án ({projectData.length})</h3>
          </div>
          {projectData.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              Chưa có dữ liệu
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tên dự án</th>
                    <th>Tổng Annotations</th>
                    <th>Đã phê duyệt</th>
                    <th>Bị từ chối</th>
                    <th>Đang xử lý</th>
                    <th>Tỷ lệ phê duyệt</th>
                  </tr>
                </thead>
                <tbody>
                  {projectData.map(p => {
                    const total = p.totalAnnotations || 0;
                    const approved = p.approved || 0;
                    const rejected = p.rejected || 0;
                    const inProgress = total - approved - rejected;
                    const rate = total > 0 ? ((approved / total) * 100) : 0;
                    
                    return (
                      <tr key={p.projectId}>
                        <td><strong>{p.projectName || 'N/A'}</strong></td>
                        <td>{total}</td>
                        <td><span style={{ color: '#059669', fontWeight: '500' }}>{approved}</span></td>
                        <td><span style={{ color: '#dc2626', fontWeight: '500' }}>{rejected}</span></td>
                        <td>{inProgress}</td>
                        <td><strong>{rate.toFixed(1)}%</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content - By Dataset */}
      {activeTab === 'dataset' && (
        <div className="card">
          <div className="card-header">
            <h3>Chất lượng theo bộ dữ liệu ({datasetData.length})</h3>
          </div>
          {datasetData.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              Chưa có dữ liệu
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tên bộ dữ liệu</th>
                    <th>Dự án</th>
                    <th>Tổng Annotations</th>
                    <th>Đã phê duyệt</th>
                    <th>Bị từ chối</th>
                    <th>Đang xử lý</th>
                    <th>Tỷ lệ phê duyệt</th>
                  </tr>
                </thead>
                <tbody>
                  {datasetData.map(d => {
                    const total = d.totalAnnotations || 0;
                    const approved = d.approved || 0;
                    const rejected = d.rejected || 0;
                    const inProgress = total - approved - rejected;
                    const rate = total > 0 ? ((approved / total) * 100) : 0;
                    
                    return (
                      <tr key={d.datasetId}>
                        <td><strong>{d.datasetName || 'N/A'}</strong></td>
                        <td>{d.projectName || 'N/A'}</td>
                        <td>{total}</td>
                        <td><span style={{ color: '#059669', fontWeight: '500' }}>{approved}</span></td>
                        <td><span style={{ color: '#dc2626', fontWeight: '500' }}>{rejected}</span></td>
                        <td>{inProgress}</td>
                        <td><strong>{rate.toFixed(1)}%</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content - By DataItem */}
      {activeTab === 'dataitem' && (
        <div className="card">
          <div className="card-header">
            <h3>Chất lượng theo mục dữ liệu ({dataItemData.length})</h3>
          </div>
          {dataItemData.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              Chưa có dữ liệu
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Hình ảnh</th>
                    <th>Bộ dữ liệu</th>
                    <th>Tổng đánh giá</th>
                    <th>Phê duyệt</th>
                    <th>Từ chối</th>
                    <th>Tỷ lệ hoàn thành</th>
                  </tr>
                </thead>
                <tbody>
                  {dataItemData.map(di => {
                    const total = di.totalAnnotations || 0;
                    const approved = di.approved || 0;
                    const rejected = di.rejected || 0;
                    const rate = total > 0 ? ((approved / total) * 100) : 0;
                    
                    return (
                      <tr key={di.dataItemId}>
                        <td>
                          {di.dataItemContent ? (
                            <img 
                              src={getImageUrl(di.dataItemContent)} 
                              alt={`Data item ${di.dataItemId}`}
                              style={{ maxWidth: '100px', maxHeight: '100px', cursor: 'pointer', borderRadius: '4px' }}
                              onClick={() => window.open(getImageUrl(di.dataItemContent), '_blank')}
                              onError={(e) => {
                                console.error('Image load error for:', di.dataItemContent);
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span style={{ color: '#999' }}>Không có hình ảnh</span>
                          )}
                        </td>
                        <td>{di.datasetName || 'N/A'}</td>
                        <td>{total}</td>
                        <td><span style={{ color: '#059669', fontWeight: '500' }}>{approved}</span></td>
                        <td><span style={{ color: '#dc2626', fontWeight: '500' }}>{rejected}</span></td>
                        <td><strong>{rate.toFixed(1)}%</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content - By Annotator */}
      {activeTab === 'annotator' && (
        <div className="card">
          <div className="card-header">
            <h3>Chất lượng theo người dùng ({annotatorData.length})</h3>
          </div>
          {annotatorData.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              Chưa có dữ liệu
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tên người dùng</th>
                    <th>Tổng đánh giá</th>
                    <th>Phê duyệt</th>
                    <th>Từ chối</th>
                    <th>Tỷ lệ phê duyệt</th>
                  </tr>
                </thead>
                <tbody>
                  {annotatorData.map(a => {
                    const total = a.totalAnnotations || 0;
                    const approved = a.approved || 0;
                    const rejected = a.rejected || 0;
                    const rate = total > 0 ? ((approved / total) * 100) : 0;
                    
                    return (
                      <tr key={a.annotatorId}>
                        <td><strong>{a.annotatorName || 'N/A'}</strong></td>
                        <td>{total}</td>
                        <td><span style={{ color: '#059669', fontWeight: '500' }}>{approved}</span></td>
                        <td><span style={{ color: '#dc2626', fontWeight: '500' }}>{rejected}</span></td>
                        <td><strong>{rate.toFixed(1)}%</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QualityOverview;
