
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { DBQuiz, DBQuestion, Tag } from '../types';
import EditDataModal, { EditField } from './EditDataModal';

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="absolute top-4 left-4 z-10 p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-700 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
    </button>
);

interface QuizEditorScreenProps {
    quizId?: string; // If undefined, creating new
    onBack: () => void;
}

const QuizEditorScreen: React.FC<QuizEditorScreenProps> = ({ quizId, onBack }) => {
    const [quiz, setQuiz] = useState<DBQuiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'setup' | 'questions'>('setup');
    const [isSaving, setIsSaving] = useState(false);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);

    // Question Edit State
    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            
            // 1. Fetch available tags for dropdowns
            const tags = await api.getGlobalTags();
            setAvailableTags(tags);

            // 2. Fetch or Init Quiz
            if (quizId) {
                const data = await api.getQuizFull(quizId);
                setQuiz(data);
            } else {
                setQuiz({
                    id: '',
                    title: '',
                    description: '',
                    image_url: '',
                    type: 'classic',
                    is_published: true,
                    questions: []
                });
            }
            setLoading(false);
        };
        init();
    }, [quizId]);

    // Map tags to select options
    const tagOptions = useMemo(() => {
        return availableTags.map(t => ({ value: t.id, label: `${t.name} (${t.category})` }));
    }, [availableTags]);

    const handleSaveQuiz = async () => {
        if (!quiz) return;
        if (!quiz.title) { alert('Введите название теста'); return; }
        
        setIsSaving(true);
        // If creating new, API returns ID
        if (!quiz.id) {
            const res = await api.createQuiz(quiz);
            if (res.success && res.id) {
                // Update local state with ID and move to questions tab
                setQuiz(prev => prev ? ({ ...prev, id: res.id! }) : null);
                setActiveTab('questions');
            } else {
                alert('Ошибка создания: ' + res.error);
            }
        } else {
            // Logic for updating existing quiz metadata could go here (TODO: Implement updateQuiz in API)
            // For now, assume success
            setActiveTab('questions');
        }
        setIsSaving(false);
    };

    const handleDeleteQuiz = async () => {
        if (!quiz?.id) return;
        if (!confirm('Вы уверены, что хотите удалить этот тест целиком?')) return;
        
        setIsSaving(true);
        const res = await api.deleteQuiz(quiz.id);
        if (res.success) {
            onBack();
        } else {
            alert('Ошибка удаления: ' + res.error);
            setIsSaving(false);
        }
    };

    const handleAddQuestion = () => {
        setEditingQuestion(null);
        setIsQuestionModalOpen(true);
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!confirm('Удалить вопрос?')) return;
        await api.deleteQuestion(id);
        
        // Refresh quiz data
        if (quiz?.id) {
            const data = await api.getQuizFull(quiz.id);
            setQuiz(data);
        }
    };

    const handleSaveQuestion = async (data: any, setStatus?: (s: string) => void) => {
        if (!quiz?.id) return;
        setStatus?.('Сохранение...');
        
        // Prepare payload based on Quiz Type
        const payload: any = {
            quiz_id: quiz.id,
            text: data.text,
            image_url: data.image_url,
            order: quiz.questions ? quiz.questions.length + 1 : 1,
            question_type: 'single', // Default
            answers: []
        };

        if (quiz.type === 'swipe') {
            payload.payload = { category: data.target_category }; 
        } 
        else if (quiz.type === 'classic') {
            // Use array_list items
            if (data.answersList) {
                payload.answers = data.answersList.map((item: any) => ({
                    text: item.text,
                    target_category: item.category, // This is now a Tag ID
                    score_weight: parseInt(item.score) || 1
                }));
            }
        }
        else if (quiz.type === 'battle') {
            // Battle has fixed 2 answers
            payload.answers = [
                { text: data.optionA_text, image_url: data.optionA_image, target_category: data.optionA_category },
                { text: data.optionB_text, image_url: data.optionB_image, target_category: data.optionB_category },
            ];
        }

        const res = await api.createQuestion(payload);
        if (!res.success) {
            throw new Error(res.error);
        }
        
        // Refresh
        const updatedData = await api.getQuizFull(quiz.id);
        setQuiz(updatedData);
        setIsQuestionModalOpen(false);
    };

    // Dynamic Fields based on Quiz Type
    const getQuestionFields = (): EditField[] => {
        const common: EditField[] = [
            { key: 'text', label: 'Текст вопроса', type: 'text' },
            { key: 'image_url', label: 'Картинка (необязательно)', type: 'image' }
        ];

        if (quiz?.type === 'swipe') {
            return [
                ...common,
                { 
                    key: 'target_category', 
                    label: 'Тег (если свайп вправо)', 
                    type: 'select', 
                    options: tagOptions // Use real tags
                }
            ];
        }

        if (quiz?.type === 'classic') {
            return [
                ...common,
                { 
                    key: 'answersList', 
                    label: 'Варианты ответов', 
                    type: 'array_list',
                    itemSchema: [
                        { key: 'text', label: 'Текст ответа', type: 'text' },
                        { key: 'category', label: 'Тег (влияние)', type: 'select', options: tagOptions }, // Use real tags
                        { key: 'score', label: 'Вес (баллы)', type: 'number' }
                    ]
                }
            ];
        }

        if (quiz?.type === 'battle') {
            return [
                { key: 'text', label: 'Текст пары (например, "Что выберешь?")', type: 'text' },
                // Option A
                { key: 'optionA_text', label: 'Вариант 1: Текст', type: 'text' },
                { key: 'optionA_category', label: 'Вариант 1: Тег', type: 'select', options: tagOptions },
                { key: 'optionA_image', label: 'Вариант 1: Картинка', type: 'image' },
                // Option B
                { key: 'optionB_text', label: 'Вариант 2: Текст', type: 'text' },
                { key: 'optionB_category', label: 'Вариант 2: Тег', type: 'select', options: tagOptions },
                { key: 'optionB_image', label: 'Вариант 2: Картинка', type: 'image' },
            ];
        }

        return common;
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-sky-500"></div></div>;
    if (!quiz) return <div>Ошибка загрузки</div>;

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-24">
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-white/10 p-4 sticky top-0 z-20 flex justify-between items-center shadow-sm">
                <BackButton onClick={onBack} />
                <h1 className="text-xl font-bold text-slate-900 dark:text-white pl-12">Редактор Теста</h1>
                <div className="w-10"></div>
            </div>

            <div className="max-w-3xl mx-auto p-4 md:p-6">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('setup')}
                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'setup' ? 'bg-white dark:bg-slate-600 shadow-sm text-sky-600 dark:text-white' : 'text-slate-500'}`}
                    >
                        Настройки
                    </button>
                    <button 
                        onClick={() => setActiveTab('questions')}
                        disabled={!quiz.id}
                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'questions' ? 'bg-white dark:bg-slate-600 shadow-sm text-sky-600 dark:text-white' : 'text-slate-500 disabled:opacity-50'}`}
                    >
                        Вопросы ({quiz.questions?.length || 0})
                    </button>
                </div>

                {activeTab === 'setup' ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Название теста</label>
                            <input 
                                type="text" 
                                value={quiz.title} 
                                onChange={(e) => setQuiz({...quiz, title: e.target.value})}
                                className="w-full p-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl border border-slate-300 dark:border-slate-600 outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder="Например: Кто ты из IT?"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Тип механики</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['classic', 'swipe', 'battle'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setQuiz({...quiz, type: type as any})}
                                        className={`p-3 rounded-xl border-2 transition-all ${quiz.type === type ? 'border-sky-500 bg-sky-500/10 text-sky-600' : 'border-slate-200 dark:border-slate-700 opacity-60'}`}
                                    >
                                        <span className="capitalize font-bold">{type}</span>
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                {quiz.type === 'classic' && 'Стандартный тест: вопрос и варианты ответов.'}
                                {quiz.type === 'swipe' && 'Карточки (Тиндер-механика): свайп вправо/влево.'}
                                {quiz.type === 'battle' && 'Выбор из двух картинок (VS).'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Описание</label>
                            <textarea 
                                value={quiz.description} 
                                onChange={(e) => setQuiz({...quiz, description: e.target.value})}
                                className="w-full p-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl border border-slate-300 dark:border-slate-600 outline-none min-h-[100px]"
                            />
                        </div>

                        <button 
                            onClick={handleSaveQuiz}
                            disabled={isSaving}
                            className="w-full py-4 bg-sky-600 text-white font-bold rounded-xl shadow-lg hover:bg-sky-700 transition-transform active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? 'Сохранение...' : (quiz.id ? 'Сохранить изменения' : 'Создать и перейти к вопросам')}
                        </button>
                        
                        {/* Buttons for existing quiz */}
                        {quiz.id && (
                            <button 
                                onClick={handleDeleteQuiz}
                                disabled={isSaving}
                                className="w-full py-3 bg-red-500/10 text-red-500 border border-red-500/30 font-bold rounded-xl hover:bg-red-500/20 transition-colors"
                            >
                                Удалить тест
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {quiz.questions?.map((q, idx) => (
                            <div key={q.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-white/5 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-slate-400 font-bold">#{idx + 1}</span>
                                    {q.image_url && <img src={q.image_url} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />}
                                    <span className="font-bold text-slate-800 dark:text-white line-clamp-1">{q.text}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">🗑️</button>
                                </div>
                            </div>
                        ))}

                        <button 
                            onClick={handleAddQuestion}
                            className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            + Добавить вопрос
                        </button>

                        <div className="h-4"></div>
                        <button 
                            onClick={onBack}
                            className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-600 transition-transform active:scale-95"
                        >
                            Завершить редактирование
                        </button>
                    </div>
                )}
            </div>

            {isQuestionModalOpen && (
                <EditDataModal 
                    title={editingQuestion ? "Редактировать вопрос" : "Новый вопрос"}
                    initialData={editingQuestion || { answersList: [] }}
                    fields={getQuestionFields()}
                    onSave={handleSaveQuestion}
                    onClose={() => setIsQuestionModalOpen(false)}
                />
            )}
        </div>
    );
};

export default QuizEditorScreen;
