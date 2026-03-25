import { useState, useEffect } from 'react';
import { getExportJobsAPI, getProjectsAPI } from '../../api';

function ExportData() {
  const [projects, setProjects] = useState([]);
  const [exportJobs, setExportJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token');
        
        const projectsResponse = await getProjectsAPI(token);
        const projectsList = projectsResponse.items || projectsResponse.data || [];
        setProjects(projectsList);
        
        if (projectsList.length > 0) {
          const firstId = projectsList[0].id;
          setSelectedProjectId(firstId);
          
          const jobsResponse = await getExportJobsAPI(firstId, token).catch(() => ({ items: [] }));
          const jobsList = jobsResponse.items || jobsResponse.data || [];
          setExportJobs(jobsList);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setProjects([]);
        setExportJobs([]);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>📤 Xuất dữ liệu</h1>
        <p>Xuất dữ liệu đã được duyệt từ các dự án</p>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có dự án nào</p>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="form-group">
              <label className="form-label">Chọn dự án</label>
              <select
                className="form-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {exportJobs.length === 0 ? (
            <div className="empty-state">
              <p>Chưa có công việc xuất dữ liệu nào</p>
            </div>
          ) : (
            <div className="card">
              <h3>Lịch sử xuất dữ liệu</h3>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Trạng thái</th>
                    <th>Định dạng</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {exportJobs.map(job => (
                    <tr key={job.id}>
                      <td>{job.id}</td>
                      <td>{job.status || 'Unknown'}</td>
                      <td>{job.exportFormat || 'N/A'}</td>
                      <td>{job.createdAt ? new Date(job.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ExportData;
