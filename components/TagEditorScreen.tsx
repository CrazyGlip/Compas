
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Tag } from '../types';
import EditDataModal, { EditField } from './EditDataModal';

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors group mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-semibold">Настройки</span>
    </button>
);

interface TagEditorScreenProps {
    onBack: () => void;
}

const TagEditorScreen: React.FC<TagEditorScreenProps> = ({ onBack }) => {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const data = await api.getGlobalTags();
        // Sort by category, then name
        const sorted = data.sort((a, b) => {
            if (a.category !== b.category) return a.category.localeCompare(b.category);
            return a.name.localeCompare(b.name);
        });
        setTags(sorted);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = async (data: any) => {
        const res = await api.createTag({
            name: data.name,
            category: data.category
        });
        if (!res.success) {
            alert('Ошибка создания: ' + res.error);
        } else {
            await loadData();
            setIsModalOpen(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Вы уверены? Удаление тега может повлиять на привязанные специальности.')) return;
        
        const res = await api.deleteTag(id);
        if (res.success) {
            setTags(prev => prev.filter(t => t.id !== id));
        } else {
            alert('Ошибка удаления: ' + res.error);
        }
    };

    const createFields: EditField[] = [
        { key: 'name', label: 'Название Тега (например, "Логика")', type: 'text' },
        { 
            key: 'category', 
            label: 'Категория', 
            type: 'select',
            options: [
                { value: 'skill', label: 'Навык (Skill)' },
                { value: 'interest', label: 'Интерес' },
                { value: 'environment', label: 'Условия работы' },
            ]
        }
    ];

    const getCategoryColor = (cat: string) => {
        switch(cat) {
            case 'skill': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
            case 'interest': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300';
            case 'environment': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20 relative">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-24 right-4 z-50 bg-green-600 text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition-transform hover:scale-110 active:scale-95 border-2 border-white/20"
                title="Создать тег"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>

            {isModalOpen && (
                <EditDataModal 
                    title="Новый Тег"
                    initialData={{ category: 'skill' }}
                    fields={createFields}
                    onSave={handleCreate}
                    onClose={() => setIsModalOpen(false)}
                />
            )}

            <BackButton onClick={onBack} />
            
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Справочник Тегов</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Основа системы рекомендаций</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
                </div>
            ) : (
                <div className="space-y-2">
                    {tags.map(tag => (
                        <div 
                            key={tag.id}
                            className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${getCategoryColor(tag.category)}`}>
                                    {tag.category}
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white">{tag.name}</span>
                            </div>
                            <button 
                                onClick={(e) => handleDelete(e, tag.id)}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TagEditorScreen;
