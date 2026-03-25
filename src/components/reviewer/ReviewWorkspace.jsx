import { useState, useEffect, useRef, useCallback } from 'react';
import { getReviewDetailAPI, submitDecisionAPI } from '../../api';

function ReviewWorkspace({ annotation, userId, onBack }) {
  const [comment, setComment] = useState('');
  const [errorCategories, setErrorCategories] = useState([]);
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef(null);

  const ERROR_CATEGORY_OPTIONS = [
    { id: 'wrong_label', label: '❌ Nhãn sai', description: 'Label không chính xác' },
    { id: 'missing_annotation', label: '⚠️ Annotation thiếu', description: 'Thiếu đối tượng cần gán nhãn' },
    { id: 'incorrect_coordinates', label: '📍 Tọa độ sai', description: 'Tọa độ không chính xác' },
    { id: 'multiple_objects_missed', label: '🔍 Bỏ sót nhiều đối tượng', description: 'Bỏ sót nhiều đối tượng' },
    { id: 'extra_objects', label: '➕ Đối tượng thừa', description: 'Gán nhãn cho đối tượng không cần thiết' },
    { id: 'object_quality', label: '🎯 Chất lượng đối tượng', description: 'Chất lượng annotation không tốt' },
    { id: 'other', label: '📝 Khác', description: 'Lý do khác' }
  ];

  const toggleErrorCategory = (categoryId) => {
    setErrorCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const drawAnnotations = useCallback(() => {
    if (!canvasRef.current || !detailData) {
      return;
    }
    
    try {
      let coordData;
      if (typeof detailData.coordinateData === 'string') {
        coordData = JSON.parse(detailData.coordinateData);
      } else {
        coordData = detailData.coordinateData;
      }
      
      // Handle both wrapped and unwrapped formats
      let annotations;
      if (coordData.annotations) {
        annotations = coordData.annotations;
      } else if (Array.isArray(coordData)) {
        annotations = coordData;
      } else {
        annotations = [coordData];
      }
      
      const canvas = canvasRef.current;
      
      let svg = canvas.querySelector('svg');
      if (!svg) {
        svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('style', 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;');
        // Remove viewBox to use actual pixel coordinates like AnnotationWorkspace
        canvas.appendChild(svg);
      }
      
      // Clear existing
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      
      annotations.forEach((ann) => {
        if (ann.type === 'bbox' || ann.type === 'bounding_box') {
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', String(ann.x));
          rect.setAttribute('y', String(ann.y));
          rect.setAttribute('width', String(ann.width));
          rect.setAttribute('height', String(ann.height));
          rect.setAttribute('fill', 'rgba(5, 150, 105, 0.15)');
          rect.setAttribute('stroke', '#059669');
          rect.setAttribute('stroke-width', '2');
          svg.appendChild(rect);
          
          const labelText = ann.label_name || ann.labelName || 'Label';
          const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          bg.setAttribute('x', String(ann.x));
          bg.setAttribute('y', String(ann.y - 20));
          bg.setAttribute('width', String((labelText.length || 10) * 8 + 12));
          bg.setAttribute('height', '18');
          bg.setAttribute('fill', '#059669');
          bg.setAttribute('rx', '4');
          svg.appendChild(bg);
          
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', String(ann.x + 6));
          text.setAttribute('y', String(ann.y - 6));
          text.setAttribute('fill', 'white');
          text.setAttribute('font-size', '11');
          text.textContent = labelText;
          svg.appendChild(text);
        } else if (ann.type === 'polygon' && ann.points) {
          const points = ann.points.map(p => `${p.x},${p.y}`).join(' ');
          const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          poly.setAttribute('points', points);
          poly.setAttribute('fill', 'rgba(139, 92, 246, 0.15)');
          poly.setAttribute('stroke', '#8b5cf6');
          poly.setAttribute('stroke-width', '2');
          svg.appendChild(poly);
          
          // Add label at first point
          if (ann.points.length > 0) {
            const labelText = ann.label_name || ann.labelName || 'Label';
            const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bg.setAttribute('x', String(ann.points[0].x));
            bg.setAttribute('y', String(ann.points[0].y - 20));
            bg.setAttribute('width', String((labelText.length || 10) * 8 + 12));
            bg.setAttribute('height', '18');
            bg.setAttribute('fill', '#8b5cf6');
            bg.setAttribute('rx', '4');
            svg.appendChild(bg);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', String(ann.points[0].x + 6));
            text.setAttribute('y', String(ann.points[0].y - 6));
            text.setAttribute('fill', 'white');
            text.setAttribute('font-size', '11');
            text.textContent = labelText;
            svg.appendChild(text);
          }
        } else if (ann.type === 'point') {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', String(ann.x));
          circle.setAttribute('cy', String(ann.y));
          circle.setAttribute('r', '5');
          circle.setAttribute('fill', 'rgba(5, 150, 105, 0.3)');
          circle.setAttribute('stroke', '#059669');
          circle.setAttribute('stroke-width', '2');
          svg.appendChild(circle);
          
          const labelText = ann.label_name || ann.labelName || 'Point';
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', String(parseFloat(ann.x) + 10));
          text.setAttribute('y', String(parseFloat(ann.y) - 10));
          text.setAttribute('fill', '#059669');
          text.setAttribute('font-size', '12');
          text.setAttribute('font-weight', 'bold');
          text.textContent = labelText;
          svg.appendChild(text);
        }
      });
      
      if (!canvas.contains(svg)) {
        canvas.appendChild(svg);
      }
    } catch (err) {
      console.error('Error drawing annotations:', err);
    }
  }, [detailData]);

  useEffect(() => {
    if (!annotation?.annotationId) return;
    
    const loadReviewDetail = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');
        
        const response = await getReviewDetailAPI(annotation.annotationId, token);
        const data = response.data || response;
        setDetailData(data);
      } catch (err) {
        console.error('Error loading review detail:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadReviewDetail();
  }, [annotation?.annotationId]);

  useEffect(() => {
    if (detailData?.coordinateData) {
      drawAnnotations();
    }
  }, [detailData, drawAnnotations]);

  const getImageUrl = () => {
    if (detailData?.dataContent || detailData?.DataContent) {
      const content = detailData.dataContent || detailData.DataContent;
      if (content.startsWith('/')) {
        return `https://localhost:7076${content}`;
      }
      return content;
    }
    return '';
  };

  const handleApprove = async () => {
    if (!detailData?.annotationId) return;
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');
      
      const decisionData = {
        annotationId: detailData.annotationId,
        reviewer_id: userId,
        decision: 'Approved',
        reviewer_comment: comment || '',
        reviewer_notes: comment || ''
      };
      
      const response = await submitDecisionAPI(decisionData, token);
      const reviewResult = response.data || response;
      
      alert('Đã chấp nhận annotation!');
      onBack();
    } catch (err) {
      console.error('Error approving:', err);
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      alert('Vui lòng nhập lý do cần chỉnh sửa (bắt buộc)');
      return;
    }

    if (errorCategories.length === 0) {
      alert('Vui lòng chọn ít nhất một loại lỗi');
      return;
    }
    
    if (!detailData?.annotationId) return;
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');
      
      const decisionData = {
        annotationId: detailData.annotationId,
        reviewer_id: userId,
        decision: 'NeedsRework',
        reviewer_comment: comment.trim(),
        reviewer_notes: comment.trim(),
        error_categories: errorCategories
      };
      
      const response = await submitDecisionAPI(decisionData, token);
      // API returns: { reviewId, annotationId, reviewStatus, comment, errorCategories, reviewerName, reviewedAt, ... }
      const reviewResult = response.data || response;
      
      alert('Đã yêu cầu chỉnh sửa!');
      onBack();
    } catch (err) {
      console.error('Error rejecting:', err);
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!annotation) {
    return (
      <>
        <h1>🔍 Không gian duyệt</h1>
        <div className="reviewer-empty-state">
          <div className="empty-icon">📭</div>
          <h3>Chưa chọn annotation</h3>
          <p>Vui lòng chọn một annotation từ danh sách chờ duyệt</p>
          <button 
            onClick={onBack}
            style={{ marginTop: '16px', padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Quay lại danh sách
          </button>
        </div>
      </>
    );
  }

  if (loading) {
    return <div className="loading">Đang tải chi tiết duyệt...</div>;
  }

  if (!detailData) {
    return <div className="error-message">Lỗi tải chi tiết annotation</div>;
  }

  const getImageIcon = (content) => {
    if (!content) return '🖼️';
    if (content.includes('lion')) return '🦁';
    if (content.includes('elephant')) return '🐘';
    if (content.includes('tiger')) return '🐯';
    if (content.includes('zebra')) return '🦓';
    return '🖼️';
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>🔍 Không gian duyệt</h1>
        <button 
          onClick={onBack}
          disabled={submitting}
          style={{ padding: '8px 16px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: submitting ? 0.5 : 1 }}
        >
          ← Quay lại
        </button>
      </div>

      <div className="review-workspace">
        <div className="review-canvas-area">
          <div className="review-canvas-header">
            <h3>{(detailData.dataContent || detailData.DataContent)?.split('/').pop() || `Item ${detailData.dataItemId || detailData.DataItemId}`}</h3>
            <div className="annotator-info">
              <div className="avatar">👤</div>
              <span>Người gán nhãn: <strong>{detailData.annotatorName || detailData.AnnotatorName || 'Unknown'}</strong></span>
            </div>
          </div>
          <div className="review-canvas-display" ref={canvasRef} style={{ position: 'relative', overflow: 'hidden' }}>
            <img 
              src={getImageUrl()} 
              alt="annotation" 
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </div>

        <div className="review-panel">
          <div className="review-section">
            <h4>📋 Hướng dẫn gán nhãn</h4>
            <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto' }}>
              {detailData.projectInstruction || detailData.ProjectInstruction || 'Chưa có hướng dẫn'}
            </div>
          </div>

          <div className="review-section">
            <h4>🏷️ Chi tiết Annotation</h4>
            <div className="annotation-detail-item">
              <div className="label">{detailData.labelValue || detailData.LabelValue || 'N/A'}</div>
              <div className="type">Loại: {detailData.annotationType || detailData.AnnotationType || 'N/A'}</div>
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>
                <div>📅 Ngày gán: {new Date(detailData.submittedAt || detailData.SubmittedAt).toLocaleDateString('vi-VN')}</div>
                <div>👤 Người gán: {detailData.annotatorName || detailData.AnnotatorName || 'Unknown'}</div>
                <div>📊 Project: {detailData.projectName || detailData.ProjectName || 'N/A'}</div>
                <div>📁 Dataset: {detailData.datasetName || detailData.DatasetName || 'N/A'}</div>
              </div>
            </div>
          </div>

          {detailData.validation && (
            <div className="review-section">
              <h4>✔️ Kiểm tra</h4>
              <div style={{ fontSize: '13px', lineHeight: 1.8 }}>
                <div>Label hợp lệ: {(detailData.validation.labelExistsInProject || detailData.validation.LabelExistsInProject) ? '✅' : '❌'}</div>
                <div>Tọa độ hợp lệ: {(detailData.validation.isCoordinateJsonValid || detailData.validation.IsCoordinateJsonValid) ? '✅' : '❌'}</div>
                {(detailData.validation.issues || detailData.validation.Issues)?.length > 0 && (
                  <div style={{ marginTop: '8px', color: '#dc2626' }}>
                    Vấn đề: {(detailData.validation.issues || detailData.validation.Issues).join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="review-section">
            <h4>💬 Bình luận</h4>
            <textarea
              className="feedback-textarea"
              placeholder="Nhập bình luận hoặc ghi chú..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={submitting}
              style={{ minHeight: '100px', padding: '10px', fontFamily: 'inherit' }}
            />
          </div>

          <div className="review-section">
            <h4>⚠️ Loại lỗi (khi từ chối)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {ERROR_CATEGORY_OPTIONS.map(option => (
                <label key={option.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '10px', borderRadius: '6px', background: errorCategories.includes(option.id) ? '#dbeafe' : '#f9fafb', border: errorCategories.includes(option.id) ? '1px solid #60a5fa' : '1px solid #e5e7eb', transition: 'all 0.2s' }}>
                  <input
                    type="checkbox"
                    checked={errorCategories.includes(option.id)}
                    onChange={() => toggleErrorCategory(option.id)}
                    disabled={submitting}
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '500', color: '#111827', fontSize: '14px' }}>{option.label}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
            {errorCategories.length > 0 && (
              <div style={{ marginTop: '12px', padding: '10px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '6px', fontSize: '13px', color: '#166534' }}>
                ✓ Đã chọn: {errorCategories.map(cat => ERROR_CATEGORY_OPTIONS.find(o => o.id === cat)?.label).join(', ')}
              </div>
            )}
          </div>

          <div className="review-decision">
            <button 
              className="decision-btn approve" 
              onClick={handleApprove}
              disabled={submitting}
              style={{ opacity: submitting ? 0.5 : 1 }}
            >
              ✅ Chấp nhận
            </button>
            <button 
              className="decision-btn reject" 
              onClick={handleReject}
              disabled={submitting}
              style={{ opacity: submitting ? 0.5 : 1 }}
            >
              ❌ Từ chối
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ReviewWorkspace;
