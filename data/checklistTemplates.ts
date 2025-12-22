import { ChecklistItem } from '../types';
import { mockColleges, mockSpecialties, mockEvents } from './mockData';

export const generateChecklist = (type: 'college' | 'specialty', id: string): ChecklistItem[] => {
    // Removed generic score calculation items as they are now handled by the UI header

    if (type === 'college') {
        const college = mockColleges.find(c => c.id === id);
        if (!college) return [];

        const openDay = mockEvents.find(e => e.collegeId === id && e.type === 'openDay');
        const openDayText = openDay 
            ? `Посетить День открытых дверей (${new Date(openDay.date).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'})})` 
            : 'Узнать дату Дня открытых дверей';

        return [
            // FIX: Use websiteUrl property directly from the College interface instead of nested contacts object
            { id: 'visit-site', text: 'Изучить официальный сайт', isCompleted: false, type: 'link', payload: college.websiteUrl },
            { id: 'open-day', text: openDayText, isCompleted: false, type: 'navigation', payload: {name: 'calendar'} },
            { id: 'prepare-docs', text: 'Собрать документы: Паспорт, Аттестат, 4 фото (3х4)', isCompleted: false, type: 'info' },
            { id: 'med-cert', text: 'Получить мед. справку 086/у', isCompleted: false, type: 'info' },
            { id: 'submit-app', text: 'Подать заявление (с 20 июня)', isCompleted: false, type: 'info' },
        ];
    }

    if (type === 'specialty') {
        const specialty = mockSpecialties.find(s => s.id === id);
        if (!specialty) return [];

         return [
            { id: 'read-skills', text: 'Изучить необходимые навыки', isCompleted: false, type: 'info' },
            { id: 'check-salary', text: 'Оценить зарплатные перспективы', isCompleted: false, type: 'info' },
            { id: 'choose-college', text: 'Выбрать колледж для поступления', isCompleted: false, type: 'info' },
            { id: 'watch-reviews', text: 'Посмотреть видео/обзоры профессии', isCompleted: false, type: 'navigation', payload: {name: 'shorts'} },
        ];
    }
    
    return [];
};