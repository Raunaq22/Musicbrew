import React, { useEffect } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';
import { rssService } from '../services/rss';
import NewsCard from '../components/NewsCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function NewsPage() {
  const { data, isLoading, error } = useQuery(
    'pitchfork-album-reviews',
    () => rssService.getAlbumReviews(),
    {
      onError: (error) => {
        console.error('Error fetching album reviews:', error);
        toast.error('Failed to load album reviews. Please try again later.');
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load album reviews. Please try again later.</p>
        </div>
      );
    }

    const articles = data || [];

    if (articles.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No album reviews available at the moment.</p>
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:gap-8">
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Album Reviews</h1>
        <p className="text-lg text-muted-foreground">
          Latest album reviews from Pitchfork
        </p>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {renderContent()}
      </div>
    </div>
  );
}