
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';

type IngredientType = 'bun_bottom' | 'meat' | 'cheese' | 'lettuce' | 'tomato' | 'bun_top' | 'sauce';

interface Ingredient {
    type: IngredientType;
    icon: string;
    name: string;
    color: string;
    width: string;
    borderRadius: string;
}

const INGREDIENTS_DATA: Record<IngredientType, Ingredient> = {
    'bun_bottom': { type: 'bun_bottom', icon: '🍞', name: 'Основа', color: 'bg-amber-800', width: 'w-48', borderRadius: 'rounded-b-3xl rounded-t-lg' },
    'meat':       { type: 'meat',       icon: '🥩', name: 'Котлета', color: 'bg-orange-950', width: 'w-44', borderRadius: 'rounded-xl' },
    'cheese':     { type: 'cheese',     icon: '🧀', name: 'Сыр', color: 'bg-yellow-400', width: 'w-46', borderRadius: 'rounded-sm' },
    'lettuce':    { type: 'lettuce',    icon: '🥬', name: 'Салат', color: 'bg-green-500', width: 'w-52', borderRadius: 'rounded-full' },
    'tomato':     { type: 'tomato',     icon: '🍅', name: 'Томат', color: 'bg-red-600', width: 'w-40', borderRadius: 'rounded-2xl' },
    'bun_top':    { type: 'bun_top',    icon: '🍔', name: 'Крышка', color: 'bg-amber-600', width: 'w-46', borderRadius: 'rounded-t-3xl rounded-b-lg' },
    'sauce':      { type: 'sauce',      icon: '🧴', name: 'Соус',   color: 'bg-red-500',    width: 'w-44', borderRadius: 'rounded-md' },
};

interface MovingItem {
    id: string;
    type: IngredientType;
    x: number; 
    isDecoy: boolean;
    hasBeenMissed?: boolean;
    isCollected?: boolean;
}

// --- МЕМОИЗИРОВАННЫЕ КОМПОНЕНТЫ ---

const GameHeader = memo(({ score, lives, misses }: { score: number, lives: number, misses: number }) => (
    <div className="z-50 p-4 flex justify-between items-center bg-slate-900/90 border-b border-white/10 backdrop-blur-xl h-20">
        <button onClick={(window as any)._chefGameBack} className="px-4 py-2 bg-slate-800 rounded-xl text-red-400 font-black border border-red-500/20 active:scale-95 transition-all text-xs tracking-widest">ВЫХОД</button>
        <div className="text-center">
            <div className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-widest">СИНТЕЗ</div>
            <div className="text-3xl font-black text-white tabular-nums drop-shadow-md">{score}</div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
            <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className={`w-3.5 h-3.5 rotate-45 transition-all duration-500 ${i < lives ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-slate-800'}`}></div>
                ))}
            </div>
            <div className="flex gap-1.5">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i < misses ? 'bg-orange-500 shadow-[0_0_8px_orange] scale-125' : 'bg-slate-800'}`}></div>
                ))}
            </div>
        </div>
    </div>
));

const RecipeList = memo(({ recipe, assembledLength }: { recipe: IngredientType[], assembledLength: number }) => (
    <div className="absolute top-4 left-4 z-40 bg-slate-900/90 border border-white/10 p-4 rounded-[2rem] backdrop-blur-md shadow-2xl">
        <div className="text-[8px] text-slate-500 font-black uppercase mb-3 tracking-widest border-b border-white/5 pb-1">РЕЦЕПТ</div>
        <div className="flex flex-col-reverse gap-1.5">
            {recipe.map((type, i) => (
                <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${assembledLength > i ? 'opacity-10 scale-90 translate-x-2' : 'opacity-100'}`}>
                    <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-sm shadow-inner">{INGREDIENTS_DATA[type].icon}</div>
                    <span className={`text-[9px] font-bold uppercase ${assembledLength === i ? 'text-white underline underline-offset-4 decoration-sky-500' : 'text-slate-500'}`}>
                        {INGREDIENTS_DATA[type].name}
                    </span>
                </div>
            ))}
        </div>
    </div>
));

const BurgerDisplay = memo(({ assembled }: { assembled: IngredientType[] }) => (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full flex flex-col-reverse items-center pointer-events-none z-30 transform-gpu">
        <div className="w-64 h-4 bg-gradient-to-b from-slate-200 to-slate-400 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.5)] border-t border-white mb-[-8px] relative">
             <div className="absolute inset-0 bg-blue-400/10 blur-xl"></div>
        </div>
        {assembled.map((type, i) => {
            const data = INGREDIENTS_DATA[type];
            if (type === 'sauce') return <div key={i} className="w-36 h-2.5 bg-red-600/90 rounded-full blur-[1px] mb-[-4px] z-10 animate-fade-in border-b border-red-800" />;
            return (
                <div key={i} className={`${data.width} h-9 ${data.color} ${data.borderRadius} border-b-2 border-black/20 flex items-center justify-center text-white shadow-xl relative animate-drop-in`} style={{ zIndex: i + 1, marginBottom: '-5px' }}>
                    <span className="text-2xl drop-shadow-lg">{data.icon}</span>
                </div>
            );
        })}
    </div>
));

const ChefGame: React.FC<{ onBack: () => void; onWin: (score: number) => void }> = ({ onBack, onWin }) => {
    const [gameState, setGameState] = useState<'intro' | 'playing' | 'lost' | 'won'>('intro');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [misses, setMisses] = useState(0);
    const [recipe, setRecipe] = useState<IngredientType[]>([]);
    const [assembled, setAssembled] = useState<IngredientType[]>([]);
    const [movingItems, setMovingItems] = useState<MovingItem[]>([]);
    
    const [sauceTaps, setSauceTaps] = useState(0);
    const [sauceDrops, setSauceDrops] = useState<{id: number, x: number}[]>([]);
    const REQUIRED_SAUCE_TAPS = 6;

    const [visualEffect, setVisualEffect] = useState<'none' | 'success' | 'error' | 'sauce'>('none');
    
    const clickLockoutRef = useRef(false);
    const requestRef = useRef<number>(null);
    const speedRef = useRef(0.65);
    const assembledRef = useRef<IngredientType[]>([]);
    const recipeRef = useRef<IngredientType[]>([]);
    const movingItemsRef = useRef<MovingItem[]>([]);

    const ITEM_SPACING = 35; 
    const SCANNER_CENTER = 50; 
    const SCANNER_RANGE = 18; // Слегка увеличено для комфорта
    const MISS_THRESHOLD = 72; // Точка потери цели

    (window as any)._chefGameBack = onBack;

    const initConveyor = useCallback((currentRecipe: IngredientType[]) => {
        const solidRecipe = currentRecipe.filter(t => t !== 'sauce');
        const decoys: IngredientType[] = ['meat', 'cheese', 'lettuce', 'tomato'];
        const deck: MovingItem[] = [];
        let currentPos = -20;

        solidRecipe.forEach((targetType, idx) => {
            const decoyCount = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < decoyCount; i++) {
                deck.push({
                    id: `decoy-${idx}-${i}-${Math.random()}`,
                    type: decoys[Math.floor(Math.random() * decoys.length)],
                    x: currentPos,
                    isDecoy: true
                });
                currentPos -= ITEM_SPACING;
            }
            deck.push({
                id: `target-${targetType}-${idx}-${Math.random()}`,
                type: targetType,
                x: currentPos,
                isDecoy: false
            });
            currentPos -= ITEM_SPACING;
        });
        movingItemsRef.current = deck;
        setMovingItems(deck);
    }, []);

    const generateRecipe = useCallback(() => {
        const mids: IngredientType[] = ['meat', 'cheese', 'lettuce', 'tomato'];
        const newRecipe: IngredientType[] = ['bun_bottom'];
        const layersCount = 3 + Math.floor(score / 2500);
        
        for (let i = 0; i < layersCount; i++) {
            newRecipe.push(mids[Math.floor(Math.random() * mids.length)]);
            if (i === 1) newRecipe.push('sauce');
        }
        newRecipe.push('bun_top');
        
        recipeRef.current = newRecipe;
        assembledRef.current = [];
        
        setRecipe(newRecipe);
        setAssembled([]);
        setMisses(0);
        setSauceTaps(0);
        setSauceDrops([]);
        clickLockoutRef.current = false;
        initConveyor(newRecipe);
    }, [score, initConveyor]);

    const triggerEffect = (type: 'success' | 'error' | 'sauce') => {
        setVisualEffect(type);
        setTimeout(() => setVisualEffect('none'), 300);
    };

    const update = useCallback(() => {
        if (gameState !== 'playing') return;

        const nextNeededType = recipeRef.current[assembledRef.current.length];
        const isSauceTime = nextNeededType === 'sauce';
        
        const activeItems = movingItemsRef.current.filter(i => !i.isCollected && i.x < 110);
        const currentMinX = activeItems.length > 0 ? Math.min(...activeItems.map(i => i.x)) : -20;

        const nextItems = movingItemsRef.current.map(item => {
            let newX = item.x + (isSauceTime ? speedRef.current * 0.1 : speedRef.current);
            let hasBeenMissed = item.hasBeenMissed;

            // Теперь любой предмет нужного типа считается целью. 
            // Если он пересек черту и не собран - это промах.
            if (!isSauceTime && item.type === nextNeededType && !item.isCollected && newX >= MISS_THRESHOLD && !hasBeenMissed) {
                hasBeenMissed = true;
                setMisses(m => {
                    const nextM = m + 1;
                    if (nextM >= 3) {
                        setLives(l => {
                            const nextL = l - 1;
                            if (nextL <= 0) setGameState('lost');
                            return nextL;
                        });
                        return 0; 
                    }
                    return nextM;
                });
                triggerEffect('error');
            }

            if (newX > 120) {
                newX = currentMinX - ITEM_SPACING; 
                hasBeenMissed = false;
            }

            return { ...item, x: newX, hasBeenMissed };
        });

        movingItemsRef.current = nextItems;
        setMovingItems(nextItems);
        requestRef.current = requestAnimationFrame(update);
    }, [gameState]);

    useEffect(() => {
        if (gameState === 'playing') {
            requestRef.current = requestAnimationFrame(update);
        } else if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [gameState, update]);

    const handleGlobalClick = (e: React.MouseEvent) => {
        if (gameState !== 'playing' || clickLockoutRef.current) return;
        if ((e.target as HTMLElement).closest('button')) return;

        const nextNeeded = recipeRef.current[assembledRef.current.length];

        if (nextNeeded === 'sauce') {
            setSauceTaps(prev => {
                const next = prev + 1;
                triggerEffect('sauce');
                const dropId = Date.now() + Math.random();
                setSauceDrops(d => [...d, { id: dropId, x: (Math.random() * 40) - 20 }]);
                setTimeout(() => setSauceDrops(d => d.filter(item => item.id !== dropId)), 600);

                if (next >= REQUIRED_SAUCE_TAPS) {
                    clickLockoutRef.current = true;
                    const newAssembled = [...assembledRef.current, 'sauce' as IngredientType];
                    assembledRef.current = newAssembled;
                    setAssembled(newAssembled);
                    setScore(s => s + 80);
                    setTimeout(() => {
                        clickLockoutRef.current = false;
                        if (newAssembled.length === recipeRef.current.length) finishBurger();
                    }, 800);
                    return 0; 
                }
                return next;
            });
            return;
        }

        // ПРОВЕРКА ПОПАДАНИЯ ПО ТИПУ (Любой предмет нужного типа в сканере подходит)
        const targetInScanner = movingItemsRef.current.find(item => 
            item.x >= (SCANNER_CENTER - SCANNER_RANGE) && 
            item.x <= (SCANNER_CENTER + SCANNER_RANGE) && 
            !item.isCollected &&
            item.type === nextNeeded
        );

        if (targetInScanner) {
            triggerEffect('success');
            clickLockoutRef.current = true;
            
            const newAssembled = [...assembledRef.current, targetInScanner.type];
            assembledRef.current = newAssembled;
            setAssembled(newAssembled);
            setScore(s => s + 50);
            
            // Убираем именно тот экземпляр, по которому "попали"
            movingItemsRef.current = movingItemsRef.current.map(i => i.id === targetInScanner.id ? { 
                ...i, isCollected: true, x: -150 
            } : i);

            setTimeout(() => {
                clickLockoutRef.current = false;
                if (newAssembled.length === recipeRef.current.length) finishBurger();
            }, 250);
        } else {
            triggerEffect('error');
            setLives(l => {
                const next = l - 1;
                if (next <= 0) setGameState('lost');
                return next;
            });
        }
    };

    const finishBurger = () => {
        setScore(s => s + 350);
        setTimeout(() => {
            speedRef.current = Math.min(2.2, speedRef.current + 0.12);
            generateRecipe();
        }, 1100);
    };

    return (
        <div 
            onClick={handleGlobalClick}
            className={`fixed inset-0 bg-slate-950 flex flex-col font-mono overflow-hidden select-none touch-none transition-all duration-300 ${visualEffect === 'error' ? 'animate-shake-screen' : ''}`}
        >
            <div className="absolute inset-0 opacity-30 bg-cover bg-center" style={{ backgroundImage: `url('https://yrlxygbsmfndcfntdmon.supabase.co/storage/v1/object/public/images/kitchen.jpg')` }} />
            <div className={`absolute inset-0 transition-colors duration-300 ${visualEffect === 'error' ? 'bg-red-900/40' : visualEffect === 'success' ? 'bg-green-500/10' : 'bg-black/50'} backdrop-blur-[1px]`} />

            <GameHeader score={score} lives={lives} misses={misses} />

            <div className="flex-1 relative">
                {gameState === 'playing' && (
                    <>
                        <RecipeList recipe={recipe} assembledLength={assembled.length} />
                        
                        <div className="absolute top-[40%] -translate-y-1/2 w-full h-40">
                            <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-white/5" />
                            
                            {/* Зона сканера */}
                            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-4 rounded-[3rem] transition-all duration-200 z-10 flex items-center justify-center ${visualEffect === 'success' ? 'border-green-400 bg-green-400/20 scale-110 shadow-[0_0_30px_green]' : visualEffect === 'error' ? 'border-red-500 bg-red-500/20 scale-95 shadow-[0_0_30px_red]' : 'border-white/20 bg-white/5 backdrop-blur-[2px]'}`}>
                                <div className="absolute inset-x-6 top-1/2 h-1 bg-sky-500/40 animate-scan"></div>
                                {!assembled.includes('sauce') && recipe[assembled.length] && (
                                    <div className="absolute -top-12 text-[10px] font-black text-sky-400 bg-slate-900/90 px-3 py-1 rounded-full border border-sky-500/30 shadow-lg uppercase tracking-tighter">
                                        ЛОВИ: {INGREDIENTS_DATA[recipe[assembled.length]].name}
                                    </div>
                                )}
                            </div>

                            {/* Предметы на ленте */}
                            {movingItems.map(item => !item.isCollected && (
                                <div 
                                    key={item.id}
                                    className={`absolute top-1/2 -translate-y-1/2 w-20 h-20 bg-slate-900/95 rounded-3xl border border-white/10 flex items-center justify-center text-4xl shadow-2xl transition-opacity duration-300 z-20 transform-gpu ${item.x < -10 || item.x > 110 ? 'opacity-0' : 'opacity-100'} ${recipe[assembled.length] === 'sauce' ? 'grayscale opacity-30 blur-[2px]' : ''}`}
                                    style={{ left: `${item.x}%`, transform: 'translate(-50%, -50%)', willChange: 'left' }}
                                >
                                    {INGREDIENTS_DATA[item.type].icon}
                                    
                                    {/* Рамка теперь на ВСЕХ предметах нужного типа */}
                                    {item.type === recipe[assembled.length] && (
                                        <div className="absolute inset-[-6px] rounded-3xl border-4 border-sky-400/50 animate-pulse"></div>
                                    )}

                                    {/* Эффект попадания */}
                                    {item.x > (SCANNER_CENTER - SCANNER_RANGE) && item.x < (SCANNER_CENTER + SCANNER_RANGE) && item.type === recipe[assembled.length] && (
                                        <div className="absolute inset-[-12px] rounded-3xl border-2 border-white/60 animate-ping"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Бутылка соуса */}
                {gameState === 'playing' && recipe[assembled.length] === 'sauce' && (
                    <div className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] flex flex-col items-center transform-gpu">
                        <div className={`text-[10rem] drop-shadow-2xl transition-transform duration-100 rotate-180 ${visualEffect === 'sauce' ? 'scale-110 translate-y-6 rotate-[175deg]' : 'scale-100 rotate-[180deg]'}`}>
                            🧴
                        </div>
                        {sauceDrops.map(drop => (
                            <div key={drop.id} className="absolute top-full left-1/2 w-5 h-12 bg-red-600 rounded-full animate-drop-pour shadow-[0_0_15px_red]" style={{ marginLeft: `${drop.x}px` }} />
                        ))}
                        
                        {/* Улучшенная полоска соуса */}
                        <div className="w-64 h-6 bg-black/80 rounded-full mt-16 overflow-hidden border-2 border-white/20 shadow-2xl p-1">
                            <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-300 shadow-[0_0_20px_red]" style={{ width: `${(sauceTaps / REQUIRED_SAUCE_TAPS) * 100}%` }} />
                        </div>
                        <div className="mt-4 text-sm font-black text-red-500 animate-pulse tracking-[0.2em] uppercase drop-shadow-lg">ЖМИ: ЛЕЙ СОУС!</div>
                    </div>
                )}

                {gameState === 'playing' && <BurgerDisplay assembled={assembled} />}
            </div>

            {/* Начальный экран */}
            {gameState === 'intro' && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/80">
                    <div className="bg-slate-900 border border-white/10 p-10 rounded-[3rem] text-center max-w-sm shadow-2xl">
                        <div className="text-8xl mb-8 animate-bounce">🍔</div>
                        <h1 className="text-3xl font-black mb-4 bg-gradient-to-r from-sky-400 to-fuchsia-400 bg-clip-text text-transparent italic tracking-tighter uppercase">КИБЕР-КУХНЯ</h1>
                        <p className="text-slate-400 text-xs mb-8 uppercase tracking-widest leading-loose">
                            Лови только нужные ингредиенты в сканер. <br/> Подходит любой предмет нужного типа! <br/> Наполни соусом в конце!
                        </p>
                        <button onClick={() => { setGameState('playing'); generateRecipe(); }} className="w-full py-5 bg-white text-black font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs">
                            ЗАПУСТИТЬ СИСТЕМУ
                        </button>
                    </div>
                </div>
            )}

            {/* Экран проигрыша */}
            {gameState === 'lost' && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/95">
                    <div className="bg-slate-900 border border-red-500/20 p-12 rounded-[4rem] text-center max-w-xs w-full shadow-2xl">
                        <div className="text-6xl mb-6">🗑️</div>
                        <h2 className="text-2xl font-black text-red-500 mb-6 uppercase italic tracking-widest">СБОЙ СИСТЕМЫ</h2>
                        <div className="bg-white/5 p-4 rounded-2xl mb-8 border border-white/5">
                            <span className="text-slate-500 text-[10px] block uppercase font-bold mb-1">ФИНАЛЬНЫЙ СЧЕТ</span>
                            <span className="text-4xl font-black text-white tabular-nums">{score}</span>
                        </div>
                        <button onClick={() => { onWin(score); onBack(); }} className="w-full py-4 bg-red-600 text-white font-black uppercase rounded-xl transition-all active:scale-95 text-xs tracking-widest">
                            ВЫЙТИ
                        </button>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes scan { 0%, 100% { transform: translateY(-40px); opacity: 0; } 50% { transform: translateY(40px); opacity: 1; } }
                @keyframes drop-in { 0% { transform: translateY(-400px) scale(1.5); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
                @keyframes drop-pour { 
                    0% { transform: translateY(0) scaleX(1.2); opacity: 1; } 
                    100% { transform: translateY(220px) scaleX(0.4); opacity: 0; } 
                }
                @keyframes shake-screen { 0%, 100% { transform: translate(0,0); } 25% { transform: translate(-8px, 4px); } 75% { transform: translate(8px, -4px); } }
                @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-scan { animation: scan 2s ease-in-out infinite; }
                .animate-drop-in { animation: drop-in 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                .animate-drop-pour { animation: drop-pour 0.6s ease-in forwards; }
                .animate-shake-screen { animation: shake-screen 0.3s both; }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}} />
        </div>
    );
};

export default ChefGame;
