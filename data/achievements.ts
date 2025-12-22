
import { Achievement } from '../types';

export const achievements: Achievement[] = [
    {
        id: 'first_step',
        title: 'Первый шаг',
        description: 'Рассчитайте свой средний балл аттестата',
        icon: '🧮',
        color: 'from-blue-400 to-indigo-500',
        condition: (state) => state.hasCalculatedScore,
        targetView: { name: 'profile' }
    },
    {
        id: 'explorer',
        title: 'Исследователь',
        description: 'Добавьте 3 специальности или колледжа в свой план',
        icon: '🗺️',
        color: 'from-emerald-400 to-teal-500',
        condition: (state) => state.planCount >= 3,
        targetView: { name: 'specialties' }
    },
    {
        id: 'self_aware',
        title: 'Познай себя',
        description: 'Пройдите любой профориентационный тест',
        icon: '🧘',
        color: 'from-purple-400 to-pink-500',
        condition: (state) => state.quizzesPassed >= 1,
        targetView: { name: 'quiz' }
    },
    {
        id: 'strategist',
        title: 'Стратег',
        description: 'Соберите план из 5 пунктов (включая колледжи и специальности)',
        icon: '♟️',
        color: 'from-amber-400 to-orange-500',
        condition: (state) => state.planCount >= 5 && state.specialtiesInPlan > 0 && state.collegesInPlan > 0
    },
    {
        id: 'viewer',
        title: 'Зритель',
        description: 'Посмотрите 5 видео о профессиях',
        icon: '🍿',
        color: 'from-rose-400 to-red-500',
        condition: (state) => state.videosWatched >= 5,
        targetView: { name: 'shorts' }
    },
    {
        id: 'analyst',
        title: 'Аналитик',
        description: 'Сравните варианты в режиме "Мой План"',
        icon: '⚖️',
        color: 'from-cyan-400 to-blue-600',
        condition: (state) => state.hasUsedComparison,
        targetView: { name: 'myPlan' }
    },
    {
        id: 'influencer',
        title: 'Инфлюенсер',
        description: 'Поставьте лайк 3 видео',
        icon: '❤️',
        color: 'from-pink-500 to-rose-600',
        condition: (state) => state.videosLiked >= 3,
        targetView: { name: 'shorts' }
    },
    {
        id: 'polymath',
        title: 'Эрудит',
        description: 'Пройдите 3 теста для точного результата',
        icon: '🎓',
        color: 'from-fuchsia-500 to-purple-600',
        condition: (state) => state.quizzesPassed >= 3,
        targetView: { name: 'quiz' }
    }
];
