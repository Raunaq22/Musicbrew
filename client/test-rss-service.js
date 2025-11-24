async function testRSSService() {
    try {
        console.log('Testing RSS service...');
        
        const response = await fetch('/api/public/album-reviews');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Raw data:', data);
        
        if (!data.success) {
            throw new Error('Failed to fetch RSS feed');
        }
        
        // Simulate the parseFeedItems method
        const items = data.items.map(item => ({
            id: item.guid || item.link,
            title: item.title,
            description: item.description,
            content: item.content,
            link: item.link,
            pubDate: item.pubDate,
            author: item.author,
            category: 'Album Review',
            imageUrl: item.imageUrl,
            categories: item.categories || []
        }));
        
        console.log('Parsed items:', items.slice(0, 3));
        console.log('Total items:', items.length);
        
        return items;
    } catch (error) {
        console.error('RSS service error:', error);
        throw error;
    }
}

// Test the function
testRSSService().then(items => {
    console.log('Success! Got', items.length, 'items');
}).catch(error => {
    console.error('Failed:', error);
});