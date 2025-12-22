
import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import CollegeCard from './CollegeCard';
import SearchBar from './SearchBar';
import FilterPanel from './FilterPanel';
import EditDataModal, { EditField } from './EditDataModal';
import type { PlanItem, College, Specialty, Tag } from '../types';

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors group mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-semibold">На главный</span>
    </button>
);

interface CollegesScreenProps {
  onNavigate: (id: string) => void;
  onBack: () => void;
  plan: PlanItem[];
  onAddToPlan: (id: string, type: 'specialty' | 'college') => void;
  onRemoveFromPlan: (id: string) => void;
  isAdminMode?: boolean;
  recommendedTags?: { primary: string[], secondary: string[], primaryId?: string, secondaryId?: string };
  userScores?: Record<string, number>;
  tagMetadata?: Tag[];
}

const CollegesScreen: React.FC<CollegesScreenProps> = ({ 
    onNavigate, 
    onBack, 
    plan, 
    onAddToPlan, 
    onRemoveFromPlan, 
    isAdminMode, 
    recommendedTags,
    userScores,
    tagMetadata
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [colleges, setColleges] = useState<College[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [selectedCity, setSelectedCity] = useState('');
  const [userScore, setUserScore] = useState('');
  const [selectedForm, setSelectedForm] = useState('any');

  const fetchData = async () => {
      setLoading(true);
      const [colData, specData] = await Promise.all([
          api.getColleges(),
          api.getSpecialties()
      ]);
      setColleges(colData);
      setSpecialties(specData);
      setLoading(false);
  };

  useEffect(() => {
      fetchData();
  }, []);

  const handleCreate = async (newData: any) => {
        const payload = { ...newData, specialtyIds: newData.specialtyIds || [] };
        const res = await api.createCollege(payload);
        if (!res.success) alert('Ошибка при создании: ' + res.error);
        else { await fetchData(); setIsCreateModalOpen(false); }
  };

  const createFields: EditField[] = [
        { key: 'name', label: 'Название', type: 'text' },
        { key: 'fullName', label: 'Полное название', type: 'textarea' },
        { key: 'city', label: 'Город', type: 'text' },
        { key: 'address', label: 'Адрес', type: 'text' },
        { key: 'imageUrl', label: 'Главное фото', type: 'image' },
        { key: 'logoUrl', label: 'Логотип', type: 'image' },
        { key: 'gallery', label: 'Галерея фото', type: 'gallery' },
        { key: 'passingScore', label: 'Проходной балл', type: 'number' },
        { key: 'activityInfo', label: 'Краткое описание деятельности', type: 'textarea' },
        { key: 'specialtyIds', label: 'Специальности', type: 'multiselect', options: specialties.map(s => ({ value: s.id, label: s.title })) },
  ];

  const cities = useMemo(() => Array.from(new Set(colleges.map(c => c.city).filter(Boolean))).sort(), [colleges]);

  // ДИНАМИЧЕСКИЙ РАСЧЕТ ТЕГОВ ДЛЯ КОЛЛЕДЖА
  const getCollegeDynamicTags = (college: College) => {
      const collegeSpecs = specialties.filter(s => college.specialtyIds.includes(s.id));
      const allTags = new Set<string>();
      collegeSpecs.forEach(s => s.tags?.forEach(t => allTags.add(t.toLowerCase())));
      return Array.from(allTags);
  };

  const calculateCollegeMatch = (college: College) => {
      if (!userScores || Object.keys(userScores).length === 0) return 0;
      const collegeSpecialties = specialties.filter(s => college.specialtyIds.includes(s.id));
      let totalMatch = 0;
      let specsCount = 0;
      collegeSpecialties.forEach(spec => {
          if (spec.specs && spec.specs.length > 0) {
              specsCount++;
              let specMatch = 0;
              spec.specs.forEach(s => {
                  const userInterest = userScores[s.tagId] || 0;
                  if (userInterest > 0) {
                      const tagInfo = tagMetadata?.find(t => t.id === s.tagId);
                      const isDomain = tagInfo?.category === 'domain';
                      specMatch += (s.weight / 100) * userInterest * (isDomain ? 1.5 : 1.0);
                  }
              });
              totalMatch += specMatch;
          }
      });
      return specsCount > 0 ? (totalMatch / specsCount) + (specsCount * 0.5) : 0;
  };

  const filteredColleges = useMemo(() => {
    let items = colleges;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(c => {
          const nameMatch = c.name.toLowerCase().includes(q) || c.fullName?.toLowerCase().includes(q);
          if (nameMatch) return true;
          // Поиск по динамическим тегам специальностей
          const dynamicTags = getCollegeDynamicTags(c);
          return dynamicTags.some(t => t.includes(q));
      });
    }
    if (selectedCity) items = items.filter(c => c.city === selectedCity);
    if (userScore) {
        const score = parseFloat(userScore);
        if (!isNaN(score)) items = items.filter(c => c.passingScore <= score);
    }
    if (selectedForm !== 'any') items = items.filter(c => c.educationForms && c.educationForms.includes(selectedForm));
    if (userScores && Object.keys(userScores).length > 0) items = [...items].sort((a, b) => calculateCollegeMatch(b) - calculateCollegeMatch(a));
    return items;
  }, [searchQuery, colleges, specialties, selectedCity, userScore, selectedForm, userScores, tagMetadata]);

  const handleTogglePlan = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (plan.some(item => item.id === id)) onRemoveFromPlan(id);
      else onAddToPlan(id, 'college');
  };

  const handleResetFilters = () => { setSelectedCity(''); setUserScore(''); setSelectedForm('any'); setSearchQuery(''); };

  const getRecLevel = (college: College) => {
      const score = calculateCollegeMatch(college);
      if (score > 120) return 'gold';
      if (score > 60) return 'green';
      return null;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 relative">
        {isAdminMode && (
            <button onClick={() => setIsCreateModalOpen(true)} className="fixed bottom-24 right-4 z-50 bg-green-600 text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition-transform hover:scale-110 active:scale-95 border-2 border-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
        )}
        {isCreateModalOpen && <EditDataModal title="Добавить Колледж" initialData={{ passingScore: 3.5, city: 'Липецк', hasDormitory: false, isAccessible: false }} fields={createFields} onSave={handleCreate} onClose={() => setIsCreateModalOpen(false)} />}
      <BackButton onClick={onBack} />
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-purple-600">Где учиться?</h1>
        <p className="text-slate-400 text-lg font-bold">Колледжи и техникумы региона</p>
      </div>
      <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Название или направление (ИТ, Сварка...)" />
      <FilterPanel cities={cities} selectedCity={selectedCity} onCityChange={setSelectedCity} userScore={userScore} onUserScoreChange={setUserScore} selectedForm={selectedForm} onFormChange={setSelectedForm} onReset={handleResetFilters} />
      {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div></div>
      ) : filteredColleges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredColleges.map(college => (
            <CollegeCard key={college.id} college={college} onClick={() => onNavigate(college.id)} isInPlan={plan.some(item => item.id === college.id)} onTogglePlan={(e) => handleTogglePlan(e, college.id)} recommendationLevel={getRecLevel(college)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-6 bg-slate-800/50 rounded-3xl border border-white/10">
          <div className="text-6xl mb-4">🏛️</div>
          <h3 className="text-xl font-bold text-white mb-2">Ничего не найдено</h3>
          <p className="text-slate-400">Попробуйте изменить параметры фильтрации.</p>
          <button onClick={handleResetFilters} className="mt-4 text-sky-400 hover:underline">Сбросить фильтры</button>
        </div>
      )}
    </div>
  );
};

export default CollegesScreen;
