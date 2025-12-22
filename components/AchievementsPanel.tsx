
import React, { useState, useEffect } from 'react';
import { achievements } from '../data/achievements';
import type { Achievement } from '../types';

interface AchievementsPanelProps {
    onAction: (achievement: Achievement) => void;
}

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ onAction }) => {
    const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
    const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

    useEffect(() => {
        const loadAchievements = () => {
            const stored = localStorage.getItem('unlockedAchievements');
            if (stored) setUnlockedIds(JSON.parse(stored));
        };

        loadAchievements();

        // Listen for global update event from App.tsx
        window.addEventListener('achievements_updated', loadAchievements);
        return () => window.removeEventListener('achievements_updated', loadAchievements);
    }, []);

    const handleIconClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        // Toggle tooltip on tap/click
        setActiveTooltipId(activeTooltipId === id ? null : id);
    };

    const handleActionClick = (e: React.MouseEvent, achievement: Achievement) => {
        e.stopPropagation();
        onAction(achievement);
        setActiveTooltipId(null);
    };

    const progress = Math.round((unlockedIds.length / achievements.length) * 100);

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 mb-6 relative">
            {/* Backdrop to close tooltip when clicking outside */}
            {activeTooltipId && (
                <div className="fixed inset-0 z-10" onClick={() => setActiveTooltipId(null)} />
            )}

            <div className="flex justify-between items-end mb-4 relative z-0">
                <h3 className="text-xl font-bold text-white">Мои достижения</h3>
                <span className="text-sky-400 font-bold">{progress}%</span>
            </div>
            
            <div className="w-full bg-slate-700 h-2 rounded-full mb-6 overflow-hidden relative z-0">
                <div className="bg-gradient-to-r from-sky-400 to-purple-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 relative z-20">
                {achievements.map(achievement => {
                    const isUnlocked = unlockedIds.includes(achievement.id);
                    const isActive = activeTooltipId === achievement.id;

                    return (
                        <div 
                            key={achievement.id} 
                            className="flex flex-col items-center text-center relative"
                        >
                            <button
                                onClick={(e) => handleIconClick(e, achievement.id)}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-2 transition-all duration-300 transform active:scale-95 outline-none ${isUnlocked ? `bg-gradient-to-br ${achievement.color} shadow-lg` : 'bg-slate-700/50 grayscale opacity-50'} ${isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-105' : ''}`}
                            >
                                {achievement.icon}
                            </button>
                            
                            {/* Tooltip */}
                            {isActive && (
                                <div className="absolute bottom-full mb-3 w-40 bg-slate-900/95 text-white text-xs rounded-xl p-3 z-30 border border-white/10 shadow-2xl animate-fade-in-up left-1/2 -translate-x-1/2 before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-8 before:border-transparent before:border-t-slate-900/95">
                                    <p className="font-bold mb-1 text-sky-300">{achievement.title}</p>
                                    <p className="text-slate-300 leading-tight mb-3">{achievement.description}</p>
                                    {/* Action Button inside Tooltip */}
                                    {(achievement.targetView || achievement.id === 'analyst') && (
                                        <button 
                                            onClick={(e) => handleActionClick(e, achievement)}
                                            className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-emerald-400 font-bold tracking-wider text-[10px] uppercase flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <span>Перейти</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AchievementsPanel;
