
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { QuizScores, View, QuizScoresSwipe, QuizScoresBattle, DBQuiz, DBQuestion, UserQuizResult, Tag } from '../types';
import { api } from '../services/api';

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors group mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-semibold">Назад</span>
    </button>
);

const QuizSelectionView: React.FC<{ 
    onNavigate: (view: View) => void, 
    onBack: () => void, 
    isAdminMode?: boolean,
    aggregatedScores?: any,
    analysisCompleteness?: number,
    userQuizResults?: UserQuizResult[]
}> = ({ onNavigate, onBack, isAdminMode, aggregatedScores, analysisCompleteness, userQuizResults }) => {
    const [quizzes, setQuizzes] = useState<DBQuiz[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        const data = await api.getQuizzes();
        setQuizzes(data);
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const handleDeleteQuiz = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Вы уверены, что хотите удалить этот тест целиком?')) return;
        try {
            const res = await api.deleteQuiz(id);
            if (res.success) {
                setQuizzes(prev => prev.filter(q => q.id !== id));
            } else {
                alert('Ошибка удаления: ' + res.error);
            }
        } catch (e: any) { alert('Ошибка: ' + e.message); }
    };

    const hasResults = aggregatedScores && Object.keys(aggregatedScores).length > 0;
    const passedQuizIds = useMemo(() => (userQuizResults || []).map(r => r.quiz_id), [userQuizResults]);

    return (
        <div className="space-y-8 animate-fade-in relative">
            {isAdminMode && (
                <button 
                    onClick={() => onNavigate({ name: 'quizEditor' })}
                    className="fixed bottom-24 right-4 z-50 bg-green-600 text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition-transform hover:scale-110 active:scale-95 border-2 border-white/20"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
            )}

            <BackButton onClick={onBack} />
            
            {hasResults && (
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden mb-6 group cursor-pointer hover:scale-[1.02] transition-transform border border-white/10 ring-4 ring-violet-500/20"
                     onClick={() => onNavigate({ name: 'quizResult', scores: aggregatedScores, quizType: 'classic' })}>
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black mb-1">📊 Моя карта интересов</h2>
                            <p className="text-white/80 text-sm font-medium mb-2">Сводный анализ по всем тестам</p>
                            {analysisCompleteness !== undefined && (
                                <div className="inline-flex items-center bg-white/20 px-3 py-1 rounded-full text-xs font-bold border border-white/10 backdrop-blur-sm">
                                    <span className="mr-1 opacity-80">Точность:</span>
                                    <span className={(analysisCompleteness || 0) >= 80 ? 'text-green-300' : 'text-amber-300'}>{Math.round(analysisCompleteness)}%</span>
                                </div>
                            )}
                        </div>
                        <div className="bg-white/20 p-3 rounded-full backdrop-blur-md shadow-lg border border-white/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                    </div>
                </div>
            )}

            <h1 className="text-3xl font-bold text-center text-slate-900 dark:text-white">Выберите тест</h1>
            
            {loading ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-sky-500"></div></div>
            ) : (
                <div className="space-y-4">
                    {quizzes.map(quiz => {
                        const isPassed = passedQuizIds.includes(quiz.id);
                        return (
                            <div key={quiz.id} className="relative group">
                                <button 
                                    onClick={() => onNavigate({ name: 'quiz', quizId: quiz.id, quizType: quiz.type as any })}
                                    className={`w-full p-6 rounded-2xl text-left transition-all duration-300 cursor-pointer relative overflow-hidden bg-white dark:bg-slate-800/50 
                                        ${isPassed 
                                            ? 'border border-slate-200 dark:border-white/5 opacity-70 shadow-sm' 
                                            : 'border-2 border-sky-500/50 shadow-lg shadow-sky-500/20 hover:scale-[1.03]'
                                        }`}
                                >
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                                {quiz.title}
                                                {isPassed && <span className="text-emerald-500 text-lg">✅</span>}
                                            </h3>
                                            {!isPassed && <span className="bg-sky-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">Начать</span>}
                                        </div>
                                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{quiz.description}</p>
                                    </div>
                                </button>
                                
                                {isAdminMode && (
                                    <div className="absolute top-4 right-4 flex gap-2 z-20">
                                        <button onClick={(e) => { e.stopPropagation(); onNavigate({ name: 'quizEditor', quizId: quiz.id }); }} className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-sky-500 hover:text-white rounded-full transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                        <button onClick={(e) => handleDeleteQuiz(e, quiz.id)} className="p-2 bg-red-100 dark:bg-red-900/50 hover:bg-red-500 hover:text-white rounded-full transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const QuizScreen: React.FC<{ 
    onBack: () => void, 
    onNavigate: (view: View) => void, 
    quizType?: 'classic' | 'swipe' | 'battle' | 'klimov',
    quizId?: string,
    isAdminMode?: boolean,
    aggregatedScores?: any,
    analysisCompleteness?: number,
    onQuizComplete?: () => Promise<void>,
    userQuizResults?: UserQuizResult[]
}> = ({ onBack, onNavigate, quizType, quizId, isAdminMode, aggregatedScores, analysisCompleteness, onQuizComplete, userQuizResults }) => {
    
    const [questions, setQuestions] = useState<DBQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [quizTitle, setQuizTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!quizId) return;
        const load = async () => {
            setLoading(true);
            const data = await api.getQuizFull(quizId);
            if (data && data.questions) {
                setQuestions(data.questions);
                setQuizTitle(data.title);
            }
            setLoading(false);
        };
        load();
    }, [quizId]);

    const handleFinish = async (scores: any) => {
        if (!quizId || isSaving) return;
        setIsSaving(true);
        try {
            let topCat = 'unknown';
            const entries = Object.entries(scores);
            if (entries.length > 0) {
                topCat = entries.sort((a, b) => (b[1] as number) - (a[1] as number))[0][0];
            }
            await api.saveQuizResult(quizId, quizTitle, scores, topCat);
            if (onQuizComplete) await onQuizComplete();
            onNavigate({ name: 'quizResult', scores, quizType: quizType!, quizTitle, quizId });
        } catch (e) {
            console.error(e);
            alert("Ошибка сохранения результата.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!quizType || !quizId) {
        return <QuizSelectionView onNavigate={onNavigate} onBack={onBack} isAdminMode={isAdminMode} aggregatedScores={aggregatedScores} analysisCompleteness={analysisCompleteness} userQuizResults={userQuizResults} />;
    }

    if (loading || isSaving) return (
        <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
            {isSaving && <p className="text-slate-500 font-bold animate-pulse">Сохраняем результат...</p>}
        </div>
    );

    return (
        <div className="animate-fade-in pb-12">
            {quizType === 'classic' && <ClassicQuizView questions={questions} onFinish={handleFinish} onBack={onBack} />}
            {(quizType === 'battle' || quizType === 'klimov') && <BattleQuizView questions={questions} onFinish={handleFinish} onBack={onBack} />}
            {quizType === 'swipe' && <SwipeQuizView questions={questions} onFinish={handleFinish} onBack={onBack} />}
        </div>
    );
};

// --- SUB-VIEWS WITH RESTORED DESIGN ---

const ClassicQuizView: React.FC<{ questions: DBQuestion[], onFinish: (scores: QuizScores) => void, onBack: () => void }> = ({ questions, onFinish, onBack }) => {
    const [userAnswers, setUserAnswers] = useState<string[]>(new Array(questions.length).fill(null));
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const handleAnswer = (category: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = category;
        setUserAnswers(newAnswers);
        if (currentQuestionIndex < questions.length - 1) {
            setTimeout(() => setCurrentQuestionIndex(currentQuestionIndex + 1), 200);
        } else {
            const finalScores: any = {};
            newAnswers.forEach(cat => { if (cat) finalScores[cat] = (finalScores[cat] || 0) + 1; });
            onFinish(finalScores);
        }
    };
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <span className="font-bold text-slate-500 uppercase text-xs tracking-widest">Вопрос {currentQuestionIndex + 1} / {questions.length}</span>
                <div className="w-6"></div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full mb-8 overflow-hidden">
                <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
            </div>
            <h3 className="text-2xl font-bold text-center mb-10 text-slate-900 dark:text-white leading-tight">{currentQuestion.text}</h3>
            <div className="grid gap-3">
                {currentQuestion.answers?.map(ans => (
                    <button key={ans.id} onClick={() => handleAnswer(ans.target_category)} className="w-full p-5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-2xl hover:bg-sky-500 hover:text-white hover:border-sky-400 transition-all text-left font-bold shadow-sm">
                        {ans.text}
                    </button>
                ))}
            </div>
        </div>
    );
};

const BattleQuizView: React.FC<{ questions: DBQuestion[], onFinish: (scores: QuizScoresBattle) => void, onBack: () => void }> = ({ questions, onFinish, onBack }) => {
    const [scores, setScores] = useState<QuizScoresBattle>({});
    const [idx, setIdx] = useState(0);
    const handleChoice = (cat: string) => {
        const next = { ...scores, [cat]: (scores[cat] || 0) + 1 };
        setScores(next);
        if (idx < questions.length - 1) setIdx(idx + 1);
        else onFinish(next);
    };
    const q = questions[idx];
    if (!q || !q.answers) return null;
    return (
        <div className="flex flex-col h-[75vh] bg-slate-900 rounded-[2.5rem] overflow-hidden relative border-4 border-slate-800 shadow-2xl">
             <div className="absolute top-4 left-4 z-20"><button onClick={onBack} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button></div>
             <div className="grid grid-rows-2 h-full">
                {q.answers.slice(0,2).map((ans, i) => (
                    <div key={ans.id} onClick={() => handleChoice(ans.target_category)} className={`relative group cursor-pointer overflow-hidden flex items-center justify-center ${i === 0 ? 'border-b-2 border-white/10' : ''}`}>
                        {ans.image_url ? (
                            <img src={ans.image_url} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 group-hover:opacity-80 transition-all duration-700" />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                        <span className="relative z-10 text-2xl font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] text-center px-8 uppercase tracking-tighter italic">{ans.text}</span>
                    </div>
                ))}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white text-black font-black w-14 h-14 flex items-center justify-center rounded-full shadow-[0_0_30px_rgba(255,255,255,0.4)] border-4 border-slate-900 italic transform -rotate-12">VS</div>
             </div>
        </div>
    );
};

const SwipeQuizView: React.FC<{ questions: DBQuestion[], onFinish: (scores: QuizScoresSwipe) => void, onBack: () => void }> = ({ questions, onFinish, onBack }) => {
    const [scores, setScores] = useState<QuizScoresSwipe>({});
    const [idx, setIdx] = useState(0);
    const [offsetX, setOffsetX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        setIsDragging(true);
        startX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDragging) return;
        const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        setOffsetX(currentX - startX.current);
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (offsetX > 100) handleSwipe(true);
        else if (offsetX < -100) handleSwipe(false);
        else setOffsetX(0);
    };

    const handleSwipe = (yes: boolean) => {
        const cat = questions[idx].payload?.category;
        const next = { ...scores };
        if (yes && cat) next[cat] = (next[cat] || 0) + 1;
        
        if (idx < questions.length - 1) {
            setScores(next);
            setIdx(idx + 1);
            setOffsetX(0);
        } else {
            onFinish(next);
        }
    };

    const q = questions[idx];
    const rotation = offsetX / 10;
    const opacity = Math.min(1, Math.abs(offsetX) / 100);

    return (
        <div className="h-[70vh] flex flex-col items-center justify-center p-4 relative select-none">
            <div className="absolute top-0 left-0 right-0 flex justify-between p-4 z-10">
                <button onClick={onBack} className="text-slate-400 p-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <div className="text-slate-400 font-black text-xl italic tracking-tighter">#{idx + 1} / {questions.length}</div>
            </div>

            <div 
                className="relative w-full max-w-sm aspect-[3/4] bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border-4 border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-8 transition-transform duration-100 ease-out cursor-grab active:cursor-grabbing transform-gpu overflow-hidden"
                style={{ transform: `translateX(${offsetX}px) rotate(${rotation}deg)` }}
                onMouseDown={handleTouchStart}
                onMouseMove={handleTouchMove}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Visual Feedback Overlays */}
                <div className="absolute inset-0 bg-emerald-500 flex items-center justify-center text-6xl font-black text-white transition-opacity" style={{ opacity: offsetX > 0 ? opacity * 0.4 : 0 }}>ДА</div>
                <div className="absolute inset-0 bg-rose-500 flex items-center justify-center text-6xl font-black text-white transition-opacity" style={{ opacity: offsetX < 0 ? opacity * 0.4 : 0 }}>НЕТ</div>

                <div className="text-7xl mb-8 filter drop-shadow-xl animate-bounce">🤔</div>
                <h3 className="text-2xl md:text-3xl font-black text-center text-slate-900 dark:text-white leading-tight">{q.text}</h3>
                <div className="absolute bottom-8 text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">Свайпай: влево или вправо</div>
            </div>

            <div className="flex gap-12 mt-12">
                <button onClick={() => handleSwipe(false)} className="w-16 h-16 bg-white dark:bg-slate-800 text-rose-500 rounded-full text-2xl shadow-xl border-b-4 border-rose-200 dark:border-rose-900 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center">✕</button>
                <button onClick={() => handleSwipe(true)} className="w-16 h-16 bg-sky-500 text-white rounded-full text-2xl shadow-xl shadow-sky-500/30 border-b-4 border-sky-700 active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center">♥</button>
            </div>
        </div>
    );
};

export default QuizScreen;
