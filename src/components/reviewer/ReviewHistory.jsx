import { useState, useEffect } from 'react';
import { getSubmittedQueueAPI } from '../../api';

function ReviewHistory({ userId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token');
        
        const response = await getSubmittedQueueAPI(token);
        const data = response.data || response.items || [];
        setReviews(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setReviews([]);
        setLoading(false);
      }
    };

    fetchReviews();
  }, [userId]);

  if (loading) {
    return <div className="loading">Đang tải lịch sử duyệt...</div>;
  }

  if (reviews.length === 0) {
    return (
      <>
        <h1>Lịch sử duyệt</h1>
        <div className="empty-state">
          <p>Chưa có lịch sử duyệt nào</p>
        </div>
      </>
    );
  }

  const getStatusLabel = (status) => {
    const statusLower = status?.toLowerCase();
    const statusMap = {
      'approved': 'Đã duyệt',
      'rejected': 'Bị từ chối',
      'need_rework': 'Cần sửa lại',
      'needsrework': 'Cần sửa lại',
      'submitted': 'Chờ duyệt',
      'pending': 'Chờ xử lý',
      'inprogress': 'Đang xử lý'
    };
    return statusMap[statusLower] || status || 'Không xác định';

  // Stats
  const totalReviewed = userReviews.length;
  const totalApproved = userReviews.filter(r => r.status === 'approved').length;
  const totalRejected = userReviews.filter(r => r.status === 'rejected').length;
  const approvalRate = totalReviewed > 0 ? Math.round((totalApproved / totalReviewed) * 100) : 0;

  return (
    <>
      <h1>📜 Lịch sử duyệt</h1>

      <div className="reviewer-stats">
        <div className="stat-card">
          <div className="stat-value">{totalReviewed}</div>
          <div className="stat-label">Tổng đã duyệt</div>
        </div>
        <div className="stat-card approved">
          <div className="stat-value">{totalApproved}</div>
          <div className="stat-label">Chấp nhận</div>
        </div>
        <div className="stat-card rejected">
          <div className="stat-value">{totalRejected}</div>
          <div className="stat-label">Từ chối</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{approvalRate}%</div>
          <div className="stat-label">Tỷ lệ chấp nhận</div>
        </div>
      </div>

      {reviewsWithDetails.length === 0 ? (
        <div className="reviewer-empty-state">
          <div className="empty-icon">📭</div>
          <h3>Chưa có lịch sử duyệt</h3>
          <p>Bạn chưa thực hiện duyệt annotation nào</p>
        </div>
      ) : (
        <div className="review-history-table">
          <table>
            <thead>
              <tr>
                <th>Dữ liệu</th>
                <th>Nhãn</th>
                <th>Annotator</th>
                <th>Kết quả</th>
                <th>Ghi chú</th>
                <th>Ngày duyệt</th>
              </tr>
            </thead>
            <tbody>
              {reviewsWithDetails.map(review => (
                <tr key={review.id}>
                  <td>{review.dataItem?.content?.split('/').pop() || 'Unknown'}</td>
                  <td>{review.labelName}</td>
                  <td>{review.annotator?.username || 'Unknown'}</td>
                  <td>
                    <span className={`review-status ${review.status}`}>
                      {getStatusLabel(review.status)}
                    </span>
                  </td>
                  <td style={{ maxWidth: '200px' }}>
                    {review.comment || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Không có</span>}
                  </td>
                  <td>{review.reviewed_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default ReviewHistory;
