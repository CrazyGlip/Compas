
import React, { useState } from 'react';

interface OnboardingScreenProps {
    onComplete: (action: 'dashboard' | 'quiz') => void;
}

const steps = [
    {
        id: 1,
        title: "Твой навигатор в будущем",
        description: "Забудь о скучных списках. Мы превратили поступление в понятную стратегию. Строй свой путь осознанно.",
        icon: "🚀",
        color: "from-violet-600 to-indigo-600"
    },
    {
        id: 2,
        title: "Оцени свои силы",
        description: "С чего начать? Рассчитай средний балл в Калькуляторе. Мы сразу подсветим специальности, на которые ты проходишь.",
        icon: "📊",
        color: "from-sky-500 to-blue-600"
    },
    {
        id: 3,
        title: "«Мой План» — твой штаб",
        description: "Это главное окно приложения. Добавляй сюда колледжи, используй режим «Сравнения», следи за датами и чеклистами.",
        icon: "🗺️",
        color: "from-rose-500 to-pink-600"
    },
    {
        id: 4,
        title: "Прокачивай уровень",
        description: "Будь активным! Смотри Shorts, изучай профессии и открывай редкие достижения. Стань настоящим «Стратегом».",
        icon: "🏆",
        color: "from-amber-400 to-orange-500"
    },
    {
        id: 5,
        title: "С чего начнем?",
        description: "Если еще не решил, кем стать — пройди тест. Если готов строить план — вперед на главную!",
        icon: "🏁",
        color: "from-emerald-500 to-teal-600",
        isFinal: true
    }
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    
    // Swipe logic
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            nextStep();
        }
        if (isRightSwipe) {
            prevStep();
        }
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete('dashboard');
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const stepData = steps[currentStep];

    return (
        <div 
            className="fixed inset-0 z-[100] bg-slate-900 text-white flex flex-col"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Background decoration */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stepData.color} opacity-20 transition-all duration-500 blur-3xl`} />

            {/* Progress Bar */}
            <div className="flex gap-2 px-4 pt-safe top-4 absolute w-full z-10 mt-4">
                {steps.map((_, index) => (
                    <div key={index} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div 
                            className={`h-full bg-white transition-all duration-300 ${index <= currentStep ? 'w-full' : 'w-0'}`}
                        />
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 animate-fade-in">
                <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-6xl mb-8 shadow-2xl animate-fade-in-up">
                    {stepData.icon}
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-center mb-4 leading-tight animate-fade-in-up">
                    {stepData.title}
                </h2>
                
                <p className="text-slate-300 text-center text-lg leading-relaxed max-w-md animate-fade-in-up delay-100">
                    {stepData.description}
                </p>
            </div>

            {/* Controls */}
            <div className="p-6 pb-safe z-10 w-full max-w-md mx-auto">
                {stepData.isFinal ? (
                    <div className="flex flex-col gap-3 animate-fade-in-up">
                        <button 
                            onClick={() => onComplete('quiz')}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-transform"
                        >
                            Пройти тест
                        </button>
                        <button 
                            onClick={() => onComplete('dashboard')}
                            className="w-full py-4 bg-white/10 rounded-xl font-semibold text-slate-300 hover:bg-white/20 transition-colors"
                        >
                            К плану поступления
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-between items-center">
                        <button 
                            onClick={() => onComplete('dashboard')}
                            className="text-slate-400 text-sm font-medium px-4 py-2 hover:text-white"
                        >
                            Пропустить
                        </button>
                        
                        <button 
                            onClick={nextStep}
                            className="px-8 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors shadow-lg"
                        >
                            Далее
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnboardingScreen;
