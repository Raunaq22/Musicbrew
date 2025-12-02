<div align="center">
  <a href="/" target="_blank">
    <img src="client/public/icon.png" alt="MusicBrew Webapp Logo" width="150">
  </a>
  <h1>MusicBrew</h1>
  <h3>
    <a href="/" target="_blank">Live Demo</a>
  </h3>
</div>

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

## Environment Variables

### Server
```bash
• DATABASE_URL: PostgreSQL database connection string
• SPOTIFY_CLIENT_ID: Spotify API client ID
• SPOTIFY_CLIENT_SECRET: Spotify API client secret
• DEEZER_APP_ID: Deezer API app ID
• DEEZER_APP_SECRET: Deezer API app secret
• JWT_SECRET: JWT signing secret
• PORT: Server port (default: 5000)
```
### Client
```bash
• REACT_APP_API_URL: Backend API URL (default: http://localhost:5000)
• REACT_APP_SPOTIFY_CLIENT_ID: Spotify client ID for frontend
```
## Author 👨‍💻

Raunaq Singh Gandhi