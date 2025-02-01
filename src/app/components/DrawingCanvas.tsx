'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Paper, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { DrawingData } from '@/lib/games/PictureGame';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import CircleIcon from '@mui/icons-material/Circle';

interface DrawingCanvasProps {
  isDrawer: boolean;
  onDrawingUpdate: (drawing: DrawingData) => void;
  currentDrawing?: DrawingData;
}

const COLORS = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080'];
const THICKNESSES = [2, 5, 8];

export default function DrawingCanvas({ isDrawer, onDrawingUpdate, currentDrawing }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<Array<{ x: number; y: number }>>([]);
  const [lines, setLines] = useState<DrawingData['lines']>([]);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentThickness, setCurrentThickness] = useState(2);

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

    // Draw all lines
    const allLines = [...lines];
    if (currentLine.length > 1) {
      allLines.push({ points: currentLine, color: currentColor, width: currentThickness });
    }

    allLines.forEach(line => {
      ctx.beginPath();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      line.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    });
  }, [lines, currentLine, currentColor, currentThickness]);

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
        color: currentColor,
        width: currentThickness
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
      {isDrawer && (
        <Box sx={{ 
          mb: 2,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <ToggleButtonGroup
            value={currentColor}
            exclusive
            onChange={(e, value) => value && setCurrentColor(value)}
            aria-label="color selection"
            size="small"
          >
            {COLORS.map((color) => (
              <ToggleButton 
                key={color} 
                value={color}
                sx={{
                  width: 40,
                  height: 40,
                  p: 0.5,
                  border: '2px solid',
                  borderColor: currentColor === color ? 'primary.main' : 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                  }
                }}
              >
                <CircleIcon sx={{ color }} />
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <ToggleButtonGroup
            value={currentThickness}
            exclusive
            onChange={(e, value) => value && setCurrentThickness(value)}
            aria-label="line thickness"
            size="small"
          >
            {THICKNESSES.map((thickness) => (
              <Tooltip key={thickness} title={`${thickness}px`}>
                <ToggleButton 
                  value={thickness}
                  sx={{
                    width: 40,
                    height: 40,
                    border: '2px solid',
                    borderColor: currentThickness === thickness ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 20,
                      height: thickness,
                      bgcolor: 'text.primary',
                      borderRadius: 1
                    }} 
                  />
                </ToggleButton>
              </Tooltip>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}

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
            cursor: isDrawer ? 'crosshair' : 'default',
            backgroundColor: '#ffffff'
          }}
        />
      </Box>
    </Paper>
  );
} 