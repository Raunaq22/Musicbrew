const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function seedMusic() {
  try {
    // Get all unique music IDs from reviews
    const reviews = await getPrisma().review.findMany({
      select: { musicId: true },
      distinct: ['musicId']
    });

    const musicIds = reviews.map(r => r.musicId);
    console.log(`Found ${musicIds.length} unique music IDs to seed`);

    // Get Spotify access token
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Spotify credentials not found in environment variables');
      return;
    }

    const authResponse = await axios.post('https://accounts.spotify.com/api/token', 
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
        }
      }
    );

    const accessToken = authResponse.data.access_token;

    // Fetch track details from Spotify
    let seeded = 0;
    for (const musicId of musicIds) {
      try {
        // Extract Spotify track ID (remove suffix if present)
        const spotifyId = musicId.includes('_') ? musicId.split('_')[0] : musicId;
        
        // Skip if the extracted ID doesn't look like a valid Spotify ID
        if (!spotifyId || spotifyId.length !== 22) {
          console.log(`Skipping invalid Spotify ID: ${musicId}`);
          continue;
        }
        
        const trackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${spotifyId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        const track = trackResponse.data;

        // Check if music already exists
        const existing = await getPrisma().music.findUnique({
          where: { spotifyId: track.id }
        });

        if (!existing) {
          await getPrisma().music.create({
            data: {
              spotifyId: track.id,
              name: track.name,
              artists: track.artists.map(a => a.name),
              album: track.album.name,
              images: track.album.images,
              duration: track.duration_ms,
              preview: track.preview_url
            }
          });
          seeded++;
          console.log(`Seeded: ${track.name} by ${track.artists[0].name}`);
        }
      } catch (error) {
        console.error(`Failed to seed music ID ${musicId}:`, error.message);
      }
    }

    console.log(`Successfully seeded ${seeded} music records`);
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await getPrisma().$disconnect();
  }
}

seedMusic();