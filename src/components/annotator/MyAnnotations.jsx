import { useState, useEffect } from 'react';

function MyAnnotations({ userId }) {
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnotations = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token');
        
        setAnnotations([]);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching annotations:', err);
        setAnnotations([]);
        setLoading(false);
      }
    };

    fetchAnnotations();
  }, [userId]);

  if (loading) {
    return <div className="loading">Đang tải lịch sử...</div>;
  }

  if (annotations.length === 0) {
    return (
      <>
        <h1>Lịch sử gán nhãn</h1>
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Chưa có lịch sử</h3>
          <p>Bạn chưa thực hiện gán nhãn nào</p>
        </div>
      </>
    );
  }

  return (
    <>
      <h1>Lịch sử gán nhãn</h1>
      <div className="annotations-table">
        <table>
          <thead>
            <tr>
              <th>Dữ liệu</th>
              <th>Nhãn</th>
              <th>Ngày gán</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {annotations.map(ann => (
              <tr key={ann.annotationId}>
                <td>{ann.datasetName || 'Unknown'}</td>
                <td>{ann.labelValue || 'N/A'}</td>
                <td>{new Date(ann.submittedAt).toLocaleDateString('vi-VN')}</td>
                <td>
                  <span className={`annotation-status ${ann.annotationStatus?.toLowerCase()}`}>
                    {ann.annotationStatus || 'Unknown'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '24px', padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1f2937' }}>📊 Thống kê</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
              {annotations.length}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Tổng annotations</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
              {annotations.filter(a => a.annotationStatus?.toLowerCase() === 'approved').length}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Đã duyệt</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
              {annotations.filter(a => a.annotationStatus?.toLowerCase() === 'submitted').length}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Đang chờ duyệt</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MyAnnotations;
