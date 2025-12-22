
import { supabase } from '../lib/supabaseClient';
import { mockSpecialties } from '../data/specialties';
import { mockColleges } from '../data/colleges';

const createLogger = () => {
    let logs: string[] = [];
    return {
        log: (msg: string) => {
            console.log(msg);
            logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
        },
        getLogs: () => logs.join('\n')
    };
};

const RAW_SCORES_DATA = [
    { college_id: 'dat', specialty_id: '15.01.05', score: 3.37 },
    { college_id: 'dat', specialty_id: '23.01.17', score: 3.84 },
    { college_id: 'dat', specialty_id: '35.01.27', score: 3.58 },
    { college_id: 'dat', specialty_id: '35.02.16', score: 3.96 },
    { college_id: 'dat', specialty_id: '19.02.11', score: 3.89 },
    { college_id: 'loki_igumnova', specialty_id: '51.02.01', score: 4.15 },
    { college_id: 'loki_igumnova', specialty_id: '51.02.02', score: 4.35 },
    { college_id: 'loki_igumnova', specialty_id: '51.02.03', score: 4.08 },
    { college_id: 'loki_igumnova', specialty_id: '53.02.02', score: 4.03 },
    { college_id: 'loki_igumnova', specialty_id: '53.02.03', score: 4.64 },
    { college_id: 'loki_igumnova', specialty_id: '53.02.04', score: 4.50 },
    { college_id: 'loki_igumnova', specialty_id: '53.02.05', score: 4.42 },
    { college_id: 'loki_igumnova', specialty_id: '53.02.06', score: 4.16 },
    { college_id: 'loki_igumnova', specialty_id: '53.02.07', score: 4.36 },
    { college_id: 'loki_igumnova', specialty_id: '53.02.08', score: 4.18 },
    { college_id: 'loki_igumnova', specialty_id: '54.02.05', score: 4.53 },
    { college_id: 'lmk', specialty_id: '09.02.01', score: 4.35 },
    { college_id: 'lmk', specialty_id: '09.02.07', score: 4.50 },
    { college_id: 'lmk', specialty_id: '13.02.07', score: 3.93 },
    { college_id: 'lmk', specialty_id: '13.02.13', score: 4.40 },
    { college_id: 'lmk', specialty_id: '15.02.03', score: 3.78 },
    { college_id: 'lmk', specialty_id: '15.02.16', score: 4.20 },
    { college_id: 'lmk', specialty_id: '15.02.17', score: 4.00 },
    { college_id: 'lmk', specialty_id: '18.02.10', score: 4.10 },
    { college_id: 'lmk', specialty_id: '18.02.12', score: 4.83 },
    { college_id: 'lmk', specialty_id: '22.02.08', score: 3.85 },
    { college_id: 'lmk', specialty_id: '27.02.04', score: 4.35 },
    { college_id: 'lmk', specialty_id: '38.02.03', score: 4.55 },
    { college_id: 'gtk', specialty_id: '08.02.01', score: 3.71 },
    { college_id: 'gtk', specialty_id: '13.01.10', score: 3.29 },
    { college_id: 'gtk', specialty_id: '15.01.05', score: 3.52 },
    { college_id: 'gtk', specialty_id: '15.01.38', score: 3.82 },
    { college_id: 'gtk', specialty_id: '15.02.17', score: 3.72 },
    { college_id: 'gtk', specialty_id: '23.01.09', score: 3.90 },
    { college_id: 'gtk', specialty_id: '43.02.15', score: 3.97 },
    { college_id: 'lmk_med', specialty_id: '31.02.01', score: 4.63 },
    { college_id: 'lmk_med', specialty_id: '34.02.01', score: 4.53 },
    { college_id: 'lmk_med', specialty_id: '31.02.02', score: 4.30 },
    { college_id: 'lmk_med', specialty_id: '31.02.03', score: 4.34 },
    { college_id: 'lmk_med_usman', specialty_id: '31.02.01', score: 4.63 },
    { college_id: 'lmk_med_usman', specialty_id: '34.02.01', score: 4.53 },
    { college_id: 'lmk_med_usman', specialty_id: '31.02.02', score: 4.30 },
    { college_id: 'emk_lukicha', specialty_id: '31.02.03', score: 4.18 },
    { college_id: 'emk_lukicha', specialty_id: '34.02.01', score: 3.81 },
    { college_id: 'umk', specialty_id: '44.02.02', score: 4.03 },
    { college_id: 'umk', specialty_id: '44.02.03', score: 3.60 },
    { college_id: 'umk', specialty_id: '44.02.06', score: 3.91 },
    { college_id: 'umk', specialty_id: '49.02.01', score: 3.51 },
    { college_id: 'umk', specialty_id: '20.02.02', score: 3.83 },
    { college_id: 'umk_okt', specialty_id: '08.01.27', score: 3.49 },
    { college_id: 'umk_okt', specialty_id: '35.01.27', score: 3.40 },
    { college_id: 'lkis', specialty_id: '11.02.17', score: 3.98 },
    { college_id: 'lkis', specialty_id: '19.02.12', score: 3.58 },
    { college_id: 'lkis', specialty_id: '29.02.10', score: 4.18 },
    { college_id: 'lkis', specialty_id: '38.02.03', score: 4.40 },
    { college_id: 'lkis', specialty_id: '42.02.01', score: 4.51 },
    { college_id: 'lkis', specialty_id: '43.02.15', score: 4.17 },
    { college_id: 'lkis', specialty_id: '43.02.16', score: 4.42 },
    { college_id: 'lkis', specialty_id: '43.02.17', score: 4.27 },
    { college_id: 'lkis', specialty_id: '29.01.04', score: 3.87 },
    { college_id: 'lkis', specialty_id: '43.01.09', score: 3.74 },
    { college_id: 'ekit', specialty_id: '23.01.09', score: 3.65 },
    { college_id: 'ekit', specialty_id: '23.01.17', score: 3.59 },
    { college_id: 'ekit', specialty_id: '43.01.06', score: 3.92 },
    { college_id: 'ekit', specialty_id: '35.01.11', score: 3.77 },
    { college_id: 'ekit', specialty_id: '43.01.09', score: 3.62 },
    { college_id: 'ekit', specialty_id: '23.02.06', score: 4.05 },
    { college_id: 'ekit', specialty_id: '29.02.10', score: 3.96 },
    { college_id: 'lksait', specialty_id: '08.02.01', score: 4.24 },
    { college_id: 'lksait', specialty_id: '08.02.15', score: 4.50 },
    { college_id: 'lksait', specialty_id: '21.02.19', score: 4.11 },
    { college_id: 'lksait', specialty_id: '21.02.15', score: 3.66 },
    { college_id: 'lksait', specialty_id: '07.02.01', score: 4.59 },
    { college_id: 'lksait', specialty_id: '35.02.15', score: 4.13 },
    { college_id: 'ekpt', specialty_id: '08.01.27', score: 3.52 },
    { college_id: 'ekpt', specialty_id: '15.01.05', score: 3.56 },
    { college_id: 'ekpt', specialty_id: '23.01.17', score: 3.76 },
    { college_id: 'ekpt', specialty_id: '09.02.01', score: 4.05 },
    { college_id: 'ekpt', specialty_id: '13.02.13', score: 3.67 },
    { college_id: 'ekpt', specialty_id: '15.02.16', score: 3.60 },
    { college_id: 'ekpt', specialty_id: '15.02.17', score: 3.67 },
    { college_id: 'ekpt', specialty_id: '15.02.19', score: 3.71 },
    { college_id: 'ekpt', specialty_id: '43.02.16', score: 4.18 },
    { college_id: 'kkat', specialty_id: '36.02.01', score: 3.54 },
    { college_id: 'kkat', specialty_id: '36.02.05', score: 3.41 },
    { college_id: 'kkat', specialty_id: '35.02.20', score: 3.38 },
    { college_id: 'kkat', specialty_id: '35.02.16', score: 3.32 },
    { college_id: 'kkat_terbuny', specialty_id: '15.01.05', score: 3.33 },
    { college_id: 'kkat_terbuny', specialty_id: '35.02.20', score: 3.38 },
    { college_id: 'kkat_terbuny', specialty_id: '35.02.16', score: 3.32 },
    { college_id: 'kkat_terbuny', specialty_id: '35.02.05', score: 3.48 },
    { college_id: 'kiivms', specialty_id: '23.02.02', score: 4.23 },
    { college_id: 'kiivms', specialty_id: '15.02.17', score: 3.85 },
    { college_id: 'kiivms', specialty_id: '15.02.09', score: 4.46 },
    { college_id: 'kiivms', specialty_id: '15.02.16', score: 4.05 },
    { college_id: 'kiivms', specialty_id: '10.02.04', score: 4.29 },
    { college_id: 'kiivms', specialty_id: '10.02.05', score: 4.22 },
    { college_id: 'kiivms', specialty_id: '08.02.08', score: 4.07 },
    { college_id: 'kiivms', specialty_id: '13.02.13', score: 4.06 },
    { college_id: 'kiivms', specialty_id: '09.02.07', score: 4.46 },
    { college_id: 'kiivms', specialty_id: '09.02.08', score: 4.34 },
    { college_id: 'chat', specialty_id: '35.02.20', score: 3.75 },
    { college_id: 'chat', specialty_id: '23.02.07', score: 3.78 },
    { college_id: 'chat', specialty_id: '35.02.05', score: 3.82 },
    { college_id: 'chat', specialty_id: '35.02.16', score: 3.64 },
    { college_id: 'chat', specialty_id: '36.02.01', score: 3.74 },
    { college_id: 'chat_dobroe', specialty_id: '35.01.27', score: 3.63 },
    { college_id: 'chat_agronom', specialty_id: '15.01.05', score: 3.70 },
    { college_id: 'chat_agronom', specialty_id: '43.01.09', score: 3.60 },
    { college_id: 'chat_agronom', specialty_id: '15.02.06', score: 3.80 },
    { college_id: 'chat_agronom', specialty_id: '35.01.27', score: 3.63 },
    { college_id: 'chat_agronom', specialty_id: '35.02.08', score: 3.45 },
    { college_id: 'uptk', specialty_id: '08.02.01', score: 3.44 },
    { college_id: 'uptk', specialty_id: '21.02.19', score: 3.65 },
    { college_id: 'uptk', specialty_id: '35.02.05', score: 3.53 },
    { college_id: 'uptk', specialty_id: '35.02.12', score: 3.63 },
    { college_id: 'uptk', specialty_id: '35.02.16', score: 3.83 },
    { college_id: 'uptk_dobrinka', specialty_id: '35.01.27', score: 3.51 },
    { college_id: 'uptk_dobrinka', specialty_id: '35.01.26', score: 3.49 },
    { college_id: 'ltptut', specialty_id: '15.01.38', score: 3.67 },
    { college_id: 'ltptut', specialty_id: '09.02.06', score: 3.94 },
    { college_id: 'ltptut', specialty_id: '09.02.07', score: 4.01 },
    { college_id: 'ltptut', specialty_id: '15.02.17', score: 3.57 },
    { college_id: 'ltptut', specialty_id: '21.02.19', score: 3.71 },
    { college_id: 'ltptut', specialty_id: '38.02.03', score: 4.50 },
    { college_id: 'ltptut', specialty_id: '40.02.02', score: 4.34 },
    { college_id: 'lktg', specialty_id: '23.02.07', score: 4.16 },
    { college_id: 'lktg', specialty_id: '23.02.01', score: 4.23 },
    { college_id: 'lktg', specialty_id: '15.02.19', score: 3.81 },
    { college_id: 'lktg', specialty_id: '08.02.12', score: 3.75 },
    { college_id: 'lktg', specialty_id: '23.01.17', score: 3.85 },
    { college_id: 'lktg', specialty_id: '23.01.07', score: 3.67 },
    { college_id: 'lktg', specialty_id: '23.01.01', score: 3.69 },
    { college_id: 'lktg', specialty_id: '23.01.06', score: 3.80 },
    { college_id: 'lktg', specialty_id: '23.01.08', score: 3.43 },
    { college_id: 'lktg', specialty_id: '15.01.05', score: 3.37 },
    { college_id: 'leb_pk', specialty_id: '44.02.01', score: 4.19 },
    { college_id: 'leb_pk', specialty_id: '44.02.02', score: 4.53 },
    { college_id: 'leb_pk', specialty_id: '44.02.03', score: 3.72 },
    { college_id: 'leb_pk', specialty_id: '44.02.04', score: 4.03 },
    { college_id: 'leb_pk', specialty_id: '44.02.05', score: 4.25 },
    { college_id: 'lpt', specialty_id: '22.01.11', score: 3.83 },
    { college_id: 'lpt', specialty_id: '23.01.09', score: 3.84 },
    { college_id: 'lpt', specialty_id: '15.01.38', score: 3.85 },
    { college_id: 'lpt', specialty_id: '27.02.04', score: 4.14 },
    { college_id: 'lpt', specialty_id: '15.02.10', score: 4.31 },
    { college_id: 'lpt', specialty_id: '15.02.19', score: 3.98 },
    { college_id: 'lpt', specialty_id: '15.02.03', score: 3.72 },
    { college_id: 'zpt', specialty_id: '35.02.16', score: 3.59 },
    { college_id: 'zpt', specialty_id: '38.02.03', score: 4.19 },
    { college_id: 'zpt', specialty_id: '19.02.12', score: 3.92 },
    { college_id: 'zpt', specialty_id: '35.02.08', score: 3.80 },
    { college_id: 'zpt', specialty_id: '13.02.13', score: 3.81 },
    { college_id: 'zpt', specialty_id: '23.02.07', score: 3.74 },
    { college_id: 'egki_hrennikova', specialty_id: '51.02.02', score: 3.95 },
    { college_id: 'egki_hrennikova', specialty_id: '53.02.03', score: 4.50 },
    { college_id: 'egki_hrennikova', specialty_id: '53.02.05', score: 3.84 },
    { college_id: 'egki_hrennikova', specialty_id: '54.02.01', score: 4.48 },
    { college_id: 'egki_hrennikova', specialty_id: '54.02.04', score: 4.24 },
    { college_id: 'egki_hrennikova', specialty_id: '54.02.05', score: 4.31 },
    { college_id: 'lisk', specialty_id: '08.01.27', score: 3.42 },
    { college_id: 'lisk', specialty_id: '15.01.05', score: 3.11 },
    { college_id: 'lisk', specialty_id: '13.01.10', score: 3.36 },
    { college_id: 'lisk', specialty_id: '35.01.28', score: 3.40 },
    { college_id: 'lisk', specialty_id: '09.01.03', score: 3.93 },
    { college_id: 'lisk', specialty_id: '09.01.04', score: 3.47 },
    { college_id: 'lisk', specialty_id: '08.01.28', score: 4.50 },
    { college_id: 'lisk', specialty_id: '15.02.19', score: 3.59 }
];

/**
 * ШАГ 1: СИНХРОНИЗАЦИЯ МЕТАДАННЫХ КОЛЛЕДЖЕЙ
 */
export const runManualCollegeImport = async () => {
    if (!supabase) return { success: false, message: 'Supabase not connected' };
    const { log, getLogs } = createLogger();
    log('🏢 СИНХРОНИЗАЦИЯ СПРАВОЧНИКА КОЛЛЕДЖЕЙ...');

    try {
        let count = 0;
        for (const college of mockColleges) {
            const { error } = await supabase.from('colleges').upsert({
                id: college.id,
                name: college.name,
                full_name: college.fullName,
                city: college.city,
                address: college.address,
                phone: college.phone,
                website_url: college.websiteUrl,
                admission_link: college.admissionLink,
                epgu_link: college.epguLink,
                vk_url: college.vkUrl,
                max_url: college.maxUrl,
                geo_tag: college.geoTag,
                image_url: college.imageUrl,
                logo_url: college.logoUrl,
                description: college.activityInfo,
                has_dormitory: college.hasDormitory,
                is_accessible: college.isAccessible,
                specialty_ids: college.specialtyIds,
                education_forms: college.educationForms
            }, { onConflict: 'id' });

            if (!error) {
                count++;
            } else {
                log(`❌ Ошибка колледжа [${college.id}]: ${error.message}`);
            }
        }
        log(`✨ Готово! Загружено/Обновлено колледжей: ${count}`);
        return { success: true, message: getLogs() };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
};

/**
 * ШАГ 2: СИНХРОНИЗАЦИЯ СПЕЦИАЛЬНОСТЕЙ
 * ВНИМАНИЕ: image_url ИСКЛЮЧЕН ИЗ ОБНОВЛЕНИЯ, ЧТОБЫ НЕ ЗАТИРАТЬ РУЧНЫЕ ПРАВКИ В БД.
 */
export const runSpecialtySync = async () => {
    if (!supabase) return { success: false, message: 'Supabase not connected' };
    const { log, getLogs } = createLogger();
    log('📖 СИНХРОНИЗАЦИЯ СПРАВОЧНИКА СПЕЦИАЛЬНОСТЕЙ (БЕЗ КАРТИНОК)...');

    try {
        let count = 0;
        for (const spec of mockSpecialties) {
            // Удаляем image_url из объекта перед upsert
            const { error } = await supabase.from('specialties').upsert({
                id: spec.id,
                title: spec.title,
                type: spec.type,
                description: spec.description,
                full_description: spec.fullDescription,
                passing_score: spec.passingScore,
                duration: spec.duration,
                // image_url: spec.imageUrl, // <--- СТРОГО ЗАПРЕЩЕНО К ПЕРЕЗАПИСИ
                details: spec.details
            }, { onConflict: 'id' });

            if (!error) count++;
            else log(`❌ Ошибка специальности [${spec.id}]: ${error.message}`);
        }
        log(`✨ Готово! Обновлено текстовых данных: ${count}`);
        return { success: true, message: getLogs() };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
};

/**
 * ШАГ 3: ИМПОРТ БАЛЛОВ И ОБНОВЛЕНИЙ
 */
export const runSpecialtyScoreImport = async () => {
    if (!supabase) return { success: false, message: 'Supabase not connected' };
    const { log, getLogs } = createLogger();
    log('📊 ЗАПУСК ПОЛНОЙ СИНХРОНИЗАЦИИ БАЛЛОВ И СВЯЗЕЙ...');

    try {
        log(`📥 Загрузка баллов в college_specialty_scores...`);
        let scoreSuccess = 0;
        for (const entry of RAW_SCORES_DATA) {
            const { error } = await supabase.from('college_specialty_scores').upsert({
                college_id: entry.college_id,
                specialty_id: entry.specialty_id,
                avg_score_2025: entry.score
            }, { onConflict: 'college_id,specialty_id' });
            if (!error) scoreSuccess++;
        }
        log(`✅ Баллы загружены: ${scoreSuccess} из ${RAW_SCORES_DATA.length}`);

        log('🔗 Обновление полей specialty_ids и passing_score в карточках колледжей...');
        
        const collegeMap = RAW_SCORES_DATA.reduce((acc, curr) => {
            if (!acc[curr.college_id]) acc[curr.college_id] = { ids: [], scores: [] };
            acc[curr.college_id].ids.push(curr.specialty_id);
            acc[curr.college_id].scores.push(curr.score);
            return acc;
        }, {} as Record<string, { ids: string[], scores: number[] }>);

        let collegesUpdated = 0;
        for (const [cId, data] of Object.entries(collegeMap)) {
            const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
            const roundedAvg = Math.round(avg * 100) / 100;

            const { error } = await supabase.from('colleges')
                .update({ 
                    specialty_ids: data.ids,
                    passing_score: roundedAvg
                })
                .eq('id', cId);
            
            if (!error) {
                collegesUpdated++;
            } else {
                log(`❌ Ошибка обновления колледжа ${cId}: ${error.message}`);
            }
        }
        log(`✨ Карточки колледжей обновлены: ${collegesUpdated}.`);

        const now = Date.now();
        await supabase.from('data_versions').upsert({ table_name: 'colleges', version: now });
        await supabase.from('data_versions').upsert({ table_name: 'specialties', version: now });
        
        return { success: true, message: getLogs() };
    } catch (e: any) {
        log(`🧨 КРИТИЧЕСКАЯ ОШИБКА: ${e.message}`);
        return { success: false, message: getLogs() };
    }
};

export const seedAllQuizzes = async () => { return { success: true, message: "OK" }; };
export const seedStandaloneTopProfessions = async () => { return { success: true, message: "OK" }; };
export const restoreQuizzesFromMock = async () => seedAllQuizzes();
