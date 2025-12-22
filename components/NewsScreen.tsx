
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { NewsItem } from '../types';
import EditDataModal, { EditField } from './EditDataModal';

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors group mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-semibold">На главный</span>
    </button>
);

interface NewsScreenProps {
    onBack: () => void;
    onNavigateToDetail: (id: string) => void;
    isAdminMode?: boolean;
}

const NewsScreen: React.FC<NewsScreenProps> = ({ onBack, onNavigateToDetail, isAdminMode }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchData = async () => {
      setLoading(true);
      const data = await api.getNews();
      setNews(data);
      setLoading(false);
  };

  useEffect(() => {
      fetchData();
  }, []);

  const handleCreate = async (newData: any) => {
      // 1. Client-side Validation
      if (!newData.title || newData.title.trim() === '') {
          alert('Пожалуйста, введите заголовок новости.');
          return;
      }
      
      // Check if image is selected (it must be a File object for new items)
      // Strict check: if no file is selected, newData.imageUrl might be undefined or empty string
      if (!newData.imageUrl || (typeof newData.imageUrl !== 'string' && !(newData.imageUrl instanceof File))) {
          alert('Ошибка: Обложка новости обязательна. Пожалуйста, загрузите изображение.');
          return;
      }

      const res = await api.createNews(newData);
      
      if (!res.success) {
          console.error("News creation error:", res.error);
          // Safe error message extraction for [object Object] cases
          let errorMsg = 'Неизвестная ошибка';
          try {
              if (typeof res.error === 'string') errorMsg = res.error;
              else if (typeof res.error === 'object') errorMsg = JSON.stringify(res.error, null, 2);
          } catch(e) {
              errorMsg = String(res.error);
          }
          
          alert('Не удалось создать новость. \n\nПричина: ' + errorMsg);
      } else {
          await fetchData();
          setIsCreateModalOpen(false);
      }
  };

  const createFields: EditField[] = [
      { key: 'title', label: 'Заголовок', type: 'text' },
      { key: 'date', label: 'Дата', type: 'date' },
      { key: 'imageUrl', label: 'Обложка (обязательно)', type: 'image' },
      { key: 'summary', label: 'Краткое описание', type: 'textarea' },
      { key: 'content', label: 'Полный текст (HTML)', type: 'textarea' },
      { key: 'gallery', label: 'Галерея', type: 'gallery' },
  ];

  return (
    <div className="space-y-6 animate-fade-in relative pb-16">
      {isAdminMode && (
          <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="fixed bottom-24 right-4 z-50 bg-green-600 text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition-transform hover:scale-110 active:scale-95 border-2 border-white/20"
              title="Добавить новость"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
          </button>
      )}

      {isCreateModalOpen && (
          <EditDataModal 
              title="Создать Новость"
              initialData={{ date: new Date().toISOString().split('T')[0] }}
              fields={createFields}
              onSave={handleCreate}
              onClose={() => setIsCreateModalOpen(false)}
          />
      )}

      <BackButton onClick={onBack} />
      <h1 className="text-3xl font-bold text-center mb-8 text-slate-900 dark:text-white">Новости и События</h1>
      
      {loading ? (
           <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
           </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {news.map((newsItem) => (
          <div key={newsItem.id} onClick={() => onNavigateToDetail(newsItem.id)} className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-lg hover:scale-[1.02] transition-transform duration-300 flex flex-col cursor-pointer group">
            <div className="h-48 overflow-hidden relative">
                <img src={newsItem.imageUrl} alt={newsItem.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-3 left-3 flex gap-2">
                    {newsItem.tags && newsItem.tags.map(tag => (
                        <span key={tag} className="bg-blue-600/90 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">{newsItem.date}</p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 leading-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{newsItem.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 flex-grow line-clamp-3">{newsItem.summary}</p>
                <button className="text-sky-600 dark:text-sky-400 font-semibold hover:text-sky-700 dark:hover:text-sky-300 text-left flex items-center gap-1 mt-auto">
                    Читать далее 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export default NewsScreen;
