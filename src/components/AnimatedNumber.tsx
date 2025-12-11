"use client";

import { useEffect, useState, useRef } from 'react';
import { sfx } from '@/lib/utils/sfx';

interface AnimatedNumberProps {
  value: number | undefined;
  duration?: number;
  prefix?: string;
  className?: string;
  playSound?: boolean;
}

export function AnimatedNumber({ value, duration = 300, prefix = '', className = '', playSound = true }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<number | undefined>(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValue = useRef<number | undefined>(value);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (value === prevValue.current) return;
    if (value === undefined || prevValue.current === undefined) {
      setDisplayValue(value);
      prevValue.current = value;
      return;
    }

    // Handle infinity values
    if (!isFinite(value) || !isFinite(prevValue.current)) {
      setDisplayValue(value);
      prevValue.current = value;
      if (playSound) sfx.playValueChange();
      return;
    }

    setIsAnimating(true);
    if (playSound) sfx.playValueChange();
    
    const startValue = prevValue.current;
    const endValue = value;
    const startTime = Date.now();
    const diff = endValue - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const current = Math.round(startValue + diff * eased);
      
      // Play tick sound every 50ms during animation
      if (playSound && Date.now() - lastTickRef.current > 50) {
        sfx.playTick();
        lastTickRef.current = Date.now();
      }
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
        prevValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
    prevValue.current = value;
  }, [value, duration, playSound]);

  const formatValue = (val: number | undefined): string => {
    if (val === undefined) return '?';
    if (val === Infinity) return '∞';
    if (val === -Infinity) return '-∞';
    return val.toString();
  };

  return (
    <span className={`${className} ${isAnimating ? 'scale-110 text-primary font-bold' : ''} transition-transform duration-150`}>
      {prefix}{formatValue(displayValue)}
    </span>
  );
}

// Simpler version for SVG text elements - with sound
export function useAnimatedNumber(
  value: number | undefined, 
  duration: number = 300,
  playSound: boolean = false
): {
  displayValue: number | undefined;
  isAnimating: boolean;
} {
  const [displayValue, setDisplayValue] = useState<number | undefined>(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValue = useRef<number | undefined>(value);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (value === prevValue.current) return;
    if (value === undefined || prevValue.current === undefined) {
      setDisplayValue(value);
      prevValue.current = value;
      return;
    }

    // Handle infinity values
    if (!isFinite(value) || !isFinite(prevValue.current)) {
      setDisplayValue(value);
      prevValue.current = value;
      if (playSound) sfx.playValueChange();
      return;
    }

    setIsAnimating(true);
    if (playSound) sfx.playValueChange();
    
    const startValue = prevValue.current;
    const endValue = value;
    const startTime = Date.now();
    const diff = endValue - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const current = Math.round(startValue + diff * eased);
      
      // Play tick sound every 50ms during animation
      if (playSound && Date.now() - lastTickRef.current > 50) {
        sfx.playTick();
        lastTickRef.current = Date.now();
      }
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
        prevValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
    prevValue.current = value;
  }, [value, duration, playSound]);

  return { displayValue, isAnimating };
}
