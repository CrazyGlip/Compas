
import React from 'react';
import type { PlanItem } from '../types';

interface FavoritesScreenProps {
    plan: PlanItem[];
    onNavigateToSpecialty: (id: string) => void;
    onNavigateToCollege: (id: string) => void;
    onBack: () => void;
}

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ onBack }) => {
    return (
        <div className="animate-fade-in space-y-6">
            <button onClick={onBack} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors group mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-semibold">Назад</span>
            </button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Избранное</h1>
            <div className="p-10 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg">
                <div className="text-5xl mb-4">⭐</div>
                <p className="text-slate-500 dark:text-slate-400">Ваши сохраненные специальности и колледжи появятся в разделе "Мой План".</p>
            </div>
        </div>
    );
};

export default FavoritesScreen;
