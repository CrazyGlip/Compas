
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { NewsItem } from '../types';
import ImageCarousel from './ImageCarousel';
import EditDataModal, { EditField } from './EditDataModal';

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors group mb-6 z-10 relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-semibold">Назад к новостям</span>
    </button>
);

interface NewsDetailScreenProps {
    newsId: string;
    onBack: () => void;
    isAdminMode?: boolean;
}

const NewsDetailScreen: React.FC<NewsDetailScreenProps> = ({ newsId, onBack, isAdminMode }) => {
    const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const load = async () => {
        const allNews = await api.getNews();
        const item = allNews.find(n => n.id === newsId);
        setNewsItem(item || null);
    };

    useEffect(() => {
        load();
    }, [newsId]);

    const handleSave = async (updatedData: any) => {
        if (!newsItem) return;
        const res = await api.updateNews(newsItem.id, updatedData);
        if (!res.success) {
            alert('Ошибка сохранения: ' + res.error);
        } else {
            await load(); // Reload data
        }
    };

    const handleDelete = async () => {
        if (!newsItem) return;
        const res = await api.deleteNews(newsItem.id);
        if (!res.success) {
            throw new Error(res.error);
        }
        onBack(); // Go back to list on success
    };

    if (!newsItem) {
        return (
            <div className="p-6">
                <BackButton onClick={onBack} />
                <p className="text-center text-slate-500 dark:text-slate-400">Загрузка...</p>
            </div>
        );
    }

    const editFields: EditField[] = [
        { key: 'title', label: 'Заголовок', type: 'text' },
        { key: 'imageUrl', label: 'Обложка новости', type: 'image' },
        { key: 'gallery', label: 'Фоторепортаж (Дополнительные фото)', type: 'gallery' },
        { key: 'date', label: 'Дата', type: 'date' },
        { key: 'summary', label: 'Краткое описание', type: 'textarea' },
        { key: 'content', label: 'Полный текст (HTML)', type: 'textarea' },
    ];

    // Filter gallery to exclude the main image for the edit modal
    const flatData = {
        ...newsItem,
        gallery: newsItem.gallery?.filter(img => img !== newsItem.imageUrl) || []
    };

    return (
        <div className="animate-fade-in pb-10 relative">
            {isAdminMode && (
                <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="fixed bottom-24 right-4 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition-transform hover:scale-110 active:scale-95 border-2 border-white/20"
                    title="Редактировать новость"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>
            )}

            {isEditModalOpen && (
                <EditDataModal 
                    title="Редактировать Новость"
                    initialData={flatData}
                    fields={editFields}
                    onSave={handleSave}
                    onClose={() => setIsEditModalOpen(false)}
                    onDelete={handleDelete}
                />
            )}

            <BackButton onClick={onBack} />
            
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl">
                <div className="h-64 md:h-80 relative">
                     <img src={newsItem.imageUrl} alt={newsItem.title} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                     <div className="absolute bottom-0 left-0 p-6 w-full">
                        <div className="flex flex-wrap gap-2 mb-3">
                             {newsItem.tags && newsItem.tags.map(tag => (
                                <span key={tag} className="bg-sky-500/80 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm shadow-sm">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg leading-tight">{newsItem.title}</h1>
                     </div>
                </div>

                <div className="p-6 md:p-8">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-6 border-b border-slate-200 dark:border-white/10 pb-4">
                        <span className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(newsItem.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>

                    <div className="mb-8">
                        <ImageCarousel images={newsItem.gallery} title="Фоторепортаж" />
                    </div>

                    <div className="prose prose-slate dark:prose-invert prose-lg max-w-none mb-8">
                         <div dangerouslySetInnerHTML={{ __html: newsItem.content }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsDetailScreen;
