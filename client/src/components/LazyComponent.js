import React, { Suspense } from 'react';
import LoadingSpinner, { LoadingScreen } from './LoadingSpinner';

// Lazy loading wrapper with error boundary
export const LazyComponent = ({ 
  component: Component, 
  fallback = <LoadingScreen message="Loading component..." />,
  errorFallback = <div className="text-center py-8 text-red-400">Failed to load component</div>
}) => {
  return (
    <Suspense fallback={fallback}>
      <ErrorBoundary fallback={errorFallback}>
        <Component />
      </ErrorBoundary>
    </Suspense>
  );
};

// Simple error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
      }
      
      // In production, you could send this to an analytics service
      if (renderTime > 100) {
        console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasIntersected, setHasIntersected] = React.useState(false);
  const elementRef = React.useRef();

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => observer.unobserve(element);
  }, [hasIntersected, options]);

  return [elementRef, isIntersecting, hasIntersected];
};

export default LazyComponent;