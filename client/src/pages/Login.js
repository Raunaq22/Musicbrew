import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Music, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const processedCodeRef = useRef(null);

  const handleSpotifyCallback = useCallback(async (code) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/spotify/callback', { code });
      
      // Check if this is a duplicate request (code already processed)
      if (response.data.duplicate) {
        console.log('Authorization code already processed, ignoring duplicate');
        // Don't show error, just silently ignore
        setIsLoading(false);
        return;
      }
      
      const { success } = await login(response.data);
      
      if (success) {
        // Remove the code from URL to prevent re-triggering
        // Use replace to avoid adding to history
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('code');
        setSearchParams(newSearchParams, { replace: true });
        toast.success('Successfully logged in!');
        navigate('/');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Don't show error for "already used" - this is expected in React Strict Mode
      const errorMessage = error.response?.data?.error || error.message || '';
      if (errorMessage.includes('already used') || errorMessage.includes('already processed')) {
        // Code was already processed (probably from Strict Mode double render)
        // Silently ignore
        setIsLoading(false);
        return;
      }
      
      // Only show actual errors
      if (errorMessage) {
        toast.error(errorMessage);
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [login, navigate, searchParams]);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    // Only process if we have a code, haven't processed it yet, and aren't already loading
    if (code && code !== processedCodeRef.current && !isLoading) {
      processedCodeRef.current = code;
      handleSpotifyCallback(code);
    }
  }, [searchParams, isLoading, handleSpotifyCallback]);

  const handleSpotifyLogin = async () => {
    try {
      const response = await api.get('/auth/spotify');
      window.location.href = response.data.authURL;
    } catch (error) {
      console.error('Spotify auth error:', error);
      toast.error('Failed to initiate Spotify login');
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-16 w-16 text-primary animate-spin mx-auto mb-4" />
          <p className="text-xl text-text-muted">Connecting to Spotify...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-card rounded-lg p-8 text-center">
          <Music className="h-16 w-16 text-primary mx-auto mb-6" />
          
          <h1 className="text-3xl font-bold text-text-light mb-2">
            Welcome to MusicBrew
          </h1>
          
          <p className="text-text-muted mb-8">
            Connect with Spotify to start discovering, rating, and sharing music
          </p>

          <button
            onClick={handleSpotifyLogin}
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Music className="h-5 w-5" />
            <span>Login with Spotify</span>
          </button>

          <div className="mt-6 text-sm text-text-muted">
            <p>By logging in, you agree to our terms of service</p>
            <p>We'll only access your public profile and music preferences</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold text-text-light mb-4">What you can do:</h3>
          <div className="space-y-2 text-text-muted">
            <p>• Search and discover new music</p>
            <p>• Rate and review your favorite tracks</p>
            <p>• Follow friends and see what they're listening to</p>
            <p>• Create and share playlists</p>
            <p>• Track your listening analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
