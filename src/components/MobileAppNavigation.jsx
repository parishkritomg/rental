import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Plus, Heart, User } from 'lucide-react';

const MobileAppNavigation = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'Home',
      exact: true
    },
    {
      path: '/properties',
      icon: Search,
      label: 'Search'
    },
    {
      path: '/property/new',
      icon: Plus,
      label: 'Add'
    },
    {
      path: '/favorites',
      icon: Heart,
      label: 'Favorites'
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profile'
    }
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path, item.exact);
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
          >
            <Icon className="bottom-nav-icon" strokeWidth={active ? 2.5 : 2} />
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileAppNavigation;