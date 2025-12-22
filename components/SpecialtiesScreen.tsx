
import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import SpecialtyCard from './SpecialtyCard';
import SearchBar from './SearchBar';
import FilterPanel from './FilterPanel';
import EditDataModal, { EditField } from './EditDataModal';
import type { PlanItem, Specialty, College, Tag } from '../types';

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors group mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-semibold">На главный</span>
    </button>
);

interface SpecialtiesScreenProps {
  onNavigate: (id: string) => void;
  onBack: () => void;
  plan: PlanItem[];
  onAddToPlan: (id: string, type: 'specialty' | 'college') => void;
  onRemoveFromPlan: (id: string) => void;
  isAdminMode?: boolean;
  recommendedTags?: { primary: string[], secondary: string[], primaryId?: string, secondaryId?: string };
  // New Props for RecSys 4.0
  userScores?: Record<string, number>;
  tagMetadata?: Tag[];
}

const SpecialtiesScreen: React.FC<SpecialtiesScreenProps> = ({ 
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
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filter State
  const [selectedCity, setSelectedCity] = useState('');
  const [userScore, setUserScore] = useState('');
  const [selectedForm, setSelectedForm] = useState('any');

  const fetchData = async () => {
    try {
        setLoading(true);
        const [specsData, colData] = await Promise.all([
            api.getSpecialties(),
            api.getColleges()
        ]);
        setSpecialties(specsData);
        setColleges(colData);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (newData: any) => {
        const payload = {
            ...newData,
            specs: newData.specs || [], 
            details: {
                dayInLife: newData.fullDescription,
                pros: typeof newData.prosStr === 'string' ? newData.prosStr.split('\n').filter((s: string) => s.trim()) : [],
                cons: typeof newData.consStr === 'string' ? newData.consStr.split('\n').filter((s: string) => s.trim()) : [],
                salary: {
                    novice: { from: newData.salaryFrom || 20000, to: newData.salaryTo || 40000 },
                    experienced: { from: 40000, to: 80000 }
                },
                skills: typeof newData.skillsStr === 'string' ? newData.skillsStr.split('\n').filter((s: string) => s.trim()) : [],
                careerTrack: []
            }
        };

        const res = await api.createSpecialty(payload);
        if (!res.success) {
            alert('Ошибка при создании: ' + res.error);
        } else {
            await fetchData();
            setIsCreateModalOpen(false);
        }
  };

  const createFields: EditField[] = [
        { key: 'title', label: 'Название', type: 'text' },
        { 
            key: 'type', 
            label: 'Тип', 
            type: 'select', 
            options: [{ value: 'профессия', label: 'Профессия' }, { value: 'специальность', label: 'Специальность' }] 
        },
        { key: 'imageUrl', label: 'Изображение', type: 'image' },
        { key: 'duration', label: 'Срок обучения', type: 'text' },
        { key: 'passingScore', label: 'Проходной балл', type: 'number' },
        { key: 'salaryFrom', label: 'Зарплата (мин)', type: 'number' },
        { key: 'salaryTo', label: 'Зарплата (макс)', type: 'number' },
        { key: 'fullDescription', label: 'Описание', type: 'textarea' },
        { key: 'specs', label: 'Характеристики (ДНК)', type: 'weighted_tags' },
  ];

  const cities = useMemo(() => {
      const unique = new Set(colleges.map(c => c.city).filter(Boolean));
      return Array.from(unique).sort();
  }, [colleges]);

  // --- RECSYS 4.0: WEIGHTED FORMULA ---
  // Formula: Score = (Domain Match * 1.5) + (Attribute Match * 1.0)
  const calculateMatch = (spec: Specialty): { score: number, reason?: string } => {
      // Return 0 if no user data
      if (!userScores || Object.keys(userScores).length === 0) return { score: 0 };
      
      let totalScore = 0;
      let topTagReason = '';
      let topTagContribution = 0;
      
      // If specialty has no DNA, use fallback (very low score)
      if (!spec.specs || spec.specs.length === 0) return { score: 0 };

      spec.specs.forEach(s => {
          // Get user's interest in this tag (from App.tsx aggregation)
          const userInterest = userScores[s.tagId] || 0;
          
          if (userInterest > 0) {
              // Find tag metadata to check category
              const tagInfo = tagMetadata?.find(t => t.id === s.tagId);
              const isDomain = tagInfo?.category === 'domain';
              
              const multiplier = isDomain ? 1.5 : 1.0;
              const contribution = (s.weight / 100) * userInterest * multiplier;
              
              totalScore += contribution;

              // Identify the main reason for recommendation (prioritize Domains)
              if (isDomain && contribution > topTagContribution) {
                  topTagContribution = contribution;
                  topTagReason = tagInfo?.name || '';
              }
          }
      });

      return { score: totalScore, reason: topTagReason };
  };

  const filteredSpecialties = useMemo(() => {
    let items = specialties.map(s => {
        const { score, reason } = calculateMatch(s);
        return { ...s, _score: score, _reason: reason };
    });

    // 1. Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(spec =>
        spec.title.toLowerCase().includes(query) || 
        spec.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 2. Filter by Colleges (City, Score)
    if (selectedCity || userScore || selectedForm !== 'any') {
        const matchingColleges = colleges.filter(c => {
            if (selectedCity && c.city !== selectedCity) return false;
            if (userScore) {
                const score = parseFloat(userScore);
                if (!isNaN(score) && c.passingScore > score) return false;
            }
            if (selectedForm !== 'any' && (!c.educationForms || !c.educationForms.includes(selectedForm))) return false;
            return true;
        });

        const matchingCollegeIds = new Set(matchingColleges.map(c => c.id));
        items = items.filter(spec => {
            const isAvailable = colleges.some(c => 
                matchingCollegeIds.has(c.id) && c.specialtyIds.includes(spec.id)
            );
            return isAvailable;
        });
    }

    // 3. REC SYS SORT (4.0)
    // Only sort if we have user scores to compare against
    if (userScores && Object.keys(userScores).length > 0) {
        items = items.sort((a, b) => b._score - a._score);
    }

    return items;
  }, [searchQuery, specialties, colleges, selectedCity, userScore, selectedForm, userScores, tagMetadata]);
  
  const handleTogglePlan = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (plan.some(item => item.id === id)) {
        onRemoveFromPlan(id);
      } else {
        onAddToPlan(id, 'specialty');
      }
  };

  const handleResetFilters = () => {
      setSelectedCity('');
      setUserScore('');
      setSelectedForm('any');
      setSearchQuery('');
  };

  const getRecLevel = (score: number) => {
      // Adjusted thresholds for RecSys 4.0 math
      if (score > 150) return 'gold';
      if (score > 80) return 'green';
      return null;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 relative">
      {isAdminMode && (
            <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="fixed bottom-24 right-4 z-50 bg-green-600 text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition-transform hover:scale-110 active:scale-95 border-2 border-white/20"
                title="Добавить специальность"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>
        )}

        {isCreateModalOpen && (
            <EditDataModal 
                title="Добавить Специальность"
                initialData={{ type: 'профессия', duration: '3 г. 10 мес.', specs: [] }}
                fields={createFields}
                onSave={handleCreate}
                onClose={() => setIsCreateModalOpen(false)}
            />
        )}

      <BackButton onClick={onBack} />
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-purple-300 to-pink-300">
            На кого учиться?
        </h1>
        <p className="text-slate-400 text-lg">Выбери своё будущее призвание</p>
      </div>
      
      <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Найти профессию мечты..." />
      
      <FilterPanel 
        cities={cities}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        userScore={userScore}
        onUserScoreChange={setUserScore}
        selectedForm={selectedForm}
        onFormChange={setSelectedForm}
        onReset={handleResetFilters}
      />

      {loading ? (
          <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
          </div>
      ) : filteredSpecialties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSpecialties.map((spec: any) => (
                <SpecialtyCard 
                  key={spec.id} 
                  specialty={spec} 
                  onClick={() => onNavigate(spec.id)}
                  isInPlan={plan.some(item => item.id === spec.id)}
                  onTogglePlan={(e) => handleTogglePlan(e, spec.id)}
                  recommendationLevel={getRecLevel(spec._score)}
                  matchReason={spec._reason}
                />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-6 bg-slate-800/50 rounded-3xl border border-white/10">
            <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white mb-2">Ничего не найдено</h3>
          <p className="text-slate-400">Попробуйте изменить параметры фильтрации.</p>
          <button onClick={handleResetFilters} className="mt-4 text-sky-400 hover:underline">Сбросить фильтры</button>
        </div>
      )}
    </div>
  );
};

export default SpecialtiesScreen;
