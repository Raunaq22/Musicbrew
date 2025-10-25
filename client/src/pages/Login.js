import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Music, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      handleSpotifyCallback(code);
    }
  }, [searchParams]);

  const handleSpotifyCallback = async (code) => {
    if (isLoading) {
      console.log('OAuth callback already in progress, ignoring duplicate request');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await api.post('/auth/spotify/callback', { code });
      const { success } = await login(response.data);
      
      if (success) {
        toast.success('Successfully logged in!');
        navigate('/');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
          <Loader className="h-16 w-16 text-green-400 animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-300">Connecting to Spotify...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <Music className="h-16 w-16 text-green-400 mx-auto mb-6" />
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to MusicBrew
          </h1>
          
          <p className="text-gray-300 mb-8">
            Connect with Spotify to start discovering, rating, and sharing music
          </p>

          <button
            onClick={handleSpotifyLogin}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Music className="h-5 w-5" />
            <span>Login with Spotify</span>
          </button>

          <div className="mt-6 text-sm text-gray-400">
            <p>By logging in, you agree to our terms of service</p>
            <p>We'll only access your public profile and music preferences</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold text-white mb-4">What you can do:</h3>
          <div className="space-y-2 text-gray-300">
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
