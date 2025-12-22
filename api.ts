
import { supabase } from './lib/supabaseClient';
import { mockSpecialties, mockColleges, mockNews, mockShorts, mockEvents, mockTop50Professions, globalTags, defaultSubjectRelations } from './data/mockData';
import { specialtyImages, collegeImages } from './data/assets';
import type { Specialty, College, NewsItem, ShortVideo, PlanItem, CalendarEvent, Profession, DBQuiz, DBQuestion, DBAnswer, UserQuizResult, Tag, SubjectRelation, GameScore } from './types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const KEYS = {
    SPECIALTIES: 'cache_specialties',
    COLLEGES: 'cache_colleges',
    TAGS: 'cache_tags',
    NEWS: 'cache_news',
    VERSIONS: 'cache_versions',
    QUIZ_RESULTS: 'career_compass_quiz_results',
    SUBJECT_RELATIONS: 'cache_subject_relations',
    USER_COINS: 'user_coins',
    GAME_SCORES: 'user_game_scores'
};

const MEMORY_CACHE: any = {
    specialties: null,
    colleges: null,
    tags: null,
    news: null,
    subjectRelations: null
};

export const api = {
    async syncData() {
        if (!supabase) return;
        console.log('🔄 Запуск синхронизации данных...');
        try {
            const { data: serverVersions, error } = await supabase.from('data_versions').select('*');
            if (error || !serverVersions) return;
            const localVersionsStr = localStorage.getItem(KEYS.VERSIONS);
            const localVersions = localVersionsStr ? JSON.parse(localVersionsStr) : {};
            const updates: Promise<void>[] = [];
            const checkAndUpdate = async (tableName: string, cacheKey: string, fetcher: () => Promise<any>) => {
                const serverVer = serverVersions.find((v: any) => v.table_name === tableName)?.version || 0;
                const localVer = localVersions[tableName] || 0;
                if (serverVer > localVer || !localStorage.getItem(cacheKey)) {
                    const data = await fetcher();
                    localStorage.setItem(cacheKey, JSON.stringify(data));
                    MEMORY_CACHE[tableName] = data;
                    localVersions[tableName] = serverVer;
                } else {
                    if (!MEMORY_CACHE[tableName]) {
                        const cached = localStorage.getItem(cacheKey);
                        if (cached) MEMORY_CACHE[tableName] = JSON.parse(cached);
                    }
                }
            };

            updates.push(checkAndUpdate('specialties', KEYS.SPECIALTIES, async () => {
                const { data } = await supabase.from('specialties').select(`*, specialty_tags ( tag_id, weight )`);
                return data?.map((item: any) => ({
                    ...item,
                    imageUrl: item.image_url,
                    fullDescription: item.full_description,
                    passingScore: item.passing_score,
                    details: item.details || {},
                    gallery: [item.image_url],
                    specs: item.specialty_tags?.map((t: any) => ({ tagId: t.tag_id, weight: t.weight })) || []
                })) || [];
            }));

            updates.push(checkAndUpdate('colleges', KEYS.COLLEGES, async () => {
                const { data } = await supabase.from('colleges').select(`*, college_tags ( tag_id, weight )`);
                return data?.map((item: any) => ({
                    ...item,
                    imageUrl: item.image_url,
                    logoUrl: item.logo_url,
                    passingScore: item.passing_score,
                    specialtyIds: item.specialty_ids || [],
                    city: item.city || 'Липецк',
                    address: item.address,
                    fullName: item.full_name,
                    educationForms: item.education_forms || ['очная'],
                    gallery: item.gallery || [item.image_url],
                    contacts: item.contacts || {},
                    info: item.info || {},
                    specs: item.college_tags?.map((t: any) => ({ tagId: t.tag_id, weight: t.weight })) || []
                })) || [];
            }));

            updates.push(checkAndUpdate('tags', KEYS.TAGS, async () => {
                const { data } = await supabase.from('tags').select('*');
                return data || [];
            }));

            await Promise.all(updates);
            localStorage.setItem(KEYS.VERSIONS, JSON.stringify(localVersions));
        } catch (e) {
            console.error('Ошибка синхронизации:', e);
        }
    },

    async getCoins(): Promise<number> { return parseInt(localStorage.getItem(KEYS.USER_COINS) || '0'); },
    async addCoins(amount: number): Promise<number> {
        const current = await api.getCoins();
        const newValue = current + amount;
        localStorage.setItem(KEYS.USER_COINS, String(newValue));
        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) await supabase.rpc('increment_coins', { amount_to_add: amount }).catch(e => console.error(e));
        }
        return newValue;
    },
    async saveGameScore(gameId: string, score: number): Promise<void> {
        const entry: GameScore = { id: generateUUID(), gameId, score, playedAt: new Date().toISOString() };
        const scoresStr = localStorage.getItem(KEYS.GAME_SCORES);
        const scores: GameScore[] = scoresStr ? JSON.parse(scoresStr) : [];
        scores.push(entry);
        localStorage.setItem(KEYS.GAME_SCORES, JSON.stringify(scores));
        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) await supabase.from('game_scores').insert({ user_id: session.user.id, game_id: gameId, score: score });
        }
    },
    async getHighScores(gameId: string): Promise<GameScore[]> {
        const scoresStr = localStorage.getItem(KEYS.GAME_SCORES);
        const scores: GameScore[] = scoresStr ? JSON.parse(scoresStr) : [];
        return scores.filter(s => s.gameId === gameId).sort((a, b) => b.score - a.score).slice(0, 10);
    },
    async getSpecialties(): Promise<Specialty[]> {
        if (MEMORY_CACHE.specialties) return MEMORY_CACHE.specialties;
        const local = localStorage.getItem(KEYS.SPECIALTIES);
        if (local) { MEMORY_CACHE.specialties = JSON.parse(local); return MEMORY_CACHE.specialties; }
        return mockSpecialties; 
    },
    async getColleges(): Promise<College[]> {
        if (MEMORY_CACHE.colleges) return MEMORY_CACHE.colleges;
        const local = localStorage.getItem(KEYS.COLLEGES);
        if (local) { MEMORY_CACHE.colleges = JSON.parse(local); return MEMORY_CACHE.colleges; }
        return mockColleges;
    },
    async getGlobalTags(): Promise<Tag[]> {
        if (MEMORY_CACHE.tags) return MEMORY_CACHE.tags;
        const local = localStorage.getItem(KEYS.TAGS);
        const data = local ? JSON.parse(local) : globalTags;
        MEMORY_CACHE.tags = data;
        return data; 
    },
    async getNews(): Promise<NewsItem[]> {
        if (MEMORY_CACHE.news) return MEMORY_CACHE.news;
        const local = localStorage.getItem(KEYS.NEWS);
        if (local) { MEMORY_CACHE.news = JSON.parse(local); return MEMORY_CACHE.news; }
        return mockNews;
    },
    async getSubjectRelations(): Promise<SubjectRelation[]> {
        if (MEMORY_CACHE.subject_relations) return MEMORY_CACHE.subject_relations;
        const local = localStorage.getItem(KEYS.SUBJECT_RELATIONS);
        if (local) { MEMORY_CACHE.subject_relations = JSON.parse(local); return MEMORY_CACHE.subject_relations; }
        return defaultSubjectRelations;
    },
    async incrementVersion(tableName: string) {
        if (!supabase) return;
        const { data } = await supabase.from('data_versions').select('version').eq('table_name', tableName).single();
        const nextVer = (data?.version || 0) + 1;
        await supabase.from('data_versions').upsert({ table_name: tableName, version: nextVer });
    },
    async updateSubjectRelation(subjectId: string, updates: any) {
        const { specs } = updates;
        if (!supabase) return { success: true };
        await supabase.from('subject_tags').delete().eq('subject_id', subjectId);
        if (specs && specs.length > 0) {
            const payload = specs.map((s: any) => ({ subject_id: subjectId, tag_id: s.tagId, weight: s.weight }));
            const { error: insError } = await supabase.from('subject_tags').insert(payload);
            if (insError) return { success: false, error: insError.message };
        }
        await api.incrementVersion('subject_relations');
        api.syncData();
        return { success: true };
    },
    async updateSpecialty(id: string, updates: any) {
        if (!supabase) return { success: true }; 
        const { specs, ...mainData } = updates;
        const dbPayload = { title: mainData.title, description: mainData.description, full_description: mainData.fullDescription, image_url: mainData.imageUrl, passing_score: mainData.passingScore, details: mainData.details };
        const { error } = await supabase.from('specialties').update(dbPayload).eq('id', id);
        if (error) return { success: false, error: error.message };
        if (specs) {
            await supabase.from('specialty_tags').delete().eq('specialty_id', id);
            if (specs.length > 0) {
                const tagsPayload = specs.map((s: any) => ({ specialty_id: id, tag_id: s.tagId, weight: s.weight }));
                await supabase.from('specialty_tags').insert(tagsPayload);
            }
        }
        await api.incrementVersion('specialties');
        await api.syncData(); 
        return { success: true };
    },
    async getQuizzes(): Promise<DBQuiz[]> {
        if (!supabase) return [{ id: 'mock_classic', title: 'Классический тест', description: 'Узнай свои сильные стороны', type: 'classic', image_url: 'https://yrlxygbsmfndcfntdmon.supabase.co/storage/v1/object/public/images/classic_quiz.jpg', is_published: true }];
        const { data } = await supabase.from('quizzes').select('*').eq('is_published', true).order('created_at', { ascending: false });
        return data || [];
    },
    async getQuizFull(id: string): Promise<DBQuiz | null> {
        if (!supabase) return null;
        const { data: quiz } = await supabase.from('quizzes').select('*').eq('id', id).single();
        if (!quiz) return null;
        const { data: questions } = await supabase.from('quiz_questions').select(`*, answers:quiz_answers(*)`).eq('quiz_id', id).order('order', { ascending: true });
        return { ...quiz, questions: questions || [] };
    },
    async saveQuizResult(quizId: string, quizTitle: string, scores: any, topCategory: string): Promise<void> {
        const resultId = generateUUID();
        const timestamp = new Date().toISOString();
        const resultPayload: UserQuizResult = { id: resultId, user_id: 'local_user', quiz_id: quizId, quiz_title: quizTitle, top_category: topCategory, scores: scores, created_at: timestamp };
        try {
            const localResultsStr = localStorage.getItem(KEYS.QUIZ_RESULTS);
            const localResults: UserQuizResult[] = localResultsStr ? JSON.parse(localResultsStr) : [];
            localResults.push(resultPayload);
            localStorage.setItem(KEYS.QUIZ_RESULTS, JSON.stringify(localResults));
        } catch (e) {}
        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) await supabase.from('user_quiz_results').insert({ ...resultPayload, user_id: session.user.id });
        }
    },
    async getUserQuizResults(userId?: string): Promise<UserQuizResult[]> {
        let results: UserQuizResult[] = [];
        try {
            const localStr = localStorage.getItem(KEYS.QUIZ_RESULTS);
            if (localStr) results = JSON.parse(localStr);
        } catch (e) { }
        if (supabase && userId) {
            const { data } = await supabase.from('user_quiz_results').select('*').eq('user_id', userId);
            if (data) results = [...results, ...data];
        }
        return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    async getShorts(): Promise<ShortVideo[]> {
        if (!supabase) return mockShorts;
        const { data } = await supabase.from('shorts').select('*').order('created_at', { ascending: false });
        return data?.map((item:any) => ({...item, imageUrl: item.image_url, videoUrl: item.video_url, collegeId: item.college_id, specialtyId: item.specialty_id})) || mockShorts;
    },
    async getEvents(): Promise<CalendarEvent[]> {
        if (!supabase) return mockEvents;
        const { data } = await supabase.from('events').select('*');
        return data?.map((item:any) => ({...item, collegeId: item.college_id})) || mockEvents;
    },
    async updateCollege(id: string, updates: any) {
        if (!supabase) return { success: true };
        const dbPayload = { 
            name: updates.name, 
            full_name: updates.fullName,
            address: updates.address,
            city: updates.city, 
            image_url: updates.imageUrl, 
            logo_url: updates.logoUrl, 
            passing_score: updates.passingScore, 
            description: updates.description, 
            specialty_ids: updates.specialtyIds,
            gallery: updates.gallery,
            contacts: updates.contacts,
            info: updates.info
        };
        const { error } = await supabase.from('colleges').update(dbPayload).eq('id', id);
        if (error) return { success: false, error: error.message };
        await api.incrementVersion('colleges');
        api.syncData();
        return { success: true };
    },
    async createCollege(updates: any) { if (!supabase) return { success: false, error: 'Offline' }; const { error } = await supabase.from('colleges').insert(updates); return { success: !error, error: error?.message }; },
    async deleteCollege(id: string) { if (!supabase) return { success: false, error: 'Offline' }; const { error } = await supabase.from('colleges').delete().eq('id', id); return { success: !error, error: error?.message }; },
    async getTopProfessions() { return mockTop50Professions; },
    async createTag(d:any) { return {success: true}; },
    async deleteTag(id:string) { return {success: true}; },
    async createNews(d: any) { return { success: false, error: 'Stub' } },
    async updateNews(id: string, d: any) { return { success: false, error: 'Stub' } },
    async deleteNews(id: string) { return { success: false, error: 'Stub' } },
    async createShort(d: any, cb?: any) { return { success: false, error: 'Stub', data: null } },
    async deleteShort(id: string) { return { success: false, error: 'Stub' } },
    async createEvent(d: any) { return { success: false, error: 'Stub' } },
    async updateEvent(id: string, d: any) { return { success: false, error: 'Stub' } },
    async deleteEvent(id: string) { return { success: false, error: 'Stub' } },
    async getLikeStatus(vid: string, uid: string) { return { liked: false, count: 0 } },
    async toggleLike(vid: string, uid: string) { return { success: true } },
    async createQuiz(d: any) { return { success: false, error: 'Stub', id: 'new' } },
    async deleteQuiz(id: string) { return { success: false, error: 'Stub' } },
    async createQuestion(d: any) { return { success: false, error: 'Stub' } },
    async deleteQuestion(id: string) { return { success: false, error: 'Stub' } },
    async createSpecialty(d: any) { return { success: false, error: 'Stub' } },
    async deleteSpecialty(id: string) { return { success: false, error: 'Stub' } },
    async createProfession(d: any) { return { success: false, error: 'Stub' } },
    async updateProfession(id: number, d: any) { return { success: false, error: 'Stub' } },
    async deleteProfession(id: number) { return { success: false, error: 'Stub' } },
};
