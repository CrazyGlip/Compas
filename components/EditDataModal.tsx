
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Tag, WeightedTag } from '../types';

export interface EditField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'textarea' | 'date' | 'datetime-local' | 'select' | 'boolean' | 'image' | 'gallery' | 'multiselect' | 'file' | 'array_list' | 'weighted_tags';
    options?: { value: string; label: string }[];
    itemSchema?: EditField[]; // For array_list type
}

interface EditDataModalProps {
    title: string;
    initialData: any;
    fields: EditField[];
    onSave: (updatedData: any, setStatus?: (status: string) => void) => Promise<void>;
    onClose: () => void;
    onDelete?: () => Promise<void>;
}

const EditDataModal: React.FC<EditDataModalProps> = ({ title, initialData, fields, onSave, onClose, onDelete }) => {
    const [formData, setFormData] = useState(initialData);
    const [imagePreviews, setImagePreviews] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>(''); // Progress status text
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    // Search state for multiselect fields
    const [searchQueries, setSearchQueries] = useState<{ [key: string]: string }>({});

    // Global Tags for the weighted_tags field
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    
    // Multi-select state for weighted tags
    const [activeTagField, setActiveTagField] = useState<string | null>(null); // Which field is currently adding tags
    const [tempSelectedTags, setTempSelectedTags] = useState<string[]>([]); // Tags pending addition

    // Max file size (50MB for videos, 5MB for images)
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

    // Initialize data
    useEffect(() => {
        const init = async () => {
            // Load previews
            const previews: any = {};
            fields.forEach(field => {
                if (field.type === 'image' && typeof initialData[field.key] === 'string') {
                    previews[field.key] = initialData[field.key];
                }
            });
            setImagePreviews(previews);

            // Load Tags if needed
            if (fields.some(f => f.type === 'weighted_tags')) {
                const tags = await api.getGlobalTags();
                setAvailableTags(tags);
            }
        };
        init();
    }, []);

    const handleChange = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
        if (error) setError(null); // Clear error on change
    };

    const handleSearchChange = (key: string, value: string) => {
        setSearchQueries(prev => ({ ...prev, [key]: value }));
    };

    const handleFileChange = (key: string, e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Validation
            const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
            if (file.size > maxSize) {
                alert(`Файл слишком большой! Максимальный размер: ${isImage ? '5Мб' : '50Мб'}`);
                e.target.value = ''; // Reset input
                return;
            }

            // Store the file object in formData to be uploaded later
            setFormData((prev: any) => ({ ...prev, [key]: file }));

            if (isImage) {
                // Create a local preview URL
                const previewUrl = URL.createObjectURL(file);
                setImagePreviews(prev => ({ ...prev, [key]: previewUrl }));
            }
            if (error) setError(null);
        }
    };

    const handleGalleryAdd = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files) as File[];
            
            // Filter large files
            const validFiles = files.filter(f => {
                if (f.size > MAX_IMAGE_SIZE) {
                    alert(`Файл ${f.name} пропущен (больше 5Мб)`);
                    return false;
                }
                return true;
            });

            if (validFiles.length > 0) {
                setFormData((prev: any) => ({
                    ...prev,
                    [key]: [...(prev[key] || []), ...validFiles]
                }));
                if (error) setError(null);
            }
        }
    };

    const handleGalleryRemove = (key: string, index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            [key]: (prev[key] || []).filter((_: any, i: number) => i !== index)
        }));
    };

    // --- Dynamic List Handlers ---
    const handleArrayItemChange = (arrayKey: string, index: number, fieldKey: string, value: any) => {
        setFormData((prev: any) => {
            const arr = [...(prev[arrayKey] || [])];
            arr[index] = { ...arr[index], [fieldKey]: value };
            return { ...prev, [arrayKey]: arr };
        });
    };

    const handleArrayItemAdd = (arrayKey: string) => {
        setFormData((prev: any) => ({
            ...prev,
            [arrayKey]: [...(prev[arrayKey] || []), {}] // Add empty object
        }));
    };

    const handleArrayItemRemove = (arrayKey: string, index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            [arrayKey]: (prev[arrayKey] || []).filter((_: any, i: number) => i !== index)
        }));
    };

    // --- Weighted Tags Handlers ---
    const handleOpenTagPicker = (fieldKey: string) => {
        setActiveTagField(fieldKey);
        setTempSelectedTags([]);
    };

    const handleToggleTempTag = (tagId: string) => {
        setTempSelectedTags(prev => 
            prev.includes(tagId) 
                ? prev.filter(id => id !== tagId) 
                : [...prev, tagId]
        );
    };

    const handleAddMultipleWeightedTags = () => {
        if (!activeTagField) return;
        
        setFormData((prev: any) => {
            const currentTags = prev[activeTagField] || [];
            // Create new WeightedTag objects for selected IDs
            const newTags = tempSelectedTags.map(id => ({
                tagId: id,
                weight: 50 // Default weight
            }));
            
            return {
                ...prev,
                [activeTagField]: [...currentTags, ...newTags]
            };
        });
        
        setActiveTagField(null);
        setTempSelectedTags([]);
    };

    const handleUpdateTagWeight = (fieldKey: string, tagId: string, weight: number) => {
        setFormData((prev: any) => ({
            ...prev,
            [fieldKey]: (prev[fieldKey] || []).map((t: WeightedTag) => 
                t.tagId === tagId ? { ...t, weight } : t
            )
        }));
    };

    const handleRemoveWeightedTag = (fieldKey: string, tagId: string) => {
        setFormData((prev: any) => ({
            ...prev,
            [fieldKey]: (prev[fieldKey] || []).filter((t: WeightedTag) => t.tagId !== tagId)
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        setStatus('Подготовка данных...');
        setError(null);
        try {
            // We pass setStatus to onSave so the parent/API can update the status text
            await onSave(formData, setStatus);
            // Don't close automatically here, parent handles it on success by unmounting or calling onClose
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Ошибка сохранения');
        } finally {
            setLoading(false);
            setStatus('');
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!onDelete) return;
        setLoading(true);
        setStatus('Удаление...');
        try {
            await onDelete();
            onClose();
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Ошибка удаления');
            setLoading(false);
            setStatus('');
            setShowDeleteConfirm(false);
        }
    };

    // Stop propagation of touch events to prevent App.tsx from triggering swipe navigation
    const handleTouchPropagation = (e: React.TouchEvent) => {
        e.stopPropagation();
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
            onTouchStart={handleTouchPropagation}
            onTouchMove={handleTouchPropagation}
            onTouchEnd={handleTouchPropagation}
        >
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 max-h-[90vh] flex flex-col overflow-hidden relative">
                
                {/* Loading Overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                        <div className="w-16 h-16 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin mb-4"></div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{status || 'Загрузка...'}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Пожалуйста, не закрывайте окно</p>
                    </div>
                )}

                <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
                    <button 
                        onClick={onClose} 
                        disabled={loading}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                    {fields.map((field) => (
                        <div key={field.key} className="space-y-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                {field.label}
                            </label>
                            
                            {field.type === 'textarea' ? (
                                <textarea
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition min-h-[100px]"
                                />
                            ) : field.type === 'select' ? (
                                <select
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition"
                                >
                                    {field.options?.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : field.type === 'weighted_tags' ? (
                                <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                    
                                    {/* Existing Tags List */}
                                    <div className="space-y-3 mb-4">
                                        {(formData[field.key] || []).map((wt: WeightedTag) => {
                                            const tagInfo = availableTags.find(t => t.id === wt.tagId);
                                            return (
                                                <div key={wt.tagId} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-100 dark:border-white/5">
                                                    <div className="w-24 text-xs font-bold truncate text-slate-700 dark:text-slate-200" title={tagInfo?.name || wt.tagId}>
                                                        {tagInfo?.name || wt.tagId}
                                                    </div>
                                                    <div className="flex-1 flex flex-col">
                                                        <input 
                                                            type="range" 
                                                            min="0" 
                                                            max="100" 
                                                            step="10"
                                                            value={wt.weight} 
                                                            onChange={(e) => handleUpdateTagWeight(field.key, wt.tagId, parseInt(e.target.value))}
                                                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                                        />
                                                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                                            <span>0%</span>
                                                            <span className="font-bold text-sky-500">{wt.weight}%</span>
                                                            <span>100%</span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleRemoveWeightedTag(field.key, wt.tagId)}
                                                        className="text-red-400 hover:text-red-500 p-1"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {(formData[field.key] || []).length === 0 && (
                                            <p className="text-xs text-slate-400 text-center py-2">Нет характеристик</p>
                                        )}
                                    </div>

                                    {/* Tag Picker UI */}
                                    {activeTagField === field.key ? (
                                        <div className="border border-sky-500/30 rounded-xl bg-white dark:bg-slate-800 p-3 shadow-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="text-xs font-bold uppercase text-slate-500">Выберите теги</h4>
                                                <button onClick={() => setActiveTagField(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                                            </div>
                                            
                                            <div className="max-h-40 overflow-y-auto space-y-1 mb-3 pr-1 custom-scrollbar">
                                                {availableTags
                                                    .filter(t => !(formData[field.key] || []).some((wt: WeightedTag) => wt.tagId === t.id))
                                                    .map(tag => (
                                                        <div 
                                                            key={tag.id}
                                                            onClick={() => handleToggleTempTag(tag.id)}
                                                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition-colors ${tempSelectedTags.includes(tag.id) ? 'bg-sky-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                                                        >
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${tempSelectedTags.includes(tag.id) ? 'border-white bg-white/20' : 'border-slate-400'}`}>
                                                                {tempSelectedTags.includes(tag.id) && <span className="text-[10px]">✓</span>}
                                                            </div>
                                                            <span className="truncate flex-1">{tag.name}</span>
                                                            <span className="text-[10px] opacity-70 border border-current px-1 rounded">{tag.category}</span>
                                                        </div>
                                                    ))
                                                }
                                                {availableTags.length === 0 && <p className="text-xs text-center text-slate-400">Список тегов пуст</p>}
                                            </div>

                                            <button 
                                                onClick={handleAddMultipleWeightedTags}
                                                disabled={tempSelectedTags.length === 0}
                                                className="w-full py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg font-bold text-sm transition-colors"
                                            >
                                                Добавить выбранные ({tempSelectedTags.length})
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleOpenTagPicker(field.key)}
                                            className="w-full py-2 border-2 border-dashed border-sky-500/50 text-sky-500 rounded-lg text-sm font-bold hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
                                        >
                                            + Добавить характеристики
                                        </button>
                                    )}
                                </div>
                            ) : field.type === 'multiselect' ? (
                                <div className="space-y-2">
                                    <input 
                                        type="text" 
                                        placeholder="Поиск..." 
                                        value={searchQueries[field.key] || ''}
                                        onChange={(e) => handleSearchChange(field.key, e.target.value)}
                                        className="w-full p-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg mb-2"
                                    />
                                    <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/50">
                                        {field.options
                                            ?.filter(opt => opt.label.toLowerCase().includes((searchQueries[field.key] || '').toLowerCase()))
                                            .map(opt => {
                                                const isSelected = (formData[field.key] || []).includes(opt.value);
                                                return (
                                                    <label key={opt.value} className="flex items-center space-x-2 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer">
                                                        <input 
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                const current = formData[field.key] || [];
                                                                const updated = e.target.checked
                                                                    ? [...current, opt.value]
                                                                    : current.filter((v: string) => v !== opt.value);
                                                                handleChange(field.key, updated);
                                                            }}
                                                            className="rounded text-sky-500 focus:ring-sky-500"
                                                        />
                                                        <span className="text-sm text-slate-700 dark:text-slate-300">{opt.label}</span>
                                                    </label>
                                                );
                                            })}
                                    </div>
                                    <p className="text-xs text-slate-500">Выбрано: {(formData[field.key] || []).length}</p>
                                </div>
                            ) : field.type === 'boolean' ? (
                                <div className="flex items-center space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => handleChange(field.key, !formData[field.key])}
                                        className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${formData[field.key] ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${formData[field.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                    <span className="text-slate-700 dark:text-slate-300 text-sm">{formData[field.key] ? 'Да' : 'Нет'}</span>
                                </div>
                            ) : field.type === 'image' ? (
                                <div>
                                    <div className="flex items-center gap-4">
                                        {imagePreviews[field.key] && (
                                            <img src={imagePreviews[field.key]} alt="Preview" className="w-20 h-20 rounded-lg object-cover border border-slate-300" />
                                        )}
                                        <label className="cursor-pointer bg-sky-500 text-white px-4 py-2 rounded-xl hover:bg-sky-600 transition text-sm font-bold">
                                            Выбрать фото
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={(e) => handleFileChange(field.key, e, true)} 
                                            />
                                        </label>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Макс. размер 5 Мб</p>
                                </div>
                            ) : field.type === 'file' ? (
                                <div>
                                    <div className="flex items-center gap-4">
                                        <label className="cursor-pointer bg-purple-500 text-white px-4 py-2 rounded-xl hover:bg-purple-600 transition text-sm font-bold">
                                            Выбрать видео файл
                                            <input 
                                                type="file" 
                                                accept="video/mp4,video/webm" 
                                                className="hidden" 
                                                onChange={(e) => handleFileChange(field.key, e, false)} 
                                            />
                                        </label>
                                        {formData[field.key] instanceof File && (
                                            <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                                                {formData[field.key].name}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Или вставьте ссылку ниже (если файл не выбран)</p>
                                    <input
                                        type="text"
                                        placeholder="Или ссылка на видео..."
                                        value={typeof formData[field.key] === 'string' ? formData[field.key] : ''}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition mt-2 text-sm"
                                    />
                                </div>
                            ) : field.type === 'gallery' ? (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {(formData[field.key] || []).map((item: string | File, idx: number) => {
                                            const url = item instanceof File ? URL.createObjectURL(item) : item;
                                            return (
                                                <div key={idx} className="relative group w-20 h-20">
                                                    <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover rounded-lg border border-slate-200" />
                                                    <button
                                                        onClick={() => handleGalleryRemove(field.key, idx)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleGalleryAdd(field.key, e)} />
                                        </label>
                                    </div>
                                </div>
                            ) : field.type === 'array_list' ? (
                                <div className="space-y-3">
                                    {(formData[field.key] || []).map((item: any, index: number) => (
                                        <div key={index} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 relative">
                                            <button 
                                                onClick={() => handleArrayItemRemove(field.key, index)}
                                                className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                                                title="Удалить"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            <div className="grid gap-2 pr-6">
                                                {field.itemSchema?.map(subField => {
                                                    if (subField.type === 'select') {
                                                        return (
                                                            <div key={subField.key}>
                                                                <select
                                                                    value={item[subField.key] || ''}
                                                                    onChange={(e) => handleArrayItemChange(field.key, index, subField.key, e.target.value)}
                                                                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-1 focus:ring-sky-500"
                                                                >
                                                                    <option value="" disabled>Выберите {subField.label.toLowerCase()}</option>
                                                                    {subField.options?.map(opt => (
                                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )
                                                    }
                                                    return (
                                                        <div key={subField.key}>
                                                            <input
                                                                type={subField.type === 'number' ? 'number' : 'text'}
                                                                placeholder={subField.label}
                                                                value={item[subField.key] || ''}
                                                                onChange={(e) => handleArrayItemChange(field.key, index, subField.key, e.target.value)}
                                                                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                                                            />
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => handleArrayItemAdd(field.key)}
                                        className="w-full py-2 border-2 border-dashed border-sky-500/50 text-sky-500 rounded-lg text-sm font-bold hover:bg-sky-50 dark:hover:bg-sky-900/20"
                                    >
                                        + Добавить вариант
                                    </button>
                                </div>
                            ) : (
                                <input
                                    type={field.type}
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition"
                                />
                            )}
                        </div>
                    ))}

                    {error && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-xl text-sm border border-red-200 dark:border-red-800">
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 flex justify-between items-center gap-4">
                    {onDelete && (
                        showDeleteConfirm ? (
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleConfirmDelete} 
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition"
                                >
                                    Подтвердить
                                </button>
                                <button 
                                    onClick={() => setShowDeleteConfirm(false)} 
                                    disabled={loading}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-bold text-sm hover:bg-slate-300 transition"
                                >
                                    Отмена
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={handleDeleteClick}
                                disabled={loading}
                                type="button"
                                className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-bold text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition border border-red-200 dark:border-red-800"
                            >
                                Удалить
                            </button>
                        )
                    )}
                    
                    <div className="flex gap-3 ml-auto">
                        <button 
                            onClick={onClose}
                            disabled={loading}
                            type="button"
                            className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                        >
                            Отмена
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={loading}
                            type="button"
                            className="px-6 py-2 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition shadow-lg shadow-sky-500/30 disabled:opacity-50"
                        >
                            {loading ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditDataModal;
