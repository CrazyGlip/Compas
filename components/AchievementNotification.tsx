
import React, { useEffect, useState } from 'react';
import { Achievement } from '../types';

interface AchievementNotificationProps {
    achievement: Achievement;
    onClose: () => void;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({ achievement, onClose }) => {
    const [visible, setVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        const enterTimer = setTimeout(() => setVisible(true), 50);
        
        // Auto hide timer
        const exitTimer = setTimeout(() => {
            handleClose();
        }, 5000); // 5 seconds display

        return () => {
            clearTimeout(enterTimer);
            clearTimeout(exitTimer);
        };
    }, []);

    const handleClose = () => {
        if (isClosing) return;
        setIsClosing(true);
        setVisible(false); // Trigger exit animation
        
        // Wait for animation to finish before unmounting via parent
        setTimeout(() => {
            onClose();
        }, 500); 
    };

    return (
        <div 
            onClick={handleClose}
            className={`fixed top-20 left-4 right-4 z-[100] flex justify-center transition-all duration-500 transform cursor-pointer ${visible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}
        >
            <div className="bg-slate-800/95 backdrop-blur-xl border border-yellow-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(234,179,8,0.3)] flex items-center gap-4 max-w-sm w-full pointer-events-auto hover:bg-slate-800 transition-colors">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${achievement.color} flex items-center justify-center text-2xl shadow-lg shrink-0`}>
                    {achievement.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Достижение разблокировано!</p>
                    <h4 className="text-white font-bold leading-tight truncate">{achievement.title}</h4>
                    <p className="text-slate-300 text-xs mt-1 line-clamp-2">{achievement.description}</p>
                </div>
                <div className="text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default AchievementNotification;
