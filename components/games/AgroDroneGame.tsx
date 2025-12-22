
import React, { useState, useEffect, useRef, useCallback } from 'react';

type TileStatus = 'hidden' | 'healthy' | 'dry' | 'pest';

interface Tile {
    id: string;
    x: number;
    y: number;
    status: TileStatus;
    _realStatus: TileStatus;
}

interface DroneState {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    battery: number;
    water: number;
    pesticide: number;
    mode: 'scan' | 'water' | 'pesticide';
    tilt: number;
}

const FIELD_SIZE = 10; 
const ACTION_RADIUS = 12; // Радиус мгновенного действия при клике

const AgroDroneGame: React.FC<{ onBack: () => void; onWin: (score: number) => void }> = ({ onBack, onWin }) => {
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'won' | 'lost'>('intro');
    const [score, setScore] = useState(0);
    const [drone, setDrone] = useState<DroneState>({
        x: 50, y: 50,
        targetX: 50, targetY: 50,
        battery: 100,
        water: 100,
        pesticide: 100,
        mode: 'scan',
        tilt: 0
    });
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [showPulse, setShowPulse] = useState(false);
    
    const requestRef = useRef<number>(null);
    const lastTimeRef = useRef<number>(0);
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
    
    // Ref для отслеживания актуального состояния дрона в игровом цикле
    const droneRef = useRef<DroneState>(drone);
    useEffect(() => {
        droneRef.current = drone;
    }, [drone]);

    // Sound initialization
    const playSound = (name: string, volume = 0.5, loop = false) => {
        const soundUrls: Record<string, string> = {
            scan: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
            water: 'https://assets.mixkit.co/active_storage/sfx/1113/1113-preview.mp3',
            pesticide: 'https://assets.mixkit.co/active_storage/sfx/1114/1114-preview.mp3',
            move: 'https://assets.mixkit.co/active_storage/sfx/1070/1070-preview.mp3',
            win: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
            alarm: 'https://assets.mixkit.co/active_storage/sfx/994/994-preview.mp3'
        };

        if (!audioRefs.current[name]) {
            audioRefs.current[name] = new Audio(soundUrls[name]);
        }
        const audio = audioRefs.current[name];
        audio.volume = volume;
        audio.loop = loop;
        if (loop && !audio.paused) return;
        audio.currentTime = 0;
        audio.play().catch(() => {});
    };

    const stopSound = (name: string) => {
        if (audioRefs.current[name]) {
            audioRefs.current[name].pause();
        }
    };

    const initField = useCallback(() => {
        const newTiles: Tile[] = [];
        for (let y = 0; y < FIELD_SIZE; y++) {
            for (let x = 0; x < FIELD_SIZE; x++) {
                const rand = Math.random();
                const realStatus: TileStatus = rand < 0.15 ? 'dry' : (rand < 0.25 ? 'pest' : 'healthy');
                newTiles.push({ id: `${x}-${y}`, x, y, status: 'hidden' as any, _realStatus: realStatus });
            }
        }
        setTiles(newTiles);
        const initialDrone: DroneState = {
            x: 50, y: 50,
            targetX: 50, targetY: 50,
            battery: 100,
            water: 100,
            pesticide: 100,
            mode: 'scan',
            tilt: 0
        };
        setDrone(initialDrone);
        droneRef.current = initialDrone;
        playSound('move', 0.2, true);
    }, []);

    // Универсальное действие инструмента (Импульс / Спрей)
    const triggerAction = useCallback(() => {
        const currentDrone = droneRef.current;
        setShowPulse(true);
        
        if (currentDrone.mode === 'scan') playSound('scan', 0.6);
        if (currentDrone.mode === 'water') playSound('water', 0.4);
        if (currentDrone.mode === 'pesticide') playSound('pesticide', 0.4);
        
        setTiles(current => current.map(t => {
            const tx = t.x * 10 + 5;
            const ty = t.y * 10 + 5;
            const dist = Math.sqrt(Math.pow(currentDrone.x - tx, 2) + Math.pow(currentDrone.y - ty, 2));
            
            if (dist < ACTION_RADIUS) {
                if (currentDrone.mode === 'scan' && t.status === 'hidden' as any) {
                    return { ...t, status: t._realStatus };
                }
                if (currentDrone.mode === 'water' && t.status === 'dry' && currentDrone.water > 0) {
                    setDrone(d => ({ ...d, water: Math.max(0, d.water - 5) }));
                    setScore(s => s + 20);
                    return { ...t, status: 'healthy' };
                }
                if (currentDrone.mode === 'pesticide' && t.status === 'pest' && currentDrone.pesticide > 0) {
                    setDrone(d => ({ ...d, pesticide: Math.max(0, d.pesticide - 5) }));
                    setScore(s => s + 30);
                    return { ...t, status: 'healthy' };
                }
            }
            return t;
        }));

        setTimeout(() => setShowPulse(false), 800);
    }, []);

    const update = (time: number) => {
        if (gameState !== 'playing') return;
        const dt = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;

        const currentDrone = droneRef.current;
        const dx = currentDrone.targetX - currentDrone.x;
        const dy = currentDrone.targetY - currentDrone.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        let newX = currentDrone.x;
        let newY = currentDrone.y;
        let newBattery = currentDrone.battery - dt * 1.2; 
        let newTilt = 0;

        if (dist > 0.5) {
            const speed = 140; 
            newX += (dx / dist) * speed * dt;
            newY += (dy / dist) * speed * dt;
            newBattery -= dt * 0.8;
            newTilt = (dx / dist) * 15;
        }

        if (newBattery < 15 && currentDrone.battery >= 15) playSound('alarm', 0.4);
        if (newBattery <= 0) {
            setGameState('lost');
            stopSound('move');
            return;
        }

        const updatedDrone = { ...currentDrone, x: newX, y: newY, battery: newBattery, tilt: newTilt };
        setDrone(updatedDrone);
        droneRef.current = updatedDrone;

        // Авто-сканирование/обработка при пролете
        setTiles(currentTiles => {
            let changed = false;
            const nextTiles = currentTiles.map(tile => {
                const tx = tile.x * 10 + 5;
                const ty = tile.y * 10 + 5;
                const ddist = Math.sqrt(Math.pow(updatedDrone.x - tx, 2) + Math.pow(updatedDrone.y - ty, 2));

                if (ddist < 7) {
                    if (updatedDrone.mode === 'scan' && tile.status === 'hidden' as any) {
                        changed = true;
                        return { ...tile, status: tile._realStatus };
                    }
                    // Для воды и химии авто-режим более экономный (постепенный)
                    if (updatedDrone.mode === 'water' && tile.status === 'dry' && updatedDrone.water > 0) {
                        changed = true;
                        setDrone(d => ({ ...d, water: Math.max(0, d.water - 0.3) }));
                        setScore(s => s + 5);
                        return { ...tile, status: 'healthy' };
                    }
                    if (updatedDrone.mode === 'pesticide' && tile.status === 'pest' && updatedDrone.pesticide > 0) {
                        changed = true;
                        setDrone(d => ({ ...d, pesticide: Math.max(0, d.pesticide - 0.3) }));
                        setScore(s => s + 7);
                        return { ...tile, status: 'healthy' };
                    }
                }
                return tile;
            });

            const allClear = nextTiles.every(t => t.status === 'healthy' || t.status === 'treated_water' as any || t.status === 'treated_pesticide' as any);
            if (allClear && gameState === 'playing' && nextTiles.length > 0) {
                setGameState('won');
                playSound('win', 0.7);
                stopSound('move');
            }

            return changed ? nextTiles : currentTiles;
        });

        requestRef.current = requestAnimationFrame(update);
    };

    useEffect(() => {
        if (gameState === 'playing') {
            lastTimeRef.current = performance.now();
            requestRef.current = requestAnimationFrame(update);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [gameState]);

    const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (gameState !== 'playing') return;
        const rect = e.currentTarget.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * 100;
        const py = ((e.clientY - rect.top) / rect.height) * 100;
        
        // Устанавливаем цель движения
        setDrone(prev => ({ ...prev, targetX: px, targetY: py }));
        
        // Мгновенно вызываем действие инструмента
        triggerAction();
    };

    return (
        <div className="fixed inset-0 bg-[#064e3b] text-white font-mono flex flex-col overflow-hidden select-none touch-none">
            {/* Header */}
            <div className="z-50 p-4 flex justify-between items-center bg-slate-900/90 border-b border-emerald-500/30 backdrop-blur-xl">
                <button onClick={() => { stopSound('move'); onBack(); }} className="px-4 py-2 bg-slate-800 border border-white/10 rounded-xl font-black text-xs uppercase text-emerald-400">
                    В_МЕНЮ
                </button>
                
                <div className="flex gap-4 items-center">
                    <div className="text-center">
                        <div className="text-[8px] text-emerald-400 font-bold uppercase">ЭНЕРГИЯ</div>
                        <div className="h-2 w-20 bg-slate-700 rounded-full mt-1 overflow-hidden border border-white/5 shadow-inner">
                            <div className={`h-full transition-all ${drone.battery < 20 ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`} style={{ width: `${drone.battery}%` }} />
                        </div>
                    </div>
                    <div className="h-8 w-px bg-white/10 mx-2" />
                    <div className="text-right">
                        <div className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Score</div>
                        <div className="text-xl font-black text-emerald-400 italic">+{score}</div>
                    </div>
                </div>
            </div>

            {/* Field Area */}
            <div className="flex-1 relative cursor-crosshair overflow-hidden bg-emerald-950" onClick={handleAreaClick}>
                <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-40">
                    {[...Array(100)].map((_, i) => <div key={i} className="border border-emerald-900/30" />)}
                </div>

                {/* Tiles */}
                <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
                    {tiles.map(tile => (
                        <div 
                            key={tile.id}
                            className={`transition-all duration-1000 flex items-center justify-center text-xl
                                ${tile.status === 'hidden' as any ? 'bg-emerald-950/80 grayscale' : ''}
                                ${tile.status === 'healthy' ? 'bg-emerald-500/10' : ''}
                                ${tile.status === 'dry' ? 'bg-amber-900/40' : ''}
                                ${tile.status === 'pest' ? 'bg-red-900/40' : ''}
                            `}
                        >
                            <div className={`transition-transform duration-500 ${tile.status === 'hidden' as any ? 'scale-0' : 'scale-100'}`}>
                                {tile.status === 'dry' && <span className={drone.mode === 'water' ? 'animate-bounce drop-shadow-[0_0_10px_#3b82f6]' : ''}>🏜️</span>}
                                {tile.status === 'pest' && <span className={drone.mode === 'pesticide' ? 'animate-bounce drop-shadow-[0_0_10px_#a855f7]' : ''}>🐛</span>}
                                {tile.status === 'healthy' && '🌱'}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Pulse Wave */}
                {showPulse && (
                    <div 
                        className={`absolute w-1 h-1 rounded-full animate-pulse-wave z-20 pointer-events-none
                            ${drone.mode === 'scan' ? 'bg-sky-400/30 shadow-[0_0_30px_#38bdf8]' : ''}
                            ${drone.mode === 'water' ? 'bg-blue-400/30 shadow-[0_0_30px_#3b82f6]' : ''}
                            ${drone.mode === 'pesticide' ? 'bg-purple-400/30 shadow-[0_0_30px_#a855f7]' : ''}
                        `}
                        style={{ left: `${drone.x}%`, top: `${drone.y}%` }}
                    />
                )}

                {/* Drone Visual */}
                <div 
                    className="absolute w-24 h-24 pointer-events-none z-30 transition-transform duration-150 ease-out flex items-center justify-center"
                    style={{ 
                        left: `${drone.x}%`, 
                        top: `${drone.y}%`, 
                        transform: `translate(-50%, -50%) rotate(${drone.tilt}deg)` 
                    }}
                >
                    <div className="relative w-full h-full">
                        {/* Sprays / VFX */}
                        {drone.mode === 'water' && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-24 bg-blue-400/20 blur-xl animate-spray-water rounded-full" />
                        )}
                        {drone.mode === 'pesticide' && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-20 bg-purple-500/30 blur-2xl animate-spray-pest rounded-full" />
                        )}

                        {/* Drone Body */}
                        <div className="absolute top-0 left-0 w-8 h-2 bg-slate-600 rounded-full animate-spin-fast shadow-lg" />
                        <div className="absolute top-0 right-0 w-8 h-2 bg-slate-600 rounded-full animate-spin-fast shadow-lg" />
                        <div className="absolute bottom-0 left-0 w-8 h-2 bg-slate-600 rounded-full animate-spin-fast shadow-lg" />
                        <div className="absolute bottom-0 right-0 w-8 h-2 bg-slate-600 rounded-full animate-spin-fast shadow-lg" />
                        
                        <div className={`w-12 h-12 m-6 rounded-2xl bg-slate-800 border-2 shadow-2xl flex items-center justify-center transition-colors relative z-10
                            ${drone.mode === 'scan' ? 'border-sky-400 shadow-sky-500/50' : ''}
                            ${drone.mode === 'water' ? 'border-blue-500 shadow-blue-500/50' : ''}
                            ${drone.mode === 'pesticide' ? 'border-purple-500 shadow-purple-500/50' : ''}
                        `}>
                            <span className="text-xl">🛸</span>
                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="p-6 bg-slate-900/90 border-t border-emerald-500/20 backdrop-blur-xl flex justify-around items-center">
                <button 
                    onClick={() => {
                        if (drone.mode === 'scan') triggerAction();
                        else setDrone(d => ({ ...d, mode: 'scan' }));
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-[2rem] transition-all relative overflow-hidden ${drone.mode === 'scan' ? 'bg-sky-500/20 ring-2 ring-sky-500 scale-110' : 'opacity-40 bg-slate-800'}`}
                >
                    <span className="text-3xl">🔍</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">SCAN</span>
                    {drone.mode === 'scan' && <div className="absolute inset-0 bg-sky-400/10 animate-ping" />}
                </button>
                
                <button 
                    onClick={() => {
                        if (drone.mode === 'water') triggerAction();
                        else setDrone(d => ({ ...d, mode: 'water' }));
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-[2rem] transition-all ${drone.mode === 'water' ? 'bg-blue-500/20 ring-2 ring-blue-500 scale-110' : 'opacity-40 bg-slate-800'}`}
                >
                    <span className="text-3xl">💧</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">WATER</span>
                    {drone.mode === 'water' && <div className="absolute inset-0 bg-blue-400/10 animate-ping" />}
                </button>

                <button 
                    onClick={() => {
                        if (drone.mode === 'pesticide') triggerAction();
                        else setDrone(d => ({ ...d, mode: 'pesticide' }));
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-[2rem] transition-all ${drone.mode === 'pesticide' ? 'bg-purple-500/20 ring-2 ring-purple-500 scale-110' : 'opacity-40 bg-slate-800'}`}
                >
                    <span className="text-3xl">🧪</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">PEST</span>
                    {drone.mode === 'pesticide' && <div className="absolute inset-0 bg-purple-400/10 animate-ping" />}
                </button>
            </div>

            {/* Overlays */}
            {gameState === 'intro' && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-fade-in">
                    <div className="border-4 border-emerald-500/40 p-10 rounded-[4rem] text-center max-w-sm shadow-[0_0_120px_rgba(16,185,129,0.35)] bg-slate-900/90 relative overflow-hidden">
                        <div className="text-9xl mb-10 drop-shadow-[0_0_30px_#10b981]">🛸</div>
                        <h1 className="text-3xl font-black mb-6 text-white tracking-tighter uppercase italic">АГРО-ДРОН 3000</h1>
                        <p className="text-slate-400 text-xs mb-10 uppercase tracking-widest leading-loose text-left">
                            [1] Лети над полем или <span className="text-emerald-400 font-bold">КЛИКАЙ</span> для активации инструмента.<br/>
                            [2] Жми на кнопки снизу для <span className="text-sky-400 font-bold">МГНОВЕННОГО</span> действия.<br/>
                            [3] Увлажняй 🏜️ и лечи 🐛.
                        </p>
                        <button onClick={() => { initField(); setGameState('playing'); }} className="w-full py-6 bg-emerald-600 text-white font-black rounded-3xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-sm hover:bg-emerald-400">
                            ВЗЛЕТ_РАЗРЕШЕН
                        </button>
                    </div>
                </div>
            )}

            {gameState === 'won' && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-fade-in">
                    <div className="border-4 border-emerald-500/50 p-12 rounded-[4.5rem] text-center max-w-sm w-full bg-slate-900/95 shadow-[0_0_100px_rgba(16,185,129,0.2)]">
                        <div className="text-9xl mb-10 italic">🌾✨</div>
                        <h2 className="text-3xl font-black mb-8 uppercase italic tracking-widest text-emerald-400">МИССИЯ_ВЫПОЛНЕНА</h2>
                        <div className="bg-white/5 p-6 rounded-3xl mb-10">
                            <div className="text-[10px] text-slate-500 uppercase font-black mb-2">ЗАРЯД ЭНЕРГИИ</div>
                            <div className="text-5xl font-black text-white">+{Math.round(drone.battery * 10)} XP</div>
                        </div>
                        <button 
                            onClick={() => { onWin(score + Math.round(drone.battery * 10)); stopSound('move'); onBack(); }}
                            className="w-full py-6 bg-white text-black font-black uppercase rounded-3xl transition-all active:scale-95 text-xs tracking-widest shadow-xl"
                        >
                            ЗАВЕРШИТЬ СМЕНУ
                        </button>
                    </div>
                </div>
            )}

            {gameState === 'lost' && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-fade-in">
                    <div className="border-4 border-red-500/50 p-12 rounded-[4.5rem] text-center max-w-sm w-full bg-slate-900/95">
                        <div className="text-9xl mb-10 grayscale italic">🪫</div>
                        <h2 className="text-3xl font-black mb-8 uppercase italic tracking-widest text-red-500">СИСТЕМА_ОТКЛЮЧЕНА</h2>
                        <p className="text-slate-500 text-xs mb-10 uppercase font-bold tracking-widest">Дрон потерян. Батарея на нуле.</p>
                        <button 
                            onClick={() => { initField(); setGameState('playing'); }}
                            className="w-full py-6 bg-red-600 text-white font-black uppercase rounded-3xl transition-all active:scale-95 text-xs tracking-widest shadow-xl"
                        >
                            ПЕРЕЗАГРУЗКА
                        </button>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes spin-fast { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin-fast { animation: spin-fast 0.08s linear infinite; }
                
                @keyframes pulse-wave {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(150); opacity: 0; }
                }
                .animate-pulse-wave { animation: pulse-wave 0.8s ease-out forwards; }

                @keyframes spray-water {
                    0% { transform: translateX(-50%) translateY(0) scale(0.5); opacity: 0.5; }
                    100% { transform: translateX(-50%) translateY(20px) scale(1.5); opacity: 0; }
                }
                .animate-spray-water { animation: spray-water 0.4s linear infinite; }

                @keyframes spray-pest {
                    0% { transform: translateX(-50%) translateY(0) scale(1); opacity: 0.3; }
                    100% { transform: translateX(-50%) translateY(15px) scale(2); opacity: 0; }
                }
                .animate-spray-pest { animation: spray-pest 0.6s ease-in infinite; }
                
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(1.1); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}} />
        </div>
    );
};

export default AgroDroneGame;
