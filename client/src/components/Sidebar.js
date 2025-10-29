import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Search, Music, Compass, BarChart3, User, LogOut } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/playlists', icon: Music, label: 'Playlists' },
    { path: '/discovery', icon: Compass, label: 'Discovery' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-card border-r border-border z-40 flex flex-col transition-all duration-300 ease-out ${
        isExpanded ? 'w-64' : 'w-16'
      } shadow-lg`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-border">
        <NavLink to="/" className="flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-all duration-200 rounded-lg px-2 py-1 -mx-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
            <img src="/icon.png" alt="MusicBrew" className="w-8 h-8 object-contain" />
          </div>
          {isExpanded && (
            <span className="ml-3 text-xl font-semibold text-foreground">MusicBrew</span>
          )}
        </NavLink>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center h-12 mx-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground transition-all duration-200 rounded-lg group ${
                      isActive ? 'bg-primary text-primary-foreground shadow-sm' : ''
                    }`
                  }
                  title={!isExpanded ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                  {isExpanded && (
                    <span className="ml-3 font-medium truncate">{item.label}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-2">
        {user && (
          <>
            {/* User Profile */}
            <NavLink
              to="/profile"
              className="flex items-center h-12 mx-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground transition-all duration-200 rounded-lg group mb-2"
              title={!isExpanded ? "Profile" : undefined}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.displayName || user.username}
                  className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <User className="h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
              )}
              {isExpanded && (
                <span className="ml-3 font-medium truncate">
                  {user.displayName || user.username}
                </span>
              )}
            </NavLink>

            {/* Logout */}
            <button
              onClick={logout}
              className="flex items-center h-12 mx-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground transition-all duration-200 rounded-lg w-full text-left group"
              title={!isExpanded ? "Logout" : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
              {isExpanded && (
                <span className="ml-3 font-medium">Logout</span>
              )}
            </button>
          </>
        )}

        {!user && (
          <NavLink
            to="/login"
            className="flex items-center h-12 mx-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground transition-all duration-200 rounded-lg group"
            title={!isExpanded ? "Login" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
            {isExpanded && (
              <span className="ml-3 font-medium">Login</span>
            )}
          </NavLink>
        )}
      </div>
    </aside>
  );
}