import React, { useRef, useEffect, useState } from 'react';
import { Box } from '@mui/material';

const SpacetimeGrid = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      setDimensions({ width, height });
    };

    resize();
    window.addEventListener('resize', resize);

    // Grid configuration
    const gridSpacing = 40;
    const distortionRadius = 250;
    const distortionStrength = 20;

    // Track mouse position
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Calculate distorted point based on mouse position
    const distortPoint = (x, y, mouseX, mouseY) => {
      const dx = x - mouseX;
      const dy = y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < distortionRadius && distance > 0) {
        const force = (1 - distance / distortionRadius) * distortionStrength;
        const angle = Math.atan2(dy, dx);
        
        // Pull points toward the mouse (gravity effect)
        const pullX = -Math.cos(angle) * force;
        const pullY = -Math.sin(angle) * force;
        
        return {
          x: x + pullX,
          y: y + pullY,
          intensity: (1 - distance / distortionRadius)
        };
      }
      
      return { x, y, intensity: 0 };
    };

    // Draw the grid
    const drawGrid = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;

      ctx.lineWidth = 0.5;

      // Draw vertical lines
      for (let x = 0; x <= width + gridSpacing; x += gridSpacing) {
        ctx.beginPath();
        
        for (let y = 0; y <= height; y += 5) {
          const distorted = distortPoint(x, y, mouseX, mouseY);
          
          if (y === 0) {
            ctx.moveTo(distorted.x, distorted.y);
          } else {
            ctx.lineTo(distorted.x, distorted.y);
          }
        }
        
        // Calculate line opacity based on distance to mouse
        const distToMouse = Math.abs(x - mouseX);
        const opacity = Math.max(0.1, Math.min(0.4, 0.4 - (distToMouse / width) * 0.3));
        
        // Increase opacity near mouse
        const nearMouse = Math.abs(x - mouseX) < distortionRadius;
        ctx.strokeStyle = `rgba(255, 255, 255, ${nearMouse ? 0.6 : opacity})`;
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let y = 0; y <= height + gridSpacing; y += gridSpacing) {
        ctx.beginPath();
        
        for (let x = 0; x <= width; x += 5) {
          const distorted = distortPoint(x, y, mouseX, mouseY);
          
          if (x === 0) {
            ctx.moveTo(distorted.x, distorted.y);
          } else {
            ctx.lineTo(distorted.x, distorted.y);
          }
        }
        
        // Calculate line opacity based on distance to mouse
        const distToMouse = Math.abs(y - mouseY);
        const opacity = Math.max(0.1, Math.min(0.4, 0.4 - (distToMouse / height) * 0.3));
        
        // Increase opacity near mouse
        const nearMouse = Math.abs(y - mouseY) < distortionRadius;
        ctx.strokeStyle = `rgba(255, 255, 255, ${nearMouse ? 0.6 : opacity})`;
        ctx.stroke();
      }

      // Draw subtle glow at cursor position
      if (mouseX > 0 && mouseY > 0) {
        const gradient = ctx.createRadialGradient(
          mouseX, mouseY, 0,
          mouseX, mouseY, distortionRadius
        );
        gradient.addColorStop(0, 'rgba(100, 120, 255, 0.15)');
        gradient.addColorStop(0.5, 'rgba(100, 120, 255, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, distortionRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(drawGrid);
    };

    drawGrid();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <Box
      ref={canvasRef}
      component="canvas"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
};

export default SpacetimeGrid;
