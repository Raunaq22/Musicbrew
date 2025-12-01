# MusicBrew

A modern music discovery and review platform built with React and Node.js, featuring Spotify and Deezer API integrations.

## Features

- **Music Discovery**: Search and explore music from Spotify and Deezer APIs
- **Review System**: User-generated reviews and ratings for albums and tracks
- **Playlists**: User-managed playlists with music organization
- **RSS Feeds**: Automated RSS feed generation from music news sources
- **User Authentication**: Secure login and profile management
- **Responsive Design**: Mobile-first, responsive UI built with Tailwind CSS

## Tech Stack

### Backend
- **Node.js** with **Express.js** framework
- **Prisma ORM** for database management
- **PostgreSQL** database
- **Spotify API** and **Deezer API** integrations
- **JWT** for authentication
- **bcrypt** for password hashing

### Frontend
- **React** with **TypeScript**
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Router** for client-side routing
- **Axios** for API communication

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database

### Backend Setup
```bash
1. Clone the repository:
git clone <repository-url>
cd musicbrew/server

2. Install dependencies:

npm install

3. Set up environment variables:
Create a .env file in the server directory with the following variables:

DATABASE_URL="postgresql://username:password@localhost:5432/musicbrew"
SPOTIFY_CLIENT_ID="your_spotify_client_id"
SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"
DEEZER_APP_ID="your_deezer_app_id"
DEEZER_APP_SECRET="your_deezer_app_secret"
JWT_SECRET="your_jwt_secret"

4. Run database migrations:

npx prisma migrate dev

5. Start the server:

npm start
```

### Frontend Setup
```bash

1. Navigate to the client directory:

cd ../client

2. Install dependencies:

npm install

3. Start the development server:

npm start

The application will be available at http://localhost:3000
```

## API Endpoints

### Authentication

• POST /api/auth/register - User registration
• POST /api/auth/login - User login
• GET /api/auth/profile - Get user profile (protected)
• PUT /api/auth/profile - Update user profile (protected)

### Music

• GET /api/music/search - Search for music (Spotify/Deezer)
• GET /api/music/preview/:id - Get music preview
• GET /api/music/album/:id - Get album details
• GET /api/music/artist/:id - Get artist details

### Reviews

• GET /api/reviews - Get all reviews
• POST /api/reviews - Create a review (protected)
• GET /api/reviews/:id - Get review by ID
• PUT /api/reviews/:id - Update review (protected)
• DELETE /api/reviews/:id - Delete review (protected)

### Playlists

• GET /api/playlists - Get user playlists (protected)
• POST /api/playlists - Create playlist (protected)
• GET /api/playlists/:id - Get playlist details
• PUT /api/playlists/:id - Update playlist (protected)
• DELETE /api/playlists/:id - Delete playlist (protected)

### Users

• GET /api/users/:id - Get user profile
• GET /api/users/:id/reviews - Get user reviews
• GET /api/users/:id/playlists - Get user playlists



### RSS

• GET /api/rss - Get RSS feed items
• GET /api/rss/:id - Get RSS item by ID

## Database Schema

The application uses Prisma ORM with the following main models:

• User: User accounts and profiles
• Review: Music reviews and ratings
• Playlist: User-created playlists
• Music: Music metadata from external APIs
• RSSItem: RSS feed items from music news sources

## Environment Variables

### Server

• DATABASE_URL: PostgreSQL database connection string
• SPOTIFY_CLIENT_ID: Spotify API client ID
• SPOTIFY_CLIENT_SECRET: Spotify API client secret
• DEEZER_APP_ID: Deezer API app ID
• DEEZER_APP_SECRET: Deezer API app secret
• JWT_SECRET: JWT signing secret
• PORT: Server port (default: 5000)

### Client

• REACT_APP_API_URL: Backend API URL (default: http://localhost:5000)
• REACT_APP_SPOTIFY_CLIENT_ID: Spotify client ID for frontend

## Author 👨‍💻

Raunaq Singh Gandhi