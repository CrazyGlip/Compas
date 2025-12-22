
import React, { useState } from 'react';

interface FilterPanelProps {
    cities: string[];
    selectedCity: string;
    onCityChange: (city: string) => void;
    
    userScore: string;
    onUserScoreChange: (score: string) => void;
    
    selectedForm: string;
    onFormChange: (form: string) => void;
    
    onReset: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
    cities,
    selectedCity,
    onCityChange,
    userScore,
    onUserScoreChange,
    selectedForm,
    onFormChange,
    onReset
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden mb-6 transition-all duration-300 shadow-sm">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
            >
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Фильтры
                    {(selectedCity || userScore || selectedForm !== 'any') && (
                        <span className="ml-2 bg-sky-500 text-white text-[10px] px-2 py-0.5 rounded-full">Активны</span>
                    )}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="p-4 pt-0 space-y-4 animate-fade-in-down">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* City Filter */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Город</label>
                            <select 
                                value={selectedCity}
                                onChange={(e) => onCityChange(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                            >
                                <option value="">Все города</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>

                        {/* Education Form Filter */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Форма обучения</label>
                            <select 
                                value={selectedForm}
                                onChange={(e) => onFormChange(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                            >
                                <option value="any">Не важно</option>
                                <option value="очная">Очная</option>
                                <option value="заочная">Заочная</option>
                                <option value="очно-заочная">Очно-заочная</option>
                            </select>
                        </div>
                    </div>

                    {/* GPA Filter */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Мой средний балл (до {userScore || '5.0'})
                        </label>
                        <div className="flex items-center gap-4">
                            <input 
                                type="range" 
                                min="3.0" 
                                max="5.0" 
                                step="0.1"
                                value={userScore || 5.0}
                                onChange={(e) => onUserScoreChange(e.target.value)}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                            />
                            <span className="font-bold text-slate-900 dark:text-white min-w-[3ch]">{userScore || '—'}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Покажем варианты, куда вы проходите с этим баллом</p>
                    </div>

                    <button 
                        onClick={onReset}
                        className="w-full py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                        Сбросить фильтры
                    </button>
                </div>
            )}
        </div>
    );
};

export default FilterPanel;
