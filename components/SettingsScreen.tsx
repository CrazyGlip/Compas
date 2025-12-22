
import React, { useState, useEffect, useRef } from 'react';
import type { ThemeMode, RecommendationWeights, View } from '../types';
import { api } from '../services/api';
import { seedAllQuizzes, seedStandaloneTopProfessions, runManualCollegeImport, runSpecialtyScoreImport, runSpecialtySync } from '../services/dbSeeder'; 
import { supabase } from '../lib/supabaseClient';

interface SettingsScreenProps {
    onBack: () => void;
    onReplayOnboarding: () => void;
    currentTheme: ThemeMode;
    onThemeChange: (theme: ThemeMode) => void;
    onReset: () => void;
    isAdminMode?: boolean;
    onToggleAdminMode?: () => void;
    recWeights: RecommendationWeights;
    onUpdateWeights: (w: RecommendationWeights) => void;
    onNavigate: (view: View) => void; 
}

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors group mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-semibold">Назад</span>
    </button>
);

const Toggle: React.FC<{ 
    label: string; 
    description?: string; 
    value: boolean; 
    onChange: (val: boolean) => void;
}> = ({ label, description, value, onChange }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-200 dark:border-white/10 last:border-0">
        <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{label}</h3>
            {description && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{description}</p>}
        </div>
        <button 
            onClick={() => onChange(!value)}
            className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${value ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}
        >
            <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${value ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    </div>
);

const ThemeOption: React.FC<{
    label: string;
    value: ThemeMode;
    current: ThemeMode;
    onSelect: (val: ThemeMode) => void;
    icon: React.ReactNode;
}> = ({ label, value, current, onSelect, icon }) => {
    const isSelected = current === value;
    return (
        <button
            onClick={() => onSelect(value)}
            className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center gap-2 transition-all duration-300 ${
                isSelected 
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 scale-[1.02]' 
                    : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
        >
            {icon}
            <span className="text-xs font-bold">{label}</span>
        </button>
    );
};

const WeightsConfigurator: React.FC<{
    weights: RecommendationWeights;
    onChange: (w: RecommendationWeights) => void;
}> = ({ weights, onChange }) => {
    const [localWeights, setLocalWeights] = useState<RecommendationWeights>(weights);
    const [isOpen, setIsOpen] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState<'influence' | 'base'>('influence');

    useEffect(() => { setLocalWeights(weights); }, [weights]);

    const handleSliderChange = (key: keyof RecommendationWeights, newValue: number) => {
        const isBaseScore = (key as string).startsWith('base');
        const newWeights: RecommendationWeights = { ...localWeights, [key]: newValue };

        if (!isBaseScore) {
            const oldValue = localWeights[key] as number;
            const delta = newValue - oldValue;
            const influenceKeys = ['quizWeight', 'gradeWeight', 'subjectLikeWeight', 'planLikeWeight'] as (keyof RecommendationWeights)[];
            const remainingKeys = influenceKeys.filter(k => k !== key);
            const remainingTotal = remainingKeys.reduce((sum: number, k) => sum + (localWeights[k] as number), 0);

            if (remainingTotal > 0) {
                remainingKeys.forEach(k => {
                    const val = localWeights[k] as number;
                    const ratio = val / remainingTotal;
                    let adjusted = val - (delta * ratio);
                    adjusted = Math.max(0, Math.min(100, adjusted));
                    (newWeights[k] as number) = Math.round(adjusted);
                });
            }
            const currentSum = influenceKeys.reduce((a, k) => a + (newWeights[k] as number), 0);
            const diff = 100 - currentSum;
            if (diff !== 0 && remainingKeys.length > 0) {
                const firstRemainingKey = remainingKeys[0];
                (newWeights[firstRemainingKey] as number) += diff;
            }
        }

        setLocalWeights(newWeights);
        onChange(newWeights);
    };

    return (
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-300 dark:border-white/10 mt-4">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left"
            >
                <div className="flex flex-col">
                    <span className="font-bold text-slate-800 dark:text-white">⚙️ Алгоритм RecSys 4.0</span>
                    <span className="text-[10px] text-slate-500 uppercase font-black">Настройка баланса источников</span>
                </div>
                <span className="text-xl">{isOpen ? '−' : '+'}</span>
            </button>

            {isOpen && (
                <div className="mt-6 space-y-6 animate-fade-in">
                    <div className="flex bg-slate-200 dark:bg-slate-900 p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveSubTab('influence')}
                            className={`flex-1 py-1 text-[10px] font-bold uppercase rounded ${activeSubTab === 'influence' ? 'bg-white dark:bg-slate-700 shadow-sm text-sky-500' : 'text-slate-500'}`}
                        >Влияние (%)</button>
                        <button 
                            onClick={() => setActiveSubTab('base')}
                            className={`flex-1 py-1 text-[10px] font-bold uppercase rounded ${activeSubTab === 'base' ? 'bg-white dark:bg-slate-700 shadow-sm text-sky-500' : 'text-slate-500'}`}
                        >Сила (База)</button>
                    </div>

                    {activeSubTab === 'influence' ? (
                        <div className="space-y-4">
                            {[
                                { key: 'quizWeight', label: 'Тесты', color: 'accent-purple-500' },
                                { key: 'gradeWeight', label: 'Оценки', color: 'accent-emerald-500' },
                                { key: 'subjectLikeWeight', label: 'Интересы', color: 'accent-rose-500' },
                                { key: 'planLikeWeight', label: 'Намерения', color: 'accent-sky-500' },
                            ].map((item) => (
                                <div key={item.key}>
                                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                        <span>{item.label}</span>
                                        <span>{localWeights[item.key as keyof RecommendationWeights]}%</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="100" 
                                        value={localWeights[item.key as keyof RecommendationWeights]}
                                        onChange={(e) => handleSliderChange(item.key as keyof RecommendationWeights, parseInt(e.target.value))}
                                        className={`w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer ${item.color}`}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {[
                                { key: 'baseQuizScore', label: 'Очки за тест', max: 50, color: 'accent-purple-400' },
                                { key: 'baseGradeScore', label: 'Очки за 5-ку', max: 100, color: 'accent-emerald-400' },
                                { key: 'baseLikeScore', label: 'Очки за ❤️ предмета', max: 100, color: 'accent-rose-400' },
                                { key: 'basePlanScore', label: 'Очки за пункт плана', max: 100, color: 'accent-sky-400' },
                            ].map((item) => (
                                <div key={item.key}>
                                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                                        <span>{item.label}</span>
                                        <span>{localWeights[item.key as keyof RecommendationWeights]}</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max={item.max} 
                                        value={localWeights[item.key as keyof RecommendationWeights]}
                                        onChange={(e) => handleSliderChange(item.key as keyof RecommendationWeights, parseInt(e.target.value))}
                                        className={`w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer ${item.color}`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack, onReplayOnboarding, currentTheme, onThemeChange, onReset, isAdminMode, onToggleAdminMode, recWeights, onUpdateWeights, onNavigate }) => {
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [secretTaps, setSecretTaps] = useState<number>(0);
    const tapTimeoutRef = useRef<any>(null);

    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string>('Нажмите кнопку для синхронизации...');

    useEffect(() => {
        const storedSound = localStorage.getItem('app_sound_enabled');
        setSoundEnabled(storedSound !== 'false'); 

        const storedNotifs = localStorage.getItem('app_notifications_enabled');
        setNotificationsEnabled(storedNotifs !== 'false');
    }, []);

    const handleSoundChange = (val: boolean) => {
        setSoundEnabled(val);
        localStorage.setItem('app_sound_enabled', String(val));
    };

    const handleNotificationsChange = (val: boolean) => {
        setNotificationsEnabled(val);
        localStorage.setItem('app_notifications_enabled', String(val));
    };

    const handleSecretTap = () => {
        if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
        setSecretTaps((prev: number) => {
            const next = prev + 1;
            if (next >= 5) {
                if (onToggleAdminMode) {
                    onToggleAdminMode();
                    setTimeout(() => alert(!isAdminMode ? "Режим администратора ВКЛЮЧЕН" : "Режим администратора ОТКЛЮЧЕН"), 100);
                }
                return 0;
            }
            return next;
        });
        tapTimeoutRef.current = setTimeout(() => setSecretTaps(0), 2000);
    };

    const updateDB = async () => {
        setLoading(true);
        setLogs("Начало полной синхронизации БД...\nОбновление тегов, предметов и тестов...");
        try {
            const res = await seedAllQuizzes();
            setLogs(prev => prev + '\n' + res.message);
        } catch (e: any) {
            setLogs(prev => prev + `\nОШИБКА: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const syncSpecialtyDict = async () => {
        setLoading(true);
        setLogs("📖 СИНХРОНИЗАЦИЯ СПРАВОЧНИКА СПЕЦИАЛЬНОСТЕЙ...");
        try {
            const res = await runSpecialtySync();
            setLogs(prev => prev + '\n' + res.message);
        } catch (e: any) {
            setLogs(prev => prev + `\nОШИБКА: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const importSpecialtyScores = async () => {
        setLoading(true);
        setLogs("📈 ЗАГРУЗКА БАЛЛОВ ПО СПЕЦИАЛЬНОСТЯМ (ТАБЛИЦА 2025)...");
        try {
            const res = await runSpecialtyScoreImport();
            setLogs(prev => prev + '\n' + res.message);
            if (res.success) {
                api.syncData(); 
            }
        } catch (e: any) {
            setLogs(prev => prev + `\nОШИБКА: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const updateTop30 = async () => {
        setLoading(true);
        setLogs("🏆 Начинаем синхронизацию ТОП-30...\nПодготовка данных для таблицы top_professions...");
        try {
            const res = await seedStandaloneTopProfessions();
            setLogs(prev => prev + '\n' + res.message);
        } catch (e: any) {
            setLogs(prev => prev + `\nОШИБКА: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleManualImport = async () => {
        setLoading(true);
        setLogs("🏢 Запуск импорта справочника колледжей...");
        try {
            const res = await runManualCollegeImport();
            setLogs(prev => prev + '\n' + res.message);
        } catch (e: any) {
            setLogs(prev => prev + `\nОШИБКА: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-6 pb-20">
            <BackButton onClick={onBack} />
            <div className="flex items-center space-x-2 mb-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Настройки</h1>
                {isAdminMode && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded uppercase animate-pulse">Admin</span>
                )}
            </div>
            
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-white/10">
                 <h2 className="text-indigo-500 dark:text-indigo-400 font-bold uppercase text-xs tracking-wider mb-4">Тема оформления</h2>
                 <div className="flex gap-3">
                     <ThemeOption label="Светлая" value="light" current={currentTheme} onSelect={onThemeChange} icon={<span className="text-xl">☀️</span>} />
                     <ThemeOption label="Темная" value="dark" current={currentTheme} onSelect={onThemeChange} icon={<span className="text-xl">🌙</span>} />
                     <ThemeOption label="Системная" value="system" current={currentTheme} onSelect={onThemeChange} icon={<span className="text-xl">💻</span>} />
                 </div>
            </div>

            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-white/10">
                <h2 className="text-sky-500 dark:text-sky-400 font-bold uppercase text-xs tracking-wider mb-4">Основные</h2>
                <Toggle label="Звук в приложении" value={soundEnabled} onChange={handleSoundChange} />
                <Toggle label="Уведомления" value={notificationsEnabled} onChange={handleNotificationsChange} />
            </div>

            {isAdminMode && (
                <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-orange-500/30">
                    <h2 className="text-orange-500 font-bold uppercase text-xs tracking-wider mb-4">Панель Администратора</h2>
                    
                    <div className="space-y-4">
                        <WeightsConfigurator weights={recWeights} onChange={onUpdateWeights} />
                        
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button 
                                onClick={() => onNavigate({ name: 'tagEditor' })}
                                className="p-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 transition-all flex flex-col items-center gap-2"
                            >
                                <span className="text-xl">🏷️</span>
                                Список тегов
                            </button>
                            <button 
                                onClick={() => onNavigate({ name: 'subjectEditor' })}
                                className="p-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 transition-all flex flex-col items-center gap-2"
                            >
                                <span className="text-xl">📚</span>
                                Теги предметов
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {/* ШАГ 1: СИНХРОНИЗАЦИЯ СПРАВОЧНИКА */}
                            <button 
                                onClick={syncSpecialtyDict}
                                disabled={loading}
                                className="w-full py-4 bg-white dark:bg-slate-800 text-sky-500 border-2 border-sky-500/30 font-black rounded-xl shadow-lg hover:scale-[1.02] transition-transform text-sm flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">📖</span> 1. Синхронизировать справочник специальностей
                            </button>

                            {/* ШАГ 2: ЗАГРУЗКА БАЛЛОВ */}
                            <button 
                                onClick={importSpecialtyScores}
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-sky-600 text-white font-black rounded-xl shadow-lg hover:scale-[1.02] transition-transform text-sm flex items-center justify-center gap-2 border-2 border-white/20"
                            >
                                <span className="text-lg">📈</span> 2. Загрузить баллы (Таблица 2025)
                            </button>

                            <button 
                                onClick={handleManualImport}
                                disabled={loading}
                                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl shadow hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">🏢</span> Синхронизировать справочник колледжей
                            </button>

                            <button 
                                onClick={updateTop30}
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform text-sm flex items-center justify-center gap-2 border border-white/10"
                            >
                                <span className="text-lg">🏆</span> Синхронизировать ТОП-30 в БД
                            </button>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-xs text-slate-500 mb-1 font-bold">Логи администратора:</p>
                        <div className="bg-slate-900 text-green-400 font-mono text-[10px] p-3 rounded-xl h-48 overflow-y-auto border border-slate-700 shadow-inner whitespace-pre-wrap">
                            {logs}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-white/10">
                <h2 className="text-emerald-500 dark:text-emerald-400 font-bold uppercase text-xs tracking-wider mb-4">Обучение</h2>
                <div className="flex items-center justify-between py-4">
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">Как пользоваться?</h3>
                    </div>
                    <button onClick={onReplayOnboarding} className="bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors">Показать</button>
                </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-red-200 dark:border-red-500/20">
                <h2 className="text-red-500 dark:text-red-400 font-bold uppercase text-xs tracking-wider mb-4">Опасная зона</h2>
                <button onClick={onReset} className="w-full py-3 border-2 border-red-500/50 text-red-500 dark:text-red-300 font-bold rounded-xl hover:bg-red-500/10 transition-colors">Сбросить весь прогресс</button>
            </div>
            
            <div 
                className={`text-center text-xs py-6 select-none cursor-pointer active:scale-95 transition-all duration-100 ${secretTaps > 0 ? 'text-slate-800 dark:text-slate-300 font-bold scale-105' : 'text-slate-500 dark:text-slate-600'}`}
                onClick={handleSecretTap}
            >
                Версия 2.4.6 (FK Fixed) <br/>
                Career Compass &copy; 2025
            </div>
        </div>
    );
};

export default SettingsScreen;
