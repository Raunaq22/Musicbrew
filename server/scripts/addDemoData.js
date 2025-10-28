const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Demo data
const demoUsers = [
  { username: 'musiclover23', displayName: 'Sarah Chen', email: 'sarah.chen@demo.com', bio: 'Electronic music enthusiast' },
  { username: 'rockfan88', displayName: 'Mike Johnson', email: 'mike.johnson@demo.com', bio: 'Classic rock collector' },
  { username: 'jazzcat', displayName: 'Emma Wilson', email: 'emma.wilson@demo.com', bio: 'Jazz pianist and vinyl lover' },
  { username: 'hiphophead', displayName: 'David Rodriguez', email: 'david.rodriguez@demo.com', bio: 'Underground hip hop curator' },
  { username: 'indieKid', displayName: 'Alex Thompson', email: 'alex.thompson@demo.com', bio: 'Indie folk discovery' },
  { username: 'metalhead', displayName: 'Lisa Anderson', email: 'lisa.anderson@demo.com', bio: 'Metal music journalist' },
  { username: 'popprincess', displayName: 'Jessica Brown', email: 'jessica.brown@demo.com', bio: 'Pop culture enthusiast' },
  { username: 'reggaeMan', displayName: 'Marcus Williams', email: 'marcus.williams@demo.com', bio: 'Reggae and dub specialist' },
  { username: 'classicalFan', displayName: 'Anna Garcia', email: 'anna.garcia@demo.com', bio: 'Classical music teacher' },
  { username: 'technoWizard', displayName: 'Kevin Lee', email: 'kevin.lee@demo.com', bio: 'Techno producer' },
  { username: 'folkster', displayName: 'Rachel Davis', email: 'rachel.davis@demo.com', bio: 'Americana and folk singer' },
  { username: 'rnbQueen', displayName: 'Taylor Jackson', email: 'taylor.jackson@demo.com', bio: 'R&B and soul vocalist' },
  { username: 'punkRocker', displayName: 'Chris Miller', email: 'chris.miller@demo.com', bio: 'Punk historian' },
  { username: 'countryGirl', displayName: 'Megan Taylor', email: 'megan.taylor@demo.com', bio: 'Country music songwriter' },
  { username: 'ambientDream', displayName: 'Jordan Kim', email: 'jordan.kim@demo.com', bio: 'Ambient soundscape composer' },
  { username: 'drummerBoy', displayName: 'Ryan Martinez', email: 'ryan.martinez@demo.com', bio: 'Session drummer' },
  { username: 'bluesMan', displayName: 'Steve Clark', email: 'steve.clark@demo.com', bio: 'Blues guitarist' },
  { username: 'synthMaster', displayName: 'Nicole White', email: 'nicole.white@demo.com', bio: 'Synthwave producer' },
  { username: 'acousticSoul', displayName: 'Tyler Adams', email: 'tyler.adams@demo.com', bio: 'Acoustic fingerstyle' },
  { username: 'worldBeat', displayName: 'Maya Patel', email: 'maya.patel@demo.com', bio: 'World music explorer' }
];

const demoPlaylists = [
  { name: 'Chill Vibes', description: 'Perfect for relaxing evenings', isPublic: true },
  { name: 'Workout Energy', description: 'High-octane tracks for the gym', isPublic: true },
  { name: 'Study Sessions', description: 'Concentrate and focus music', isPublic: true },
  { name: 'Road Trip Hits', description: 'Anthems for the open road', isPublic: true },
  { name: 'Late Night Jazz', description: 'Smooth sounds for evening listening', isPublic: true },
  { name: 'Electronic Pulse', description: 'Dance and electronic music', isPublic: true },
  { name: 'Rock Legends', description: 'Classic and modern rock anthems', isPublic: true },
  { name: 'Indie Discoveries', description: 'Hidden gems from indie artists', isPublic: true }
];

const demoReviews = [
  { rating: 5, content: 'Absolutely incredible track! The production quality is top-notch.' },
  { rating: 4, content: 'Great song, but the bridge could have been better.' },
  { rating: 5, content: 'This is my favorite track of the year. Amazing vocals!' },
  { rating: 3, content: 'Decent track, but not quite what I expected.' },
  { rating: 4, content: 'Really solid work. The bass line is fantastic.' },
  { rating: 5, content: 'Perfect melody and lyrics. Couldn\'t stop listening!' },
  { rating: 2, content: 'Not my style, but the artist has talent.' },
  { rating: 4, content: 'Solid track with great instrumentation.' },
  { rating: 5, content: 'This track gives me chills every time.' },
  { rating: 3, content: 'Good effort, though it\'s not for everyone.' }
];

// Mock track IDs for reviews (simulating Spotify track IDs)
const mockTrackIds = [
  '4iV5W9uYEdYUVa79Axb7Rh', '3AJwUDP919kvQ9QcozQPxg', '7qiZfU4dY1lWllzX7mPBI3',
  '6b2oQwSGFkzsMtQjfvLdkX', '1P4rMUjI4hquaLgt5zHBfs', '2LqTu8ylMXhb9Ha3GFDu2r',
  '5WcnYfgH1mQVmRd7ieEvEa', '3d8jU5d8UcCkK5qYfZq2aA', '7BHYW2EOuZHHkP65LwM8kB',
  '4cOdK2wGLETKBW3PvgPWqT', '6KuQTIu1KoTTkLXKrUkce4', '3dg8gmBhJf5lKgCFY1gxFo'
];

async function addDemoData() {
  try {
    console.log('Adding demo data to database...');

    // Check existing users first
    const existingUsers = await prisma.user.findMany({
      where: {
        email: {
          in: demoUsers.map(u => u.email)
        }
      }
    });

    const existingEmails = new Set(existingUsers.map(u => u.email));

    // Create demo users (skip if already exists)
    const createdUsers = [...existingUsers];
    for (let i = 0; i < demoUsers.length; i++) {
      const user = demoUsers[i];
      
      if (existingEmails.has(user.email)) {
        console.log(`User already exists: ${user.displayName}`);
        continue;
      }
      
      const hashedPassword = await bcrypt.hash('demo123456', 12);
      
      const createdUser = await prisma.user.create({
        data: {
          ...user,
          email: user.email,
          password: hashedPassword,
          isPublic: true,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        }
      });
      createdUsers.push(createdUser);
      console.log(`Created user: ${user.displayName}`);
    }

    // Create demo playlists
    const createdPlaylists = [];
    for (let i = 0; i < demoPlaylists.length; i++) {
      const playlistData = demoPlaylists[i];
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      
      const playlist = await prisma.playlist.create({
        data: {
          ...playlistData,
          userId: randomUser.id,
          coverImage: `https://picsum.photos/300/300?random=${i + 100}`,
          createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000) // Random date within last 60 days
        }
      });
      createdPlaylists.push(playlist);
      console.log(`Created playlist: ${playlistData.name}`);
    }

    // Create demo reviews
    const createdReviews = [];
    const reviewCombinations = new Set(); // Track unique combinations
    
    for (let i = 0; i < 100 && createdReviews.length < 50; i++) {
      const reviewData = demoReviews[createdReviews.length % demoReviews.length];
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const randomTrackId = `${mockTrackIds[createdReviews.length % mockTrackIds.length]}_${createdReviews.length}`;
      
      const combinationKey = `${randomUser.id}_${randomTrackId}`;
      
      // Skip if this combination already exists
      if (reviewCombinations.has(combinationKey)) {
        continue;
      }
      
      try {
        const review = await prisma.review.create({
          data: {
            ...reviewData,
            userId: randomUser.id,
            musicId: randomTrackId,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
          }
        });
        createdReviews.push(review);
        reviewCombinations.add(combinationKey);
        
        if (createdReviews.length % 10 === 0) {
          console.log(`Created ${createdReviews.length} reviews...`);
        }
      } catch (error) {
        // Skip if constraint violation
        continue;
      }
    }

    // Create some demo listening rooms
    const demoRooms = [
      { name: 'Chill Study Session', description: 'Quiet music for focused studying' },
      { name: 'Workout Motivation', description: 'High energy tracks for exercise' },
      { name: 'Jazz Evening', description: 'Smooth jazz for relaxation' },
      { name: 'Indie Discovery', description: 'Exploring new indie music' },
      { name: 'Rock Party', description: 'Classic rock anthems' }
    ];

    for (let i = 0; i < demoRooms.length; i++) {
      const roomData = demoRooms[i];
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      
      // Create queue with demo tracks
      const demoQueue = [
        {
          id: `demo-track-${i}-1`,
          name: `Popular Track ${i + 1}`,
          artist: `Artist ${i + 1}`,
          album: 'Demo Album',
          duration: 180000,
          artwork: `https://picsum.photos/64/64?random=${i * 10 + 1}`,
          addedBy: randomUser.id
        },
        {
          id: `demo-track-${i}-2`,
          name: `Chill Vibes ${i + 1}`,
          artist: `Chill Artist ${i + 1}`,
          album: 'Relax Album',
          duration: 210000,
          artwork: `https://picsum.photos/64/64?random=${i * 10 + 2}`,
          addedBy: randomUser.id
        }
      ];

      const listeningRoom = await prisma.listeningRoom.create({
        data: {
          ...roomData,
          hostId: randomUser.id,
          isActive: true,
          queue: demoQueue,
          currentTrack: demoQueue[0].id, // Just store the ID
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last 7 days
        }
      });
      console.log(`Created listening room: ${roomData.name}`);
    }

    // Create some follows
    for (let i = 0; i < 100; i++) {
      const follower = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const following = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      
      if (follower.id !== following.id) {
        try {
          await prisma.follow.create({
            data: {
              followerId: follower.id,
              followingId: following.id,
              createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
            }
          });
        } catch (error) {
          // Ignore duplicate follows
        }
      }
      
      if (i % 20 === 0) {
        console.log(`Created ${i + 1} follows...`);
      }
    }

    console.log('Demo data added successfully!');
    console.log(`Created ${createdUsers.length} users`);
    console.log(`Created ${createdPlaylists.length} playlists`);
    console.log(`Created ${createdReviews.length} reviews`);
    console.log('Created demo listening rooms');
    console.log('Created demo follows');

  } catch (error) {
    console.error('Error adding demo data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  addDemoData();
}

module.exports = { addDemoData };