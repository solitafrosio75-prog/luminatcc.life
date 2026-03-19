/**
 * EmotionalDemoNavigation - Navigation component for emotional connection system demos
 * Provides easy access to chat interface and dashboard
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, BarChart3, MessageCircle, Activity } from 'lucide-react';

export const EmotionalDemoNavigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  const navItems = [
    {
      path: '/emotional-chat',
      label: 'Emotional Chat',
      icon: MessageCircle,
      description: 'Interactive emotional connection demo'
    },
    {
      path: '/emotional-dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'System metrics and insights'
    },
    {
      path: '/session',
      label: 'TCC Protocol',
      icon: Activity,
      description: 'Therapeutic protocol sessions'
    }
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Emotional Connection System
              </h1>
              <p className="text-xs text-gray-500">
                Digital Trust & Emotional Intelligence
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200 relative group
                    ${active 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                  title={item.description}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                  
                  {/* Active indicator */}
                  {active && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                  )}
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
