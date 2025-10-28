import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, User, LogOut, Music, ListMusic, BarChart3, Compass, Users, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const navigationLinks = [
    { to: '/discovery', label: 'Discover', icon: Compass },
    { to: '/listening-rooms', label: 'Rooms', icon: Users },
    { to: '/playlists', label: 'Playlists', icon: ListMusic },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <nav className="bg-card border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Music className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-text-light hidden sm:block">MusicBrew</span>
          </Link>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted h-4 w-4" />
              <input
                type="text"
                placeholder="Search for music..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const query = e.target.value.trim();
                    if (query) {
                      navigate(`/search?q=${encodeURIComponent(query)}`);
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {navigationLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center space-x-2 text-text-muted hover:text-text-light transition-colors"
                    title={label}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm">{label}</span>
                  </Link>
                ))}
                {(user?.email?.includes('admin') || user?.username?.includes('admin')) && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 text-text-muted hover:text-text-light transition-colors"
                    title="Admin Panel"
                  >
                    <span className="text-xs font-semibold text-primary">ADMIN</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-text-muted hover:text-text-light transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm">{user?.displayName || user?.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-text-muted hover:text-text-light transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm">Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg transition-colors"
              >
                Login with Spotify
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-text-muted hover:text-text-light transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted h-4 w-4" />
            <input
              type="text"
              placeholder="Search for music..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-text-light placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const query = e.target.value.trim();
                  if (query) {
                    navigate(`/search?q=${encodeURIComponent(query)}`);
                    setIsMobileMenuOpen(false);
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-700 pt-4 pb-4">
            <div className="space-y-2">
              {isAuthenticated ? (
                <>
                  {navigationLinks.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-text-muted hover:text-text-light hover:bg-background rounded-lg transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                      <span>{label}</span>
                    </Link>
                  ))}
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-text-muted hover:text-text-light hover:bg-background rounded-lg transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span>{user?.displayName || user?.username}</span>
                  </Link>
                  {(user?.email?.includes('admin') || user?.username?.includes('admin')) && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-text-muted hover:text-text-light hover:bg-background rounded-lg transition-colors"
                    >
                      <span className="text-xs font-semibold text-primary">ADMIN PANEL</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-text-muted hover:text-text-light hover:bg-background rounded-lg transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block bg-primary hover:bg-primary-hover text-white px-4 py-3 rounded-lg transition-colors text-center"
                >
                  Login with Spotify
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
