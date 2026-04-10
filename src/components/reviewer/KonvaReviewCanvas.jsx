import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Line, Circle, Text, Group, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';



function KonvaReviewCanvas({ 
  imageUrl, 
  annotations,
  containerHeight = 600
}) {
  const stageRef = useRef(null);
  const [image] = useImage(imageUrl);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);

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

  const renderBBoxAnnotation = (ann, index) => {
    return (
      <Group key={`bbox-${index}`}>
        <Rect
          x={ann.x * scale}
          y={ann.y * scale}
          width={ann.width * scale}
          height={ann.height * scale}
          fill="rgba(5, 150, 105, 0.15)"
          stroke="#059669"
          strokeWidth={2}
          pointerEvents="none"
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
      </Group>
    );
  };

  const renderPolygonAnnotation = (ann, index) => {
    const points = ann.points.flatMap(p => [p.x * scale, p.y * scale]);

    return (
      <Group key={`polygon-${index}`}>
        <Line
          points={points}
          fill="rgba(139, 92, 246, 0.15)"
          stroke="#8b5cf6"
          strokeWidth={2}
          closed
          pointerEvents="none"
        />

        {/* Vertex circles */}
        {ann.points.map((p, i) => (
          <Circle
            key={`vertex-${i}`}
            x={p.x * scale}
            y={p.y * scale}
            radius={4 * scale}
            fill="#8b5cf6"
            pointerEvents="none"
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

  const renderPointAnnotation = (ann, index) => {
    return (
      <Group key={`point-${index}`}>
        <Circle
          x={ann.x * scale}
          y={ann.y * scale}
          radius={5 * scale}
          fill="rgba(5, 150, 105, 0.3)"
          stroke="#059669"
          strokeWidth={2}
          pointerEvents="none"
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

  const parsedAnnotations = (() => {
    if (!annotations) return [];
    
    if (typeof annotations === 'string') {
      try {
        const parsed = JSON.parse(annotations);
        return Array.isArray(parsed) ? parsed : (parsed.annotations || []);
      } catch {
        return [];
      }
    }
    
    if (Array.isArray(annotations)) {
      return annotations;
    }
    
    return annotations.annotations || [];
  })();

  return (
    <div style={{ position: 'relative', width: '100%', height: containerHeight, overflow: 'hidden' }}>
      <Stage
        ref={stageRef}
        width={800}
        height={containerHeight}
        style={{ display: 'block' }}
      >
        <Layer>
          {/* Background image */}
          {image && (
            <KonvaImage
              image={image}
              width={imageSize.width * scale}
              height={imageSize.height * scale}
              listening={false}
            />
          )}

          {/* Rendered annotations */}
          {parsedAnnotations.map((ann, index) => {
            if (ann.type === 'bbox' || ann.type === 'bounding_box') {
              return renderBBoxAnnotation(ann, index);
            } else if (ann.type === 'polygon') {
              return renderPolygonAnnotation(ann, index);
            } else if (ann.type === 'point') {
              return renderPointAnnotation(ann, index);
            }
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
}

export default KonvaReviewCanvas;
