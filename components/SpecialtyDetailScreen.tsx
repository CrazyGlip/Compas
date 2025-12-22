
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { College, Specialty, Tag } from '../types';
import ImageCarousel from './ImageCarousel';
import EditDataModal, { EditField } from './EditDataModal';

const CollegeLinkCard: React.FC<{ college: College, onClick: () => void }> = ({ college, onClick }) => (
    <div onClick={onClick} className="flex items-center space-x-4 bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:border-sky-500/50 transition-all cursor-pointer shadow-sm">
        <img src={college.logoUrl} alt={`${college.name} logo`} className="w-12 h-12 rounded-full object-contain flex-shrink-0 bg-slate-100 dark:bg-slate-700 p-1" />
        <div>
            <h4 className="font-bold text-slate-900 dark:text-white">{college.name}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-300">Проходной балл: {college.passingScore}</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 dark:text-slate-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    </div>
);

// New Component: DNA Bar
const DnaBar: React.FC<{ name: string, weight: number, color: string }> = ({ name, weight, color }) => (
    <div className="mb-3 last:mb-0">
        <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-slate-700 dark:text-slate-300">{name}</span>
            <span className="text-slate-900 dark:text-white">{weight}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div 
                className={`h-full rounded-full ${color}`} 
                style={{ width: `${weight}%` }}
            />
        </div>
    </div>
);

interface ProfessionDetailScreenProps {
    specialtyId: string;
    onBack: () => void;
    onNavigateToCollege: (id: string) => void;
    isInPlan: boolean;
    onAddToPlan: (id: string, type: 'specialty' | 'college') => void;
    onRemoveFromPlan: (id: string) => void;
    isAdminMode?: boolean;
}

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
            isActive ? 'bg-sky-500 text-white' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
    >
        {children}
    </button>
);

const InfoLine: React.FC<{ label: string; value: string | number; icon?: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 py-3">
        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">{icon} {label}</span>
        <span className="font-bold text-slate-900 dark:text-white text-right">{value}</span>
    </div>
);

const ProfessionDetailScreen: React.FC<ProfessionDetailScreenProps> = ({ specialtyId, onBack, onNavigateToCollege, isInPlan, onAddToPlan, onRemoveFromPlan, isAdminMode }) => {
    const [specialty, setSpecialty] = useState<Specialty | null>(null);
    const [relatedColleges, setRelatedColleges] = useState<College[]>([]);
    const [tagsMap, setTagsMap] = useState<Record<string, Tag>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('about');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const [specialties, colleges, tags] = await Promise.all([
                api.getSpecialties(),
                api.getColleges(),
                api.getGlobalTags()
            ]);
            
            const foundSpecialty = specialties.find(s => s.id === specialtyId);
            setSpecialty(foundSpecialty || null);

            const related = colleges.filter(c => c.specialtyIds.includes(specialtyId));
            setRelatedColleges(related);

            const tMap: Record<string, Tag> = {};
            tags.forEach(t => tMap[t.id] = t);
            setTagsMap(tMap);

        } catch (e) {
            console.error("Error loading profession details:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [specialtyId]);

    const handleSave = async (updatedData: any) => {
        if (!specialty) return;

        // Convert newline-separated strings back to arrays
        const payload = {
            ...updatedData,
            skills: typeof updatedData.skillsStr === 'string' ? updatedData.skillsStr.split('\n').filter((s: string) => s.trim()) : specialty.details.skills,
            pros: typeof updatedData.prosStr === 'string' ? updatedData.prosStr.split('\n').filter((s: string) => s.trim()) : specialty.details.pros,
            cons: typeof updatedData.consStr === 'string' ? updatedData.consStr.split('\n').filter((s: string) => s.trim()) : specialty.details.cons,
        };

        const res = await api.updateSpecialty(specialty.id, payload);
        if (!res.success) {
            throw new Error(res.error);
        }
        await loadData();
    };

    const handleDelete = async () => {
        if (!specialty) return;
        const res = await api.deleteSpecialty(specialty.id);
        if (!res.success) {
            throw new Error(res.error);
        }
        onBack();
    };

    const salaryFormatter = new Intl.NumberFormat('ru-RU');
    
    if (loading) {
        return (
             <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
            </div>
        );
    }

    if (!specialty) {
        return (
            <div className="text-center py-10">
                <p className="text-slate-400">Специальность не найдена</p>
                <button onClick={onBack} className="mt-4 text-sky-400 hover:underline">Вернуться назад</button>
            </div>
        );
    }

    const typeColor = specialty.type === 'профессия' 
        ? 'bg-sky-500/20 text-sky-600 dark:text-sky-300' 
        : 'bg-amber-500/20 text-amber-600 dark:text-amber-300';

    // Sort tags by weight descending
    const weightedSpecs = (specialty.specs || [])
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5); // Take top 5

    const renderTabContent = () => {
        switch (activeTab) {
            case 'about':
                return (
                    <div className="space-y-6 animate-fade-in">
                        {/* DNA Block (New Feature) */}
                        {weightedSpecs.length > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                                    Характеристики (ДНК)
                                </h4>
                                {weightedSpecs.map(spec => {
                                    const tag = tagsMap[spec.tagId];
                                    if (!tag) return null;
                                    // Dynamic color based on category
                                    const color = tag.category === 'skill' ? 'bg-indigo-500' :
                                                  tag.category === 'interest' ? 'bg-pink-500' : 'bg-emerald-500';
                                    return <DnaBar key={spec.tagId} name={tag.name} weight={spec.weight} color={color} />;
                                })}
                            </div>
                        )}

                        <div className="bg-slate-100 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                            <InfoLine 
                                label="Срок обучения" 
                                value={specialty.duration || 'Не указано'} 
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-500 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            />
                             <InfoLine 
                                label="Средний балл" 
                                value={specialty.passingScore || '—'} 
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-500 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                            />
                        </div>
                        
                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{specialty.details?.dayInLife || specialty.fullDescription || specialty.description}</p>

                        {specialty.details?.pros && (
                            <div>
                                <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-white">Плюсы</h3>
                                <ul className="list-disc list-inside space-y-1 text-green-500 dark:text-green-300">
                                    {specialty.details.pros.map((pro, i) => <li key={i}><span className="text-slate-700 dark:text-slate-300">{pro}</span></li>)}
                                </ul>
                            </div>
                        )}
                        
                        {specialty.details?.cons && (
                            <div>
                                <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-white">Минусы</h3>
                                <ul className="list-disc list-inside space-y-1 text-red-500 dark:text-red-300">
                                    {specialty.details.cons.map((con, i) => <li key={i}><span className="text-slate-700 dark:text-slate-300">{con}</span></li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                );
            case 'skills':
                 return (
                    <div className="animate-fade-in">
                        <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">Ключевые навыки</h3>
                        <div className="flex flex-wrap gap-2">
                           {specialty.details?.skills?.map((skill, i) => (
                                <span key={i} className="bg-slate-100 dark:bg-slate-700/50 text-sky-600 dark:text-sky-300 font-semibold py-1 px-3 rounded-full text-sm border border-slate-200 dark:border-slate-600">{skill}</span>
                           )) || <p className="text-slate-400">Информация о навыках уточняется</p>}
                        </div>
                    </div>
                );
            case 'career':
                 return (
                    <div className="animate-fade-in">
                        <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">Карьерный трек</h3>
                         <div className="relative pl-4 border-l-2 border-slate-300 dark:border-slate-600 space-y-6">
                           {specialty.details?.careerTrack?.map((track, i) => (
                                <div key={i} className="relative">
                                    <div className="absolute -left-6 top-1.5 w-3 h-3 bg-sky-500 dark:bg-sky-400 rounded-full border-2 border-white dark:border-slate-900"></div>
                                    <p className="font-bold text-slate-800 dark:text-white">{track.title}</p>
                                </div>
                           )) || <p className="text-slate-400">Информация о карьере уточняется</p>}
                        </div>
                    </div>
                );
            case 'colleges':
                return (
                    <div className="space-y-3 animate-fade-in">
                         {relatedColleges.length > 0 ? (
                            relatedColleges.map(college => (
                                <CollegeLinkCard key={college.id} college={college} onClick={() => onNavigateToCollege(college.id)} />
                            ))
                         ) : (
                            <p className="text-slate-400 text-center py-4">Нет данных об учебных заведениях по этой специальности.</p>
                         )}
                    </div>
                );
            default: return null;
        }
    }

    const editFields: EditField[] = [
        { key: 'title', label: 'Название', type: 'text' },
        { key: 'imageUrl', label: 'Изображение', type: 'image' },
        { key: 'gallery', label: 'Галерея (Дополнительные фото)', type: 'gallery' },
        { key: 'duration', label: 'Срок обучения', type: 'text' },
        { key: 'passingScore', label: 'Проходной балл', type: 'number' },
        { key: 'salaryFrom', label: 'Зарплата (мин)', type: 'number' },
        { key: 'salaryTo', label: 'Зарплата (макс)', type: 'number' },
        { key: 'fullDescription', label: 'Описание', type: 'textarea' },
        // New: DB Weighted Tags
        { key: 'specs', label: 'Характеристики (Рекомендации 2.0)', type: 'weighted_tags' },
        
        { key: 'skillsStr', label: 'Навыки (каждый с новой строки)', type: 'textarea' },
        { key: 'prosStr', label: 'Плюсы (каждый с новой строки)', type: 'textarea' },
        { key: 'consStr', label: 'Минусы (каждый с новой строки)', type: 'textarea' },
    ];

    // Flatten data for the modal
    const flatData = {
        ...specialty,
        salaryFrom: specialty.details?.salary?.novice?.from,
        salaryTo: specialty.details?.salary?.experienced?.to,
        skillsStr: specialty.details?.skills?.join('\n'),
        prosStr: specialty.details?.pros?.join('\n'),
        consStr: specialty.details?.cons?.join('\n'),
        // Filter out main image from gallery
        gallery: specialty.gallery?.filter(img => img !== specialty.imageUrl) || []
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10 relative">
            {isAdminMode && (
                <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="fixed bottom-24 right-4 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition-transform hover:scale-110 active:scale-95 border-2 border-white/20"
                    title="Редактировать специальность"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>
            )}

            {isEditModalOpen && (
                <EditDataModal 
                    title="Редактировать Специальность"
                    initialData={flatData}
                    fields={editFields}
                    onSave={handleSave}
                    onClose={() => setIsEditModalOpen(false)}
                    onDelete={handleDelete}
                />
            )}

            <div className="relative">
                 <button onClick={onBack} className="absolute top-4 left-4 z-10 p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="relative w-full h-48 md:h-64 rounded-2xl mb-4 overflow-hidden shadow-lg group">
                     <img src={specialty.imageUrl} alt={specialty.title} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                </div>
                
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <h1 className="text-3xl md:text-4xl font-bold leading-tight text-slate-900 dark:text-white">{specialty.title}</h1>
                        <span className={`mt-3 inline-block text-base font-semibold px-3 py-1 rounded-full ${typeColor}`}>{specialty.type}</span>
                    </div>
                    <button
                        onClick={() => isInPlan ? onRemoveFromPlan(specialty.id) : onAddToPlan(specialty.id, 'specialty')}
                        className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-full transition-colors hover:bg-slate-200 dark:hover:bg-slate-700/80"
                        aria-label={isInPlan ? 'Удалить из плана' : 'Добавить в план'}
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 transition-all ${isInPlan ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400'}`} viewBox="0 0 20 20" fill="currentColor">
                         <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.13L5 18V4z" />
                       </svg>
                    </button>
                </div>
            </div>

            {/* Photo Block (Moved above buttons) */}
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-white/10">
                 <ImageCarousel images={specialty.gallery} title="Фото" />
            </div>
            
            {/* Tabs Block */}
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-white/10">
                <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 dark:border-white/10 pb-4">
                    <TabButton isActive={activeTab === 'about'} onClick={() => setActiveTab('about')}>О профессии</TabButton>
                    <TabButton isActive={activeTab === 'skills'} onClick={() => setActiveTab('skills')}>Навыки</TabButton>
                    <TabButton isActive={activeTab === 'career'} onClick={() => setActiveTab('career')}>Карьера</TabButton>
                    <TabButton isActive={activeTab === 'colleges'} onClick={() => setActiveTab('colleges')}>Где учиться</TabButton>
                </div>
                <div className="min-h-[200px]">{renderTabContent()}</div>
            </div>

            {/* Salary Block (Moved to bottom) */}
            {specialty.details?.salary && (
                <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-white/10">
                    <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Диапазон заработной платы в регионе</h3>
                    <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                        <span className="font-bold text-xl">
                            {salaryFormatter.format(specialty.details.salary.novice.from)} - {salaryFormatter.format(specialty.details.salary.experienced.to)} ₽
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfessionDetailScreen;
