
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { SubjectRelation, Tag } from '../types';
import EditDataModal, { EditField } from './EditDataModal';
import { defaultSubjects } from '../data/mockData';

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors group mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-semibold">Настройки</span>
    </button>
);

interface SubjectEditorScreenProps {
    onBack: () => void;
}

const SubjectEditorScreen: React.FC<SubjectEditorScreenProps> = ({ onBack }) => {
    const [relations, setRelations] = useState<SubjectRelation[]>([]);
    const [globalTags, setGlobalTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<{ id: string, name: string, specs: any[] } | null>(null);

    const loadData = async () => {
        setLoading(true);
        const [rels, tags] = await Promise.all([
            api.getSubjectRelations(),
            api.getGlobalTags()
        ]);
        setRelations(rels);
        setGlobalTags(tags);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleEdit = (subjectId: string, subjectName: string) => {
        const rel = relations.find(r => r.subjectId === subjectId);
        setEditingSubject({
            id: subjectId,
            name: subjectName,
            specs: rel ? rel.tags : []
        });
        setIsModalOpen(true);
    };

    const handleSave = async (data: any) => {
        if (!editingSubject) return;
        const res = await api.updateSubjectRelation(editingSubject.id, data);
        if (!res.success) {
            alert('Ошибка: ' + res.error);
        } else {
            await loadData();
            setIsModalOpen(false);
        }
    };

    const editFields: EditField[] = [
        { 
            key: 'specs', 
            label: 'Влияние на характеристики (ДНК)', 
            type: 'weighted_tags' 
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <BackButton onClick={onBack} />
            
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Влияние предметов</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Настройте, какие навыки (теги) развивает каждый школьный предмет.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {defaultSubjects.map(subj => {
                        const rel = relations.find(r => r.subjectId === subj.id);
                        const tagsCount = rel?.tags?.length || 0;
                        
                        return (
                            <div 
                                key={subj.id}
                                onClick={() => handleEdit(subj.id, subj.name)}
                                className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between cursor-pointer hover:border-sky-500 hover:shadow-md transition-all group"
                            >
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{subj.name}</h3>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {rel?.tags?.map((t, idx) => {
                                            const tagName = globalTags.find(gt => gt.id === t.tagId)?.name || t.tagId;
                                            return (
                                                <span key={idx} className="text-[10px] bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                                                    {tagName} <span className="opacity-70">x{t.weight/100}</span>
                                                </span>
                                            );
                                        })}
                                        {tagsCount === 0 && <span className="text-xs text-slate-400 italic">Нет связей</span>}
                                    </div>
                                </div>
                                <div className="text-slate-400 group-hover:text-sky-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isModalOpen && editingSubject && (
                <EditDataModal 
                    title={`Настройка: ${editingSubject.name}`}
                    initialData={{ specs: editingSubject.specs }}
                    fields={editFields}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default SubjectEditorScreen;
