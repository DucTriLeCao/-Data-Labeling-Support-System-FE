import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Circle, Text, Group, Transformer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';


function KonvaDrawingCanvas({ 
  imageUrl, 
  annotations, 
  onAnnotationsChange, 
  activeTool, 
  selectedLabel, 
  labels,
  containerHeight = 600
}) {
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const transformerRef = useRef(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentShape, setCurrentShape] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [scale, setScale] = useState(1);
  
  const [image] = useImage(imageUrl);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (image) {
      setImageSize({ width: image.width, height: image.height });
    }
  }, [image]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !image) return;

    const container = stage.container();
    const containerWidth = container.offsetWidth;
    
    let stageWidth = containerWidth;
    let stageHeight = containerHeight;
    
    const imageAspect = image.width / image.height;
    const containerAspect = containerWidth / containerHeight;
    
    if (imageAspect > containerAspect) {
      const scaleFactor = containerWidth / image.width;
      setScale(scaleFactor);
      stageHeight = image.height * scaleFactor;
    } else {
      const scaleFactor = containerHeight / image.height;
      setScale(scaleFactor);
      stageWidth = image.width * scaleFactor;
    }
    
    stage.width(stageWidth);
    stage.height(stageHeight);
  }, [image, containerHeight]);

  const getMousePos = (e) => {
    const stage = stageRef.current;
    if (!stage) return null;
    
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return null;

    return {
      x: Math.round(pointerPos.x / scale),
      y: Math.round(pointerPos.y / scale)
    };
  };

  const handleStageMouseDown = (e) => {
    if (!selectedLabel) {
      alert('Vui lòng chọn một nhãn trước khi vẽ');
      return;
    }

    const pos = getMousePos(e);
    if (!pos) return;

    if (activeTool === 'bbox') {
      setIsDrawing(true);
      setStartPos(pos);
      setCurrentShape({ x: pos.x, y: pos.y, width: 0, height: 0 });
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
      onAnnotationsChange([...annotations, newAnnotation]);
    }
  };

  const handleStageMouseMove = (e) => {
    if (!isDrawing || activeTool !== 'bbox') return;

    const pos = getMousePos(e);
    if (!pos || !startPos) return;

    const newShape = {
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      width: Math.abs(pos.x - startPos.x),
      height: Math.abs(pos.y - startPos.y)
    };
    setCurrentShape(newShape);
  };

  const handleStageMouseUp = () => {
    if (!isDrawing || activeTool !== 'bbox') return;

    if (currentShape && currentShape.width > 10 && currentShape.height > 10) {
      const labelInfo = labels.find(l => l.id === selectedLabel);
      const newAnnotation = {
        id: Date.now(),
        type: 'bbox',
        label_id: selectedLabel,
        label_name: labelInfo?.name,
        ...currentShape
      };
      onAnnotationsChange([...annotations, newAnnotation]);
    }

    setIsDrawing(false);
    setStartPos(null);
    setCurrentShape(null);
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
      onAnnotationsChange([...annotations, newAnnotation]);
      setPolygonPoints([]);
    }
  };

  const handleCancelPolygon = () => {
    setPolygonPoints([]);
  };

  const handleShapeClick = (annoId) => {
    setSelectedAnnotationId(annoId);
  };

  const handleShapeTransform = (annoId, newProps) => {
    const updatedAnnotations = annotations.map(ann => 
      ann.id === annoId ? { ...ann, ...newProps } : ann
    );
    onAnnotationsChange(updatedAnnotations);
  };

  const handleRemoveAnnotation = (id) => {
    onAnnotationsChange(annotations.filter(a => a.id !== id));
    setSelectedAnnotationId(null);
  };

  const renderBBoxAnnotation = (ann) => {
    return (
      <Group key={ann.id}>
        <Rect
          x={ann.x * scale}
          y={ann.y * scale}
          width={ann.width * scale}
          height={ann.height * scale}
          fill="rgba(5, 150, 105, 0.15)"
          stroke={selectedAnnotationId === ann.id ? '#fbbf24' : '#059669'}
          strokeWidth={selectedAnnotationId === ann.id ? 3 : 2}
          onClick={() => handleShapeClick(ann.id)}
          onDragMove={(e) => {
            handleShapeTransform(ann.id, {
              x: Math.round(e.target.x() / scale),
              y: Math.round(e.target.y() / scale)
            });
          }}
          draggable
          onTransformEnd={(e) => {
            const node = e.target;
            handleShapeTransform(ann.id, {
              x: Math.round(node.x() / scale),
              y: Math.round(node.y() / scale),
              width: Math.round(node.width() * node.scaleX() / scale),
              height: Math.round(node.height() * node.scaleY() / scale)
            });
            node.scaleX(1);
            node.scaleY(1);
          }}
        />

        {/* Label background */}
        <Rect
          x={ann.x * scale}
          y={(ann.y - 20) * scale}
          width={(ann.label_name?.length || 5) * 8 * scale + 12}
          height={18 * scale}
          fill="#059669"
          rx={4}
          pointerEvents="none"
        />

        {/* Label text */}
        <Text
          x={ann.x * scale + 6}
          y={(ann.y - 18) * scale}
          text={ann.label_name}
          fill="white"
          fontSize={11 * scale}
          pointerEvents="none"
        />

        {/* Transformer for resizing */}
        {selectedAnnotationId === ann.id && (
          <Transformer ref={transformerRef} />
        )}
      </Group>
    );
  };

  const renderPolygonAnnotation = (ann) => {
    const points = ann.points.flatMap(p => [p.x * scale, p.y * scale]);

    return (
      <Group key={ann.id}>
        <Line
          points={points}
          fill="rgba(139, 92, 246, 0.15)"
          stroke={selectedAnnotationId === ann.id ? '#fbbf24' : '#8b5cf6'}
          strokeWidth={selectedAnnotationId === ann.id ? 3 : 2}
          closed
          onClick={() => handleShapeClick(ann.id)}
          draggable
          onDragMove={(e) => {
            const dx = Math.round(e.evt.movementX / scale);
            const dy = Math.round(e.evt.movementY / scale);
            const newPoints = ann.points.map(p => ({
              x: p.x + dx,
              y: p.y + dy
            }));
            handleShapeTransform(ann.id, { points: newPoints });
          }}
        />

        {/* Anchor points for vertex editing */}
        {ann.points.map((p, i) => (
          <Circle
            key={`anchor-${i}`}
            x={p.x * scale}
            y={p.y * scale}
            radius={5 * scale}
            fill="#8b5cf6"
            stroke="white"
            strokeWidth={2}
            draggable
            onDragMove={(e) => {
              const newPoints = [...ann.points];
              newPoints[i] = {
                x: Math.round(e.target.x() / scale),
                y: Math.round(e.target.y() / scale)
              };
              handleShapeTransform(ann.id, { points: newPoints });
            }}
            onMouseEnter={() => {
              const stage = stageRef.current;
              if (stage) stage.container().style.cursor = 'pointer';
            }}
            onMouseLeave={() => {
              const stage = stageRef.current;
              if (stage) stage.container().style.cursor = 'crosshair';
            }}
          />
        ))}

        {/* Label at first point */}
        {ann.points.length > 0 && (
          <>
            <Rect
              x={ann.points[0].x * scale}
              y={(ann.points[0].y - 20) * scale}
              width={(ann.label_name?.length || 5) * 8 * scale + 12}
              height={18 * scale}
              fill="#8b5cf6"
              rx={4}
              pointerEvents="none"
            />
            <Text
              x={ann.points[0].x * scale + 6}
              y={(ann.points[0].y - 18) * scale}
              text={ann.label_name}
              fill="white"
              fontSize={11 * scale}
              pointerEvents="none"
            />
          </>
        )}
      </Group>
    );
  };

  const renderPointAnnotation = (ann) => {
    return (
      <Group key={ann.id}>
        <Circle
          x={ann.x * scale}
          y={ann.y * scale}
          radius={5 * scale}
          fill="rgba(5, 150, 105, 0.3)"
          stroke={selectedAnnotationId === ann.id ? '#fbbf24' : '#059669'}
          strokeWidth={selectedAnnotationId === ann.id ? 3 : 2}
          onClick={() => handleShapeClick(ann.id)}
          draggable
          onDragMove={(e) => {
            handleShapeTransform(ann.id, {
              x: Math.round(e.target.x() / scale),
              y: Math.round(e.target.y() / scale)
            });
          }}
        />

        {/* Label text */}
        <Text
          x={ann.x * scale + 10}
          y={(ann.y - 10) * scale}
          text={ann.label_name}
          fill="#059669"
          fontSize={12 * scale}
          fontStyle="bold"
          pointerEvents="none"
        />
      </Group>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: containerHeight, overflow: 'hidden' }}>
      <Stage
        ref={stageRef}
        width={800}
        height={containerHeight}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onMouseLeave={handleStageMouseUp}
        style={{ display: 'block', cursor: activeTool === 'polygon' ? 'crosshair' : activeTool === 'point' ? 'crosshair' : 'default' }}
      >
        <Layer ref={layerRef}>
          {/* Background image */}
          {image && (
            <KonvaImage
              image={image}
              width={imageSize.width * scale}
              height={imageSize.height * scale}
              listening={false}
            />
          )}

          {/* Current drawing shape (preview) */}
          {currentShape && activeTool === 'bbox' && (
            <Rect
              x={currentShape.x * scale}
              y={currentShape.y * scale}
              width={currentShape.width * scale}
              height={currentShape.height * scale}
              fill="rgba(5, 150, 105, 0.2)"
              stroke="#059669"
              strokeWidth={2}
              dash={[5, 5]}
            />
          )}

          {/* Current polygon points (preview) */}
          {polygonPoints.length > 0 && activeTool === 'polygon' && (
            <Group>
              <Line
                points={polygonPoints.flatMap(p => [p.x * scale, p.y * scale])}
                stroke="#8b5cf6"
                strokeWidth={2}
                dash={[5, 5]}
                pointerEvents="none"
              />
              {polygonPoints.map((p, i) => (
                <Circle
                  key={i}
                  x={p.x * scale}
                  y={p.y * scale}
                  radius={5 * scale}
                  fill="#8b5cf6"
                  stroke="white"
                  strokeWidth={2}
                  pointerEvents="none"
                />
              ))}
            </Group>
          )}

          {/* Rendered annotations */}
          {annotations.map(ann => {
            if (ann.type === 'bbox') {
              return renderBBoxAnnotation(ann);
            } else if (ann.type === 'polygon') {
              return renderPolygonAnnotation(ann);
            } else if (ann.type === 'point') {
              return renderPointAnnotation(ann);
            }
            return null;
          })}
        </Layer>
      </Stage>

      {/* Polygon controls */}
      {polygonPoints.length > 0 && activeTool === 'polygon' && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', gap: '8px' }}>
          {polygonPoints.length >= 3 && (
            <button
              onClick={handleCompletePolygon}
              style={{
                padding: '6px 12px',
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ✓ Hoàn thành đa giác
            </button>
          )}
          <button
            onClick={handleCancelPolygon}
            style={{
              padding: '6px 12px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ✕ Hủy
          </button>
        </div>
      )}
    </div>
  );
}

export default KonvaDrawingCanvas;
