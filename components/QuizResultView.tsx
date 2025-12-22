
import React, { useMemo, useEffect, useState } from 'react';
import type { QuizScores, QuizScoresSwipe, QuizScoresBattle, View, UserQuizResult, Tag, DBQuiz } from '../types';
import { api } from '../services/api';

// --- KLIMOV (DDO) CONSTANTS ---
const DDO_CATEGORIES: Record<string, { title: string, icon: string, color: string, keywords: string[], description: string, fullDesc: string }> = {
    'nature': { title: 'Человек — Природа', icon: '🌿', color: 'text-green-500', keywords: ['природа'], description: 'Изучение, уход и работа с живыми организмами.', fullDesc: 'Работа с объектами живой природы: агроном, фермер, кинолог, ветеринар, эколог.' },
    'tech': { title: 'Человек — Техника', icon: '⚙️', color: 'text-blue-500', keywords: ['техника'], description: 'Создание, ремонт и управление техническими системами.', fullDesc: 'Взаимодействие с техническими объектами: инженер, механик, водитель, сварщик, электрик.' },
    'communication': { title: 'Человек — Человек', icon: '🤝', color: 'text-pink-500', keywords: ['люди'], description: 'Взаимодействие, воспитание, управление, обслуживание.', fullDesc: 'Профессии, связанные с обучением, лечением, обслуживанием: врач, учитель, менеджер.' },
    'sign': { title: 'Человек — Знак', icon: '🔢', color: 'text-violet-500', keywords: ['цифры'], description: 'Цифры, коды, формулы, тексты и базы данных.', fullDesc: 'Работа со знаковой информацией: программист, экономист, бухгалтер, аналитик.' },
    'art': { title: 'Человек — Образ', icon: '🎨', color: 'text-fuchsia-500', keywords: ['искусство'], description: 'Искусство, дизайн, творчество и самовыражение.', fullDesc: 'Создание художественных образов: дизайнер, художник, музыкант, актер, архитектор.' }
};

// --- ARCHETYPES & MAPPINGS (SYSTEM SLUGS) ---
const ARCHETYPE_CONTENT: Record<string, { title: string, desc: string, color: string }> = {
    'Техника и Производство': { title: 'Технарь', desc: 'Вам нравится разбираться в устройстве сложных систем.', color: 'from-blue-500 to-cyan-500' },
    'IT и Цифра': { title: 'Цифровой гений', desc: 'Мир кодов и алгоритмов — ваша стихия.', color: 'from-violet-500 to-purple-500' },
    'Педагогика и Общество': { title: 'Лидер', desc: 'Ваша сила в общении и управлении людьми.', color: 'from-pink-500 to-rose-500' },
    'Искусство и Культура': { title: 'Творец', desc: 'Ваше призвание — создавать красоту.', color: 'from-fuchsia-500 to-pink-500' },
    'Природа и Агро': { title: 'Натуралист', desc: 'Вам близка природа и забота о живом.', color: 'from-emerald-500 to-green-500' },
    'Строительство и Среда': { title: 'Созидатель', desc: 'Вам нравится строить и создавать среду.', color: 'from-orange-500 to-amber-500' },
    'Медицина и Здоровье': { title: 'Целитель', desc: 'Ваша миссия — помогать людям и спасать жизни.', color: 'from-teal-500 to-emerald-600' },
    'Сервис и Туризм': { title: 'Мастер сервиса', desc: 'Забота о комфорте других — ваш талант.', color: 'from-sky-400 to-blue-500' },
};

const SUBJECT_MAPPING: Record<string, string[]> = {
    'Техника и Производство': ['Физика', 'Труд', 'Математика'],
    'IT и Цифра': ['Информатика', 'Алгебра', 'Английский'],
    'Педагогика и Общество': ['Обществознание', 'История', 'Русский язык'],
    'Искусство и Культура': ['МХК', 'Литература', 'История'],
    'Медицина и Здоровье': ['Химия', 'Биология', 'Русский язык'],
    'Природа и Агро': ['Биология', 'География', 'Химия'],
    'Строительство и Среда': ['Черчение', 'Физика', 'Геометрия'],
    'Сервис и Туризм': ['Английский', 'Обществознание', 'География']
};

const AnalysisAccuracy: React.FC<any> = ({ completeness, hasGrades, hasProf, hasCollege, passedQuizzesCount, totalQuizzes, onNavigate }) => {
    const items = [
        { label: '❤️ Предметы', done: hasGrades, view: { name: 'profile' } },
        { label: `📝 Тесты (${passedQuizzesCount}/${totalQuizzes})`, done: passedQuizzesCount > 0, view: { name: 'quiz' } },
        { label: '⭐ Профессии', done: hasProf, view: { name: 'specialties' } },
        { label: '🏛️ Колледжи', done: hasCollege, view: { name: 'colleges' } },
    ];
    return (
        <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-white/10 relative overflow-hidden">
            <div className="flex justify-between items-end mb-4 relative z-10">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">🎯 Точность анализа</h3>
                <span className={`text-3xl font-black ${completeness >= 80 ? 'text-emerald-400' : completeness >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{Math.round(completeness)}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mb-6 relative z-10">
                <div className={`h-full rounded-full transition-all duration-1000 ${completeness >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${completeness}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-3 relative z-10">
                {items.map((item, idx) => (
                    <button key={idx} onClick={() => onNavigate(item.view)} className={`p-3 rounded-xl border text-left flex flex-col justify-between ${item.done ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                        <span className={`text-[10px] font-black uppercase ${item.done ? 'text-emerald-400' : 'text-slate-400'}`}>{item.label}</span>
                        <p className={`text-[10px] font-bold ${item.done ? 'text-emerald-300/50' : 'text-sky-400 underline'}`}>{item.done ? 'Готово' : 'Настроить >'}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

const ProgressBar: React.FC<{ label: string, percent: number, colorClass: string }> = ({ label, percent, colorClass }) => (
    <div className="mb-3">
        <div className="flex justify-between mb-1">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{label}</span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{Math.round(percent)}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div className={`h-2 rounded-full bg-gradient-to-r ${colorClass} transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
        </div>
    </div>
);

const QuizResultView: React.FC<any> = ({ scores, quizType, aggregatedScores, onNavigate, analysisCompleteness, hasFavorites, hasLikedSpecialty, hasLikedCollege, userQuizResults = [], onBack }) => {
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [allQuizzes, setAllQuizzes] = useState<DBQuiz[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [tags, quizzes] = await Promise.all([api.getGlobalTags(), api.getQuizzes()]);
            setAllTags(tags);
            setAllQuizzes(quizzes);
            setLoading(false);
        };
        load();
    }, []);

    const passedQuizzesCount = useMemo(() => new Set(userQuizResults.map((r: any) => r.quiz_id)).size, [userQuizResults]);

    const resultData = useMemo(() => {
        if (loading || allTags.length === 0) return [];
        const processed: Record<string, number> = {};
        const source = aggregatedScores || scores;

        Object.entries(source).forEach(([key, value]) => {
            // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: поиск тега по UUID для вывода ИМЕНИ
            const tag = allTags.find(t => t.id === key || t.name === key);
            if (!tag) return;
            
            // Агрегируем по имени тега для интерфейса
            processed[tag.name] = (processed[tag.name] || 0) + (value as number);
        });

        const maxVal = Math.max(...Object.values(processed), 1);
        return Object.entries(processed).map(([name, score]) => {
            const tagInfo = allTags.find(t => t.name === name);
            return {
                id: tagInfo?.id || name,
                name: name,
                category: tagInfo?.category || 'domain',
                score,
                percent: (score / maxVal) * 100
            };
        }).sort((a, b) => b.score - a.score);
    }, [scores, aggregatedScores, allTags, loading]);

    if (loading) return <div className="p-10 text-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-sky-500 mx-auto"></div></div>;

    if (quizType === 'klimov') {
        const ddoProcessed = Object.keys(DDO_CATEGORIES).map(k => ({ id: k, name: DDO_CATEGORIES[k].title, score: (scores as any)[k] || 0 })).sort((a,b) => b.score - a.score);
        return (
            <div className="animate-fade-in-up pb-10 space-y-6">
                <div className="text-center pt-6">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">ВАШ ПСИХОТИП</p>
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 mt-1">{DDO_CATEGORIES[ddoProcessed[0]?.id]?.title || 'Не определен'}</h2>
                </div>
                <div className="space-y-2">{ddoProcessed.map(item => <DdoAccordion key={item.id} categoryKey={item.id} score={item.score} maxScore={10} />)}</div>
                <button onClick={() => onNavigate({ name: 'quizResult', scores: aggregatedScores, quizType: 'classic' })} className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg">📊 Перейти к общей карте</button>
            </div>
        );
    }

    const topResult = resultData[0];
    const archetype = ARCHETYPE_CONTENT[topResult?.name] || { title: topResult?.name || 'Исследователь', desc: 'У вас разносторонние интересы.', color: 'from-slate-500 to-gray-500' };
    
    // Автоматическое определение на основе справочника
    const topDomains = resultData.filter(r => r.category === 'domain').slice(0, 3);
    const topAttributes = resultData.filter(r => r.category === 'attribute').slice(0, 4);
    
    // Сопоставление с предметами ОГЭ через русские имена тегов доменов
    const recommendedSubjects = Array.from(new Set(topDomains.flatMap(d => SUBJECT_MAPPING[d.name] || []))).slice(0, 4);
    const recommendedSkills = topAttributes.map(a => a.name);

    return (
        <div className="animate-fade-in-up pb-10 space-y-6">
            <div className="text-center pt-6">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">ТВОЙ ПРОФИЛЬ</p>
                <h2 className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${archetype.color} mt-1`}>{archetype.title}</h2>
                <p className="text-slate-600 dark:text-slate-300 text-sm mt-2">{archetype.desc}</p>
            </div>

            <AnalysisAccuracy 
                completeness={analysisCompleteness || 0} 
                hasGrades={hasFavorites} 
                hasLikedSpecialty={hasLikedSpecialty} 
                hasLikedCollege={hasLikedCollege} 
                passedQuizzesCount={passedQuizzesCount} 
                totalQuizzes={allQuizzes.length} 
                onNavigate={onNavigate} 
            />

            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-white/10">
                <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white flex items-center gap-2">📊 Карта интересов</h3>
                {resultData.filter(r => r.percent > 5).slice(0, 5).map(item => <ProgressBar key={item.id} label={item.name} percent={item.percent} colorClass={ARCHETYPE_CONTENT[item.name]?.color || 'from-sky-400 to-blue-500'} />)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-3"><span className="text-xl">💪</span><h4 className="font-bold text-slate-900 dark:text-white">Сильные стороны</h4></div>
                    <div className="flex flex-wrap gap-2">{recommendedSkills.length > 0 ? recommendedSkills.map(s => <span key={s} className="text-xs font-bold px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-md">{s}</span>) : <span className="text-xs text-slate-400 italic">Пройдите больше тестов</span>}</div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-3"><span className="text-xl">📚</span><h4 className="font-bold text-slate-900 dark:text-white">Предметы ОГЭ</h4></div>
                    <div className="flex flex-wrap gap-2">{recommendedSubjects.length > 0 ? recommendedSubjects.map(s => <span key={s} className="text-xs font-bold px-2 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-md">{s}</span>) : <span className="text-xs text-slate-400 italic">Анализируем интересы...</span>}</div>
                </div>
            </div>

            <button onClick={onBack} className="w-full py-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold">Вернуться назад</button>
        </div>
    );
};

const DdoAccordion: React.FC<any> = ({ categoryKey, score, maxScore }) => {
    const [isOpen, setIsOpen] = useState(false);
    const cat = DDO_CATEGORIES[categoryKey];
    if (!cat) return null;
    const percent = Math.min(100, Math.round((score / maxScore) * 100));
    return (
        <div className="mb-3 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-white/10">
            <div onClick={() => setIsOpen(!isOpen)} className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">{cat.icon}</div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-lg">{cat.title}</h4>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{score}</div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${score >= 7 ? 'bg-fuchsia-500' : score >= 4 ? 'bg-amber-400' : 'bg-slate-300'}`} style={{ width: `${percent}%` }} />
                </div>
            </div>
            {isOpen && <div className="bg-slate-50 dark:bg-slate-900/50 p-5 border-t border-slate-100 dark:border-white/5 animate-fade-in"><p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{cat.fullDesc}</p></div>}
        </div>
    );
};

export default QuizResultView;
