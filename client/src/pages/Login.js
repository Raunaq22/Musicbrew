import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Music, Loader, Mail, Lock, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Label } from '../components/ui/label';
import toast from 'react-hot-toast';

const Login = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    username: '',
    displayName: ''
  });
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

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await api.post('/auth/login', loginForm);
      const { success } = await login(response.data);
      
      if (success) {
        navigate('/');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Email login error:', error);
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await api.post('/auth/register', registerForm);
      const { success } = await login(response.data);
      
      if (success) {
        navigate('/');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Email register error:', error);
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 mx-auto">
            <Loader className="h-8 w-8 text-primary animate-spin" />
          </div>
          <p className="text-xl text-muted-foreground">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4 mx-auto">
            <Music className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to MusicBrew</CardTitle>
          <CardDescription>
            Discover, rate, and share your favorite music
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={handleSpotifyLogin}
                className="w-full"
                disabled={isLoading}
              >
                <Music className="mr-2 h-4 w-4" />
                Spotify
              </Button>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleEmailRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Choose a username"
                      className="pl-10"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name (Optional)</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="How should we call you?"
                    value={registerForm.displayName}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, displayName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Create a password"
                      className="pl-10"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={handleSpotifyLogin}
                className="w-full"
                disabled={isLoading}
              >
                <Music className="mr-2 h-4 w-4" />
                Spotify
              </Button>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>By continuing, you agree to our terms of service</p>
            <p>Spotify connection gives you access to millions of tracks</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
