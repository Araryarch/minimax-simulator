import { useState, useEffect } from 'react';

/**
 * A hook to animate a number from its current value to a new value.
 * 
 * @param value The target value to animate to
 * @param duration Duration of the animation in ms
 * @param shouldAnimate Whether to enable animation
 * @returns An object containing the current displayValue
 */
export const useAnimatedNumber = (
  value: number | undefined | null,
  duration: number = 200,
  shouldAnimate: boolean = true
) => {
  const [displayValue, setDisplayValue] = useState<number | undefined | null>(value);

  useEffect(() => {
    // If shouldn't animate, or values are non-numeric/infinite, update immediately
    if (
        !shouldAnimate || 
        value === undefined || 
        value === null || 
        displayValue === undefined || 
        displayValue === null ||
        !Number.isFinite(value) || 
        !Number.isFinite(displayValue)
    ) {
      setDisplayValue(value);
      return;
    }

    const startValue = displayValue;
    const endValue = value;
    
    if (startValue === endValue) return;

    const startTime = performance.now();
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const current = startValue + (endValue - startValue) * easeOut;
      
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  // We strictly want to run this effect when value changes. 
  // We include displayValue in deps roughly, but logically we are reacting to 'value' change.
  // Ideally, we keep track of 'prevValue' to know where to animate from, 
  // but using current state 'displayValue' as start point works for continuous updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, shouldAnimate]);

  return { displayValue };
};
