import { useState, useEffect } from 'react';
import { getReviewerHistoryAPI } from '../../api';

function ReviewerHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadHistory();
  }, [pageNumber, pageSize, status]);

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await getReviewerHistoryAPI(token, pageNumber, pageSize, status || null);
      const data = response.data || response;
      
      if (data.items) {
        setHistory(data.items);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error loading history:', err);
      setError(err.message || 'Failed to load review history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      approved: { bg: '#dcfce7', text: '#166534', label: 'Đã duyệt' },
      'need_rework': { bg: '#fee2e2', text: '#991b1b', label: 'Cần sửa lại' },
      'needsrework': { bg: '#fee2e2', text: '#991b1b', label: 'Cần sửa lại' },
      'needwork': { bg: '#fee2e2', text: '#991b1b', label: 'Cần sửa lại' },
      'submitted': { bg: '#fef3c7', text: '#b45309', label: 'Chờ duyệt' },
      'pending': { bg: '#fef3c7', text: '#b45309', label: 'Chờ xử lý' },
      'inprogress': { bg: '#dbeafe', text: '#0c4a6e', label: 'Đang xử lý' },
      'rejected': { bg: '#fee2e2', text: '#991b1b', label: 'Bị từ chối' }
    };
    const key = status?.toLowerCase();
    const config = statusMap[key] || { bg: '#f3f4f6', text: '#6b7280', label: status };
    return (
      <span style={{ background: config.bg, color: config.text, padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
        {config.label}
      </span>
    );
  };

  const parseComment = (commentStr) => {
    try {
      if (!commentStr) return { Comment: '', ErrorCategories: [] };
      const parsed = JSON.parse(commentStr);
      return parsed;
    } catch {
      return { Comment: commentStr, ErrorCategories: [] };
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px', color: '#1f2937' }}>Lịch sử Duyệt</h1>

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {/* Filters */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPageNumber(1);
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="approved">Đã duyệt</option>
            <option value="needsrework">Cần chỉnh sửa</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value));
              setPageNumber(1);
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value={10}>10 mục/trang</option>
            <option value={20}>20 mục/trang</option>
            <option value={50}>50 mục/trang</option>
          </select>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Đang tải lịch sử...
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
            Chưa có lịch sử duyệt
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280', fontSize: '14px' }}>ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280', fontSize: '14px' }}>Project</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280', fontSize: '14px' }}>Dataset</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280', fontSize: '14px' }}>Nhãn</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280', fontSize: '14px' }}>Gán bởi</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280', fontSize: '14px' }}>Trạng thái</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280', fontSize: '14px' }}>Bình luận</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#6b7280', fontSize: '14px' }}>Ngày duyệt</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => {
                    const commentData = parseComment(item.comment);
                    return (
                      <tr key={item.reviewId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px', color: '#1f2937', fontSize: '14px' }}>#{item.reviewId}</td>
                        <td style={{ padding: '12px', color: '#1f2937', fontSize: '14px' }}>{item.projectName}</td>
                        <td style={{ padding: '12px', color: '#1f2937', fontSize: '14px' }}>{item.datasetName}</td>
                        <td style={{ padding: '12px', fontWeight: '500', color: '#6366f1' }}>{item.labelValue}</td>
                        <td style={{ padding: '12px', color: '#6b7280', fontSize: '14px' }}>{item.annotatorName}</td>
                        <td style={{ padding: '12px' }}>{getStatusBadge(item.reviewStatus)}</td>
                        <td style={{ padding: '12px', color: '#6b7280', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={commentData.Comment}>
                          {commentData.Comment || '(Không có)'}
                        </td>
                        <td style={{ padding: '12px', color: '#6b7280', fontSize: '14px' }}>
                          {new Date(item.reviewedAt).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>
                Trang {pageNumber} / {totalPages}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                  disabled={pageNumber === 1}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    background: pageNumber === 1 ? '#f3f4f6' : 'white',
                    color: pageNumber === 1 ? '#9ca3af' : '#1f2937',
                    cursor: pageNumber === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ← Trước
                </button>
                <button
                  onClick={() => setPageNumber(Math.min(totalPages, pageNumber + 1))}
                  disabled={pageNumber === totalPages}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    background: pageNumber === totalPages ? '#f3f4f6' : 'white',
                    color: pageNumber === totalPages ? '#9ca3af' : '#1f2937',
                    cursor: pageNumber === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Tiếp →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ReviewerHistory;
