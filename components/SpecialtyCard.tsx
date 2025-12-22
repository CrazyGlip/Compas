
import React from 'react';
import type { Specialty } from '../types';
import SmartImage from './SmartImage';

interface SpecialtyCardProps {
  specialty: Specialty;
  onClick: () => void;
  isInPlan: boolean;
  onTogglePlan: (e: React.MouseEvent) => void;
  recommendationLevel?: 'gold' | 'green' | null;
  matchReason?: string;
}

export const SpecialtyCard = React.memo(({ specialty, onClick, isInPlan, onTogglePlan, recommendationLevel, matchReason }: SpecialtyCardProps) => {
    const gradients = [
        'from-violet-600 to-indigo-900',
        'from-blue-600 to-cyan-800',
        'from-emerald-500 to-teal-900',
        'from-rose-500 to-pink-900',
        'from-amber-500 to-orange-900',
        'from-fuchsia-600 to-purple-900',
    ];
    
    const colorIndex = specialty.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
    const gradientClass = gradients[colorIndex];

    return (
        <div 
            onClick={onClick} 
            className={`relative overflow-hidden rounded-3xl group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl h-[300px] shadow-lg ${
                recommendationLevel === 'gold' ? 'border-4 border-amber-400 shadow-amber-500/30 ring-4 ring-amber-500/20' :
                recommendationLevel === 'green' ? 'border-4 border-emerald-500 shadow-emerald-500/30 ring-4 ring-emerald-500/20' :
                'border-transparent hover:border-white/10 hover:shadow-sky-500/20'
            }`}
        >
            <div className="absolute inset-0 bg-slate-900">
                 <SmartImage 
                    src={specialty.imageUrl} 
                    alt={specialty.title} 
                    className="w-full h-full opacity-90 group-hover:opacity-100 transition-transform duration-700 group-hover:scale-110" 
                />
            </div>

            <div className={`absolute inset-0 bg-gradient-to-t ${gradientClass} opacity-20 transition-opacity duration-300 group-hover:opacity-10`} />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

            {recommendationLevel === 'gold' && (
                <div className="absolute top-0 right-14 z-10 bg-amber-400 text-black text-[10px] font-black px-3 py-1.5 rounded-b-xl shadow-lg flex items-center gap-1 border border-white/20">
                    <span>🏆 Идеально</span>
                </div>
            )}

            <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                     <span className={`text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md border border-white/20 shadow-lg ${
                        specialty.type === 'профессия' ? 'bg-blue-500/60 text-blue-50' : 'bg-purple-500/60 text-purple-50'
                    }`}>
                        {specialty.type}
                    </span>
                    
                    <button
                        onClick={onTogglePlan}
                        className="bg-black/30 backdrop-blur-md p-2.5 rounded-full hover:bg-black/50 transition-colors border border-white/20 active:scale-95 shadow-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-colors ${isInPlan ? 'text-amber-400 fill-amber-400' : 'text-white fill-none'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </div>

                <div className="transform transition-transform duration-300 group-hover:translate-y-[-5px]">
                    {matchReason && (
                        <div className="inline-flex items-center gap-1 mb-2 px-2 py-0.5 rounded-md bg-emerald-500/30 border border-emerald-400/30 backdrop-blur-sm">
                            <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wide">
                                🎯 {matchReason}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 mb-2 text-slate-200 text-[10px] font-black uppercase bg-black/40 w-fit px-2 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                         Средний балл 2025: <span className="text-sky-400">{specialty.passingScore}</span>
                    </div>

                    <h3 className="font-bold text-white text-lg leading-tight drop-shadow-md mb-2 line-clamp-2">
                        {specialty.title}
                    </h3>
                </div>
            </div>
            
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-500 pointer-events-none"></div>
        </div>
    );
});

export default SpecialtyCard;
