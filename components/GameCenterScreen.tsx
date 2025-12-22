
import React from 'react';
import type { View } from '../types';

interface GameCenterScreenProps {
    onNavigate: (view: View) => void;
    onBack: () => void;
}

const GameCard: React.FC<{ title: string, description: string, icon: string, color: string, onClick: () => void }> = ({ title, description, icon, color, onClick }) => (
    <button onClick={onClick} className={`w-full p-6 rounded-3xl bg-gradient-to-br ${color} text-white text-left shadow-xl hover:scale-[1.02] transition-transform`}>
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">{title}</h3>
                <p className="text-white/80 text-sm leading-relaxed">{description}</p>
            </div>
            <div className="text-5xl ml-4">{icon}</div>
        </div>
    </button>
);

const GameCenterScreen: React.FC<GameCenterScreenProps> = ({ onNavigate, onBack }) => {
    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <button onClick={onBack} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors group mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-semibold">Назад</span>
            </button>
            <h1 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-8">Игровая Зона</h1>
            <div className="space-y-4">
                <GameCard 
                    title="Энерго-Сеть"
                    description="Соединяй узлы и питай город энергией. Проверь свои навыки инженера."
                    icon="⚡"
                    color="from-blue-500 to-indigo-600"
                    onClick={() => onNavigate({ name: 'energyGame' })}
                />
                <GameCard 
                    title="Охотник на Баги"
                    description="Найди ошибки в коде раньше, чем истечет время. Путь программиста."
                    icon="🐞"
                    color="from-emerald-500 to-teal-600"
                    onClick={() => onNavigate({ name: 'bugHunterGame' })}
                />
                <GameCard 
                    title="Кибер-Шеф"
                    description="Собирай заказы в ритме будущего. Проверка реакции и памяти."
                    icon="🍔"
                    color="from-orange-500 to-rose-600"
                    onClick={() => onNavigate({ name: 'chefGame' })}
                />
                <GameCard 
                    title="Сортировщик"
                    description="Управляй логистическим центром и распределяй грузы."
                    icon="📦"
                    color="from-sky-500 to-blue-700"
                    onClick={() => onNavigate({ name: 'logisticsGame' })}
                />
                <GameCard 
                    title="Неотложка"
                    description="Оценивай состояние пациентов и принимай решения за секунды."
                    icon="🚑"
                    color="from-red-500 to-pink-600"
                    onClick={() => onNavigate({ name: 'triageGame' })}
                />
                <GameCard 
                    title="Кибер-Щит"
                    description="Отражай хакерские атаки и защищай данные корпорации."
                    icon="🛡️"
                    color="from-cyan-500 to-blue-600"
                    onClick={() => onNavigate({ name: 'securityGame' })}
                />
                <GameCard 
                    title="Архитектор Света"
                    description="Управляй лазерными лучами и зеркалами. Запитай мегаполис."
                    icon="💎"
                    color="from-indigo-500 to-purple-600"
                    onClick={() => onNavigate({ name: 'architectGame' })}
                />
                <GameCard 
                    title="Агро-Дрон"
                    description="Сканируй поля и спасай урожай с помощью ИИ-дрона. Высокие технологии в полях."
                    icon="🛸"
                    color="from-emerald-400 to-green-700"
                    onClick={() => onNavigate({ name: 'agroDroneGame' })}
                />
            </div>
        </div>
    );
};

export default GameCenterScreen;
