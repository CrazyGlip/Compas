
import React, { useState, useMemo, useEffect } from 'react';
import type { Subject } from '../types';
import { defaultSubjects, mockColleges } from '../data/mockData';
import { restoreQuizzesFromMock } from '../services/dbSeeder';

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors group mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-semibold">Назад</span>
    </button>
);

const CalculatorView: React.FC<{ onCalculate: () => void; onNavigateToPlan: () => void }> = ({ onCalculate, onNavigateToPlan }) => {
    const [subjects, setSubjects] = useState<Subject[]>(() => {
        const savedSubjects = localStorage.getItem('calculatorSubjects');
        return savedSubjects ? JSON.parse(savedSubjects) : defaultSubjects;
    });
    const [averageScore, setAverageScore] = useState<number | null>(() => {
        const savedScore = localStorage.getItem('averageScore');
        return savedScore ? parseFloat(savedScore) : null;
    });
    
    const [manualInput, setManualInput] = useState<string>(averageScore ? averageScore.toString() : '');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        localStorage.setItem('calculatorSubjects', JSON.stringify(subjects));
        if (averageScore !== null) {
            localStorage.setItem('averageScore', averageScore.toString());
            setManualInput(averageScore.toFixed(2)); 
        }
    }, [subjects, averageScore]);

    const handleGradeChange = (id: string, grade: number) => {
        const newGrade = Math.max(0, Math.min(5, grade));
        setSubjects(prevSubjects =>
            prevSubjects.map(subject =>
                subject.id === id ? { ...subject, grade: newGrade } : subject
            )
        );
    };

    const handleFavoriteToggle = (id: string) => {
        setSubjects(prevSubjects =>
            prevSubjects.map(subject =>
                subject.id === id ? { ...subject, isFavorite: !subject.isFavorite } : subject
            )
        );
    };

    const playSuccessEffect = () => {
        const soundEnabled = localStorage.getItem('app_sound_enabled') !== 'false';
        if (soundEnabled) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
        }
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    const handleManualSave = () => {
        let val = parseFloat(manualInput.replace(',', '.'));
        if (!isNaN(val) && val >= 2.0 && val <= 5.0) {
            val = Math.floor(val * 100) / 100;
            setAverageScore(val);
            setManualInput(val.toFixed(2));
            playSuccessEffect();
            onCalculate();
        } else {
            alert("Пожалуйста, введите значение от 2.0 до 5.0");
        }
    };

    const handleCalculate = () => {
        playSuccessEffect();
        onCalculate();
        
        const filledSubjects = subjects.filter(s => s.grade > 0);
        if (filledSubjects.length > 0) {
            const totalWeightedGrade = filledSubjects.reduce((acc, subject) => acc + subject.grade * subject.weight, 0);
            const totalWeight = filledSubjects.reduce((acc, subject) => acc + subject.weight, 0);
            const avg = totalWeightedGrade / totalWeight;
            setAverageScore(Math.round(avg * 100) / 100);
        }
    };
    
    const scoreContext = useMemo(() => {
        if (averageScore === null) return null;
        const totalColleges = mockColleges.length;
        const passableColleges = mockColleges.filter(c => averageScore >= c.passingScore).length;
        return `Вы проходите в ${passableColleges} из ${totalColleges} колледжей`;
    }, [averageScore]);

    const hasFavorites = subjects.some(s => s.isFavorite);

    return (
         <div className="animate-fade-in relative">
            {showSuccess && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl animate-fade-in pointer-events-none">
                    <div className="bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transform scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-bold text-lg">Данные сохранены!</span>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-white/10">
                
                {averageScore !== null && (
                    <div className="mb-8 p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-2xl animate-fade-in-down border border-emerald-500/20 relative">
                        <button 
                            onClick={onNavigateToPlan}
                            className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1.5 rounded-lg shadow-md hover:bg-emerald-600 transition-colors flex items-center gap-1 text-xs font-bold"
                        >
                            <span>Готово</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </button>

                        <div className="text-center">
                            <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">Твой средний балл:</p>
                            <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 my-2">
                                {averageScore.toFixed(2)}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">{scoreContext}</p>
                        </div>
                    </div>
                )}

                <h2 className="text-2xl font-semibold mb-2 text-center text-slate-900 dark:text-white">Калькулятор и Интересы</h2>
                
                {averageScore !== null && (
                    <>
                        {hasFavorites ? (
                            <button 
                                onClick={onNavigateToPlan}
                                className="w-full p-4 rounded-xl mb-6 border transition-all duration-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30 hover:scale-[1.02] cursor-pointer group"
                            >
                                <div className="text-center text-sm text-emerald-700 dark:text-emerald-300 font-medium flex items-center justify-center gap-2">
                                    <span className="text-lg">✅</span>
                                    <span>Отлично! Интересы учтены.</span>
                                </div>
                                <div className="text-center text-emerald-600/70 dark:text-emerald-400/70 text-xs mt-1 font-bold flex items-center justify-center gap-1 group-hover:underline">
                                    Вернуться к плану
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </button>
                        ) : (
                            <div className="p-4 rounded-xl mb-6 border transition-all duration-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30 animate-pulse">
                                <p className="text-center text-sm text-amber-700 dark:text-amber-300 font-bold">
                                    <span className="mr-1">👉</span>
                                    Теперь отметьте сердечком <span className="text-rose-500 inline-block">❤️</span> ваши любимые предметы ниже!
                                </p>
                            </div>
                        )}
                    </>
                )}
                
                <div className="mb-8 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-white/10 border-dashed">
                    <label className="block text-slate-500 dark:text-slate-400 text-sm mb-3 font-medium text-center">Уже знаете свой средний балл?</label>
                    <div className="flex items-center justify-center gap-3 max-w-[240px] mx-auto">
                        <input
                            type="number"
                            step="0.01"
                            min="2"
                            max="5"
                            placeholder="—"
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            className="w-24 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl px-2 py-3 text-slate-900 dark:text-white font-bold text-3xl text-center focus:ring-2 focus:ring-sky-500 outline-none placeholder-slate-400 dark:placeholder-slate-600"
                        />
                        <button 
                            onClick={handleManualSave}
                            disabled={!manualInput}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Сохранить и применить"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="h-px bg-slate-200 dark:bg-slate-600 flex-1"></div>
                    <span className="text-slate-500 text-sm font-bold uppercase">Оценки и Интересы</span>
                    <div className="h-px bg-slate-200 dark:bg-slate-600 flex-1"></div>
                </div>

                {/* --- FIXED LAYOUT FOR TABLETS (GRID 60/40) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-6">
                    {subjects.map(subject => (
                        <div key={subject.id} className="grid grid-cols-[1fr_auto] items-center py-2 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                            <label 
                                className="text-slate-700 dark:text-slate-300 font-bold cursor-pointer truncate pr-2" 
                                onClick={() => handleFavoriteToggle(subject.id)}
                                title={subject.name}
                            >
                                {subject.name}
                            </label>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => handleFavoriteToggle(subject.id)}
                                    className={`p-1.5 rounded-full transition-all duration-300 transform active:scale-90 ${subject.isFavorite ? 'text-rose-500 bg-rose-100 dark:bg-rose-900/30' : 'text-slate-300 dark:text-slate-600 hover:text-rose-400'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${subject.isFavorite ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>

                                <input
                                    type="number"
                                    id={subject.id}
                                    value={subject.grade === 0 ? '' : subject.grade}
                                    onChange={(e) => handleGradeChange(subject.id, parseInt(e.target.value) || 0)}
                                    placeholder="—"
                                    min="2"
                                    max="5"
                                    className="w-12 h-9 text-center bg-slate-100 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-bold text-base focus:ring-2 focus:ring-brand-purple outline-none"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                
                <button onClick={handleCalculate} className="w-full bg-brand-purple text-white font-bold py-4 px-4 rounded-xl hover:opacity-90 transform hover:scale-[1.02] transition-all duration-300 shadow-lg flex items-center justify-center gap-2">
                    Рассчитать и Сохранить
                </button>
            </div>
        </div>
    );
}

const AdminPanel: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSeed = async () => {
        setStatus('loading');
        setMessage('Синхронизация данных с Supabase...');
        const result = await restoreQuizzesFromMock();
        if (result.success) {
            setStatus('success');
            setMessage(result.message);
        } else {
            setStatus('error');
            setMessage('Ошибка: ' + result.message);
        }
    };

    return (
        <div className="mt-8 bg-slate-100 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-300 dark:border-white/5 border-dashed">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Администрирование</h3>
            <button 
                onClick={handleSeed} 
                disabled={status === 'loading'}
                className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${status === 'loading' ? 'bg-slate-300 dark:bg-slate-700 cursor-wait' : status === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
            >
                {status === 'loading' ? 'Загрузка...' : 'Синхронизировать данные (RecSys 4.0)'}
            </button>
            {message && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">{message}</p>}
        </div>
    );
};

const ProfileScreen: React.FC<{ onBack: () => void; onCalculateScore: () => void; onNavigateToPlan: () => void; }> = ({ onBack, onCalculateScore, onNavigateToPlan }) => {
    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <BackButton onClick={onBack} />
            <CalculatorView onCalculate={onCalculateScore} onNavigateToPlan={onNavigateToPlan} />
            <AdminPanel />
        </div>
    );
};

export default ProfileScreen;
