const express = require('express');
const axios = require('axios');

const router = express.Router();

// Parse RSS XML to JSON
function parseRSSXML(xml) {
  const items = [];
  
  // Parse items using more robust regex
  const itemRegex = /<item>(.*?)<\/item>/gs;
  const titleRegex = /<title>(.*?)<\/title>/;
  const linkRegex = /<link>(.*?)<\/link>/;
  const guidRegex = /<guid[^>]*>(.*?)<\/guid>/;
  const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
  const descriptionRegex = /<description>(.*?)<\/description>/;
  const contentRegex = /<content:encoded>(.*?)<\/content:encoded>|<content[^>]*>(.*?)<\/content>/;
  const authorRegex = /<dc:creator>(.*?)<\/dc:creator>/;
  const thumbnailRegex = /<media:thumbnail[^>]*url=["']([^"']+)["']/;
  const categoryRegex = /<category>(.*?)<\/category>/g;

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemContent = match[1];
    
    const titleMatch = titleRegex.exec(itemContent);
    const linkMatch = linkRegex.exec(itemContent);
    const guidMatch = guidRegex.exec(itemContent);
    const pubDateMatch = pubDateRegex.exec(itemContent);
    const descriptionMatch = descriptionRegex.exec(itemContent);
    const contentMatch = contentRegex.exec(itemContent);
    const authorMatch = authorRegex.exec(itemContent);
    const thumbnailMatch = thumbnailRegex.exec(itemContent);
    
    const categories = [];
    let catMatch;
    while ((catMatch = categoryRegex.exec(itemContent)) !== null) {
      categories.push(catMatch[1]);
    }

    if (titleMatch) {
      // Clean up HTML entities
      const cleanTitle = titleMatch[1].replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
      const cleanDescription = descriptionMatch ? descriptionMatch[1].replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"') : '';
      
      items.push({
        title: cleanTitle,
        link: linkMatch ? linkMatch[1] : '',
        guid: guidMatch ? guidMatch[1] : '',
        pubDate: pubDateMatch ? pubDateMatch[1] : '',
        description: cleanDescription,
        content: contentMatch ? (contentMatch[1] || contentMatch[2] || '').replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"') : (descriptionMatch ? descriptionMatch[1].replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"') : ''),
        author: authorMatch ? authorMatch[1] : '',
        thumbnail: thumbnailMatch ? thumbnailMatch[1] : null,
        categories: categories,
        imageUrl: thumbnailMatch ? thumbnailMatch[1] : null
      });
    }
  }
  
  return items;
}

// Public album reviews endpoint
router.get('/album-reviews', async (req, res) => {
  try {
    console.log('Fetching album reviews...');
    const response = await axios.get('https://pitchfork.com/feed/feed-album-reviews/rss');
    const xml = response.data;
    const items = parseRSSXML(xml);
    
    console.log(`Found ${items.length} items`);
    
    // Sort by publication date (newest first)
    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    res.json({
      success: true,
      items: items.map(item => ({
        ...item,
        category: 'Album Review'
      }))
    });
    
  } catch (error) {
    console.error('Error fetching album reviews:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch album reviews' 
    });
  }
});

module.exports = router;