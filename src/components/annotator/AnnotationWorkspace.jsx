import { useState, useRef, useEffect } from 'react';
import { createAnnotationAPI, submitForReviewAPI, getTaskDetailAPI, getAnnotationFeedbackAPI } from '../../api';

function AnnotationWorkspace({ task, userId, onBack, retryAnnotationId }) {
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [activeTool, setActiveTool] = useState('select');
  const [labels, setLabels] = useState([]);
  const [guidelines, setGuidelines] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedAnnotationId, setSavedAnnotationId] = useState(null);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  
  const canvasRef = useRef(null);

  // Load existing annotations when retrying rejected annotation
  useEffect(() => {
    const loadExistingAnnotations = async () => {
      if (retryAnnotationId) {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          
          const response = await getAnnotationFeedbackAPI(retryAnnotationId, token);
          const data = response.data || response;
          
          if (data.coordinateData) {
            let parsedAnnotations = [];
            try {
              parsedAnnotations = JSON.parse(data.coordinateData);
              // Handle both {annotations: [...]} and [...] formats
              if (parsedAnnotations.annotations) {
                parsedAnnotations = parsedAnnotations.annotations;
              }
            } catch (e) {
              parsedAnnotations = [];
            }
            
            setAnnotations(parsedAnnotations);
            
            // Set the label if available
            if (data.labelValue) {
              const label = labels.find(l => l.name === data.labelValue);
              if (label) {
                setSelectedLabel(label.id);
              }
            }
          }
        } catch (err) {
          // Silently skip on error
        }
      }
    };
    
    loadExistingAnnotations();
  }, [retryAnnotationId, labels]);

  // Load full task details including labels
  useEffect(() => {
    const loadTaskDetails = async () => {
      if (!task || !task.dataItemAssignmentId) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');
        
        const response = await getTaskDetailAPI(task.dataItemAssignmentId, token);
        const taskData = response.data || response;
        
        if (taskData.availableLabels) {
          // Convert API format to component format
          const formattedLabels = taskData.availableLabels.map(label => ({
            id: label.labelId,
            name: label.labelName,
            parent_id: label.parentLabelId,
            parentId: label.parentLabelId
          }));
          setLabels(formattedLabels);
        }
      } catch (err) {
        console.error('Error loading task details:', err);
      }
    };
    
    loadTaskDetails();
  }, [task?.dataItemAssignmentId]);

  if (!task) {
    return (
      <>
        <h1>Không gian gán nhãn</h1>
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Chưa chọn công việc</h3>
          <p>Vui lòng chọn một công việc từ danh sách để bắt đầu gán nhãn</p>
          <button 
            onClick={onBack}
            style={{ marginTop: '16px', padding: '10px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Quay lại danh sách
          </button>
        </div>
      </>
    );
  }

  // Helper function to get image URL
  const getImageUrl = () => {
    if (task.dataContent) {
      // If it's a relative path, convert to full URL
      if (task.dataContent.startsWith('/')) {
        return `https://localhost:7076${task.dataContent}`;
      }
      return task.dataContent;
    }
    return '';
  };

  const parentLabels = labels.filter(l => !l.parent_id && !l.parentId);

  const getChildLabels = (parentId) => labels.filter(l => (l.parent_id || l.parentId) === parentId);

  // Save annotation to backend
  const handleSaveAnnotation = async () => {
    if (!selectedLabel || annotations.length === 0) {
      alert('Vui lòng hoàn thành gán nhãn trước khi lưu');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      // Get label name from selectedLabel ID
      const selectedLabelObj = labels.find(l => l.id === selectedLabel);
      const labelValue = selectedLabelObj?.name || '';

      // Map tool name to annotation type
      const annotationTypeMap = {
        bbox: 'bounding_box',
        polygon: 'polygon',
        point: 'point',
        select: 'select'
      };

      const annotationData = {
        dataItemAssignmentId: task.dataItemAssignmentId,
        dataItemId: task.dataItemId || task.data_item_id || task.id,
        labelValue: labelValue,
        annotationType: annotationTypeMap[activeTool] || activeTool,
        coordinateData: JSON.stringify({ annotations: annotations })
      };

      const response = await createAnnotationAPI(annotationData, token);
      
      // Extract annotation ID from response (try multiple field names)
      let annotationId = null;
      if (response?.data?.annotationId) annotationId = response.data.annotationId;
      else if (response?.data?.id) annotationId = response.data.id;
      else if (response?.data?.annotation_id) annotationId = response.data.annotation_id;
      else if (response?.annotationId) annotationId = response.annotationId;
      else if (response?.id) annotationId = response.id;
      else if (response?.annotation_id) annotationId = response.annotation_id;
      
      if (!annotationId) {
        throw new Error('No annotation ID in response. Response: ' + JSON.stringify(response));
      }
      
      setSavedAnnotationId(annotationId);
      alert('Lưu annotations thành công! Bây giờ bạn có thể gửi duyệt.');
      setSaving(false);
    } catch (err) {
      console.error('Error saving annotation:', err);
      alert('Lỗi khi lưu: ' + err.message);
      setSaving(false);
    }
  };

  // Submit for review
  const handleSubmitForReview = async () => {
    if (!savedAnnotationId) {
      alert('Vui lòng lưu annotations trước khi gửi duyệt');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      await submitForReviewAPI(savedAnnotationId, token);
      alert('Gửi duyệt thành công!');
      setSubmitting(false);
      onBack();
    } catch (err) {
      console.error('Error submitting for review:', err);
      alert('Lỗi: ' + err.message);
      setSubmitting(false);
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

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e) => {
    if (activeTool === 'select') {
      // Check if clicking on an annotation
      const pos = getMousePos(e);
      const clicked = annotations.find(ann => {
        if (ann.type === 'bbox') {
          return pos.x >= ann.x && pos.x <= ann.x + ann.width &&
                 pos.y >= ann.y && pos.y <= ann.y + ann.height;
        }
        if (ann.type === 'point') {
          const distance = Math.sqrt(Math.pow(pos.x - ann.x, 2) + Math.pow(pos.y - ann.y, 2));
          return distance <= 15; // Click within 15px of point
        }
        return false;
      });
      setSelectedAnnotation(clicked?.id || null);
      return;
    }

    if (!selectedLabel) {
      alert('Vui lòng chọn một nhãn trước khi vẽ');
      return;
    }

    const pos = getMousePos(e);

    if (activeTool === 'bbox') {
      setIsDrawing(true);
      setStartPoint(pos);
      setCurrentRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
    } else if (activeTool === 'polygon') {
      setPolygonPoints([...polygonPoints, pos]);
    } else if (activeTool === 'point') {
      const labelInfo = labels.find(l => l.id === selectedLabel);
      const newAnnotation = {
        id: Date.now(),
        type: 'point',
        label_id: selectedLabel,
        label_name: labelInfo?.name,
        x: pos.x,
        y: pos.y
      };
      setAnnotations([...annotations, newAnnotation]);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || activeTool !== 'bbox') return;
    
    const pos = getMousePos(e);
    const newRect = {
      x: Math.min(startPoint.x, pos.x),
      y: Math.min(startPoint.y, pos.y),
      width: Math.abs(pos.x - startPoint.x),
      height: Math.abs(pos.y - startPoint.y)
    };
    setCurrentRect(newRect);
  };

  const handleMouseUp = () => {
    if (!isDrawing || activeTool !== 'bbox') return;
    
    if (currentRect && currentRect.width > 10 && currentRect.height > 10) {
      const labelInfo = labels.find(l => l.id === selectedLabel);
      const newAnnotation = {
        id: Date.now(),
        type: 'bbox',
        label_id: selectedLabel,
        label_name: labelInfo?.name,
        ...currentRect
      };
      setAnnotations([...annotations, newAnnotation]);
    }
    
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentRect(null);
  };

  const handleCompletePolygon = () => {
    if (activeTool === 'polygon' && polygonPoints.length >= 3) {
      const labelInfo = labels.find(l => l.id === selectedLabel);
      const newAnnotation = {
        id: Date.now(),
        type: 'polygon',
        label_id: selectedLabel,
        label_name: labelInfo?.name,
        points: [...polygonPoints]
      };
      setAnnotations([...annotations, newAnnotation]);
      setPolygonPoints([]);
    }
  };

  const handleCancelPolygon = () => {
    setPolygonPoints([]);
  };

  const handleRemoveAnnotation = (id) => {
    setAnnotations(annotations.filter(a => a.id !== id));
    if (selectedAnnotation === id) setSelectedAnnotation(null);
  };

  const handleSubmit = () => {
    if (annotations.length === 0) {
      alert('Vui lòng thêm ít nhất một annotation');
      return;
    }
    alert('Đã gửi annotation thành công!');
    onBack();
  };

  const handleSaveDraft = () => {
    alert('Đã lưu bản nháp');
  };

  const getPolygonPath = (points) => {
    if (points.length < 2) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>Không gian gán nhãn</h1>
        <button 
          onClick={onBack}
          style={{ padding: '8px 16px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          ← Quay lại
        </button>
      </div>

      <div className="annotation-workspace">
        <div className="annotation-canvas-area">
          <div className="canvas-header">
            <h3>{(task.dataContent || task.name || task.dataItem?.content || 'Task').split('/').pop()}</h3>
            <div className="canvas-tools">
              <button 
                className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`}
                onClick={() => setActiveTool('select')}
              >
                🖱️ Chọn
              </button>
              <button 
                className={`tool-btn ${activeTool === 'bbox' ? 'active' : ''}`}
                onClick={() => setActiveTool('bbox')}
              >
                ⬜ Vẽ box
              </button>
              <button 
                className={`tool-btn ${activeTool === 'polygon' ? 'active' : ''}`}
                onClick={() => setActiveTool('polygon')}
              >
                🔷 Đa giác
              </button>
              <button 
                className={`tool-btn ${activeTool === 'point' ? 'active' : ''}`}
                onClick={() => setActiveTool('point')}
              >
                📍 Điểm
              </button>
              {polygonPoints.length > 0 && (
                <>
                  {polygonPoints.length >= 3 && (
                    <button 
                      className="tool-btn"
                      onClick={handleCompletePolygon}
                      style={{ background: '#059669', color: 'white', borderColor: '#059669' }}
                    >
                      ✓ Hoàn thành đa giác
                    </button>
                  )}
                  <button 
                    className="tool-btn"
                    onClick={handleCancelPolygon}
                    style={{ background: '#ef4444', color: 'white', borderColor: '#ef4444' }}
                  >
                    ✕ Hủy đa giác
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Tool instructions */}
          <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: '6px', marginBottom: '12px', fontSize: '13px', color: '#059669' }}>
            {activeTool === 'select' && '🖱️ Click vào annotation để chọn'}
            {activeTool === 'bbox' && '⬜ Kéo chuột để vẽ hình chữ nhật'}
            {activeTool === 'polygon' && '🔷 Click để thêm điểm, khi có ≥3 điểm bấm nút "Hoàn thành"'}
            {activeTool === 'point' && '📍 Click để đánh dấu điểm trên đối tượng'}
          </div>

          <div 
            style={{ position: 'relative', overflow: 'hidden', width: '100%', minHeight: '400px', userSelect: 'none' }}
          >
            {getImageUrl() ? (
              <img 
                ref={canvasRef}
                src={getImageUrl()} 
                alt="Task data" 
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
              />
            ) : (
              <span className="placeholder-image">{getImageIcon(task.dataContent)}</span>
            )}
            
            {/* SVG overlay for annotations */}
            <svg 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: activeTool === 'bbox' || activeTool === 'polygon' || activeTool === 'point' ? 'crosshair' : 'default', userSelect: 'none' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Existing annotations */}
              {annotations.map(ann => (
                ann.type === 'bbox' ? (
                  <g key={ann.id}>
                    <rect
                      x={ann.x}
                      y={ann.y}
                      width={ann.width}
                      height={ann.height}
                      fill="rgba(5, 150, 105, 0.15)"
                      stroke={selectedAnnotation === ann.id ? '#fbbf24' : '#059669'}
                      strokeWidth={selectedAnnotation === ann.id ? 3 : 2}
                    />
                    <rect
                      x={ann.x}
                      y={ann.y - 20}
                      width={ann.label_name.length * 8 + 12}
                      height={18}
                      fill="#059669"
                      rx={4}
                    />
                    <text
                      x={ann.x + 6}
                      y={ann.y - 6}
                      fill="white"
                      fontSize="11"
                    >
                      {ann.label_name}
                    </text>
                  </g>
                ) : ann.type === 'polygon' ? (
                  <g key={ann.id}>
                    <path
                      d={getPolygonPath(ann.points)}
                      fill="rgba(139, 92, 246, 0.15)"
                      stroke={selectedAnnotation === ann.id ? '#fbbf24' : '#8b5cf6'}
                      strokeWidth={selectedAnnotation === ann.id ? 3 : 2}
                    />
                    {ann.points[0] && (
                      <>
                        <rect
                          x={ann.points[0].x}
                          y={ann.points[0].y - 20}
                          width={ann.label_name.length * 8 + 12}
                          height={18}
                          fill="#8b5cf6"
                          rx={4}
                        />
                        <text
                          x={ann.points[0].x + 6}
                          y={ann.points[0].y - 6}
                          fill="white"
                          fontSize="11"
                        >
                          {ann.label_name}
                        </text>
                      </>
                    )}
                    {ann.points.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={4} fill="#8b5cf6" />
                    ))}
                  </g>
                ) : ann.type === 'point' ? (
                  <g key={ann.id}>
                    <circle
                      cx={ann.x}
                      cy={ann.y}
                      r={5}
                      fill="rgba(5, 150, 105, 0.3)"
                      stroke="#059669"
                      strokeWidth={2}
                    />
                    <text
                      x={ann.x + 10}
                      y={ann.y - 10}
                      fill="#059669"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {ann.label_name}
                    </text>
                  </g>
                ) : null
              ))}

              {/* Current drawing rect */}
              {currentRect && (
                <rect
                  x={currentRect.x}
                  y={currentRect.y}
                  width={currentRect.width}
                  height={currentRect.height}
                  fill="rgba(5, 150, 105, 0.2)"
                  stroke="#059669"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />
              )}

              {/* Current polygon points */}
              {polygonPoints.length > 0 && (
                <g>
                  <path
                    d={polygonPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="5,5"
                  />
                  {polygonPoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={5} fill="#8b5cf6" stroke="white" strokeWidth={2} />
                  ))}
                </g>
              )}
            </svg>
          </div>
        </div>

        <div className="annotation-panel">
          <div className="panel-section">
            <h4>📋 Hướng dẫn gán nhãn</h4>
            <div className="guidelines-content">
              {guidelines?.content || 'Chưa có hướng dẫn'}
            </div>
          </div>

          <div className="panel-section">
            <h4>🏷️ Chọn nhãn {selectedLabel && '✓'}</h4>
            {labels.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>Chưa có nhãn nào</p>
            ) : (
              <div className="label-tree">
                {parentLabels.map(parent => {
                  const hasSelectedChild = getChildLabels(parent.id).some(child => selectedLabel === child.id);
                  return (
                    <div key={parent.id}>
                      <div 
                        className={`label-item ${selectedLabel === parent.id || hasSelectedChild ? 'selected' : ''}`}
                        onClick={() => setSelectedLabel(parent.id)}
                      >
                        {parent.name}
                      </div>
                      {getChildLabels(parent.id).map(child => (
                        <div 
                          key={child.id}
                          className={`label-item child ${selectedLabel === child.id ? 'selected' : ''}`}
                          onClick={() => setSelectedLabel(child.id)}
                        >
                          {child.name}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="panel-section">
            <h4>📝 Annotations ({annotations.length})</h4>
            <div className="annotation-list">
              {annotations.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>
                  Chưa có annotation nào
                </p>
              ) : (
                annotations.map(ann => (
                  <div 
                    key={ann.id} 
                    className="annotation-item"
                    style={{ 
                      background: selectedAnnotation === ann.id ? '#fef3c7' : '#f9fafb',
                      border: selectedAnnotation === ann.id ? '1px solid #fbbf24' : 'none'
                    }}
                    onClick={() => setSelectedAnnotation(ann.id)}
                  >
                    <span>
                      {ann.type === 'bbox' ? '⬜' : ann.type === 'polygon' ? '🔷' : '📍'} {ann.label_name}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); handleRemoveAnnotation(ann.id); }}>Xóa</button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="submit-section">
            {!savedAnnotationId ? (
              <button className="submit-btn primary" onClick={handleSaveAnnotation} disabled={saving}>
                {saving ? 'Đang lưu...' : '💾 Lưu'}
              </button>
            ) : (
              <>
                <button className="submit-btn secondary" onClick={() => setSavedAnnotationId(null)} disabled={submitting}>
                  ← Quay lại chỉnh sửa
                </button>
                <button className="submit-btn primary" onClick={handleSubmitForReview} disabled={submitting}>
                  {submitting ? 'Đang gửi...' : '✅ Gửi duyệt'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default AnnotationWorkspace;
