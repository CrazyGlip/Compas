
import React from 'react';

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors group mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-semibold">На главный</span>
    </button>
);


const ChoiceCard: React.FC<{ title: string; subtitle: string; onClick: () => void; enabled: boolean }> = ({ title, subtitle, onClick, enabled }) => (
    <button 
        onClick={onClick} 
        disabled={!enabled}
        className={`w-full p-6 rounded-2xl flex justify-between items-center text-left transition-transform duration-300 shadow-lg bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 ${enabled ? 'hover:scale-[1.03] hover:border-sky-500/50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
    >
        <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-slate-500 dark:text-slate-300 mt-1">{subtitle}</p>
        </div>
        <div className="bg-slate-100 dark:bg-black/20 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 dark:text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </div>
    </button>
);


const EducationTypeSelectionScreen: React.FC<{ onNavigate: () => void; onBack: () => void; }> = ({ onNavigate, onBack }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <BackButton onClick={onBack} />
            <h1 className="text-3xl font-bold text-center text-slate-900 dark:text-white">
                Выберите тип обучения
            </h1>
            <div className="space-y-4">
                <ChoiceCard 
                    title="Среднее профессиональное образование"
                    subtitle="Колледжи и техникумы"
                    onClick={onNavigate}
                    enabled={true}
                />
                <ChoiceCard 
                    title="Высшее образование"
                    subtitle="Институты и университеты"
                    onClick={() => alert('Раздел в разработке')}
                    enabled={false}
                />
            </div>
        </div>
    );
};

export default EducationTypeSelectionScreen;
