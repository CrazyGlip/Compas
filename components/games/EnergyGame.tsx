
import React, { useState, useEffect, useRef } from 'react';

type Direction = 0 | 1 | 2 | 3;
type CellType = 'empty' | 'source' | 'sink' | 'straight' | 'curve' | 'tee' | 'cross';

interface GridCell {
    x: number;
    y: number;
    type: CellType;
    rotation: number;
    isPowered: boolean;
    fixed: boolean;
}

interface LevelData {
    id: number;
    name: string;
    width: number;
    height: number;
    timeLimit: number;
    layout: { x: number, y: number, type: CellType, fixed?: boolean, rotation?: number }[];
}

const BASE_CONNECTIONS: Record<CellType, boolean[]> = {
    'empty':    [false, false, false, false],
    'source':   [false, true, false, false],
    'sink':     [false, false, false, true],
    'straight': [false, true, false, true],
    'curve':    [false, false, true, true],
    'tee':      [false, true, true, true],
    'cross':    [true, true, true, true],
};

const getOutputs = (type: CellType, rotation: number): boolean[] => {
    const base = BASE_CONNECTIONS[type];
    const rotated = [false, false, false, false];
    for (let i = 0; i < 4; i++) {
        if (base[i]) {
            const newIndex = (i + rotation) % 4;
            rotated[newIndex] = true;
        }
    }
    return rotated;
};

const areConnected = (c1: GridCell, c2: GridCell): boolean => {
    let dir: Direction | null = null;
    if (c2.x === c1.x && c2.y === c1.y - 1) dir = 0; 
    else if (c2.x === c1.x + 1 && c2.y === c1.y) dir = 1; 
    else if (c2.x === c1.x && c2.y === c1.y + 1) dir = 2; 
    else if (c2.x === c1.x - 1 && c2.y === c1.y) dir = 3; 

    if (dir === null) return false;
    const c1Outputs = getOutputs(c1.type, c1.rotation);
    const c2Outputs = getOutputs(c2.type, c2.rotation);
    const oppositeDir = (dir + 2) % 4;
    return c1Outputs[dir] && c2Outputs[oppositeDir];
};

const LEVELS: LevelData[] = [
    {
        id: 1,
        name: "Стажер",
        width: 4,
        height: 4,
        timeLimit: 45,
        layout: [
            { x: 0, y: 0, type: 'source', fixed: true, rotation: 0 },
            { x: 1, y: 0, type: 'straight' },
            { x: 2, y: 0, type: 'curve' },
            { x: 2, y: 1, type: 'straight' },
            { x: 2, y: 2, type: 'curve' },
            { x: 3, y: 2, type: 'curve' },
            { x: 3, y: 3, type: 'sink', fixed: true, rotation: 1 },
            { x: 0, y: 1, type: 'curve' },
            { x: 1, y: 2, type: 'tee' },
        ]
    },
    {
        id: 2,
        name: "Инженер",
        width: 5,
        height: 5,
        timeLimit: 60,
        layout: [
            { x: 0, y: 2, type: 'source', fixed: true, rotation: 0 },
            { x: 1, y: 2, type: 'tee' },
            { x: 1, y: 1, type: 'straight' },
            { x: 1, y: 0, type: 'curve' },
            { x: 2, y: 0, type: 'straight' },
            { x: 3, y: 0, type: 'curve' },
            { x: 1, y: 3, type: 'curve' },
            { x: 2, y: 3, type: 'tee' },
            { x: 3, y: 3, type: 'straight' },
            { x: 3, y: 1, type: 'straight' }, 
            { x: 3, y: 2, type: 'tee' },
            { x: 4, y: 2, type: 'sink', fixed: true, rotation: 0 },
            { x: 0, y: 0, type: 'curve' }, { x: 4, y: 0, type: 'straight' },
            { x: 0, y: 4, type: 'tee' }, { x: 4, y: 4, type: 'curve' }
        ]
    },
    {
        id: 3,
        name: "Главный Энергетик",
        width: 5,
        height: 6,
        timeLimit: 90,
        layout: [
            { x: 2, y: 0, type: 'source', fixed: true, rotation: 1 },
            { x: 2, y: 1, type: 'straight' }, 
            { x: 2, y: 2, type: 'tee' },
            { x: 1, y: 2, type: 'straight' },
            { x: 0, y: 2, type: 'curve' },
            { x: 0, y: 3, type: 'straight' },
            { x: 0, y: 4, type: 'curve' },
            { x: 3, y: 2, type: 'straight' },
            { x: 4, y: 2, type: 'curve' },
            { x: 4, y: 3, type: 'straight' },
            { x: 4, y: 4, type: 'curve' },
            { x: 1, y: 4, type: 'straight' },
            { x: 3, y: 4, type: 'straight' },
            { x: 2, y: 4, type: 'tee' },
            { x: 2, y: 5, type: 'sink', fixed: true, rotation: 1 },
        ]
    }
];

const EnergyGame: React.FC<{ onBack: () => void; onWin: (score: number) => void }> = ({ onBack, onWin }) => {
    const [currentLevelId, setCurrentLevelId] = useState(1);
    const [grid, setGrid] = useState<GridCell[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'won' | 'lost'>('intro');
    const [score, setScore] = useState(0);
    
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadLevel = (levelId: number) => {
        const levelData = LEVELS.find(l => l.id === levelId);
        if (!levelData) return;

        const newGrid: GridCell[] = [];
        for (let y = 0; y < levelData.height; y++) {
            for (let x = 0; x < levelData.width; x++) {
                const layoutItem = levelData.layout.find(l => l.x === x && l.y === y);
                let type: CellType = 'empty';
                let rotation = 0;
                let fixed = false;
                if (layoutItem) {
                    type = layoutItem.type;
                    fixed = !!layoutItem.fixed;
                    if (layoutItem.rotation !== undefined) {
                        rotation = layoutItem.rotation;
                    } else if (!fixed && type !== 'empty') {
                        rotation = Math.floor(Math.random() * 4);
                    }
                }
                newGrid.push({ x, y, type, rotation, isPowered: type === 'source', fixed });
            }
        }
        setGrid(newGrid);
        setTimeLeft(levelData.timeLimit);
        setGameState('playing');
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { endGame('lost'); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const endGame = (result: 'won' | 'lost') => {
        if (timerRef.current) clearInterval(timerRef.current);
        setGameState(result);
    };

    useEffect(() => {
        if (gameState === 'intro') loadLevel(currentLevelId);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [currentLevelId]);

    useEffect(() => {
        if (gameState !== 'playing') return;
        const nextGrid = grid.map(c => ({ ...c, isPowered: c.type === 'source' }));
        const queue = nextGrid.filter(c => c.type === 'source');
        const visited = new Set<string>();
        queue.forEach(c => visited.add(`${c.x},${c.y}`));
        let sinkPowered = false;
        while (queue.length > 0) {
            const curr = queue.shift()!;
            const currInArray = nextGrid.find(c => c.x === curr.x && c.y === curr.y);
            if (currInArray) currInArray.isPowered = true;
            if (curr.type === 'sink') sinkPowered = true;
            const neighbors = [{ x: curr.x, y: curr.y - 1 }, { x: curr.x + 1, y: curr.y }, { x: curr.x, y: curr.y + 1 }, { x: curr.x - 1, y: curr.y }];
            for (const nCoords of neighbors) {
                const neighbor = nextGrid.find(c => c.x === nCoords.x && c.y === nCoords.y);
                if (neighbor && !visited.has(`${neighbor.x},${neighbor.y}`) && neighbor.type !== 'empty') {
                    if (areConnected(curr, neighbor)) {
                        visited.add(`${neighbor.x},${neighbor.y}`);
                        queue.push(neighbor);
                    }
                }
            }
        }
        const serialized = JSON.stringify(nextGrid.map(c => c.isPowered));
        const currentSerialized = JSON.stringify(grid.map(c => c.isPowered));
        if (serialized !== currentSerialized) setGrid(nextGrid);
        if (sinkPowered) setTimeout(() => endGame('won'), 500);
    }, [grid]);

    const handleCellClick = (x: number, y: number) => {
        if (gameState !== 'playing') return;
        if (navigator.vibrate) navigator.vibrate(20);
        setGrid(prev => prev.map(cell => {
            if (cell.x === x && cell.y === y && !cell.fixed && cell.type !== 'empty') {
                return { ...cell, rotation: (cell.rotation + 1) % 4 };
            }
            return cell;
        }));
    };

    const handleNext = () => {
        const bonus = timeLeft * 10;
        const levelScore = 100 + bonus;
        onWin(score + levelScore);
        if (currentLevelId < LEVELS.length) {
            setCurrentLevelId(prev => prev + 1);
            setGameState('playing');
            loadLevel(currentLevelId + 1);
        } else {
            onBack();
        }
    };

    const currentLevelConfig = LEVELS.find(l => l.id === currentLevelId);

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
            <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <div className="z-10 w-full max-w-md flex justify-between items-center mb-8 bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl border-b-4 border-slate-700 shadow-2xl">
                <button onClick={onBack} className="p-2 bg-slate-900 rounded-lg text-red-500 font-bold border border-white/10 hover:bg-red-500/10 active:scale-95 transition-all">ВЫХОД</button>
                <div className="text-center">
                    <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest block">Уровень {currentLevelId}</span>
                    <div className={`px-4 py-1 rounded-xl font-mono text-xl font-black border-2 ${timeLeft < 10 ? 'border-red-500 text-red-500 bg-red-500/10 animate-pulse' : 'border-sky-500 text-sky-400 bg-sky-900/30'}`}>
                        {timeLeft}с
                    </div>
                </div>
                <div className="w-16"></div>
            </div>

            <div className="z-10 grid gap-2 bg-slate-800 p-4 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-slate-700 relative" style={{ gridTemplateColumns: `repeat(${currentLevelConfig?.width || 4}, 1fr)`, width: 'min(95vw, 400px)', aspectRatio: `${(currentLevelConfig?.width || 1) / (currentLevelConfig?.height || 1)}` }}>
                {grid.map((cell) => (
                    <div key={`${cell.x}-${cell.y}`} onClick={() => handleCellClick(cell.x, cell.y)} className={`relative rounded-lg transition-all duration-100 flex items-center justify-center ${cell.type === 'empty' ? '' : 'cursor-pointer active:scale-95'} ${cell.fixed ? 'cursor-not-allowed' : ''}`} style={{ backgroundColor: cell.type === 'empty' ? 'transparent' : '#1e293b', boxShadow: cell.type !== 'empty' ? 'inset 0 0 10px rgba(0,0,0,0.5)' : 'none' }}>
                        {cell.type !== 'empty' && <div className="w-full h-full transition-transform duration-300 ease-out" style={{ transform: `rotate(${cell.rotation * 90}deg)` }}><PipeIcon type={cell.type} powered={cell.isPowered} /></div>}
                    </div>
                ))}
            </div>

            {gameState === 'won' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-800 p-8 rounded-3xl border-2 border-yellow-400 text-center shadow-2xl max-w-xs w-full relative">
                        <div className="text-6xl mb-2 animate-bounce">⚡</div>
                        <h2 className="text-2xl font-black text-white mb-1 uppercase">Победа!</h2>
                        <button onClick={handleNext} className="w-full mt-4 py-4 bg-yellow-500 text-black font-black uppercase rounded-xl shadow-lg transform hover:scale-105 transition-all">{currentLevelId < LEVELS.length ? 'Далее' : 'Завершить'}</button>
                    </div>
                </div>
            )}

            {gameState === 'lost' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="bg-slate-900 p-8 rounded-3xl border-2 border-red-600 text-center shadow-2xl max-w-xs w-full">
                        <h2 className="text-3xl font-black text-red-500 mb-2 uppercase italic">Сбой!</h2>
                        <button onClick={() => loadLevel(currentLevelId)} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl mb-3">Повторить</button>
                        <button onClick={onBack} className="text-slate-500 hover:text-white text-sm">В меню</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const PipeIcon: React.FC<{ type: CellType, powered: boolean }> = ({ type, powered }) => {
    const pipeColor = powered ? '#38bdf8' : '#334155';
    const coreColor = powered ? '#e0f2fe' : '#1e293b';
    const glow = powered ? 'drop-shadow(0 0 4px #38bdf8)' : '';
    const strokeW = 24;
    const innerW = 10;
    switch (type) {
        case 'source':
            return (
                <svg viewBox="0 0 100 100" className="w-full h-full p-1">
                    <defs><radialGradient id="gradSource" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" style={{stopColor: powered ? '#fef08a' : '#555'}} /><stop offset="100%" style={{stopColor: powered ? '#eab308' : '#333'}} /></radialGradient></defs>
                    <rect x="50" y="40" width="50" height="20" fill={powered ? '#fbbf24' : '#475569'} />
                    <circle cx="50" cy="50" r="35" fill="url(#gradSource)" className={powered ? "animate-pulse" : ""} stroke={powered ? '#fbbf24' : '#1e293b'} strokeWidth="4" />
                    <path d="M45 35 L60 50 L45 65" fill="none" stroke={powered ? '#713f12' : '#000'} strokeWidth="5" strokeLinecap="round"/>
                </svg>
            );
        case 'sink':
            return (
                <svg viewBox="0 0 100 100" className="w-full h-full p-1">
                    <rect x="0" y="40" width="50" height="20" fill={powered ? '#fbbf24' : '#475569'} />
                    <rect x="20" y="20" width="60" height="60" rx="12" fill={powered ? '#22c55e' : '#1e293b'} stroke={powered ? '#86efac' : '#334155'} strokeWidth="4" />
                    <path d="M50 35 L40 50 H60 L50 65" fill={powered ? '#fff' : '#475569'} />
                </svg>
            );
        case 'straight':
            return (
                <svg viewBox="0 0 100 100" style={{ filter: glow }}>
                    <line x1="0" y1="50" x2="100" y2="50" stroke={pipeColor} strokeWidth={strokeW} strokeLinecap="butt" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke={coreColor} strokeWidth={innerW} opacity={powered ? 1 : 0.2} />
                </svg>
            );
        case 'curve':
            return (
                <svg viewBox="0 0 100 100" style={{ filter: glow }}>
                    <path d="M0 50 H50 V100" fill="none" stroke={pipeColor} strokeWidth={strokeW} strokeLinejoin="round" />
                    <path d="M0 50 H50 V100" fill="none" stroke={coreColor} strokeWidth={innerW} strokeLinejoin="round" opacity={powered ? 1 : 0.2} />
                </svg>
            );
        case 'tee':
            return (
                <svg viewBox="0 0 100 100" style={{ filter: glow }}>
                    <path d="M0 50 H100 M50 50 V100" fill="none" stroke={pipeColor} strokeWidth={strokeW} strokeLinecap="butt" />
                    <path d="M0 50 H100 M50 50 V100" fill="none" stroke={coreColor} strokeWidth={innerW} opacity={powered ? 1 : 0.2} />
                </svg>
            );
        default: return null;
    }
};

export default EnergyGame;
