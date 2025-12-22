
import React, { useState } from 'react';
import type { View } from '../types';

interface AppBarProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
  showBack?: boolean;
}

const AppBar: React.FC<AppBarProps> = ({ onBack, onNavigate, showBack = true }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { label: 'Мой План', view: { name: 'myPlan' } as View },
    { label: 'Калькулятор', view: { name: 'profile' } as View },
    { label: 'Настройки', view: { name: 'settings' } as View },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-white/10 h-16 flex items-center justify-between px-4 transition-colors duration-300">
      {/* Spacer to keep menu button on the right */}
      <div className="w-10" />

      <div className="relative">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-white/10 py-1 animate-fade-in-down">
            {menuItems.map(item => (
              <button
                key={item.label}
                onClick={() => {
                  onNavigate(item.view);
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

export default AppBar;
