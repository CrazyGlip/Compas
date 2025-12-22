
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';

type DataPacketType = 'good' | 'virus' | 'encrypted' | 'glitch' | 'bonus' | 'emp';

interface DataPacket {
    id: string;
    type: DataPacketType;
    x: number; 
    y: number; 
    speed: number;
    icon: string;
    hp: number;
    wiggle: number; // For zigzag movement
    isProcessed?: boolean;
}

const ICONS: Record<DataPacketType, string> = {
    good: '🔹',
    virus: '🚫',
    encrypted: '🔐',
    glitch: '👾',
    bonus: '💎',
    emp: '🔌'
};

const SecurityGame: React.FC<{ onBack: () => void; onWin: (score: number) => void }> = ({ onBack, onWin }) => {
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'lost' | 'won'>('intro');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [packets, setPackets] = useState<DataPacket[]>([]);
    const [timeLeft, setTimeLeft] = useState(60.0);
    const [empCharge, setEmpCharge] = useState(0);
    const [isScreenShaking, setIsScreenShaking] = useState(false);

    const packetsRef = useRef<DataPacket[]>([]);
    const requestRef = useRef<number>(null);
    const lastSpawnTime = useRef<number>(0);
    const intensityRef = useRef(1);

    const triggerShake = () => {
        setIsScreenShaking(true);
        setTimeout(() => setIsScreenShaking(false), 400);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    };

    const spawnPacket = useCallback(() => {
        const rand = Math.random();
        let type: DataPacketType = 'good';
        let hp = 1;
        
        if (rand < 0.15) { type = 'virus'; }
        else if (rand < 0.25) { type = 'encrypted'; hp = 2; }
        else if (rand < 0.32) { type = 'glitch'; }
        else if (rand < 0.35) { type = 'bonus'; }
        else if (rand < 0.38) { type = 'emp'; }

        const newPacket: DataPacket = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            x: 15 + Math.random() * 70,
            y: -15,
            speed: (0.18 + Math.random() * 0.2) * intensityRef.current,
            icon: ICONS[type],
            hp,
            wiggle: Math.random() * Math.PI * 2
        };
        packetsRef.current.push(newPacket);
    }, []);

    const useEMP = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (empCharge < 100) return;
        
        setEmpCharge(0);
        const threats = packetsRef.current.filter(p => p.type === 'virus' || p.type === 'encrypted' || p.type === 'glitch');
        setScore(s => s + threats.length * 50);
        packetsRef.current = packetsRef.current.filter(p => !['virus', 'encrypted', 'glitch'].includes(p.type));
        // Visual effect for EMP
        const flash = document.createElement('div');
        flash.className = 'fixed inset-0 bg-white z-[80] animate-ping opacity-30 pointer-events-none';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 500);
    };

    const update = useCallback((time: number) => {
        if (gameState !== 'playing') return;

        const spawnInterval = Math.max(350, 1100 - intensityRef.current * 150);

        if (time - lastSpawnTime.current > spawnInterval) {
            spawnPacket();
            lastSpawnTime.current = time;
        }

        let damageTaken = 0;
        const nextPackets = packetsRef.current.map(p => {
            let newY = p.y + p.speed;
            let newX = p.x;

            // Специальное движение для глитч-вирусов
            if (p.type === 'glitch') {
                newX += Math.sin(newY * 0.1) * 0.8;
            }

            if (newY >= 100 && !p.isProcessed) {
                if (['virus', 'encrypted', 'glitch'].includes(p.type)) {
                    damageTaken++;
                }
                return { ...p, y: 110, isProcessed: true };
            }
            
            return { ...p, y: newY, x: newX };
        }).filter(p => p.y < 105);

        if (damageTaken > 0) {
            triggerShake();
            setLives(l => {
                const next = l - damageTaken;
                if (next <= 0) setGameState('lost');
                return next;
            });
        }

        packetsRef.current = nextPackets;
        setPackets([...nextPackets]);

        setTimeLeft(prev => {
            const next = prev - 0.016;
            if (next <= 0) {
                setGameState('won');
                return 0;
            }
            intensityRef.current = 1 + (60 - next) / 25;
            return next;
        });

        requestRef.current = requestAnimationFrame(update);
    }, [gameState, spawnPacket]);

    useEffect(() => {
        if (gameState === 'playing') {
            requestRef.current = requestAnimationFrame(update);
        } else if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [gameState, update]);

    const handlePacketClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (gameState !== 'playing') return;

        const packetIndex = packetsRef.current.findIndex(p => p.id === id);
        if (packetIndex === -1) return;
        
        const p = packetsRef.current[packetIndex];

        if (p.type === 'good') {
            triggerShake();
            setLives(l => l - 1);
            packetsRef.current.splice(packetIndex, 1);
            if (lives <= 1) setGameState('lost');
            return;
        }

        const newHp = p.hp - 1;
        if (newHp <= 0) {
            // Destroyed
            if (p.type === 'bonus') setScore(s => s + 500);
            else if (p.type === 'emp') setEmpCharge(prev => Math.min(100, prev + 25));
            else setScore(s => s + 150);
            
            packetsRef.current.splice(packetIndex, 1);
        } else {
            // Damaged (for encrypted)
            packetsRef.current[packetIndex] = { ...p, hp: newHp, icon: '🔓' };
        }
    };

    const startGame = () => {
        packetsRef.current = [];
        intensityRef.current = 1;
        setGameState('playing');
        setScore(0);
        setLives(3);
        setTimeLeft(60.0);
        setEmpCharge(0);
        lastSpawnTime.current = performance.now();
    };

    return (
        <div className={`fixed inset-0 bg-[#050505] text-cyan-500 font-mono flex flex-col overflow-hidden select-none touch-none ${isScreenShaking ? 'animate-shake-heavy' : ''}`}>
            {/* Cyber Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="w-full h-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:30px_30px]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-red-500/10"></div>
            </div>

            {/* UI Header */}
            <div className="z-50 p-5 flex justify-between items-center bg-black/60 border-b border-cyan-500/20 backdrop-blur-xl">
                <button onClick={onBack} className="p-3 bg-red-900/20 border border-red-500/50 text-red-500 rounded-xl hover:bg-red-500/30 transition-all font-black text-xs tracking-tighter">
                    EXIT_SESSION
                </button>
                
                <div className="flex flex-col items-center">
                    <div className="text-[10px] text-cyan-700 font-black uppercase tracking-[0.4em] mb-1">System_Uptime</div>
                    <div className={`text-4xl font-black tabular-nums transition-colors ${timeLeft < 10 ? 'text-red-500' : 'text-white'}`}>
                        {timeLeft.toFixed(1)}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1.5">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={`w-4 h-4 rounded-sm border ${i < lives ? 'bg-red-500 shadow-[0_0_15px_red] border-red-400' : 'bg-transparent border-white/10'}`}></div>
                        ))}
                    </div>
                    <div className="text-2xl font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                        {score.toString().padStart(5, '0')}
                    </div>
                </div>
            </div>

            {/* EMP Charge Bar */}
            <div className="z-50 px-5 py-2 bg-black/40 border-b border-white/5 flex items-center gap-4">
                <div className="text-[10px] font-black text-white uppercase opacity-40">EMP_CHARGE</div>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <div 
                        className={`h-full transition-all duration-300 ${empCharge >= 100 ? 'bg-cyan-400 animate-pulse shadow-[0_0_15px_cyan]' : 'bg-blue-600'}`}
                        style={{ width: `${empCharge}%` }}
                    />
                </div>
                <button 
                    onClick={useEMP}
                    disabled={empCharge < 100}
                    className={`px-4 py-1 rounded-lg font-black text-[10px] transition-all ${empCharge >= 100 ? 'bg-cyan-500 text-black scale-110 shadow-lg' : 'bg-slate-800 text-slate-500 opacity-50'}`}
                >
                    ACTIVATE [SPACE]
                </button>
            </div>

            {/* Game Area */}
            <div className="flex-1 relative perspective-1000">
                {/* Visual Sweep Line */}
                <div className="absolute inset-x-0 top-0 h-2 bg-cyan-400/20 shadow-[0_0_30px_cyan] animate-scan-fast pointer-events-none z-10"></div>

                {packets.map(p => (
                    <div 
                        key={p.id}
                        onClick={(e) => handlePacketClick(e, p.id)}
                        className={`absolute flex items-center justify-center transition-transform duration-75 cursor-pointer transform-gpu active:scale-125
                            ${p.type === 'glitch' ? 'animate-pulse' : ''}
                            ${['virus', 'encrypted', 'glitch'].includes(p.type) ? 'z-20' : 'z-10'}`}
                        style={{ 
                            left: `${p.x}%`, 
                            top: `${p.y}%`,
                            transform: `translate(-50%, -50%) scale(${p.type === 'encrypted' && p.hp > 1 ? 1.4 : 1.2})`,
                            fontSize: '4.5rem', // LARGE OBJECTS
                            filter: ['virus', 'encrypted', 'glitch'].includes(p.type) ? 'drop-shadow(0 0 15px currentColor)' : 'none',
                            willChange: 'top, left'
                        }}
                    >
                        <span className={`inline-block ${p.type === 'encrypted' && p.hp > 1 ? 'animate-bounce' : ''}`}>
                            {p.icon}
                        </span>
                        
                        {/* HP Counter for Encrypted */}
                        {p.type === 'encrypted' && p.hp > 1 && (
                            <div className="absolute -top-4 bg-purple-600 text-white text-[12px] px-2 py-0.5 rounded-full font-black">
                                x{p.hp}
                            </div>
                        )}

                        {/* EMP indicator */}
                        {p.type === 'emp' && (
                            <div className="absolute inset-0 border-4 border-cyan-400 rounded-full animate-ping opacity-40"></div>
                        )}
                    </div>
                ))}
            </div>

            {/* Transition Overlays */}
            {gameState === 'intro' && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-fade-in">
                    <div className="border-4 border-cyan-500/30 p-10 rounded-[3rem] text-center max-w-sm shadow-[0_0_100px_rgba(6,182,212,0.3)] bg-slate-900/80 relative overflow-hidden">
                        <div className="text-8xl mb-8 animate-pulse drop-shadow-[0_0_30px_cyan]">🛡️</div>
                        <h1 className="text-4xl font-black mb-4 text-white tracking-tighter uppercase italic">КИБЕР-ЩИТ 2.0</h1>
                        <p className="text-slate-400 text-xs mb-10 uppercase tracking-widest leading-loose">
                            [ПРОТОКОЛ_ЗАЩИТЫ_АКТИВИРОВАН]<br/>
                            Устраняй <span className="text-red-500 font-bold">УГРОЗЫ</span> тапом.<br/>
                            Шифровщики 🔐 требуют <span className="text-purple-400 font-bold">2 КЛИКА</span>.<br/>
                            Синтезируй энергию 🔌 для <span className="text-cyan-400 font-bold">EMP-УДАРА</span>.
                        </p>
                        <button onClick={startGame} className="w-full py-6 bg-cyan-500 text-black font-black rounded-2xl shadow-[0_10px_40px_rgba(6,182,212,0.4)] transition-all active:scale-95 uppercase tracking-widest text-sm hover:bg-cyan-300">
                            INITIALIZE_NEURAL_LINK
                        </button>
                    </div>
                </div>
            )}

            {(gameState === 'lost' || gameState === 'won') && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-fade-in">
                    <div className={`border-4 p-12 rounded-[4rem] text-center max-w-sm w-full shadow-2xl ${gameState === 'won' ? 'border-emerald-500/50 shadow-emerald-500/20' : 'border-red-600/50 shadow-red-600/20'}`}>
                        <div className="text-8xl mb-8">{gameState === 'won' ? '👑' : '💀'}</div>
                        <h2 className={`text-3xl font-black mb-8 uppercase italic tracking-widest ${gameState === 'won' ? 'text-emerald-400' : 'text-red-600'}`}>
                            {gameState === 'won' ? 'ВЗЛОМ_ОТБИТ' : 'СЕТЬ_ПАЛА'}
                        </h2>
                        <div className="bg-white/5 p-6 rounded-3xl mb-10 border border-white/5 shadow-inner">
                            <span className="text-slate-500 text-[10px] block uppercase font-black mb-2">LOGGED_SCORE</span>
                            <span className="text-6xl font-black text-white tabular-nums tracking-tighter">{score}</span>
                        </div>
                        <button 
                            onClick={() => { onWin(score); onBack(); }}
                            className="w-full py-5 bg-white text-black font-black uppercase rounded-2xl transition-all active:scale-95 text-xs tracking-widest hover:bg-cyan-400"
                        >
                            RETURN_TO_BASE
                        </button>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes scan-fast {
                    0% { top: -10%; }
                    100% { top: 110%; }
                }
                .animate-scan-fast { animation: scan-fast 2.5s linear infinite; }
                
                @keyframes shake-heavy {
                    0%, 100% { transform: translate(0, 0); }
                    10% { transform: translate(-10px, -5px) rotate(-1deg); }
                    30% { transform: translate(10px, 5px) rotate(1deg); }
                    50% { transform: translate(-10px, 5px) rotate(-1deg); }
                    70% { transform: translate(10px, -5px) rotate(1deg); }
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

export default SecurityGame;
