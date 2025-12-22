
import React, { useEffect, useState } from 'react';
import type { View } from '../types';
import { api } from '../services/api';

interface DashboardProps {
  setView: (view: View) => void;
}

const DashboardCard: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactElement<any>;
  onClick: () => void;
  color: string;
  span?: string;
  isHero?: boolean;
}> = ({ title, subtitle, icon, onClick, color, span = "", isHero = false }) => (
  <button
    onClick={onClick}
    className={`relative w-full p-5 rounded-3xl flex flex-col justify-between text-left hover:scale-[1.02] transition-all duration-300 shadow-lg overflow-hidden min-h-[180px] ${color} ${span} ${isHero ? 'ring-4 ring-rose-500/30 shadow-rose-500/20 shadow-2xl' : ''}`}
  >
    {isHero && (
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/10 to-transparent animate-pulse pointer-events-none"></div>
    )}
    
    <div className="relative z-10">
      <h3 className={`${isHero ? 'text-3xl' : 'text-2xl'} font-bold text-white mb-1`}>{title}</h3>
      <p className="text-white/90 text-sm font-medium leading-snug max-w-[80%]">{subtitle}</p>
      
      {isHero && (
          <div className="mt-4 inline-flex items-center bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold text-white border border-white/20">
              Перейти к плану <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </div>
      )}
    </div>
    <div className={`absolute -right-4 -bottom-4 text-white/20 z-0 transform rotate-12 ${isHero ? 'scale-110' : ''}`}>
        {React.cloneElement(icon, { className: isHero ? "w-40 h-40" : "w-32 h-32" })}
    </div>
  </button>
);

const DashboardScreen: React.FC<DashboardProps> = ({ setView }) => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'offline'>('idle');

  // Listen to network status
  useEffect(() => {
      if (!navigator.onLine) setSyncStatus('offline');
      window.addEventListener('offline', () => setSyncStatus('offline'));
      window.addEventListener('online', () => setSyncStatus('idle'));
      
      // Simulate sync check on mount
      if (navigator.onLine) {
          setSyncStatus('syncing');
          api.syncData().then(() => setSyncStatus('idle'));
      }

      return () => {
          window.removeEventListener('offline', () => {});
          window.removeEventListener('online', () => {});
      };
  }, []);

  const menuItems = [
    {
      id: 'myPlan',
      title: 'Мой План',
      subtitle: 'Центр управления поступлением',
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      onClick: () => setView({ name: 'myPlan' }),
      color: 'bg-gradient-to-r from-rose-600 to-pink-600',
      span: 'md:col-span-2',
      isHero: true,
    },
    {
      id: 'gameCenter',
      title: 'Игровая Зона',
      subtitle: 'Зарабатывай коины и открывай скины',
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>,
      onClick: () => setView({ name: 'gameCenter' }),
      color: 'bg-gradient-to-r from-fuchsia-600 to-purple-600 border-2 border-fuchsia-400',
      span: 'md:col-span-2',
    },
    {
      id: 'specialties',
      title: 'На кого учиться?',
      subtitle: 'Каталог профессий',
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
      onClick: () => setView({ name: 'specialties' }),
      color: 'bg-gradient-to-br from-indigo-500 to-blue-600',
    },
    {
      id: 'colleges',
      title: 'Где учиться?',
      subtitle: 'Колледжи и техникумы',
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>,
      onClick: () => setView({ name: 'educationTypeSelection' }),
      color: 'bg-gradient-to-br from-sky-500 to-cyan-600',
    },
     {
      id: 'quiz',
      title: 'Тест: Кто ты?',
      subtitle: 'Профориентация',
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a3.375 3.375 0 00-2.456-2.456L12.75 18l1.197-.398a3.375 3.375 0 002.456-2.456L16.5 14.25l.398 1.197a3.375 3.375 0 002.456 2.456L20.25 18l-1.197.398a3.375 3.375 0 00-2.456 2.456z" /></svg>,
      onClick: () => setView({ name: 'quiz' }),
      color: 'bg-gradient-to-br from-purple-500 to-violet-600',
    },
    {
      id: 'top50',
      title: 'Топ-30',
      subtitle: 'Рейтинг профессий',
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      onClick: () => setView({ name: 'top50' }),
      color: 'bg-gradient-to-br from-teal-500 to-emerald-600',
    },
    {
      id: 'calculator',
      title: 'Калькулятор',
      subtitle: 'Оцени шансы',
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18m2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5a2.25 2.25 0 012.25 2.25v12a2.25 2.25 0 01-2.25 2.25H8.25A2.25 2.25 0 016 20.25V8.25A2.25 2.25 0 018.25 6z" /></svg>,
      onClick: () => setView({ name: 'profile' }),
      color: 'bg-gradient-to-br from-orange-500 to-red-500',
    },
    {
      id: 'calendar',
      title: 'Календарь',
      subtitle: 'Дни открытых дверей',
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-4.5 12h22.5" /></svg>,
      onClick: () => setView({ name: 'calendar' }),
      color: 'bg-gradient-to-br from-violet-600 to-purple-800',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-6 relative">
      {syncStatus !== 'idle' && (
          <div className="absolute top-0 right-0 flex items-center gap-2 bg-slate-900/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 z-10">
              <div className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-sky-500 animate-pulse' : 'bg-amber-500'}`}></div>
              <span className="text-[10px] text-white font-medium uppercase tracking-wide">
                  {syncStatus === 'syncing' ? 'Sync...' : 'Offline'}
              </span>
          </div>
      )}

      <div className="text-center py-4">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-purple-500 to-pink-500 dark:from-sky-400 dark:via-purple-400 dark:to-pink-400 drop-shadow-sm">Карьерный Компас</h1>
        <p className="text-slate-500 dark:text-slate-300 mt-2 text-lg">Твой навигатор в будущем</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {menuItems.map(item => (
          <DashboardCard
            key={item.id}
            title={item.title}
            subtitle={item.subtitle}
            icon={item.icon}
            onClick={item.onClick}
            color={item.color}
            span={item.span}
            isHero={item.isHero}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardScreen;
