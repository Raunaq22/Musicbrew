import React from 'react';

export const ResponsiveGrid = ({ 
  children, 
  className = '', 
  columns = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
    wide: 4
  },
  gap = 6
}) => {
  const gridClasses = {
    0: 'gap-0',
    2: 'gap-2',
    4: 'gap-4', 
    6: 'gap-6',
    8: 'gap-8',
    12: 'gap-12'
  };

  const getColumnClasses = () => {
    const classes = [];
    
    if (columns.mobile) classes.push(`grid-cols-${columns.mobile}`);
    if (columns.tablet) classes.push(`md:grid-cols-${columns.tablet}`);
    if (columns.desktop) classes.push(`lg:grid-cols-${columns.desktop}`);
    if (columns.wide) classes.push(`xl:grid-cols-${columns.wide}`);
    
    return classes.join(' ');
  };

  return (
    <div className={`grid ${getColumnClasses()} ${gridClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

export const CardGrid = ({ 
  children, 
  className = '',
  variant = 'default' // 'default', 'compact', 'featured'
}) => {
  const variants = {
    default: 'bg-card rounded-lg p-6',
    compact: 'bg-card rounded-lg p-4',
    featured: 'bg-gradient-to-br from-card to-background rounded-lg p-6 border border-primary/20'
  };

  return (
    <div className={`${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

export const MasonryGrid = ({ 
  children, 
  className = '',
  columns = 3,
  gap = 4
}) => {
  // Simple masonry layout using CSS columns
  return (
    <div 
      className={`columns-${columns} column-gap-${gap} ${className}`}
      style={{
        columnCount: columns,
        columnGap: `${gap * 0.25}rem`
      }}
    >
      {React.Children.map(children, (child, index) => (
        <div 
          key={index} 
          className="break-inside-avoid mb-4"
          style={{
            marginBottom: `${gap * 0.25}rem`
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

// Virtual scrolling wrapper for large lists
export const VirtualList = ({ 
  items, 
  itemHeight = 80,
  renderItem,
  className = '',
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const [containerHeight, setContainerHeight] = React.useState(0);
  const containerRef = React.useRef();

  React.useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => 
            renderItem(item, startIndex + index)
          )}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveGrid;