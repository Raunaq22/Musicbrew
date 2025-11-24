import React from 'react';

export default function NewsCard({ article }) {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return '';
    }
  };

  const cleanDescription = (htmlString) => {
    // Remove HTML tags and decode HTML entities
    const text = htmlString.replace(/<[^>]*>/g, '');
    return text.length > 200 ? text.substring(0, 200) + '...' : text;
  };

  const handleClick = () => {
    // Open link in new tab
    window.open(article.link, '_blank', 'noopener,noreferrer');
  };

  return (
    <article 
      className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex flex-col md:flex-row gap-6 p-6">
        {/* Image Section */}
        {article.imageUrl && (
          <div className="md:w-48 lg:w-64 flex-shrink-0">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-32 md:h-40 lg:h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          {/* Category Badge */}
          <div className="flex items-center space-x-2 mb-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {article.category}
            </span>
            {article.author && (
              <span className="text-xs text-muted-foreground">
                by {article.author}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-200 line-clamp-2">
            {article.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
            {cleanDescription(article.description)}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <time dateTime={article.pubDate}>
                {formatDate(article.pubDate)}
              </time>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-primary font-medium group-hover:underline">
                Read more →
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}