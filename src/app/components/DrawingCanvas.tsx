'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Paper } from '@mui/material';
import { DrawingData } from '@/lib/games/PictureGame';

interface DrawingCanvasProps {
  isDrawer: boolean;
  onDrawingUpdate: (drawing: DrawingData) => void;
  currentDrawing?: DrawingData;
}

export default function DrawingCanvas({ isDrawer, onDrawingUpdate, currentDrawing }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<Array<{ x: number; y: number }>>([]);
  const [lines, setLines] = useState<DrawingData['lines']>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set actual canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set drawing styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw all lines
    const allLines = [...lines];
    if (currentLine.length > 1) {
      allLines.push({ points: currentLine, color: '#000000', width: 3 });
    }

    allLines.forEach(line => {
      ctx.beginPath();
      line.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    });
  }, [lines, currentLine]);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    
    setIsDrawing(true);
    const point = getCanvasPoint(e);
    setCurrentLine([point]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer) return;

    const point = getCanvasPoint(e);
    setCurrentLine(prev => [...prev, point]);
  };

  const handleMouseUp = () => {
    if (!isDrawer) return;
    
    setIsDrawing(false);
    if (currentLine.length > 0) {
      const newLine = {
        points: currentLine,
        color: '#000000',
        width: 3
      };
      
      const newLines = [...lines, newLine];
      setLines(newLines);
      onDrawingUpdate({ lines: newLines });
    }
    setCurrentLine([]);
  };

  return (
    <Paper 
      elevation={3}
      sx={{ 
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper'
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          paddingTop: '75%', // 4:3 aspect ratio
        }}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: '1px solid #ccc',
            borderRadius: '8px',
            cursor: isDrawer ? 'crosshair' : 'default'
          }}
        />
      </Box>
    </Paper>
  );
} 