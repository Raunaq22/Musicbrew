import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Context
import { AuthProvider } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import MusicDetails from './pages/MusicDetails';
import Search from './pages/Search';
import Playlists from './pages/Playlists';
import Admin from './pages/Admin';
import PlaylistDetails from './pages/PlaylistDetails';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background text-text-light">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/callback" element={<Login />} />
                <Route path="/search" element={<Search />} />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/music/:id" 
                  element={
                    <ProtectedRoute>
                      <MusicDetails />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/user/:username" 
                  element={<UserProfile />}
                />
                <Route 
                  path="/playlists" 
                  element={
                    <ProtectedRoute>
                      <Playlists />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/playlists/:id" 
                  element={
                    <ProtectedRoute>
                      <PlaylistDetails />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#23233a',
                  color: '#f3f4f6',
                  border: '1px solid #52525b',
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;