class RSSService {
  constructor() {
    this.baseUrl = 'https://api.rss2json.com/v1/api.json';
    this.feedUrl = 'https://pitchfork.com/feed/feed-album-reviews/rss';
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