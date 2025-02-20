import React, { useState, useEffect, useRef } from 'react';
import './AnimatedCounter.css';

const AnimatedCounter = ({ end, duration = 2000, start = 0 }) => {
  const [count, setCount] = useState(start);
  const countRef = useRef(start);
  const startTimeRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const startValue = countRef.current;
    const endValue = end;
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const currentValue = Math.round(
        startValue + (endValue - startValue) * easeOutQuart
      );
      
      setCount(currentValue);
      countRef.current = currentValue;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      startTimeRef.current = null;
    };
  }, [end, duration]);

  return (
    <span className="animated-number">
      {count.toLocaleString()}
    </span>
  );
};

export default AnimatedCounter; 