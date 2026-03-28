import { useState, useEffect } from 'react';
import { getSubmittedQueueAPI } from '../../api';

function PendingReviews({ userId, onStartReview }) {
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalReviewed: 0,
    totalApproved: 0,
    totalRejected: 0
  });

  useEffect(() => {
    fetchPendingAnnotations(currentPage);
  }, [currentPage]);

  const fetchPendingAnnotations = async (pageNumber) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await getSubmittedQueueAPI(token, pageNumber, pageSize);
      const paginatedData = response.data || {};
      const annotationsData = paginatedData.items || [];
      
      setAnnotations(annotationsData);
      setTotalCount(paginatedData.totalCount || 0);
      setTotalPages(paginatedData.totalPages || 0);
      
      // Calculate stats based on actual statuses from API
      const submitted = annotationsData.filter(a => a.annotationStatus === 'Submitted').length;
      const inProgress = annotationsData.filter(a => a.annotationStatus === 'InProgress').length;
      const approved = annotationsData.filter(a => a.annotationStatus === 'Approved').length;
      const rejected = annotationsData.filter(a => a.annotationStatus === 'Rejected').length;
      
      setStats({
        totalPending: submitted + inProgress,
        totalReviewed: approved + rejected,
        totalApproved: approved,
        totalRejected: rejected
      });
      setError('');
    } catch (err) {
      setError(err.message);
      console.error('Error fetching annotations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getImageIcon = (content) => {
    if (!content) return '🖼️';
    if (content.includes('lion')) return '🦁';
    if (content.includes('elephant')) return '🐘';
    if (content.includes('tiger')) return '🐯';
    if (content.includes('zebra')) return '🦓';
    return '🖼️';
  };

  if (loading) {
    return <div className="loading">Đang tải danh sách duyệt...</div>;
  }

  return (
    <>
      <h1>Danh sách chờ duyệt</h1>

      {error && <div className="error-message" style={{ marginBottom: '20px' }}>{error}</div>}

      <div className="reviewer-stats">
        <div className="stat-card pending">
          <div className="stat-value">{stats.totalPending}</div>
          <div className="stat-label">Chờ duyệt</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalReviewed}</div>
          <div className="stat-label">Đã duyệt</div>
        </div>
        <div className="stat-card approved">
          <div className="stat-value">{stats.totalApproved}</div>
          <div className="stat-label">Chấp nhận</div>
        </div>
        <div className="stat-card rejected">
          <div className="stat-value">{stats.totalRejected}</div>
          <div className="stat-label">Từ chối</div>
        </div>
      </div>

      {annotations.length === 0 ? (
        <div className="reviewer-empty-state">
          <div className="empty-icon"></div>
          <h3>Không có annotation nào chờ duyệt</h3>
          <p>Tất cả annotations đã được xử lý</p>
        </div>
      ) : (
        <>
          <div className="pending-reviews-container">
          {annotations.map(ann => (
            <div key={ann.annotationId} className="review-card">
              <div className="review-info">
                <div className="review-thumbnail">
                  {getImageIcon(ann.dataContent)}
                </div>
                <div className="review-details">
                  <h3>{ann.dataContent?.split('/').pop() || `Mục dữ liệu ${ann.dataItemId}`}</h3>
                  <p>Nhãn: <strong>{ann.labelValue || 'Không xác định'}</strong></p>
                  <p>Loại: <strong>{ann.annotationType || 'Không xác định'}</strong></p>
                  <div className="review-meta">
                    <span>👤 {ann.annotatorName || 'Không xác định'}</span>
                    <span>📅 {new Date(ann.submittedAt).toLocaleDateString('vi-VN') || 'N/A'}</span>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      background: ann.annotationStatus === 'Submitted' ? '#fef3c7' : ann.annotationStatus === 'InProgress' ? '#dbeafe' : ann.annotationStatus === 'Approved' ? '#dcfce7' : '#fee2e2',
                      color: ann.annotationStatus === 'Submitted' ? '#92400e' : ann.annotationStatus === 'InProgress' ? '#1e40af' : ann.annotationStatus === 'Approved' ? '#166534' : '#991b1b'
                    }}>
                      {ann.annotationStatus === 'Submitted' ? 'Chờ duyệt' : ann.annotationStatus === 'InProgress' ? 'Đang xử lý' : ann.annotationStatus === 'Approved' ? 'Đã duyệt' : ann.annotationStatus === 'Rejected' ? 'Bị từ chối' : 'Không xác định'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="review-actions">
                <button onClick={() => onStartReview(ann)}>
                  Bắt đầu duyệt
                </button>
              </div>
            </div>
          ))}
          </div>
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '30px', padding: '20px' }}>
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                Trang trước
              </button>
              
              <span style={{ fontSize: '14px', color: '#666' }}>
                Trang {currentPage} / {totalPages}
              </span>
              
              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
                style={{ padding: '8px 16px' }}
              >
                Trang tiếp
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default PendingReviews;
