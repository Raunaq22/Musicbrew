import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, User, LogOut, Music, ListMusic, BarChart3, Compass, Users, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '../lib/utils';

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
     { to: '/playlists', label: 'Playlists', icon: ListMusic },
     { to: '/reviews', label: 'Reviews', icon: BarChart3 },
   ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search for music, artists, albums..."
                className="pl-12 pr-4 h-10 bg-muted/50 border-muted hover:bg-muted focus:bg-background transition-colors rounded-full"
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
          <div className="hidden lg:flex items-center space-x-1">
            {isAuthenticated ? (
              <>
                {navigationLinks.map(({ to, label, icon: Icon }) => (
                  <Button
                    key={to}
                    variant="ghost"
                    size="sm"
                    asChild
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Link to={to}>
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                    </Link>
                  </Button>
                ))}
                {(user?.email?.includes('admin') || user?.username?.includes('admin')) && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <Link to="/admin">ADMIN</Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Link to="/profile">
                    <User className="h-4 w-4 mr-2" />
                    {user?.displayName || user?.username}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link to="/login">
                  Sign In
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search for music, artists, albums..."
              className="pl-12 pr-4 h-10 bg-muted/50 border-muted hover:bg-muted focus:bg-background transition-colors rounded-full"
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
          <div className="lg:hidden border-t border-border pb-4">
            <div className="flex flex-col space-y-1">
              {isAuthenticated ? (
                <>
                  {navigationLinks.map(({ to, label, icon: Icon }) => (
                    <Button
                      key={to}
                      variant="ghost"
                      asChild
                      className="justify-start text-muted-foreground hover:text-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to={to}>
                        <Icon className="h-4 w-4 mr-2" />
                        {label}
                      </Link>
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    asChild
                    className="justify-start text-muted-foreground hover:text-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link to="/profile">
                      <User className="h-4 w-4 mr-2" />
                      {user?.displayName || user?.username}
                    </Link>
                  </Button>
                  {(user?.email?.includes('admin') || user?.username?.includes('admin')) && (
                    <Button
                      variant="outline"
                      asChild
                      className="justify-start text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to="/admin">Admin Panel</Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="justify-start text-muted-foreground hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button asChild className="justify-start">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
