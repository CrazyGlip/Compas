
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Profession, College, Specialty } from '../types';
import EditDataModal, { EditField } from './EditDataModal';

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors group mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-semibold">Назад</span>
    </button>
);

const ProfessionCard: React.FC<{ 
    profession: Profession, 
    index: number, 
    isExpanded: boolean,
    onToggle: () => void,
    onNavigateToCollege: (id: string) => void,
    onNavigateToSpecialty: (id: string) => void,
    isAdminMode?: boolean,
    onEdit?: (e: React.MouseEvent) => void,
    colleges: College[],
    specialties: Specialty[]
}> = ({ profession, index, isExpanded, onToggle, onNavigateToCollege, onNavigateToSpecialty, isAdminMode, onEdit, colleges, specialties }) => {
    const salaryFormatter = new Intl.NumberFormat('ru-RU');

    const relatedColleges = (profession.collegeIds || [])
        .map(id => colleges.find(c => c.id === id))
        .filter((c): c is College => !!c);

    const relatedSpecialties = (profession.relatedSpecialtyIds || [])
        .map(id => specialties.find(s => s.id === id))
        .filter((s): s is Specialty => !!s);

    const trendIcon = profession.trend === 'hot' ? '🔥' : profession.trend === 'growing' ? '📈' : '🛡️';
    const trendText = profession.trend === 'hot' ? 'Высокий спрос' : profession.trend === 'growing' ? 'Растущий тренд' : 'Стабильность';
    
    const duration = relatedSpecialties.length > 0 ? relatedSpecialties[0].duration : '3 г. 10 мес.';

    return (
        <div 
            className={`bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden transition-all duration-500 ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/80 border-sky-500/30 shadow-2xl' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-sm'}`}
        >
            <div onClick={onToggle} className="p-5 cursor-pointer flex items-start gap-4 relative group">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                    <span className="font-black text-4xl text-transparent bg-clip-text bg-gradient-to-br from-sky-500 to-purple-600 dark:from-sky-400 dark:to-purple-500">
                        #{index + 1}
                    </span>
                </div>
                
                <div className="flex-grow min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{profession.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-slate-500 dark:text-slate-400 text-sm font-medium">
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-[10px] uppercase font-black">{profession.sphere}</span>
                        <span>{duration}</span>
                    </div>
                </div>

                {isAdminMode && onEdit && (
                    <button 
                        onClick={onEdit}
                        className="p-2 bg-indigo-100 hover:bg-indigo-500 text-indigo-500 hover:text-white rounded-full transition-colors mr-2 opacity-0 group-hover:opacity-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                )}

                <div className="flex-shrink-0 self-center transform transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {!isExpanded && relatedColleges.length > 0 && (
                <div className="px-5 pb-4 flex gap-2 overflow-hidden" onClick={onToggle}>
                    {relatedColleges.slice(0, 4).map(college => (
                        <img key={college.id} src={college.logoUrl} className="w-8 h-8 rounded-full object-contain bg-slate-100 dark:bg-slate-700 p-1 opacity-70" alt="" />
                    ))}
                    {relatedColleges.length > 4 && <span className="text-slate-500 text-xs self-center">+{relatedColleges.length - 4}</span>}
                </div>
            )}

            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-5 pb-6 pt-0 space-y-6 border-t border-slate-200 dark:border-white/5">
                    <div className="pt-4">
                        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-inner">
                            <div>
                                <span className="text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase block tracking-widest">Доход в месяц</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-black text-2xl">
                                    {salaryFormatter.format(profession.salaryFrom)} - {salaryFormatter.format(profession.salaryTo)} ₽
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/20 dark:bg-black/20 px-3 py-1 rounded-full">
                                <span className="text-xl">{trendIcon}</span>
                                <span className="font-bold text-slate-700 dark:text-white text-xs">{trendText}</span>
                            </div>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                            {profession.description || "Востребованная профессия с высокими перспективами роста в регионе."}
                        </p>

                        {/* НОВОЕ: БЛОК РАБОТОДАТЕЛЕЙ */}
                        {profession.employers && profession.employers.length > 0 && (
                            <div className="mb-6 bg-indigo-500/5 dark:bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20">
                                <h4 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                    Где работать в Липецке
                                </h4>
                                <div className="space-y-3">
                                    {profession.employers.map((emp, i) => (
                                        <div key={i} className="flex flex-col">
                                            <span className="font-bold text-slate-900 dark:text-white text-sm">{emp.name}</span>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{emp.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {relatedSpecialties.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Обучение в вузе/колледже</h4>
                                <div className="flex flex-wrap gap-2">
                                    {relatedSpecialties.map(spec => (
                                        <button
                                            key={spec.id}
                                            onClick={(e) => { e.stopPropagation(); onNavigateToSpecialty(spec.id); }}
                                            className="flex items-center gap-2 bg-sky-500/10 text-sky-600 dark:text-sky-300 px-3 py-2 rounded-xl text-xs font-bold hover:bg-sky-500/20 transition-colors border border-sky-500/20"
                                        >
                                            <span>{spec.title}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {relatedColleges.length > 0 && (
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Лучшие учебные заведения</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {relatedColleges.map(college => (
                                        <button
                                            key={college.id}
                                            onClick={(e) => { e.stopPropagation(); onNavigateToCollege(college.id); }}
                                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                                        >
                                            <img src={college.logoUrl} alt="" className="w-10 h-10 rounded-full object-contain bg-white dark:bg-slate-700 p-1 shadow-sm" />
                                            <span className="text-sm text-slate-700 dark:text-slate-200 font-bold group-hover:text-sky-500 transition-colors">{college.name}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300 ml-auto group-hover:text-sky-500 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Top50Screen: React.FC<{ 
    onBack: () => void; 
    onNavigateToCollege: (id: string) => void; 
    onNavigateToSpecialty: (id: string) => void;
    isAdminMode?: boolean;
}> = ({ onBack, onNavigateToCollege, onNavigateToSpecialty, isAdminMode }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [allColleges, setAllColleges] = useState<College[]>([]);
  const [allSpecialties, setAllSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProfession, setEditingProfession] = useState<Profession | null>(null);

  const fetchProfessions = async () => {
      setLoading(true);
      const [profData, colData, specData] = await Promise.all([
          api.getTopProfessions(),
          api.getColleges(),
          api.getSpecialties()
      ]);
      setProfessions(profData);
      setAllColleges(colData);
      setAllSpecialties(specData);
      setLoading(false);
  };

  useEffect(() => {
      fetchProfessions();
  }, []);

  const handleToggle = (id: number) => {
      setExpandedId(expandedId === id ? null : id);
  };

  const handleEdit = (e: React.MouseEvent, profession: Profession) => {
      e.stopPropagation();
      setEditingProfession(profession);
      setIsCreating(false);
      setIsEditModalOpen(true);
  };

  const handleCreateClick = () => {
      setEditingProfession({
          id: 0,
          name: '',
          sphere: '',
          salaryFrom: 30000,
          salaryTo: 60000,
          collegeIds: [],
          description: '',
          trend: 'stable',
          employers: []
      });
      setIsCreating(true);
      setIsEditModalOpen(true);
  };

  const handleSave = async (updatedData: any) => {
      let res;
      if (isCreating) res = await api.createProfession(updatedData);
      else if (editingProfession) res = await api.updateProfession(editingProfession.id, updatedData);

      if (res?.success) {
          await fetchProfessions();
          setIsEditModalOpen(false);
      } else {
          alert('Ошибка: ' + res?.error);
      }
  };

  const handleDelete = async () => {
      if (isCreating || !editingProfession) return;
      const res = await api.deleteProfession(editingProfession.id);
      if (res.success) {
          await fetchProfessions();
          setIsEditModalOpen(false);
      } else {
          alert('Ошибка удаления: ' + res.error);
      }
  };

  const editFields: EditField[] = [
      { key: 'name', label: 'Название профессии', type: 'text' },
      { key: 'sphere', label: 'Сфера деятельности', type: 'text' },
      { key: 'salaryFrom', label: 'Зарплата (от)', type: 'number' },
      { key: 'salaryTo', label: 'Зарплата (до)', type: 'number' },
      { key: 'trend', label: 'Тренд', type: 'select', options: [{ value: 'hot', label: '🔥 Высокий спрос' }, { value: 'growing', label: '📈 Растущий тренд' }, { value: 'stable', label: '🛡️ Стабильность' }] },
      { key: 'description', label: 'Почему в топе?', type: 'textarea' },
      { key: 'employers', label: 'Работодатели', type: 'array_list', itemSchema: [{ key: 'name', label: 'Название фирмы', type: 'text' }, { key: 'description', label: 'Описание / Вакансия', type: 'text' }] },
      { key: 'collegeIds', label: 'Где учиться (Колледжи)', type: 'multiselect', options: allColleges.map(c => ({ value: c.id, label: c.name })) },
      { key: 'relatedSpecialtyIds', label: 'Подходящие специальности', type: 'multiselect', options: allSpecialties.map(s => ({ value: s.id, label: s.title })) },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12 relative">
        {isAdminMode && (
            <button 
                onClick={handleCreateClick}
                className="fixed bottom-24 right-4 z-50 bg-green-600 text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition-transform hover:scale-110 active:scale-95 border-2 border-white/20"
                title="Добавить профессию в рейтинг"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>
        )}

        {isEditModalOpen && editingProfession && (
            <EditDataModal 
                title={isCreating ? "Добавить Профессию" : "Редактировать Профессию"}
                initialData={editingProfession}
                fields={editFields}
                onSave={handleSave}
                onClose={() => setIsEditModalOpen(false)}
                onDelete={!isCreating ? handleDelete : undefined}
            />
        )}

        <BackButton onClick={onBack} />
        <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 dark:from-teal-300 dark:via-emerald-300 dark:to-green-300 italic tracking-tighter">
                ТОП-30 ПРОФЕССИЙ 2025
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Рейтинг востребованности Липецкого региона</p>
        </div>
        
        {loading ? (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        ) : (
            <div className="space-y-4">
                {professions.map((profession, index) => (
                    <ProfessionCard 
                        key={profession.id} 
                        profession={profession} 
                        index={index} 
                        isExpanded={expandedId === profession.id}
                        onToggle={() => handleToggle(profession.id)}
                        onNavigateToCollege={onNavigateToCollege}
                        onNavigateToSpecialty={onNavigateToSpecialty}
                        isAdminMode={isAdminMode}
                        onEdit={(e) => handleEdit(e, profession)}
                        colleges={allColleges}
                        specialties={allSpecialties}
                    />
                ))}
            </div>
        )}
        
        <div className="text-center text-slate-500 text-[10px] pt-8 pb-4 uppercase font-black tracking-widest opacity-50">
            <p>Данные предоставлены на основе запросов НЛМК, ОЭЗ "Липецк" и Агропромышленного комплекса области.</p>
        </div>
    </div>
  );
};

export default Top50Screen;
