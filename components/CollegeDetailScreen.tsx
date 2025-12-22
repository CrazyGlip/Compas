
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { mockEvents } from '../data/mockData';
import type { Specialty, College } from '../types';
import ImageCarousel from './ImageCarousel';
import EditDataModal, { EditField } from './EditDataModal';

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors group mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-semibold">Назад</span>
    </button>
);

const ContactLink: React.FC<{ label: string; value?: string; href?: string; icon: React.ReactNode }> = ({ label, value, href, icon }) => (
    href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-white/5 shadow-sm">
            <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 rounded-full shadow-inner text-xl">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{value || 'Открыть'}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
    ) : null
);

interface CollegeDetailScreenProps {
    collegeId: string;
    onBack: () => void;
    onNavigateToSpecialty: (id: string) => void;
    isInPlan: boolean;
    onAddToPlan: (id: string, type: 'specialty' | 'college') => void;
    onRemoveFromPlan: (id: string) => void;
    onNavigateToCalendar: () => void;
    isAdminMode?: boolean;
}

const CollegeDetailScreen: React.FC<CollegeDetailScreenProps> = ({ collegeId, onBack, onNavigateToSpecialty, isInPlan, onAddToPlan, onRemoveFromPlan, onNavigateToCalendar, isAdminMode }) => {
    const [college, setCollege] = useState<College | null>(null);
    const [allSpecialties, setAllSpecialties] = useState<Specialty[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const loadCollege = async () => {
        setLoading(true);
        const [colleges, specialties] = await Promise.all([
            api.getColleges(),
            api.getSpecialties()
        ]);
        const found = colleges.find(c => c.id === collegeId);
        setCollege(found || null);
        setAllSpecialties(specialties);
        setLoading(false);
    };

    useEffect(() => {
        loadCollege();
    }, [collegeId]);

    const handleSave = async (updatedData: any) => {
        const res = await api.updateCollege(collegeId, updatedData);
        if (!res.success) throw new Error(res.error);
        await loadCollege(); 
        setIsEditModalOpen(false);
    };

    const handleDelete = async () => {
        const res = await api.deleteCollege(collegeId);
        if (!res.success) throw new Error(res.error);
        onBack();
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div></div>;
    if (!college) return <div><BackButton onClick={onBack} /><p>Колледж не найден</p></div>;

    const upcomingOpenDay = mockEvents
        .filter(event => event.collegeId === collegeId && event.type === 'openDay' && new Date(event.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    const editFields: EditField[] = [
        { key: 'name', label: 'Краткое название', type: 'text' },
        { key: 'fullName', label: 'Полное наименование', type: 'textarea' },
        { key: 'activityInfo', label: 'Описание деятельности (кратко)', type: 'textarea' },
        { key: 'address', label: 'Адрес', type: 'text' },
        { key: 'city', label: 'Город', type: 'text' },
        { key: 'phone', label: 'Телефон приемной комиссии', type: 'text' },
        { key: 'admissionLink', label: 'Ссылка на страницу абитуриента', type: 'text' },
        { key: 'epguLink', label: 'Ссылка на ЕПГУ', type: 'text' },
        { key: 'vkUrl', label: 'Ссылка на ВК', type: 'text' },
        { key: 'maxUrl', label: 'Ссылка на Макс', type: 'text' },
        { key: 'websiteUrl', label: 'Ссылка на сайт', type: 'text' },
        { key: 'geoTag', label: 'Геометка Яндекс Карт', type: 'text' },
        { key: 'hasDormitory', label: 'Наличие общежития', type: 'boolean' },
        { key: 'isAccessible', label: 'Доступность', type: 'boolean' },
        { key: 'imageUrl', label: 'Главное фото', type: 'image' },
        { key: 'logoUrl', label: 'Логотип', type: 'image' },
        { key: 'gallery', label: 'Галерея фото', type: 'gallery' },
        { key: 'specialtyIds', label: 'Специальности', type: 'multiselect', options: allSpecialties.map(s => ({ value: s.id, label: s.title })) },
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-10 relative">
            {isAdminMode && (
                <button onClick={() => setIsEditModalOpen(true)} className="fixed bottom-24 right-4 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition-transform hover:scale-110 active:scale-95 border-2 border-white/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
            )}

            {isEditModalOpen && <EditDataModal title="Редактировать Колледж" initialData={college} fields={editFields} onSave={handleSave} onClose={() => setIsEditModalOpen(false)} onDelete={handleDelete} />}

            <div className="relative">
                <button onClick={onBack} className="absolute top-4 left-4 z-10 p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <img src={college.imageUrl} alt={college.name} className="w-full h-48 object-cover rounded-3xl shadow-lg" />
                <div className="absolute -bottom-8 left-6 bg-white dark:bg-slate-800 p-2 rounded-full border-4 border-slate-100 dark:border-slate-900/50 shadow-xl">
                     <img src={college.logoUrl} alt="logo" className="w-20 h-20 rounded-full object-contain" />
                </div>
            </div>

            <div className="pt-12 px-2 flex justify-between items-start">
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{college.name}</h1>
                    <p className="text-slate-500 text-xs mt-1 font-bold">{college.fullName || college.name}</p>
                </div>
                <button onClick={() => isInPlan ? onRemoveFromPlan(college.id) : onAddToPlan(college.id, 'college')} className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl transition-all active:scale-90 border border-slate-100 dark:border-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 transition-all ${isInPlan ? 'text-amber-500 fill-current' : 'text-slate-300'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.13L5 18V4z" /></svg>
                </button>
            </div>

            {/* ГАЛЕРЕЯ */}
            <div className="px-2">
                <ImageCarousel images={college.gallery} title="Жизнь колледжа в кадрах" />
            </div>

            {/* БЛОК ПОСТУПЛЕНИЯ 2026 */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4 flex items-center gap-3">
                        Прием 2026
                    </h2>
                    <p className="text-blue-100 text-sm font-bold leading-relaxed mb-8">Подайте документы онлайн через портал Госуслуг (ЕПГУ).</p>
                    
                    <div className="space-y-3">
                        {college.epguLink && (
                            <a href={college.epguLink} target="_blank" rel="noreferrer" className="w-full py-4 bg-white text-blue-700 font-black uppercase text-center rounded-2xl shadow-xl block hover:bg-blue-50 transition-colors">
                                Подать через Госуслуги
                            </a>
                        )}
                        {upcomingOpenDay && (
                            <button onClick={onNavigateToCalendar} className="w-full py-4 bg-blue-500/20 border-2 border-white/20 text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                                📅 {new Date(upcomingOpenDay.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} — День открытых дверей
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* О КОЛЛЕДЖЕ */}
            <div className="bg-white dark:bg-slate-800/40 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-white/5 space-y-6">
                <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">О деятельности</h3>
                    <p className="text-slate-700 dark:text-slate-200 text-lg font-bold leading-tight italic">«{college.activityInfo || college.description}»</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Ср. балл (2025)</span>
                        <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{college.passingScore || '—'}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Общежитие</span>
                        <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{college.hasDormitory ? '🏠 Есть' : '❌ Нет'}</span>
                    </div>
                </div>
            </div>

            {/* ТАБЛИЦА СПЕЦИАЛЬНОСТЕЙ */}
            <div className="bg-white dark:bg-slate-800/40 rounded-[2.5rem] p-6 shadow-sm border border-slate-200 dark:border-white/5">
                <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white mb-2 tracking-tighter">Направления обучения</h2>
                <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest leading-tight">
                    Баллы указаны по результатам зачисления 2025 года. <br/> В 2026 году данные могут измениться.
                </p>
                
                <div className="space-y-3">
                    {college.specialtyIds.map(id => {
                        const spec = allSpecialties.find(s => s.id === id);
                        const specScore = college.specialtyScores?.find(s => s.specialtyId === id)?.score;
                        if (!spec) return null;

                        return (
                            <div 
                                key={id} 
                                onClick={() => onNavigateToSpecialty(id)}
                                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                            >
                                <div className="flex-1 min-w-0 pr-4">
                                    <p className="text-xs font-black text-slate-400 uppercase mb-1">{id}</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-sky-500 transition-colors">{spec.title}</p>
                                </div>
                                <div className="text-right">
                                    <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-white/10">
                                        <span className="text-lg font-black text-indigo-500">{specScore || '—'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* КОНТАКТЫ */}
            <div className="bg-white dark:bg-slate-800/40 rounded-[2.5rem] p-6 shadow-sm border border-slate-200 dark:border-white/5 space-y-4">
                 <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white mb-2 tracking-tighter">Контакты</h2>
                 
                 <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8"></div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Адрес</p>
                    <p className="text-lg font-bold leading-tight mb-4">{college.address || "Адрес не указан"}</p>
                    <p className="text-sm opacity-60 mb-6">{college.city}</p>
                    {college.geoTag && (
                        <a href={college.geoTag} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all">
                            🧭 Открыть карту
                        </a>
                    )}
                 </div>

                 <div className="grid grid-cols-1 gap-3">
                    <ContactLink label="Приемная комиссия" value={college.phone} href={college.phone ? `tel:${college.phone}` : undefined} icon="📞" />
                    <ContactLink label="Официальный сайт" value="Перейти на сайт" href={college.websiteUrl} icon="🌐" />
                    <ContactLink label="ВКонтакте" value="Наше сообщество" href={college.vkUrl} icon={<img src="https://vk.com/favicon.ico" className="w-5 h-5 rounded" />} />
                    <ContactLink label="Абитуриенту" value="Раздел поступающим" href={college.admissionLink} icon="🎓" />
                    <ContactLink label="МАКС" value="Канал в MAX" href={college.maxUrl} icon={<div className="font-black text-[10px] bg-sky-500 text-white px-1 rounded">MAX</div>} />
                 </div>
            </div>
        </div>
    );
};

export default CollegeDetailScreen;
