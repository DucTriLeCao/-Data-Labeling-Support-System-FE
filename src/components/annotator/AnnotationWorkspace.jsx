import { useState, useRef, useEffect } from 'react';
import { createAnnotationAPI, submitForReviewAPI, getTaskDetailAPI, getAnnotationFeedbackAPI } from '../../api';
import KonvaDrawingCanvas from './KonvaDrawingCanvas';

function AnnotationWorkspace({ task, userId, onBack, retryAnnotationId }) {
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [activeTool, setActiveTool] = useState('bbox');
  const [labels, setLabels] = useState([]);
  const [guidelines, setGuidelines] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [savedAnnotationId, setSavedAnnotationId] = useState(null);

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
              if (parsedAnnotations.annotations) {
                parsedAnnotations = parsedAnnotations.annotations;
              }
            } catch (e) {
              parsedAnnotations = [];
            }
            
            setAnnotations(parsedAnnotations);
            
            if (data.labelValue) {
              const label = labels.find(l => l.name === data.labelValue);
              if (label) {
                setSelectedLabel(label.id);
              }
            }
          }
        } catch (err) {
          console.error('Error loading existing annotations:', err);}
      }
    };
    
    loadExistingAnnotations();
  }, [retryAnnotationId, labels]);

  useEffect(() => {
    const loadTaskDetails = async () => {
      if (!task || !task.dataItemAssignmentId) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');
        
        const response = await getTaskDetailAPI(task.dataItemAssignmentId, token);
        const taskData = response.data || response;
        
        if (taskData.availableLabels) {
          const formattedLabels = taskData.availableLabels.map(label => ({
            id: label.labelId,
            name: label.labelName,
            parent_id: label.parentLabelId,
            parentId: label.parentLabelId
          }));
          setLabels(formattedLabels);
        }

        if (taskData.projectDescription) {
          setGuidelines({ content: taskData.projectDescription });
        } else if (taskData.description) {
          setGuidelines({ content: taskData.description });
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

  const getImageUrl = () => {
    if (task.dataContent) {
      if (task.dataContent.startsWith('/')) {
        return `https://localhost:7076${task.dataContent}`;
      }
      return task.dataContent;
    }
    return '';
  };

  const handleSubmitForReview = async () => {
    if (annotations.length === 0) {
      alert('Bạn chưa vẽ bất kỳ annotation nào. Vui lòng vẽ ít nhất một annotation trước khi gửi duyệt.');
      return;
    }
    
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

  const parentLabels = labels.filter(l => !l.parent_id && !l.parentId);

  const getChildLabels = (parentId) => labels.filter(l => (l.parent_id || l.parentId) === parentId);

  const handleSaveAnnotation = async () => {
    if (!selectedLabel) {
      alert('Vui lòng chọn một nhãn');
      return;
    }
    
    if (annotations.length === 0) {
      alert('Bạn chưa vẽ bất kỳ annotation nào. Vui lòng vẽ ít nhất một annotation trước khi lưu.');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      const selectedLabelObj = labels.find(l => l.id === selectedLabel);
      const labelValue = selectedLabelObj?.name || '';

      const annotationTypeMap = {
        bbox: 'bounding_box',
        polygon: 'polygon',
        point: 'point'
      };

      const annotationData = {
        dataItemAssignmentId: task.dataItemAssignmentId,
        dataItemId: task.dataItemId || task.data_item_id || task.id,
        labelValue: labelValue,
        annotationType: annotationTypeMap[activeTool] || activeTool,
        coordinateData: JSON.stringify({ annotations: annotations })
      };

      const response = await createAnnotationAPI(annotationData, token);
      
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
            </div>
          </div>
          
          {/* Tool instructions */}
          <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: '6px', marginBottom: '12px', fontSize: '13px', color: '#059669' }}>
            {activeTool === 'bbox' && '⬜ Kéo chuột để vẽ hình chữ nhật'}
            {activeTool === 'polygon' && '🔷 Click để thêm điểm, khi có ≥3 điểm bấm nút "Hoàn thành"'}
            {activeTool === 'point' && '📍 Click để đánh dấu điểm trên đối tượng'}
          </div>

          {/* Konva Canvas Component */}
          <KonvaDrawingCanvas
            imageUrl={getImageUrl()}
            annotations={annotations}
            onAnnotationsChange={setAnnotations}
            activeTool={activeTool}
            selectedLabel={selectedLabel}
            labels={labels}
            containerHeight={600}
          />
        </div>

        <div className="annotation-panel">
          <div className="panel-section">
            <h4>Mô tả dự án</h4>
            <div className="guidelines-content">
              {guidelines?.content || 'Chưa có mô tả dự án'}
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
                      background: '#f9fafb'
                    }}
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
