import { useState, useEffect, useRef } from 'react';

/**
 * Hook for detecting when an element enters the viewport
 * Used for scroll-triggered animations
 * 
 * @param {Object} options - IntersectionObserver options
 * @param {number} options.threshold - Visibility threshold (0-1)
 * @param {string} options.rootMargin - Margin around the root
 * @param {boolean} options.triggerOnce - Only trigger once
 * @returns {[React.RefObject, boolean]} - Ref to attach to element and inView state
 */
export function useInView({
  threshold = 0.1,
  rootMargin = '0px 0px -50px 0px',
  triggerOnce = true
} = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, inView];
}

/**
 * Hook for staggered animations on multiple children
 * 
 * @param {number} itemCount - Number of items to animate
 * @param {Object} options - Animation options
 * @returns {Object} - containerRef and getItemProps function
 */
export function useStaggeredAnimation(itemCount, {
  baseDelay = 50,
  threshold = 0.1,
  rootMargin = '0px 0px -30px 0px'
} = {}) {
  const [containerRef, inView] = useInView({ threshold, rootMargin });

  const getItemProps = (index) => ({
    style: {
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(15px)',
      transition: `opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * baseDelay}ms, 
                   transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * baseDelay}ms`
    }
  });

  return { containerRef, inView, getItemProps };
}

export default useInView;
