import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Context
import { AuthProvider } from './context/AuthContext';
import { MusicPlayerProvider } from './context/MusicPlayerContext';

// Components
import { PerformanceMonitor, NetworkStatus } from './components/PerformanceMonitor';

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
import Analytics from './pages/Analytics';
import Discovery from './pages/Discovery';

// Components
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import MusicPlayer from './components/MusicPlayer';

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
  // Apply dark theme class to document
  React.useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.style.backgroundColor = 'hsl(222.2 84% 4.9%)';
    document.body.style.color = 'hsl(210 40% 98%)';
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MusicPlayerProvider>
          <Router>
            <div className="min-h-screen bg-background text-foreground">
              <NetworkStatus />
              <div className="flex">
                <Sidebar />
                <main className="flex-1 ml-16 lg:ml-64 p-6 pb-24 transition-all duration-300">
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
                    <Route 
                      path="/analytics" 
                      element={
                        <ProtectedRoute>
                          <Analytics />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/discovery" 
                      element={<Discovery />} 
                    />
                  </Routes>
                </main>
              </div>
              <MusicPlayer />
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--card-foreground))',
                    border: '1px solid hsl(var(--border))',
                  },
                }}
              />
              <PerformanceMonitor />
            </div>
          </Router>
        </MusicPlayerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;