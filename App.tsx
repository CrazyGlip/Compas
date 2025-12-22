
import React, { useState, useEffect, useMemo } from 'react';
import type { View, PlanItem, AchievementState, RecommendationWeights, ThemeMode, Subject, SubjectRelation, Tag, UserQuizResult, Specialty } from './types';
import { api } from './services/api';
import { generateChecklist } from './data/checklistTemplates';

// Screens
import DashboardScreen from './components/DashboardScreen';
import MyPlanScreen from './components/MyPlanScreen';
import SpecialtiesScreen from './components/SpecialtiesScreen';
import SpecialtyDetailScreen from './components/SpecialtyDetailScreen';
import CollegesScreen from './components/CollegesScreen';
import CollegeDetailScreen from './components/CollegeDetailScreen';
import EducationTypeSelectionScreen from './components/EducationTypeSelectionScreen';
import QuizScreen from './components/QuizScreen';
import QuizResultView from './components/QuizResultView';
import ProfileScreen from './components/ProfileScreen';
import Top50Screen from './components/Top50Screen';
import CalendarScreen from './components/CalendarScreen';
import ShortsScreen from './components/ShortsScreen';
import NewsScreen from './components/NewsScreen';
import NewsDetailScreen from './components/NewsDetailScreen';
import AuthScreen from './components/AuthScreen';
import SettingsScreen from './components/SettingsScreen';
import QuizEditorScreen from './components/QuizEditorScreen';
import SubjectEditorScreen from './components/SubjectEditorScreen';
import TagEditorScreen from './components/TagEditorScreen';
import GameCenterScreen from './components/GameCenterScreen';

// Games
import EnergyGame from './components/games/EnergyGame';
import BugHunterGame from './components/games/BugHunterGame';
import ChefGame from './components/games/ChefGame';
import TriageGame from './components/games/TriageGame';
import LogisticsGame from './components/games/LogisticsGame';
import SecurityGame from './components/games/SecurityGame';
import ArchitectGame from './components/games/ArchitectGame';
import AgroDroneGame from './components/games/AgroDroneGame';

import AppBar from './components/AppBar';
import BottomNav from './components/BottomNav';
import AchievementNotification from './components/AchievementNotification';
import { achievements } from './data/achievements';
import { supabase } from './lib/supabaseClient';

const App: React.FC = () => {
  const [view, setView] = useState<View>({ name: 'dashboard' });
  const [history, setHistory] = useState<View[]>([]);
  const [plan, setPlan] = useState<PlanItem[]>(() => {
    const saved = localStorage.getItem('career_plan');
    return saved ? JSON.parse(saved) : [];
  });
  const [user, setUser] = useState<any>(null);
  const [isAdminMode, setIsAdminMode] = useState(() => localStorage.getItem('admin_mode') === 'true');
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('theme') as ThemeMode) || 'system');
  
  // Data for Recommendations
  const [userQuizResults, setUserQuizResults] = useState<UserQuizResult[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectRelations, setSubjectRelations] = useState<SubjectRelation[]>([]);
  const [globalTags, setGlobalTags] = useState<Tag[]>([]);
  const [allSpecialties, setAllSpecialties] = useState<Specialty[]>([]);
  const [totalQuizzesInDB, setTotalQuizzesInDB] = useState(4);

  const [achievementState, setAchievementState] = useState<AchievementState>(() => {
    const saved = localStorage.getItem('achievement_state');
    return saved ? JSON.parse(saved) : {
      hasCalculatedScore: false,
      planCount: 0,
      quizzesPassed: 0,
      specialtiesInPlan: 0,
      collegesInPlan: 0,
      videosWatched: 0,
      hasUsedComparison: false,
      videosLiked: 0
    };
  });
  
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() => {
    const saved = localStorage.getItem('unlockedAchievements');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeNotification, setActiveNotification] = useState<any>(null);

  const [recWeights, setRecWeights] = useState<RecommendationWeights>(() => {
    const saved = localStorage.getItem('rec_weights');
    return saved ? JSON.parse(saved) : {
      quizWeight: 40,
      gradeWeight: 30,
      subjectLikeWeight: 20,
      planLikeWeight: 10,
      baseQuizScore: 15,
      baseGradeScore: 40,
      baseLikeScore: 30,
      basePlanScore: 20
    };
  });

  const loadRecData = async () => {
      const [qRes, sRels, gTags, specs, quizzes] = await Promise.all([
          api.getUserQuizResults(user?.id),
          api.getSubjectRelations(),
          api.getGlobalTags(),
          api.getSpecialties(),
          api.getQuizzes()
      ]);
      setUserQuizResults(qRes);
      setSubjectRelations(sRels);
      setGlobalTags(gTags);
      setAllSpecialties(specs);
      setTotalQuizzesInDB(quizzes.length || 4);

      const savedSubjects = localStorage.getItem('calculatorSubjects');
      if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
  };

  useEffect(() => {
    loadRecData();
  }, [user, view.name]);

  // --- RECSYS 4.0 ENGINE ---
  const { aggregatedScores, analysisCompleteness } = useMemo(() => {
    const scores: Record<string, number> = {};
    
    const quizF = recWeights.quizWeight / 100;
    const gradeF = recWeights.gradeWeight / 100;
    const subjLikeF = recWeights.subjectLikeWeight / 100;
    const planF = recWeights.planLikeWeight / 100;

    const applyScore = (tagId: string, amount: number, factor: number) => {
        if (!tagId) return;
        scores[tagId] = (scores[tagId] || 0) + (amount * factor);
    };

    userQuizResults.forEach(result => {
        Object.entries(result.scores).forEach(([tagId, val]) => {
            applyScore(tagId, (val as number) * recWeights.baseQuizScore, quizF);
        });
    });

    subjects.filter(s => s.grade >= 4).forEach(subj => {
        const rel = subjectRelations.find(r => r.subjectId === subj.id);
        if (rel) {
            const gradeBoost = subj.grade === 5 ? recWeights.baseGradeScore : recWeights.baseGradeScore / 2;
            rel.tags.forEach(t => {
                applyScore(t.tagId, gradeBoost * (t.weight / 100), gradeF);
            });
        }
    });

    subjects.filter(s => s.isFavorite).forEach(subj => {
        const rel = subjectRelations.find(r => r.subjectId === subj.id);
        if (rel) {
            rel.tags.forEach(t => {
                applyScore(t.tagId, recWeights.baseLikeScore * (t.weight / 100), subjLikeF);
            });
        }
    });

    plan.forEach(item => {
        const data = allSpecialties.find(s => s.id === item.id);
        if (data && data.specs) {
            data.specs.forEach(t => {
                applyScore(t.tagId, recWeights.basePlanScore * (t.weight / 100), planF);
            });
        }
    });

    // --- NEW MATHEMATICS FOR ACCURACY (RECSYS 4.0) ---
    const hasFavs = subjects.some(s => s.isFavorite);
    const uniquePassedCount = new Set(userQuizResults.map(r => r.quiz_id)).size;
    const hasSpecInPlan = plan.some(p => p.type === 'specialty');
    const hasColInPlan = plan.some(p => p.type === 'college');
    
    let completeness = 0;
    if (hasFavs) completeness += 10; // Любимые предметы: 10%
    
    // Тесты: 40% от общего кол-ва тестов в системе
    if (totalQuizzesInDB > 0) {
        completeness += (uniquePassedCount / totalQuizzesInDB) * 40;
    }
    
    if (hasSpecInPlan) completeness += 25; // Профессии: 25%
    if (hasColInPlan) completeness += 25;  // Колледжи: 25%

    return { aggregatedScores: scores, analysisCompleteness: Math.min(100, Math.round(completeness)) };
  }, [userQuizResults, subjects, subjectRelations, plan, allSpecialties, recWeights, totalQuizzesInDB]);

  // Auth Effect
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user || null);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync Plan to LS
  useEffect(() => {
    localStorage.setItem('career_plan', JSON.stringify(plan));
    setAchievementState(prev => ({
      ...prev,
      planCount: plan.length,
      specialtiesInPlan: plan.filter(p => p.type === 'specialty').length,
      collegesInPlan: plan.filter(p => p.type === 'college').length
    }));
  }, [plan]);

  // Sync Achievement State to LS
  useEffect(() => {
    localStorage.setItem('achievement_state', JSON.stringify(achievementState));
    
    achievements.forEach(ach => {
      if (!unlockedAchievements.includes(ach.id) && ach.condition(achievementState)) {
        setUnlockedAchievements(prev => {
          const next = [...prev, ach.id];
          localStorage.setItem('unlockedAchievements', JSON.stringify(next));
          return next;
        });
        setActiveNotification(ach);
        window.dispatchEvent(new CustomEvent('achievements_updated'));
      }
    });
  }, [achievementState, unlockedAchievements]);

  const navigateTo = (newView: View) => {
    setHistory(prev => [...prev, view]);
    setView(newView);
    window.scrollTo(0, 0);
  };

  const navigateBack = () => {
    if (history.length > 0) {
      const newHistory = [...history];
      const lastView = newHistory.pop()!;
      setHistory(newHistory);
      setView(lastView);
    } else {
      setView({ name: 'dashboard' });
    }
  };

  const addToPlan = (id: string, type: 'specialty' | 'college') => {
    if (plan.some(p => p.id === id)) return;
    const newItem: PlanItem = {
      id,
      type,
      checklist: generateChecklist(type, id)
    };
    setPlan(prev => [...prev, newItem]);
  };

  const removeFromPlan = (id: string) => {
    setPlan(prev => prev.filter(p => p.id !== id));
  };

  const updateChecklistItem = (planItemId: string, checklistItemId: string, isCompleted: boolean) => {
    setPlan(prev => prev.map(p => {
      if (p.id === planItemId) {
        return {
          ...p,
          checklist: p.checklist.map(c => c.id === checklistItemId ? { ...c, isCompleted } : c)
        };
      }
      return p;
    }));
  };

  const handleGameWin = (gameScore: number) => {
    api.addCoins(Math.floor(gameScore / 10));
    navigateBack();
  };

  const toggleAdminMode = () => {
    const next = !isAdminMode;
    setIsAdminMode(next);
    localStorage.setItem('admin_mode', String(next));
  };

  const renderContent = () => {
    switch (view.name) {
      case 'dashboard': return <DashboardScreen setView={navigateTo} />;
      case 'myPlan': return (
        <MyPlanScreen 
          plan={plan} 
          onRemoveFromPlan={removeFromPlan} 
          onUpdateChecklistItem={updateChecklistItem}
          onNavigateToSpecialty={(id) => navigateTo({ name: 'specialtyDetail', specialtyId: id })}
          onNavigateToCollege={(id) => navigateTo({ name: 'collegeDetail', collegeId: id })}
          onNavigateToCalculator={() => navigateTo({ name: 'profile' })}
          onNavigateToCalendar={() => navigateTo({ name: 'calendar' })}
          onNavigateToSpecialtiesList={() => navigateTo({ name: 'specialties' })}
          onNavigateToCollegesList={() => navigateTo({ name: 'colleges' })}
          onBack={navigateBack}
          onCompare={() => setAchievementState(prev => ({ ...prev, hasUsedComparison: true }))}
          onNavigate={navigateTo}
          user={user}
          onNavigateToAuth={() => navigateTo({ name: 'auth' })}
          aggregatedScores={aggregatedScores}
          analysisCompleteness={analysisCompleteness}
          userQuizResults={userQuizResults}
        />
      );
      case 'specialties': return <SpecialtiesScreen onNavigate={(id) => navigateTo({ name: 'specialtyDetail', specialtyId: id })} onBack={navigateBack} plan={plan} onAddToPlan={addToPlan} onRemoveFromPlan={removeFromPlan} isAdminMode={isAdminMode} userScores={aggregatedScores} tagMetadata={globalTags} />;
      case 'specialtyDetail': return <SpecialtyDetailScreen specialtyId={view.specialtyId} onBack={navigateBack} onNavigateToCollege={(id) => navigateTo({ name: 'collegeDetail', collegeId: id })} isInPlan={plan.some(p => p.id === view.specialtyId)} onAddToPlan={addToPlan} onRemoveFromPlan={removeFromPlan} isAdminMode={isAdminMode} />;
      case 'colleges': return <CollegesScreen onNavigate={(id) => navigateTo({ name: 'collegeDetail', collegeId: id })} onBack={navigateBack} plan={plan} onAddToPlan={addToPlan} onRemoveFromPlan={removeFromPlan} isAdminMode={isAdminMode} userScores={aggregatedScores} tagMetadata={globalTags} />;
      case 'collegeDetail': return <CollegeDetailScreen collegeId={view.collegeId} onBack={navigateBack} onNavigateToSpecialty={(id) => navigateTo({ name: 'specialtyDetail', specialtyId: id })} isInPlan={plan.some(p => p.id === view.collegeId)} onAddToPlan={addToPlan} onRemoveFromPlan={removeFromPlan} onNavigateToCalendar={() => navigateTo({ name: 'calendar' })} isAdminMode={isAdminMode} />;
      case 'educationTypeSelection': return <EducationTypeSelectionScreen onNavigate={() => navigateTo({ name: 'colleges' })} onBack={navigateBack} />;
      case 'quiz': return <QuizScreen onBack={navigateBack} onNavigate={navigateTo} quizId={view.quizId} quizType={view.quizType} isAdminMode={isAdminMode} onQuizComplete={async () => {
          setAchievementState(prev => ({ ...prev, quizzesPassed: prev.quizzesPassed + 1 }));
          await loadRecData(); 
      }} aggregatedScores={aggregatedScores} analysisCompleteness={analysisCompleteness} userQuizResults={userQuizResults} />;
      case 'quizResult': return <QuizResultView {...view} onBack={() => navigateTo({ name: 'myPlan' })} onNavigateToCollege={(id) => navigateTo({ name: 'collegeDetail', collegeId: id })} onNavigateToCollegesList={() => navigateTo({ name: 'colleges' })} onNavigate={navigateTo} aggregatedScores={aggregatedScores} analysisCompleteness={analysisCompleteness} userQuizResults={userQuizResults} hasFavorites={subjects.some(s => s.isFavorite)} hasLikedSpecialty={plan.some(p => p.type === 'specialty')} hasLikedCollege={plan.some(p => p.type === 'college')} />;
      case 'profile': return <ProfileScreen onBack={navigateBack} onCalculateScore={() => {
          setAchievementState(prev => ({ ...prev, hasCalculatedScore: true }));
          const savedSubjects = localStorage.getItem('calculatorSubjects');
          if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
      }} onNavigateToPlan={() => navigateTo({ name: 'myPlan' })} />;
      case 'top50': return <Top50Screen onBack={navigateBack} onNavigateToCollege={(id) => navigateTo({ name: 'collegeDetail', collegeId: id })} onNavigateToSpecialty={(id) => navigateTo({ name: 'specialtyDetail', specialtyId: id })} isAdminMode={isAdminMode} />;
      case 'calendar': return <CalendarScreen onBack={navigateBack} onNavigateToCollege={(id) => navigateTo({ name: 'collegeDetail', collegeId: id })} isAdminMode={isAdminMode} />;
      case 'shorts': return <ShortsScreen onBack={navigateBack} onNavigateToAuth={() => navigateTo({ name: 'auth' })} onNavigateToCollege={(id) => navigateTo({ name: 'collegeDetail', collegeId: id })} onNavigateToSpecialty={(id) => navigateTo({ name: 'specialtyDetail', specialtyId: id })} onLike={() => setAchievementState(prev => ({ ...prev, videosLiked: prev.videosLiked + 1 }))} isAdminMode={isAdminMode} />;
      case 'news': return <NewsScreen onBack={navigateBack} onNavigateToDetail={(id) => navigateTo({ name: 'newsDetail', newsId: id })} isAdminMode={isAdminMode} />;
      case 'newsDetail': return <NewsDetailScreen newsId={view.newsId} onBack={navigateBack} isAdminMode={isAdminMode} />;
      case 'auth': return <AuthScreen onBack={navigateBack} onSuccess={() => navigateTo({ name: 'dashboard' })} />;
      case 'settings': return <SettingsScreen onBack={navigateBack} onReplayOnboarding={() => { localStorage.removeItem('onboarding_complete'); window.location.reload(); }} currentTheme={theme} onThemeChange={setTheme} onReset={() => { localStorage.clear(); window.location.reload(); }} isAdminMode={isAdminMode} onToggleAdminMode={toggleAdminMode} recWeights={recWeights} onUpdateWeights={(w) => {
          setRecWeights(w);
          localStorage.setItem('rec_weights', JSON.stringify(w));
      }} onNavigate={navigateTo} />;
      case 'quizEditor': return <QuizEditorScreen quizId={view.quizId} onBack={navigateBack} />;
      case 'subjectEditor': return <SubjectEditorScreen onBack={navigateBack} />;
      case 'tagEditor': return <TagEditorScreen onBack={navigateBack} />;
      case 'gameCenter': return <GameCenterScreen onNavigate={navigateTo} onBack={navigateBack} />;
      
      case 'securityGame': return <SecurityGame onBack={navigateBack} onWin={handleGameWin} />;
      case 'architectGame': return <ArchitectGame onBack={navigateBack} onWin={handleGameWin} />;
      case 'agroDroneGame': return <AgroDroneGame onBack={navigateBack} onWin={handleGameWin} />;
      case 'energyGame': return <EnergyGame onBack={navigateBack} onWin={handleGameWin} />;
      case 'bugHunterGame': return <BugHunterGame onBack={navigateBack} onWin={handleGameWin} />;
      case 'chefGame': return <ChefGame onBack={navigateBack} onWin={handleGameWin} />;
      case 'triageGame': return <TriageGame onBack={navigateBack} onWin={handleGameWin} />;
      case 'logisticsGame': return <LogisticsGame onBack={navigateBack} onWin={handleGameWin} />;
      
      default: return <DashboardScreen setView={navigateTo} />;
    }
  };

  const noBarViews = ['shorts', 'auth', 'quizEditor', 'subjectEditor', 'tagEditor', 'energyGame', 'bugHunterGame', 'chefGame', 'triageGame', 'logisticsGame', 'securityGame', 'architectGame', 'agroDroneGame'];
  const showBars = !noBarViews.includes(view.name);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {showBars && <AppBar onBack={navigateBack} onNavigate={navigateTo} />}
      <main className={`${showBars ? 'pt-20 pb-24 px-4 max-w-lg mx-auto' : ''}`}>
        {renderContent()}
      </main>
      {showBars && <BottomNav activeTab={view.name as any} onSelect={(tab) => navigateTo({ name: tab as any })} />}
      
      {activeNotification && (
        <AchievementNotification 
          achievement={activeNotification} 
          onClose={() => setActiveNotification(null)} 
        />
      )}
    </div>
  );
};

export default App;
