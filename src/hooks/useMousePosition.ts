import { useState, useEffect, useCallback, useRef } from 'react';

export const useMousePosition = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const frameRef = useRef<number>();

  const updatePosition = useCallback((e: MouseEvent) => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    
    frameRef.current = requestAnimationFrame(() => {
      setPosition({ x: e.clientX, y: e.clientY });
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', updatePosition);

    return () => {
      window.removeEventListener('mousemove', updatePosition);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [updatePosition]);

  return position;
}; 