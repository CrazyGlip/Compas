
import React, { useState, useEffect, useRef, useCallback } from 'react';

type TriageCategory = 'urgent' | 'stable' | 'home';

interface Patient {
    id: string;
    name: string;
    age: number;
    pulse: number;
    temp: number;
    spO2: number;
    bp: string;
    complaint: string;
    correctCategory: TriageCategory;
    isPediatric: boolean;
}

const COMPLAINTS: Record<TriageCategory, string[]> = {
    urgent: [
        "Острая боль в груди (сжимающая)",
        "Отек лица и гортани, удушье",
        "Тяжелая черепно-мозговая травма",
        "Сатурация 85%, цианоз",
        "Судорожный приступ"
    ],
    stable: [
        "Рваная рана предплечья (кровь ост.)",
        "Подозрение на перелом голени",
        "Высокое давление (170/100), головная боль",
        "Почечная колика",
        "Боли в животе (подозрение на аппендицит)"
    ],
    home: [
        "Насморк и температура 37.2",
        "Плановый осмотр для справки",
        "Старый ушиб пальца (3 дня назад)",
        "Покраснение глаза без боли",
        "Общая слабость, плохой сон"
    ]
};

const TriageGame: React.FC<{ onBack: () => void; onWin: (score: number) => void }> = ({ onBack, onWin }) => {
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'lost' | 'won'>('intro');
    const [patient, setPatient] = useState<Patient | null>(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [timeLeft, setTimeLeft] = useState(12.0);
    const [solvedCount, setSolvedCount] = useState(0);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const generatePatient = useCallback(() => {
        const rand = Math.random();
        let category: TriageCategory;
        
        if (rand < 0.35) category = 'home';
        else if (rand < 0.7) category = 'stable';
        else category = 'urgent';

        const list = COMPLAINTS[category];
        const complaint = list[Math.floor(Math.random() * list.length)];

        setPatient({
            id: Math.random().toString(36).substr(2, 5).toUpperCase(),
            name: "Пациент-" + Math.floor(Math.random() * 1000),
            age: Math.floor(Math.random() * 60) + 18,
            pulse: category === 'urgent' ? 140 : (category === 'stable' ? 100 : 72),
            temp: category === 'home' ? 37.1 : (category === 'urgent' ? 39.5 : 36.6),
            spO2: category === 'urgent' ? 88 : (category === 'stable' ? 95 : 99),
            bp: category === 'urgent' ? "190/115" : (category === 'stable' ? "150/90" : "120/80"),
            complaint,
            correctCategory: category,
            isPediatric: false
        });

        setTimeLeft(Math.max(6, 12 - solvedCount * 0.5));
    }, [solvedCount]);

    const handleChoice = (choice: TriageCategory | null) => {
        if (!patient) return;

        if (choice === patient.correctCategory) {
            setScore(s => s + 100 + Math.ceil(timeLeft * 10));
            setSolvedCount(prev => prev + 1);
            if (score + 100 > 1500) setGameState('won');
            else generatePatient();
        } else {
            setLives(l => {
                const next = l - 1;
                if (next <= 0) setGameState('lost');
                else generatePatient();
                return next;
            });
            if (navigator.vibrate) navigator.vibrate(200);
        }
    };

    useEffect(() => {
        if (gameState === 'playing') {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 0.1) {
                        handleChoice(null);
                        return 0;
                    }
                    return parseFloat((prev - 0.1).toFixed(1));
                });
            }, 100);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [gameState, patient]);

    const startGame = () => {
        setGameState('playing');
        setScore(0);
        setLives(3);
        setSolvedCount(0);
        generatePatient();
    };

    const handleFinish = () => {
        onWin(score);
        onBack();
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-mono flex flex-col p-4 overflow-hidden relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500 via-transparent to-transparent"></div>
            
            {/* Header */}
            <div className="z-50 flex justify-between items-center p-3 bg-slate-900 border-b border-sky-500/30 rounded-t-xl backdrop-blur-md">
                <button onClick={onBack} className="px-3 py-1 bg-slate-800 rounded-lg text-red-500 font-bold border border-white/10 active:scale-95 transition-all">ВЫХОД</button>
                <div className="text-center">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Принятие решения</span>
                    <span className={`text-2xl font-black ${timeLeft < 3 ? 'text-red-500 animate-pulse' : 'text-sky-400'}`}>{timeLeft.toFixed(1)}с</span>
                </div>
                <div className="text-right">
                    <div className="flex gap-1 justify-end mb-1">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={`w-3 h-3 rotate-45 ${i < lives ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-slate-800'}`}></div>
                        ))}
                    </div>
                    <span className="text-green-400 font-black text-sm">{score} XP</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-6 relative z-10">
                {gameState === 'intro' && (
                    <div className="text-center p-8 bg-slate-900 border-2 border-sky-500/30 rounded-[3rem] shadow-2xl max-w-sm animate-fade-in">
                        <div className="text-7xl mb-6">🚑</div>
                        <h1 className="text-2xl font-black mb-4 uppercase tracking-tighter italic">Неотложка: Вызов</h1>
                        <p className="text-slate-400 text-xs mb-8 leading-relaxed">
                            Вы — диспетчер приёмного отделения. <br/>
                            Ваша задача — за секунды оценить тяжесть состояния и распределить пациентов по потокам. Ошибка стоит жизни.
                        </p>
                        <button onClick={startGame} className="w-full py-5 bg-red-600 text-white font-black rounded-2xl shadow-xl hover:bg-red-500 transition-colors uppercase tracking-widest text-sm">
                            ПРИСТУПИТЬ К ДЕЖУРСТВУ
                        </button>
                    </div>
                )}

                {gameState === 'playing' && patient && (
                    <div className="w-full max-w-md space-y-4 animate-fade-in">
                        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3"><span className="text-[10px] font-bold bg-white text-black px-2 py-0.5 rounded italic">CASE ID: {patient.id}</span></div>
                            
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl">👤</div>
                                <div>
                                    <h3 className="font-bold text-lg">{patient.age} лет, Мужчина</h3>
                                    <p className="text-sky-400 text-sm italic">«{patient.complaint}»</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-slate-500 block font-bold">ПУЛЬС</span>
                                    <span className={`text-xl font-black ${patient.pulse > 120 ? 'text-red-500' : 'text-emerald-400'}`}>{patient.pulse} BPM</span>
                                </div>
                                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-slate-500 block font-bold">ДАВЛЕНИЕ</span>
                                    <span className="text-xl font-black text-white">{patient.bp}</span>
                                </div>
                                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-slate-500 block font-bold">SpO2</span>
                                    <span className={`text-xl font-black ${patient.spO2 < 92 ? 'text-red-500' : 'text-emerald-400'}`}>{patient.spO2}%</span>
                                </div>
                                <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-slate-500 block font-bold">ТЕМП.</span>
                                    <span className={`text-xl font-black ${patient.temp > 38 ? 'text-red-400' : 'text-white'}`}>{patient.temp}°C</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <button onClick={() => handleChoice('urgent')} className="py-5 bg-red-600/20 border-2 border-red-600 text-red-500 font-black rounded-2xl uppercase hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95">
                                [ КРАСНЫЙ ] КРИТИЧЕСКОЕ
                            </button>
                            <button onClick={() => handleChoice('stable')} className="py-5 bg-amber-500/10 border-2 border-amber-500 text-amber-500 font-black rounded-2xl uppercase hover:bg-amber-500 hover:text-white transition-all shadow-lg active:scale-95">
                                [ ЖЕЛТЫЙ ] СТАБИЛЬНОЕ
                            </button>
                            <button onClick={() => handleChoice('home')} className="py-5 bg-emerald-500/10 border-2 border-emerald-500 text-emerald-500 font-black rounded-2xl uppercase hover:bg-emerald-500 hover:text-white transition-all shadow-lg active:scale-95">
                                [ ЗЕЛЕНЫЙ ] АМБУЛАТОРНО
                            </button>
                        </div>
                    </div>
                )}

                {(gameState === 'lost' || gameState === 'won') && (
                    <div className="text-center p-10 bg-slate-900 border-2 border-white/10 rounded-[3rem] shadow-2xl max-w-sm">
                        <div className="text-7xl mb-6">{gameState === 'won' ? '🎖️' : '☠️'}</div>
                        <h2 className="text-3xl font-black mb-2 uppercase italic">{gameState === 'won' ? 'Герой Смены' : 'Дежурство окончено'}</h2>
                        <p className="text-slate-500 text-xs mb-8 leading-relaxed">
                            {gameState === 'won' 
                                ? 'Вы успешно обработали всех пациентов. Ваша эффективность заслуживает повышения!' 
                                : 'Критическая ошибка привела к внутреннему расследованию. Лицензия отозвана.'}
                        </p>
                        <div className="bg-black/50 p-5 rounded-3xl mb-8 border border-white/5">
                            <span className="text-[10px] text-slate-500 uppercase block mb-1 font-bold">Эффективность</span>
                            <span className="text-4xl font-black text-sky-400">{score}</span>
                        </div>
                        <button onClick={handleFinish} className="w-full py-4 bg-white text-black font-black uppercase rounded-2xl hover:bg-sky-400 transition-all shadow-lg active:scale-95">
                            ВЕРНУТЬСЯ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TriageGame;
