
import React from 'react';
import type { College } from '../types';
import SmartImage from './SmartImage';

// Wrapped in React.memo to prevent unnecessary re-renders during parent updates (like swipes)
export const CollegeCard = React.memo(({
  college,
  onClick,
  isInPlan,
  onTogglePlan,
  recommendationLevel // 'gold' | 'green' | null
}: {
  college: College,
  onClick: () => void,
  isInPlan: boolean,
  onTogglePlan: (e: React.MouseEvent) => void;
  recommendationLevel?: 'gold' | 'green' | null;
}) => (
    <div onClick={onClick} className={`bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.03] cursor-pointer group ${
        recommendationLevel === 'gold' ? 'border-4 border-amber-400 shadow-amber-500/30 ring-4 ring-amber-500/20' :
        recommendationLevel === 'green' ? 'border-4 border-emerald-500 shadow-emerald-500/30 ring-4 ring-emerald-500/20' :
        'border border-slate-200 dark:border-white/10 hover:border-sky-500/50'
    }`}>
        <div className="relative h-44">
            <SmartImage 
                src={college.imageUrl} 
                alt={college.name} 
                className="w-full h-full"
            />
            {recommendationLevel === 'gold' && (
                <div className="absolute top-0 right-14 z-10 bg-amber-400 text-black text-[10px] font-black px-3 py-1.5 rounded-b-xl shadow-lg flex items-center gap-1 border border-white/20">
                    <span>🏆 ТОП</span>
                </div>
            )}
            <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/80 p-1.5 rounded-2xl shadow-xl z-10">
                <img src={college.logoUrl} alt="logo" className="w-12 h-12 rounded-xl object-contain" />
            </div>
            <button
                onClick={onTogglePlan}
                className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-full p-2.5 hover:bg-black/60 transition-all z-10 shadow-sm border border-white/10 active:scale-90"
                aria-label={isInPlan ? 'Удалить из плана' : 'Добавить в план'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-all ${isInPlan ? 'text-amber-500 fill-amber-500' : 'text-white'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <span className="text-white font-black uppercase text-xs tracking-tighter drop-shadow-md">{college.city}</span>
            </div>
        </div>
        <div className="p-5">
            <h3 className="font-black text-lg text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-indigo-500 transition-colors uppercase tracking-tighter">{college.name}</h3>
            <div className="flex items-center justify-between mt-4">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Проходной балл</span>
                    <span className="text-xl font-black text-indigo-500">{college.passingScore}</span>
                </div>
                <div className={`p-2 rounded-xl ${college.hasDormitory ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-400 opacity-50'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                </div>
            </div>
        </div>
    </div>
));

export default CollegeCard;
