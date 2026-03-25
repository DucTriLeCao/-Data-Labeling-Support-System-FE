import { useState, useEffect } from 'react';
import { getAnnotationFeedbackAPI, getAssignedTasksAPI, getTaskDetailAPI } from '../../api';

function RejectedAnnotations({ userId, onRetry }) {
  const [rejectedAnnotations, setRejectedAnnotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchRejectedAnnotations = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token');
        
        // Get all assigned tasks
        const tasksResponse = await getAssignedTasksAPI(token);
        const tasks = tasksResponse.data || [];
        
        // Fetch feedback for each task
        const rejectedList = [];
        for (const task of tasks) {
          try {
            // First get task detail to get annotation ID
            const taskDetail = await getTaskDetailAPI(task.dataItemAssignmentId, token);
            const annotation = taskDetail.data || taskDetail;
            const annotationId = annotation.currentAnnotation?.annotationId;
            
            if (annotationId) {
              try {
                // Get feedback for this annotation
                const feedbackResponse = await getAnnotationFeedbackAPI(annotationId, token);
                const data = feedbackResponse.data || feedbackResponse;
                
                // Check if has rejected feedbacks
                if (data.feedbacks && data.feedbacks.length > 0) {
                  const hasRejected = data.feedbacks.some(f => f.reviewStatus === 'rejected');
                  if (hasRejected) {
                    // Store task info in the data for retry
                    data._task = task;
                    rejectedList.push(data);
                  }
                }
              } catch (err) {
                // Silently skip if feedback fetch fails
              }
            }
          } catch (err) {
            // Silently skip if task detail fetch fails
          }
        }
        
        setRejectedAnnotations(rejectedList);
        setError(null);
      } catch (err) {
        setError(err.message);
        setRejectedAnnotations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRejectedAnnotations();
  }, [userId]);

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="rejected-annotations-container">
        <h2>🔴 Annotation Bị Từ Chối</h2>
        <div className="error-message" style={{ padding: '20px', background: '#fef2f2', borderRadius: '6px', color: '#dc2626' }}>
          Không thể tải annotation bị từ chối: {error}
        </div>
      </div>
    );
  }

  if (rejectedAnnotations.length === 0) {
    return (
      <div className="rejected-annotations-container">
        <h2>🔴 Annotation Bị Từ Chối</h2>
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>Không có annotation bị từ chối</h3>
          <p>Tất cả annotation của bạn đều được chấp nhận!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rejected-annotations-container">
      <h2>🔴 Annotation Bị Từ Chối ({rejectedAnnotations.length})</h2>
      
      <div className="rejected-list">
        {rejectedAnnotations.map(annotation => (
          <div key={annotation.annotationId} className="rejected-item">
            <div 
              className="rejected-header"
              onClick={() => setExpandedId(expandedId === annotation.annotationId ? null : annotation.annotationId)}
              style={{ cursor: 'pointer' }}
            >
              <div className="rejected-info">
                <div className="annotation-label">
                  <span className="label-badge">{annotation.labelValue}</span>
                  <span className="annotation-type">({annotation.annotationType})</span>
                </div>
                <div className="annotation-date">
                  📅 {new Date(annotation.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <span className="expand-icon">
                {expandedId === annotation.annotationId ? '▼' : '▶'}
              </span>
            </div>

            {expandedId === annotation.annotationId && (
              <div className="rejected-details">
                {annotation.feedbacks && annotation.feedbacks.length > 0 ? (
                  annotation.feedbacks.map((feedback, idx) => {
                    let parsedComment = {};
                    try {
                      parsedComment = JSON.parse(feedback.comment);
                    } catch (e) {
                      parsedComment = { Comment: feedback.comment, ErrorCategories: [] };
                    }

                    return (
                      <div key={idx} className="feedback-block">
                        <div className="feedback-header">
                          <span className="reviewer-name">👤 {feedback.reviewerName}</span>
                          <span className="review-date">
                            {new Date(feedback.reviewedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        <div className="feedback-content">
                          <div className="feedback-comment">
                            <strong>💬 Nhận xét:</strong>
                            <p>{parsedComment.Comment || feedback.comment}</p>
                          </div>

                          {parsedComment.ErrorCategories && parsedComment.ErrorCategories.length > 0 && (
                            <div className="error-categories">
                              <strong>⚠️ Lý do từ chối:</strong>
                              <ul>
                                {parsedComment.ErrorCategories.map((category, i) => (
                                  <li key={i}>{category}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="feedback-action">
                          <button 
                            className="retry-btn"
                            onClick={() => onRetry && onRetry(annotation._task, annotation.annotationId)}
                          >
                            ↩️ Chỉnh sửa lại
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-feedback">Không có phản hồi chi tiết</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .rejected-annotations-container {
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
          margin-top: 20px;
        }

        .rejected-annotations-container h2 {
          margin: 0 0 20px 0;
          color: #dc2626;
          font-size: 18px;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          background: white;
          border-radius: 6px;
          border: 1px dashed #d1d5db;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          color: #374151;
        }

        .empty-state p {
          margin: 0;
          color: #9ca3af;
          font-size: 14px;
        }

        .rejected-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .rejected-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .rejected-header {
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fef2f2;
          border-bottom: 1px solid #fecaca;
        }

        .rejected-info {
          flex: 1;
        }

        .annotation-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          font-weight: 500;
        }

        .label-badge {
          background: #dc2626;
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
        }

        .annotation-type {
          color: #6b7280;
          font-size: 13px;
        }

        .annotation-date {
          font-size: 13px;
          color: #6b7280;
        }

        .expand-icon {
          color: #6b7280;
          font-size: 12px;
          margin-left: 12px;
        }

        .rejected-details {
          padding: 16px;
          background: white;
        }

        .feedback-block {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 6px;
          padding: 14px;
          margin-bottom: 12px;
        }

        .feedback-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 13px;
        }

        .reviewer-name {
          color: #374151;
          font-weight: 500;
        }

        .review-date {
          color: #9ca3af;
        }

        .feedback-content {
          margin: 12px 0;
        }

        .feedback-comment {
          margin-bottom: 12px;
        }

        .feedback-comment strong {
          display: block;
          color: #dc2626;
          font-size: 13px;
          margin-bottom: 6px;
        }

        .feedback-comment p {
          margin: 0;
          padding: 8px;
          background: white;
          border-left: 3px solid #dc2626;
          color: #374151;
          font-size: 13px;
        }

        .error-categories {
          margin-top: 12px;
        }

        .error-categories strong {
          display: block;
          color: #ea580c;
          font-size: 13px;
          margin-bottom: 6px;
        }

        .error-categories ul {
          margin: 0;
          padding-left: 20px;
          font-size: 13px;
        }

        .error-categories li {
          color: #6b7280;
          margin: 4px 0;
        }

        .feedback-action {
          margin-top: 12px;
          text-align: right;
        }

        .retry-btn {
          background: #ea580c;
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .retry-btn:hover {
          background: #c2410c;
        }

        .no-feedback {
          padding: 12px;
          background: white;
          color: #9ca3af;
          font-size: 13px;
          text-align: center;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

export default RejectedAnnotations;
