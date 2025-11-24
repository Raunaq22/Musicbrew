class RSSService {
  constructor() {
    this.baseUrl = 'https://api.rss2json.com/v1/api.json';
    this.feedUrl = 'https://pitchfork.com/feed/rss';
  }

  async fetchRSSFeed() {
    try {
      const response = await fetch(
        `${this.baseUrl}?rss_url=${encodeURIComponent(this.feedUrl)}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'ok') {
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
      // Extract image from content if available
      let imageUrl = null;
      const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1];
      }

      // Extract category from categories
      let category = 'News';
      if (item.categories && item.categories.length > 0) {
        const categories = Array.isArray(item.categories) ? item.categories : [item.categories];
        const albumCategory = categories.find(cat => 
          cat.toLowerCase().includes('album') || 
          cat.toLowerCase().includes('review') ||
          cat.toLowerCase().includes('record')
        );
        if (albumCategory) {
          category = 'Albums';
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
        category,
        imageUrl,
        categories: item.categories || []
      };
    });
  }

  async getNewsAndAlbums() {
    const allItems = await this.fetchRSSFeed();
    
    const news = allItems.filter(item => item.category === 'News');
    const albums = allItems.filter(item => item.category === 'Albums');
    
    return {
      news: news.slice(0, 20), // Limit to 20 items each
      albums: albums.slice(0, 20)
    };
  }
}

export const rssService = new RSSService();