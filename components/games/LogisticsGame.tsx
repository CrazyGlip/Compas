
import React, { useState, useEffect, useRef, useCallback } from 'react';

type CargoType = 'standard' | 'fragile' | 'hazard' | 'express';

interface Cargo {
    id: string;
    type: CargoType;
    lane: number; 
    progress: number; 
    isDragging?: boolean;
    dragX?: number; 
    isDeactivated?: boolean; 
    isBroken?: boolean;
    stress: number; // 0 to 100 for fragile items
    isProcessed?: boolean;
}

interface LaneConfig {
    id: number;
    color: string;
    label: string;
    accepts: CargoType[];
}

const LANES: LaneConfig[] = [
    { id: 0, color: 'from-blue-600 to-blue-900', label: 'СЕКТОР_А', accepts: ['standard'] },
    { id: 1, color: 'from-amber-600 to-amber-900', label: 'СЕКТОР_Б', accepts: ['fragile', 'hazard'] },
    { id: 2, color: 'from-purple-600 to-purple-900', label: 'СЕКТОР_В', accepts: ['express'] }
];

const CARGO_DATA: Record<CargoType, { icon: string, brokenIcon: string, color: string, points: number }> = {
    standard: { icon: '📦', brokenIcon: '📦', color: 'text-blue-400', points: 100 },
    fragile:  { icon: '🏺', brokenIcon: '🏚️', color: 'text-amber-400', points: 200 },
    hazard:   { icon: '☢️', brokenIcon: '💥', color: 'text-red-500', points: 300 },
    express:  { icon: '🚀', brokenIcon: '🚀', color: 'text-fuchsia-400', points: 500 }
};

const LogisticsGame: React.FC<{ onBack: () => void; onWin: (score: number) => void }> = ({ onBack, onWin }) => {
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'lost' | 'won'>('intro');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [timeLeft, setTimeLeft] = useState(60.0);
    const [isShaking, setIsShaking] = useState(false);

    const cargosRef = useRef<Cargo[]>([]);
    const requestRef = useRef<number>(null);
    const lastSpawnTime = useRef<number>(0);
    const intensityRef = useRef(1);
    const dragRef = useRef<{ id: string, startX: number, originalLane: number, lastMoveX: number } | null>(null);

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    };

    const spawnCargo = useCallback(() => {
        const rand = Math.random();
        let type: CargoType = 'standard';
        
        if (rand < 0.15) type = 'hazard';
        else if (rand < 0.35) type = 'fragile';
        else if (rand < 0.45) type = 'express';

        const newCargo: Cargo = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            lane: Math.floor(Math.random() * 3),
            progress: -15,
            isDeactivated: false,
            isBroken: false,
            stress: 0
        };
        cargosRef.current.push(newCargo);
    }, []);

    const update = useCallback((time: number) => {
        if (gameState !== 'playing') return;

        const spawnInterval = Math.max(800, 2500 - intensityRef.current * 400);
        if (time - lastSpawnTime.current > spawnInterval) {
            spawnCargo();
            lastSpawnTime.current = time;
        }

        let damage = 0;
        let points = 0;

        const nextCargos = cargosRef.current.map(c => {
            if (c.isProcessed) return c;
            
            // Естественное снижение стресса со временем, если груз не трогают
            let newStress = c.stress;
            if (!c.isDragging && newStress > 0) newStress = Math.max(0, newStress - 0.5);

            const speed = (c.type === 'express' ? 0.45 : 0.25) * intensityRef.current;
            const newProgress = c.progress + speed;

            if (newProgress >= 90 && !c.isProcessed) {
                const laneConfig = LANES[c.lane];
                const isCorrect = laneConfig.accepts.includes(c.type);

                if (isCorrect && !c.isBroken) {
                    if (c.type === 'hazard' && !c.isDeactivated) {
                        damage++; 
                    } else {
                        points += CARGO_DATA[c.type].points;
                    }
                } else {
                    damage++;
                }
                return { ...c, progress: 110, isProcessed: true };
            }
            
            return { ...c, progress: newProgress, stress: newStress };
        }).filter(c => c.progress < 105);

        if (damage > 0) {
            triggerShake();
            setLives(l => {
                const next = l - damage;
                if (next <= 0) setGameState('lost');
                return next;
            });
        }

        if (points > 0) setScore(s => s + points);

        cargosRef.current = nextCargos;
        setCargos([...nextCargos]);

        setTimeLeft(prev => {
            const next = prev - 0.016;
            if (next <= 0) {
                setGameState('won');
                return 0;
            }
            intensityRef.current = 1 + (60 - next) / 30;
            return next;
        });

        requestRef.current = requestAnimationFrame(update);
    }, [gameState, spawnCargo]);

    useEffect(() => {
        if (gameState === 'playing') {
            requestRef.current = requestAnimationFrame(update);
        } else if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [gameState, update]);

    const onPointerDown = (e: React.PointerEvent, cargo: Cargo) => {
        if (gameState !== 'playing' || cargo.isBroken) return;
        
        if (cargo.type === 'hazard' && !cargo.isDeactivated) {
            cargosRef.current = cargosRef.current.map(c => 
                c.id === cargo.id ? { ...c, isDeactivated: true } : c
            );
            setScore(s => s + 50);
            return;
        }

        dragRef.current = {
            id: cargo.id,
            startX: e.clientX,
            originalLane: cargo.lane,
            lastMoveX: e.clientX
        };
        
        cargosRef.current = cargosRef.current.map(c => 
            c.id === cargo.id ? { ...c, isDragging: true, dragX: 0 } : c
        );
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!dragRef.current) return;
        
        const deltaX = e.clientX - dragRef.current.startX;
        const movementX = Math.abs(e.clientX - dragRef.current.lastMoveX);
        dragRef.current.lastMoveX = e.clientX;

        const screenThird = window.innerWidth / 3;
        let laneOffset = Math.round(deltaX / screenThird);
        let newLane = Math.max(0, Math.min(2, dragRef.current.originalLane + laneOffset));

        cargosRef.current = cargosRef.current.map(c => {
            if (c.id !== dragRef.current?.id) return c;

            let newStress = c.stress;
            let isBroken = c.isBroken;

            // Логика стресса для хрупких грузов
            if (c.type === 'fragile' && !isBroken) {
                // Если скорость движения слишком высокая (> 15 пикселей за кадр)
                if (movementX > 15) {
                    newStress = Math.min(100, newStress + movementX * 0.4);
                } else if (newStress > 0) {
                    newStress = Math.max(0, newStress - 0.2);
                }

                if (newStress >= 100) {
                    isBroken = true;
                    if (navigator.vibrate) navigator.vibrate(200);
                }
            }

            return { ...c, dragX: deltaX, lane: newLane, stress: newStress, isBroken };
        });
    };

    const onPointerUp = () => {
        if (!dragRef.current) return;
        cargosRef.current = cargosRef.current.map(c => 
            c.id === dragRef.current?.id ? { ...c, isDragging: false, dragX: 0 } : c
        );
        dragRef.current = null;
    };

    const startGame = () => {
        cargosRef.current = [];
        intensityRef.current = 1;
        setGameState('playing');
        setScore(0);
        setLives(3);
        setTimeLeft(60.0);
        lastSpawnTime.current = performance.now();
    };

    return (
        <div 
            className={`fixed inset-0 bg-[#020617] text-white font-mono flex flex-col overflow-hidden select-none touch-none ${isShaking ? 'animate-shake-heavy' : ''}`}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
        >
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            </div>

            {/* Header */}
            <div className="z-50 p-6 flex justify-between items-center bg-slate-900/80 border-b border-blue-500/30 backdrop-blur-xl">
                <button onClick={onBack} className="p-3 bg-slate-800 border border-white/10 rounded-xl hover:bg-slate-700 transition-all font-black text-xs">
                    В_МЕНЮ
                </button>
                
                <div className="text-center">
                    <div className="text-[10px] text-blue-400 font-black uppercase tracking-[0.4em] mb-1">СОРТИРОВКА</div>
                    <div className={`text-4xl font-black tabular-nums ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {timeLeft.toFixed(1)}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1.5">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={`w-4 h-4 rounded-sm border-2 ${i < lives ? 'bg-red-500 shadow-[0_0_15px_red] border-red-400' : 'bg-transparent border-white/10'}`}></div>
                        ))}
                    </div>
                    <div className="text-2xl font-black text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                        {score.toString().padStart(5, '0')}
                    </div>
                </div>
            </div>

            {/* Main Sorting Area */}
            <div className="flex-1 flex relative px-4 gap-4 py-8">
                {LANES.map(lane => (
                    <div key={lane.id} className="flex-1 relative group">
                        <div className="absolute inset-0 bg-slate-900/40 rounded-[2rem] border border-white/5 overflow-hidden">
                             <div className="absolute inset-0 opacity-10 animate-conveyor" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff, #fff 2px, transparent 2px, transparent 40px)' }}></div>
                        </div>

                        {/* Drop Zone / Доки */}
                        <div className={`absolute bottom-0 inset-x-0 h-44 rounded-t-[2.5rem] bg-gradient-to-t ${lane.color} border-t-4 border-white/20 flex flex-col items-center justify-start pt-4 shadow-2xl transition-all duration-300`}>
                            <div className="text-[10px] font-black mb-4 opacity-70 tracking-widest text-white uppercase">{lane.label}</div>
                            
                            <div className="flex gap-2 bg-black/30 p-2.5 rounded-2xl border border-white/10 shadow-inner">
                                {lane.accepts.map(type => (
                                    <div key={type} className="text-3xl filter drop-shadow-md">
                                        {CARGO_DATA[type].icon}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-auto mb-2 opacity-30 text-4xl animate-bounce">▼</div>
                        </div>

                        {/* Items */}
                        {cargos.filter(c => c.lane === lane.id).map(cargo => (
                            <div 
                                key={cargo.id}
                                onPointerDown={(e) => onPointerDown(e, cargo)}
                                className={`absolute left-1/2 -translate-x-1/2 w-24 h-24 bg-slate-800 rounded-3xl border-2 shadow-2xl flex items-center justify-center transition-transform duration-75 cursor-grab active:cursor-grabbing z-40 transform-gpu
                                    ${cargo.isDragging ? 'scale-110 shadow-blue-500/50 border-blue-400 z-50' : 'border-white/10'}
                                    ${cargo.isBroken ? 'opacity-50 grayscale scale-90' : ''}
                                    ${cargo.stress > 50 ? 'animate-wiggle' : ''}
                                `}
                                style={{ 
                                    top: `${cargo.progress}%`,
                                    fontSize: '5rem',
                                    transform: `translate(calc(-50% + ${cargo.dragX || 0}px), -50%)`,
                                    willChange: 'top, transform'
                                }}
                            >
                                <span className={`${cargo.isDeactivated ? 'opacity-40 scale-75' : ''}`}>
                                    {cargo.isBroken ? CARGO_DATA[cargo.type].brokenIcon : CARGO_DATA[cargo.type].icon}
                                </span>
                                
                                {/* Шкала стресса для хрупкого груза */}
                                {cargo.type === 'fragile' && cargo.isDragging && !cargo.isBroken && (
                                    <div className="absolute -top-10 inset-x-0 h-2 bg-black/50 rounded-full border border-white/20 overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-100 ${cargo.stress > 70 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-amber-400'}`}
                                            style={{ width: `${cargo.stress}%` }}
                                        ></div>
                                        <div className="absolute top-[-15px] left-0 text-[8px] font-black text-white uppercase whitespace-nowrap">Уровень_тряски</div>
                                    </div>
                                )}

                                {cargo.type === 'hazard' && !cargo.isDeactivated && (
                                    <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] px-2 py-1 rounded-full font-black animate-bounce shadow-lg">
                                        ОБЕЗВРЕДИТЬ
                                    </div>
                                )}
                                
                                {cargo.type === 'express' && (
                                    <div className="absolute inset-0 border-2 border-fuchsia-500 rounded-3xl animate-ping opacity-30"></div>
                                )}

                                {cargo.isBroken && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-red-600/20 rounded-3xl">
                                        <div className="bg-red-600 text-white text-[10px] px-2 font-black rounded italic">РАЗБИТО</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Overlays */}
            {gameState === 'intro' && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-fade-in">
                    <div className="border-4 border-blue-500/30 p-10 rounded-[3rem] text-center max-w-sm shadow-[0_0_100px_rgba(59,130,246,0.3)] bg-slate-900/80 relative overflow-hidden">
                        <div className="text-8xl mb-8 animate-bounce">📦</div>
                        <h1 className="text-3xl font-black mb-4 text-white tracking-tighter uppercase italic">МАСТЕР ЛОГИСТИКИ</h1>
                        <p className="text-slate-400 text-xs mb-10 uppercase tracking-widest leading-loose text-left">
                            Распределяй грузы по секторам:<br/>
                            1. <span className="text-blue-400 font-bold">ОБЫЧНЫЕ</span> 📦 — ВЛЕВО<br/>
                            2. <span className="text-amber-400 font-bold">ХРУПКИЕ</span> 🏺 — В ЦЕНТР (Двигай плавно!)<br/>
                            3. <span className="text-red-500 font-bold">ОПАСНЫЕ</span> ☢️ — В ЦЕНТР (Тапни для защиты!)<br/>
                            4. <span className="text-fuchsia-400 font-bold">ЭКСПРЕСС</span> 🚀 — ВПРАВО<br/>
                        </p>
                        <button onClick={startGame} className="w-full py-6 bg-blue-600 text-white font-black rounded-2xl shadow-[0_10px_40px_rgba(59,130,246,0.4)] transition-all active:scale-95 uppercase tracking-widest text-sm hover:bg-blue-400">
                            НАЧАТЬ_СОРТИРОВКУ
                        </button>
                    </div>
                </div>
            )}

            {(gameState === 'lost' || gameState === 'won') && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-fade-in">
                    <div className={`border-4 p-12 rounded-[4rem] text-center max-w-sm w-full shadow-2xl ${gameState === 'won' ? 'border-emerald-500/50 shadow-emerald-500/20' : 'border-red-600/50 shadow-red-600/20'}`}>
                        <div className="text-8xl mb-8">{gameState === 'won' ? '🏆' : '📦'}</div>
                        <h2 className={`text-3xl font-black mb-8 uppercase italic tracking-widest ${gameState === 'won' ? 'text-emerald-400' : 'text-red-600'}`}>
                            {gameState === 'won' ? 'ПЛАН_ВЫПОЛНЕН' : 'СКЛАД_ЗАКРЫТ'}
                        </h2>
                        <div className="bg-white/5 p-6 rounded-3xl mb-10 border border-white/5">
                            <span className="text-slate-500 text-[10px] block uppercase font-black mb-2">ДОХОД</span>
                            <span className="text-6xl font-black text-white tabular-nums tracking-tighter">{score}</span>
                        </div>
                        <button 
                            onClick={() => { onWin(score); onBack(); }}
                            className="w-full py-5 bg-white text-black font-black uppercase rounded-2xl transition-all active:scale-95 text-xs tracking-widest hover:bg-blue-400"
                        >
                            В_ШТАБ
                        </button>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes conveyor {
                    from { transform: translateY(0); }
                    to { transform: translateY(40px); }
                }
                .animate-conveyor { animation: conveyor 1.5s linear infinite; }
                
                @keyframes wiggle {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    25% { transform: translate(-52%, -50%) rotate(-3deg); }
                    75% { transform: translate(-48%, -50%) rotate(3deg); }
                    100% { transform: translate(-50%, -50%) rotate(0deg); }
                }
                .animate-wiggle { animation: wiggle 0.1s infinite; }

                @keyframes shake-heavy {
                    0%, 100% { transform: translate(0, 0); }
                    10% { transform: translate(-8px, -4px); }
                    30% { transform: translate(8px, 4px); }
                    50% { transform: translate(-8px, 4px); }
                    70% { transform: translate(8px, -4px); }
                }
                .animate-shake-heavy { animation: shake-heavy 0.4s cubic-bezier(.36,.07,.19,.97) both; }
                
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(1.1); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
            `}} />
        </div>
    );
};

export default LogisticsGame;
