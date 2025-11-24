class RSSService {
  constructor() {
    this.baseUrl = '/api/rss';
  }

  async fetchRSSFeed() {
    try {
      const response = await fetch('/api/public/album-reviews');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch RSS feed');
      }
      
      return this.parseFeedItems(data.items);
    } catch (error) {
      console.error('Error fetching RSS feed:', error);
      throw error;
    }
  }

  parseFeedItems(items) {
    return items.map(item => {
      // Extract image from multiple possible sources
      let imageUrl = null;
      
      // Try RSS2JSON thumbnail first (most reliable)
      if (item.thumbnail) {
        imageUrl = item.thumbnail;
      } else if (item.enclosure && item.enclosure.thumbnail) {
        imageUrl = item.enclosure.thumbnail;
      } else {
        // Fallback to content parsing for images
        const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1]) {
          imageUrl = imgMatch[1];
        }
      }

      return {
        id: item.guid || item.link,
        title: item.title,
        description: item.description,
        content: item.content,
        link: item.link,
        pubDate: item.pubDate,
        author: item.author,
        category: 'Album Review',
        imageUrl,
        categories: item.categories || []
      };
    });
  }

  async getAlbumReviews() {
    const allItems = await this.fetchRSSFeed();
    return allItems;
  }
}

export const rssService = new RSSService();