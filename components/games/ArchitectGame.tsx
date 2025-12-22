
import React, { useState, useEffect, useCallback, useMemo } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right';
type CellType = 'empty' | 'wall' | 'source' | 'receiver' | 'mirror' | 'splitter';
type MirrorType = '/' | '\\';

interface GameCell {
    x: number;
    y: number;
    type: CellType;
    mirrorType?: MirrorType;
    sourceDir?: Direction;
    isPermanent?: boolean;
}

interface Level {
    id: number;
    size: number;
    mirrorInventory: number;
    splitterInventory: number;
    cells: Partial<GameCell>[];
}

const LEVELS: Level[] = [
    {
        id: 1,
        size: 5,
        mirrorInventory: 3,
        splitterInventory: 0,
        cells: [
            { x: 0, y: 0, type: 'source', sourceDir: 'right' },
            { x: 4, y: 4, type: 'receiver' },
            { x: 2, y: 0, type: 'wall' },
            { x: 2, y: 1, type: 'wall' },
            { x: 4, y: 2, type: 'wall' },
        ]
    },
    {
        id: 2,
        size: 6,
        mirrorInventory: 2,
        splitterInventory: 1,
        cells: [
            { x: 0, y: 2, type: 'source', sourceDir: 'right' },
            { x: 5, y: 0, type: 'receiver' },
            { x: 5, y: 5, type: 'receiver' },
            { x: 3, y: 1, type: 'wall' },
            { x: 3, y: 4, type: 'wall' },
        ]
    },
    {
        id: 3,
        size: 7,
        mirrorInventory: 2,
        splitterInventory: 2,
        cells: [
            { x: 0, y: 3, type: 'source', sourceDir: 'right' },
            { x: 3, y: 0, type: 'receiver' },
            { x: 3, y: 6, type: 'receiver' },
            { x: 6, y: 3, type: 'receiver' },
            { x: 3, y: 2, type: 'wall' },
            { x: 3, y: 4, type: 'wall' },
            { x: 5, y: 3, type: 'wall' },
        ]
    }
];

const ArchitectGame: React.FC<{ onBack: () => void, onWin: (score: number) => void }> = ({ onBack, onWin }) => {
    const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'won'>('intro');
    const [grid, setGrid] = useState<GameCell[]>([]);
    const [inv, setInv] = useState({ mirrors: 0, splitters: 0 });
    
    const level = LEVELS[currentLevelIdx];

    const initLevel = useCallback((idx: number) => {
        const lvl = LEVELS[idx];
        const newGrid: GameCell[] = [];
        for (let y = 0; y < lvl.size; y++) {
            for (let x = 0; x < lvl.size; x++) {
                const config = lvl.cells.find(c => c.x === x && c.y === y);
                newGrid.push({
                    x, y,
                    type: config?.type || 'empty',
                    mirrorType: config?.mirrorType,
                    sourceDir: config?.sourceDir,
                    isPermanent: !!config
                });
            }
        }
        setGrid(newGrid);
        setInv({ mirrors: lvl.mirrorInventory, splitters: lvl.splitterInventory });
        setGameState('playing');
    }, []);

    // РЕКУРСИВНЫЙ РАСЧЕТ ЛАЗЕРА (BFS)
    const laserResult = useMemo(() => {
        if (grid.length === 0) return { path: [], litCoords: new Set<string>() };

        const path: { x1: number, y1: number, x2: number, y2: number }[] = [];
        const litCoords = new Set<string>();
        const queue: { x: number, y: number, dir: Direction }[] = [];
        
        grid.filter(c => c.type === 'source').forEach(s => {
            queue.push({ x: s.x, y: s.y, dir: s.sourceDir! });
            litCoords.add(`${s.x},${s.y}`);
        });

        const maxTotalSteps = 100;
        let totalSteps = 0;

        while (queue.length > 0 && totalSteps < maxTotalSteps) {
            const { x, y, dir } = queue.shift()!;
            totalSteps++;

            let nx = x;
            let ny = y;
            if (dir === 'up') ny--;
            else if (dir === 'down') ny++;
            else if (dir === 'left') nx--;
            else if (dir === 'right') nx++;

            // Границы
            if (nx < 0 || nx >= level.size || ny < 0 || ny >= level.size) {
                path.push({ x1: x, y1: y, x2: nx, y2: ny });
                continue;
            }

            const cell = grid.find(c => c.x === nx && c.y === ny);
            if (!cell) continue;

            litCoords.add(`${nx},${ny}`);
            path.push({ x1: x, y1: y, x2: nx, y2: ny });

            if (cell.type === 'wall') continue;
            
            if (cell.type === 'mirror') {
                let nextDir: Direction = dir;
                if (cell.mirrorType === '/') {
                    if (dir === 'right') nextDir = 'up';
                    else if (dir === 'left') nextDir = 'down';
                    else if (dir === 'up') nextDir = 'right';
                    else if (dir === 'down') nextDir = 'left';
                } else {
                    if (dir === 'right') nextDir = 'down';
                    else if (dir === 'left') nextDir = 'up';
                    else if (dir === 'up') nextDir = 'left';
                    else if (dir === 'down') nextDir = 'right';
                }
                queue.push({ x: nx, y: ny, dir: nextDir });
            } else if (cell.type === 'splitter') {
                // Расщепитель: один луч идет прямо, второй отражается как зеркало '/'
                // 1. Прямой луч
                queue.push({ x: nx, y: ny, dir: dir });
                // 2. Отраженный луч (логика '/')
                let reflectedDir: Direction = dir;
                if (dir === 'right') reflectedDir = 'up';
                else if (dir === 'left') reflectedDir = 'down';
                else if (dir === 'up') reflectedDir = 'right';
                else if (dir === 'down') reflectedDir = 'left';
                queue.push({ x: nx, y: ny, dir: reflectedDir });
            } else {
                // Свободный проход сквозь пустую ячейку или приемник
                queue.push({ x: nx, y: ny, dir });
            }
        }

        return { path, litCoords };
    }, [grid, level.size]);

    useEffect(() => {
        if (gameState !== 'playing' || grid.length === 0) return;
        const receivers = grid.filter(c => c.type === 'receiver');
        const allLit = receivers.length > 0 && receivers.every(r => laserResult.litCoords.has(`${r.x},${r.y}`));
        if (allLit) setTimeout(() => setGameState('won'), 600);
    }, [laserResult.litCoords, grid, gameState]);

    const handleCellClick = (x: number, y: number) => {
        if (gameState !== 'playing') return;

        setGrid(prev => {
            const idx = prev.findIndex(c => c.x === x && c.y === y);
            const cell = prev[idx];
            if (cell.isPermanent) return prev;

            const nextGrid = [...prev];
            
            // Цикл: Пусто -> / -> \ -> Splitter -> Пусто
            if (cell.type === 'empty') {
                if (inv.mirrors > 0) {
                    setInv(i => ({ ...i, mirrors: i.mirrors - 1 }));
                    nextGrid[idx] = { ...cell, type: 'mirror', mirrorType: '/' };
                } else if (inv.splitters > 0) {
                    setInv(i => ({ ...i, splitters: i.splitters - 1 }));
                    nextGrid[idx] = { ...cell, type: 'splitter' };
                }
            } else if (cell.type === 'mirror') {
                if (cell.mirrorType === '/') {
                    nextGrid[idx] = { ...cell, mirrorType: '\\' };
                } else {
                    // Возвращаем зеркало в инвентарь
                    let nextType: CellType = 'empty';
                    let nextInvMirrors = inv.mirrors + 1;
                    let nextInvSplitters = inv.splitters;

                    if (inv.splitters > 0) {
                        nextType = 'splitter';
                        nextInvSplitters--;
                    }
                    
                    setInv({ mirrors: nextInvMirrors, splitters: nextInvSplitters });
                    nextGrid[idx] = { ...cell, type: nextType, mirrorType: undefined };
                }
            } else if (cell.type === 'splitter') {
                setInv(i => ({ ...i, splitters: i.splitters + 1 }));
                nextGrid[idx] = { ...cell, type: 'empty' };
            }
            
            return nextGrid;
        });
        
        if (navigator.vibrate) navigator.vibrate(10);
    };

    const handleNextLevel = () => {
        if (currentLevelIdx < LEVELS.length - 1) {
            const nextIdx = currentLevelIdx + 1;
            setCurrentLevelIdx(nextIdx);
            initLevel(nextIdx);
        } else {
            onWin(1000);
            onBack();
        }
    };

    return (
        <div className="fixed inset-0 bg-[#020617] text-white font-mono flex flex-col overflow-hidden select-none touch-none">
            {/* Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent"></div>
            </div>

            {/* Header */}
            <div className="z-50 p-6 flex justify-between items-center bg-slate-900/80 border-b border-indigo-500/30 backdrop-blur-xl">
                <button onClick={onBack} className="px-4 py-2 bg-slate-800 border border-white/10 rounded-xl hover:bg-slate-700 transition-all font-black text-xs uppercase tracking-widest text-indigo-300">
                    В_МЕНЮ
                </button>
                <div className="text-center">
                    <div className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.4em] mb-1">OPTIC_NETWORK</div>
                    <div className="text-xl font-black text-white italic tracking-widest">УРОВЕНЬ {level.id}</div>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <div className="text-[8px] text-slate-500 font-black uppercase">MIRRORS</div>
                        <div className="text-sm font-black text-sky-400 italic">x{inv.mirrors}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[8px] text-slate-500 font-black uppercase">PRISMS</div>
                        <div className="text-sm font-black text-fuchsia-400 italic">x{inv.splitters}</div>
                    </div>
                </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 flex items-center justify-center p-4 relative">
                <div 
                    className="grid gap-2 bg-slate-900/60 p-3 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl relative"
                    style={{ 
                        gridTemplateColumns: `repeat(${level.size}, 1fr)`,
                        width: 'min(94vw, 500px)',
                        aspectRatio: '1/1'
                    }}
                >
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible rounded-[2.5rem]">
                        {laserResult.path.map((p, i) => {
                            const cellSize = 100 / level.size;
                            const x1 = (p.x1 + 0.5) * cellSize;
                            const y1 = (p.y1 + 0.5) * cellSize;
                            const x2 = (p.x2 + 0.5) * cellSize;
                            const y2 = (p.y2 + 0.5) * cellSize;
                            return (
                                <g key={i}>
                                    <line 
                                        x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} 
                                        stroke="#818cf8" strokeWidth="6" strokeLinecap="round" 
                                        className="opacity-20 animate-pulse"
                                    />
                                    <line 
                                        x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} 
                                        stroke="#fff" strokeWidth="2" strokeLinecap="round"
                                        className="opacity-80"
                                    />
                                </g>
                            );
                        })}
                    </svg>

                    {grid.map((cell, i) => {
                        const isLit = laserResult.litCoords.has(`${cell.x},${cell.y}`);
                        return (
                            <div 
                                key={i} 
                                onClick={() => handleCellClick(cell.x, cell.y)}
                                className={`relative rounded-2xl flex items-center justify-center transition-all duration-200 group
                                    ${cell.type === 'empty' ? 'bg-slate-800/20 hover:bg-slate-700/30' : 'bg-slate-800 shadow-inner'}
                                    ${isLit && cell.type !== 'empty' ? 'ring-2 ring-indigo-500/50 scale-[1.02]' : ''}
                                    ${!cell.isPermanent ? 'cursor-pointer active:scale-90' : 'cursor-default'}
                                `}
                            >
                                {cell.type === 'wall' && (
                                    <div className="w-full h-full bg-slate-700 rounded-2xl flex items-center justify-center border-2 border-slate-600">
                                        <div className="w-8 h-8 opacity-20">🚧</div>
                                    </div>
                                )}

                                {cell.type === 'source' && (
                                    <div className={`text-4xl relative z-20 ${isLit ? 'animate-pulse' : ''}`}>📡</div>
                                )}

                                {cell.type === 'receiver' && (
                                    <div className={`text-4xl transition-all duration-700 ${isLit ? 'scale-125 drop-shadow-[0_0_20px_#818cf8]' : 'grayscale opacity-20'}`}>🏙️</div>
                                )}

                                {cell.type === 'mirror' && (
                                    <div className={`relative w-full h-full p-2 flex items-center justify-center transition-all duration-300 ${isLit ? 'drop-shadow-[0_0_10px_#818cf8]' : ''}`}>
                                        <div className={`w-full h-2 bg-indigo-300 rounded-full shadow-lg transform ${cell.mirrorType === '/' ? 'rotate-[-45deg]' : 'rotate-[45deg]'}`} />
                                    </div>
                                )}

                                {cell.type === 'splitter' && (
                                    <div className={`relative w-full h-full flex items-center justify-center transition-all duration-300 ${isLit ? 'drop-shadow-[0_0_15px_#f0abfc]' : ''}`}>
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-400 to-indigo-500 border border-white/40 rotate-45 flex items-center justify-center shadow-lg">
                                            <div className="w-4 h-4 bg-white/30 rounded-full blur-[2px]" />
                                        </div>
                                        <div className="absolute inset-x-0 h-0.5 bg-white/20 -rotate-45" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Inventory Display Footer */}
            <div className="p-8 bg-slate-900/60 border-t border-white/5 backdrop-blur-md flex justify-around">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-2 border border-sky-500/30">
                        <div className="w-8 h-1 bg-sky-400 rotate-[-45deg]" />
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mirror</span>
                </div>
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-2 border border-fuchsia-500/30 overflow-hidden relative">
                        <div className="w-6 h-6 bg-fuchsia-500/40 rotate-45 border border-white/30" />
                        <div className="absolute inset-x-0 h-0.5 bg-white/20 rotate-45" />
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Prism</span>
                </div>
            </div>

            {/* Overlays */}
            {gameState === 'intro' && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-fade-in">
                    <div className="border-4 border-indigo-500/40 p-10 rounded-[3.5rem] text-center max-w-sm shadow-[0_0_120px_rgba(99,102,241,0.35)] bg-slate-900/90 relative overflow-hidden">
                        <div className="text-9xl mb-10 drop-shadow-[0_0_40px_#6366f1]">💎</div>
                        <h1 className="text-3xl font-black mb-6 text-white tracking-tighter uppercase italic">АРХИТЕКТОР СВЕТА</h1>
                        <p className="text-slate-400 text-xs mb-10 uppercase tracking-widest leading-loose">
                            Используйте <span className="text-fuchsia-400 font-bold">ПРИЗМЫ</span> для разделения луча, чтобы запитать несколько городов одновременно.
                        </p>
                        <button onClick={() => initLevel(currentLevelIdx)} className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl shadow-[0_15px_50px_rgba(99,102,241,0.5)] transition-all active:scale-95 uppercase tracking-widest text-sm hover:bg-indigo-400">
                            НАЧАТЬ_СЕАНС
                        </button>
                    </div>
                </div>
            )}

            {gameState === 'won' && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-fade-in">
                    <div className="border-4 border-emerald-500/50 p-12 rounded-[4.5rem] text-center max-w-sm w-full shadow-[0_0_80px_rgba(16,185,129,0.3)] bg-slate-900/95">
                        <div className="text-9xl mb-10 italic">⚡🏙️</div>
                        <h2 className="text-3xl font-black mb-8 uppercase italic tracking-widest text-emerald-400">СЕТЬ_СТАБИЛЬНА</h2>
                        <button 
                            onClick={handleNextLevel}
                            className="w-full py-6 bg-white text-black font-black uppercase rounded-3xl transition-all active:scale-95 text-xs tracking-widest"
                        >
                            {currentLevelIdx < LEVELS.length - 1 ? 'СЛЕДУЮЩИЙ СЕКТОР' : 'ЗАВЕРШИТЬ МИССИЮ'}
                        </button>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fade-in { from { opacity: 0; transform: scale(1.1); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}} />
        </div>
    );
};

export default ArchitectGame;
