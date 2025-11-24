import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';
import { rssService } from '../services/rss';
import NewsCard from '../components/NewsCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState('news');

  const { data, isLoading, error } = useQuery(
    'pitchfork-feed',
    () => rssService.getNewsAndAlbums(),
    {
      onError: (error) => {
        console.error('Error fetching news:', error);
        toast.error('Failed to load news. Please try again later.');
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const tabs = [
    { id: 'news', label: 'News', count: data?.news?.length || 0 },
    { id: 'albums', label: 'Albums', count: data?.albums?.length || 0 }
  ];

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
          <p className="text-muted-foreground">Failed to load news. Please try again later.</p>
        </div>
      );
    }

    const articles = activeTab === 'news' ? data?.news || [] : data?.albums || [];

    if (articles.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No {activeTab} articles available at the moment.</p>
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Music News</h1>
        <p className="text-lg text-muted-foreground">
          Stay updated with the latest music news and album reviews from Pitchfork
        </p>
      </div>

      {/* Horizontal Tab Navigation */}
      <div className="border-b border-border mb-8">
        <div className="flex space-x-1 bg-muted rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-primary/20 text-primary-foreground text-xs px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {renderContent()}
      </div>
    </div>
  );
}