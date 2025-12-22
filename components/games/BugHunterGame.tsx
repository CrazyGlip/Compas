
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface CodeSnippet {
    id: number;
    language: 'js' | 'python';
    lines: string[];
    errorLineIndex: number;
    hint: string;
    description: string;
}

const SNIPPETS: CodeSnippet[] = [
    {
        id: 1,
        language: 'python',
        lines: [
            "def calculate_area(radius):",
            "    pi = 3.14",
            "    area = pi * radius ^ 2",
            "    return area",
            "print(calculate_area(5))"
        ],
        errorLineIndex: 2,
        hint: "Как в Python возводят в степень?",
        description: "Оператор '^' — это XOR. Для возведения в степень в Python используется '**'."
    },
    {
        id: 2,
        language: 'js',
        lines: [
            "function greet(name) {",
            "  if (name = 'Alice') {",
            "    return 'Hello Boss';",
            "  }",
            "  return 'Hello Guest';",
            "}"
        ],
        errorLineIndex: 1,
        hint: "Сравнение или присваивание?",
        description: "Одиночное '=' присваивает значение, что делает условие всегда истинным. Нужно '==='."
    },
    {
        id: 3,
        language: 'js',
        lines: [
            "const colors = ['red', 'blue'];",
            "console.log(colors[2]);",
            "// Array length is 2",
            "// Expecting 'undefined' error",
            "process.exit(0);"
        ],
        errorLineIndex: 1,
        hint: "Проверь границы массива.",
        description: "Индексация начинается с 0. Для массива из 2 элементов допустимы индексы 0 и 1."
    },
    {
        id: 4,
        language: 'python',
        lines: [
            "items = [1, 2, 3]",
            "for i in range(len(items)):",
            "    print(items[i+1])",
            "    # logic here",
            "print('Done')"
        ],
        errorLineIndex: 2,
        hint: "IndexError скоро случится...",
        description: "При i = 2 (последний элемент), индекс i+1 (3) выходит за пределы массива."
    }
];

const BugHunterGame: React.FC<{ onBack: () => void; onWin: (score: number) => void }> = ({ onBack, onWin }) => {
    const [levelIndex, setLevelIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [gameState, setGameState] = useState<'tutorial' | 'playing' | 'won' | 'lost' | 'level_complete'>('tutorial');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', lineIndex: number } | null>(null);
    const [timeLeft, setTimeLeft] = useState(30.0);
    const [shuffledLevels, setShuffledLevels] = useState<CodeSnippet[]>([]);
    
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        setShuffledLevels([...SNIPPETS].sort(() => 0.5 - Math.random()));
    }, []);

    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0.1) {
                    handleTimeOut();
                    return 0;
                }
                return parseFloat((prev - 0.1).toFixed(1));
            });
        }, 100);
    }, [levelIndex]);

    const handleTimeOut = () => {
        setLives(l => {
            const next = l - 1;
            if (next <= 0) setGameState('lost');
            else handleNextLevel(false);
            return next;
        });
    };

    const handleLineClick = (index: number) => {
        if (gameState !== 'playing' || feedback) return;
        
        const currentSnippet = shuffledLevels[levelIndex];
        if (index === currentSnippet.errorLineIndex) {
            setFeedback({ type: 'success', lineIndex: index });
            setScore(s => s + 200 + Math.ceil(timeLeft * 10));
            if (timerRef.current) clearInterval(timerRef.current);
            setTimeout(() => setGameState('level_complete'), 1000);
        } else {
            setFeedback({ type: 'error', lineIndex: index });
            if (navigator.vibrate) navigator.vibrate(100);
            setTimeout(() => {
                setFeedback(null);
                setLives(l => {
                    const next = l - 1;
                    if (next <= 0) setGameState('lost');
                    return next;
                });
            }, 800);
        }
    };

    const handleNextLevel = (wonLevel: boolean = true) => {
        setFeedback(null);
        setTimeLeft(30.0);
        if (wonLevel && levelIndex >= shuffledLevels.length - 1) {
            setGameState('won');
        } else {
            setLevelIndex(prev => (prev + 1) % shuffledLevels.length);
            setGameState('playing');
            startTimer();
        }
    };

    const handleFinish = () => {
        onWin(score);
        onBack();
    };

    if (shuffledLevels.length === 0) return null;
    const currentSnippet = shuffledLevels[levelIndex];

    return (
        <div className="min-h-screen bg-slate-950 text-emerald-500 font-mono flex flex-col p-4 relative overflow-hidden select-none">
            {/* CRT Effect Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%] opacity-20"></div>
            
            {/* Header */}
            <div className="z-10 flex justify-between items-center mb-6 border-b border-emerald-900 pb-4">
                <button onClick={onBack} className="px-3 py-1 bg-emerald-900/30 border border-emerald-500 text-emerald-400 font-bold rounded hover:bg-emerald-500/20 active:scale-95 transition-all">ВЫХОД</button>
                <div className="text-center">
                    <div className="text-[10px] text-emerald-800 uppercase font-black tracking-widest">DEBUG_MODE_v4.0</div>
                    <div className={`text-2xl font-black tabular-nums ${timeLeft < 5 ? 'text-red-500 animate-pulse' : ''}`}>{timeLeft.toFixed(1)}s</div>
                </div>
                <div className="text-right">
                    <div className="text-xl font-black text-white">{score.toString().padStart(6, '0')}</div>
                    <div className="flex justify-end gap-1 mt-1">
                        {[...Array(3)].map((_, i) => (
                            <span key={i} className={`text-sm ${i < lives ? 'text-red-500 shadow-[0_0_5px_red]' : 'text-emerald-950'}`}>♥</span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center z-10 w-full">
                {gameState === 'tutorial' && (
                    <div className="p-8 border-2 border-emerald-500 bg-emerald-950/20 rounded-2xl text-center max-w-sm shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                        <div className="text-6xl mb-6">🐛</div>
                        <h2 className="text-2xl font-black mb-4 tracking-tighter">ОБНАРУЖЕН ВИРУС</h2>
                        <p className="text-xs text-emerald-400 mb-8 leading-relaxed">
                            Система повреждена. Найди строку с критической ошибкой в коде, пока таймер не обнулился. Одно неверное нажатие — и система рухнет.
                        </p>
                        <button onClick={() => { setGameState('playing'); startTimer(); }} className="w-full py-4 bg-emerald-600 text-black font-black rounded-xl uppercase tracking-widest hover:bg-emerald-500 transition-all active:scale-95 shadow-lg">
                            [ ИНИЦИАЛИЗИРОВАТЬ ]
                        </button>
                    </div>
                )}

                {(gameState === 'playing' || gameState === 'level_complete') && (
                    <div className="w-full max-w-2xl bg-black/80 border border-emerald-800 rounded-xl p-2 relative shadow-2xl">
                        <div className="absolute top-0 left-0 right-0 h-6 bg-emerald-900/20 flex items-center px-3 border-b border-emerald-900/50">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            </div>
                            <span className="ml-4 text-[10px] font-bold text-emerald-700 uppercase">source_file.{currentSnippet.language}</span>
                        </div>

                        <div className="pt-8 pb-4 px-2 space-y-1 overflow-x-auto">
                            {currentSnippet.lines.map((line, idx) => {
                                let statusClass = '';
                                if (feedback?.lineIndex === idx) {
                                    statusClass = feedback.type === 'success' ? 'bg-emerald-500/20 border-emerald-500' : 'bg-red-900/40 border-red-500 animate-shake';
                                }

                                return (
                                    <div 
                                        key={idx} 
                                        onClick={() => handleLineClick(idx)}
                                        className={`flex items-start gap-4 p-2.5 rounded border border-transparent transition-all duration-200 cursor-pointer hover:bg-emerald-900/10 group ${statusClass}`}
                                    >
                                        <span className="text-emerald-900 font-bold w-6 text-right select-none group-hover:text-emerald-500">{(idx + 1).toString().padStart(2, '0')}</span>
                                        <code className="text-sm md:text-base whitespace-pre text-emerald-300">
                                            {line.split(/(\W+)/).map((part, pidx) => {
                                                const keywords = ['def', 'return', 'if', 'function', 'const', 'for', 'while'];
                                                const isKey = keywords.includes(part);
                                                return <span key={pidx} className={isKey ? 'text-purple-400' : 'text-emerald-300'}>{part}</span>
                                            })}
                                        </code>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-2 p-3 bg-emerald-950/30 rounded-lg border-t border-emerald-900/50 flex items-center gap-3">
                            <span className="text-[10px] font-black bg-emerald-500 text-black px-1.5 py-0.5 rounded">HINT</span>
                            <p className="text-xs text-emerald-400 italic">"{currentSnippet.hint}"</p>
                        </div>
                    </div>
                )}

                {gameState === 'level_complete' && (
                    <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-black text-4xl mb-6 shadow-[0_0_30px_rgba(16,185,129,0.5)]">✓</div>
                        <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">Баг Устранен</h2>
                        <p className="text-emerald-400 text-sm max-w-xs mb-8 leading-relaxed">
                            {currentSnippet.description}
                        </p>
                        <button onClick={() => handleNextLevel(true)} className="px-10 py-4 bg-emerald-600 text-black font-black rounded-xl uppercase tracking-widest hover:bg-emerald-500 transition-all">
                            СЛЕДУЮЩИЙ СЕКТОР
                        </button>
                    </div>
                )}

                {(gameState === 'lost' || gameState === 'won') && (
                    <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 z-30 text-center animate-fade-in">
                        <div className="text-8xl mb-8">{gameState === 'won' ? '👑' : '👾'}</div>
                        <h2 className={`text-4xl font-black mb-2 uppercase italic ${gameState === 'won' ? 'text-yellow-400' : 'text-red-600'}`}>
                            {gameState === 'won' ? 'ЭЛИТНЫЙ ХАКЕР' : 'СИСТЕМНЫЙ КРАХ'}
                        </h2>
                        <p className="text-slate-500 text-sm mb-10 max-w-xs">
                            {gameState === 'won' 
                                ? 'Все угрозы нейтрализованы. Вы доказали своё мастерство отладки.' 
                                : 'Вирус захватил ядро. Пароли скомпрометированы. Соединение разорвано.'}
                        </p>
                        <div className="bg-black border border-emerald-900 p-6 rounded-3xl mb-10 w-full max-w-xs">
                            <span className="text-[10px] text-emerald-800 uppercase block mb-1 font-black">Score_Data</span>
                            <span className="text-5xl font-black text-emerald-500 tracking-tighter tabular-nums">{score}</span>
                        </div>
                        <button onClick={handleFinish} className="w-full max-w-xs py-5 bg-white text-black font-black uppercase rounded-2xl hover:bg-emerald-400 transition-all active:scale-95 shadow-xl">
                            ВЫЙТИ ИЗ КОНСОЛИ
                        </button>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
                .animate-shake { animation: shake 0.2s infinite; }
            `}} />
        </div>
    );
};

export default BugHunterGame;
