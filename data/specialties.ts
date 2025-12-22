
import type { Specialty, WeightedTag } from '../types';
import { specialtyImages } from './assets';

const SEMANTIC_RULES: { keywords: string[], imageUrl: string }[] = [
    { keywords: ['информационное моделирование', 'bim'], imageUrl: 'https://yrlxygbsmfndcfntdmon.supabase.co/storage/v1/object/public/images/BIM.jpg' },
    { keywords: ['кибер', 'безопасность', 'защита информации'], imageUrl: 'https://yrlxygbsmfndcfntdmon.supabase.co/storage/v1/object/public/images/Itsecurity.jpg' },
    { keywords: ['программист', 'программирование', 'разработчик', 'кодирование'], imageUrl: 'https://yrlxygbsmfndcfntdmon.supabase.co/storage/v1/object/public/images/Koder).jpg' },
    { keywords: ['веб', 'дизайн', 'графический'], imageUrl: 'https://yrlxygbsmfndcfntdmon.supabase.co/storage/v1/object/public/images/CGI.jpg' },
    { keywords: ['строительство', 'эксплуатация зданий'], imageUrl: 'https://yrlxygbsmfndcfntdmon.supabase.co/storage/v1/object/public/images/Stroitel.jpg' },
    { keywords: ['архитектор', 'архитектура'], imageUrl: 'https://yrlxygbsmfndcfntdmon.supabase.co/storage/v1/object/public/images/Architector.jpg' },
    { keywords: ['сестринское', 'медсестра'], imageUrl: 'https://yrlxygbsmfndcfntdmon.supabase.co/storage/v1/object/public/images/Medsestra.jpg' },
    { keywords: ['лечебное', 'фельдшер'], imageUrl: 'https://res.cloudinary.com/dxmoaebbj/image/upload/v1763462712/лечебное_дело_kxz84j.jpg' },
    { keywords: ['ремонт', 'автомобил', 'автомеханик'], imageUrl: 'https://yrlxygbsmfndcfntdmon.supabase.co/storage/v1/object/public/images/AvtoStroit.jpg' },
    { keywords: ['сварщик', 'сварочное'], imageUrl: 'https://yrlxygbsmfndcfntdmon.supabase.co/storage/v1/object/public/images/Swarka.jpg' },
    { keywords: ['преподавание', 'начальных', 'классах'], imageUrl: 'https://yrlxygbsmfndcfntdmon.supabase.co/storage/v1/object/public/images/NachKlass.jpg' },
    { keywords: ['ветеринария', 'животные'], imageUrl: 'https://yrlxygbsmfndcfntdmon.supabase.co/storage/v1/object/public/images/veterenar.jpg' },
    { keywords: ['агрономия', 'садово', 'ландшафт'], imageUrl: 'https://yrlxygbsmfndcfntdmon.supabase.co/storage/v1/object/public/images/Sadowod.jpg' },
];

export const generateSemanticTags = (title: string): string[] => {
    const lowerTitle = title.toLowerCase();
    const tags = new Set<string>();
    if (lowerTitle.includes('свар')) tags.add('сварка');
    if (lowerTitle.includes('программ')) tags.add('it');
    if (lowerTitle.includes('строит')) tags.add('строительство');
    if (lowerTitle.includes('авто')) tags.add('транспорт');
    if (lowerTitle.includes('мед')) tags.add('медицина');
    return Array.from(tags);
};

export const generateSpecs = (title: string, id?: string): WeightedTag[] => {
    if (id?.startsWith('09.')) return [{ tagId: 'dom-it', weight: 100 }, { tagId: 'attr-logic', weight: 80 }];
    if (id?.startsWith('15.')) return [{ tagId: 'dom-tech', weight: 100 }, { tagId: 'attr-tools', weight: 80 }];
    if (id?.startsWith('31.') || id?.startsWith('34.')) return [{ tagId: 'dom-med', weight: 100 }, { tagId: 'attr-empathy', weight: 90 }];
    if (id?.startsWith('35.')) return [{ tagId: 'dom-agro', weight: 100 }, { tagId: 'attr-mobility', weight: 70 }];
    if (id?.startsWith('44.')) return [{ tagId: 'dom-soc', weight: 100 }, { tagId: 'attr-teach', weight: 90 }];
    if (id?.startsWith('53.') || id?.startsWith('54.')) return [{ tagId: 'dom-art', weight: 100 }, { tagId: 'attr-visual', weight: 80 }];
    return [{ tagId: 'dom-tech', weight: 50 }];
};

const getSemanticImage = (title: string) => {
    const lowerTitle = title.toLowerCase();
    for (const rule of SEMANTIC_RULES) {
        if (rule.keywords.some(keyword => lowerTitle.includes(keyword))) return rule.imageUrl;
    }
    return specialtyImages['09.02.07'] || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800';
};

const placeholderDetails = {
    dayInLife: 'Специалист выполняет задачи согласно профессиональному стандарту...',
    pros: ['Востребованность на рынке труда', 'Возможность карьерного роста'],
    cons: ['Высокая ответственность'],
    salary: { novice: { from: 30000, to: 45000 }, experienced: { from: 50000, to: 120000 } },
    skills: ['Профессиональные компетенции', 'Командная работа'],
    careerTrack: [{ step: 1, title: 'Выпускник' }, { step: 2, title: 'Специалист' }],
};

const ALL_IDENTIFIED_CODES = [
    { id: '15.01.05', title: 'Сварщик' },
    { id: '23.01.17', title: 'Мастер по ремонту автомобилей' },
    { id: '35.01.27', title: 'Мастер с/х производства' },
    { id: '35.02.16', title: 'Эксплуатация с/х техники' },
    { id: '19.02.11', title: 'Технология продуктов из растительного сырья' },
    { id: '51.02.01', title: 'Народное художественное творчество' },
    { id: '51.02.02', title: 'Социально-культурная деятельность' },
    { id: '51.02.03', title: 'Библиотековедение' },
    { id: '53.02.02', title: 'Музыкальное искусство эстрады' },
    { id: '53.02.03', title: 'Инструментальное исполнительство' },
    { id: '53.02.04', title: 'Вокальное искусство' },
    { id: '53.02.05', title: 'Сольное и народное пение' },
    { id: '53.02.06', title: 'Хоровое дирижирование' },
    { id: '53.02.07', title: 'Теория музыки' },
    { id: '53.02.08', title: 'Музыкальное звукооператорское мастерство' },
    { id: '54.02.05', title: 'Живопись' },
    { id: '09.02.01', title: 'Компьютерные системы и комплексы' },
    { id: '09.02.07', title: 'Информационные системы и программирование' },
    { id: '13.02.07', title: 'Электроснабжение' },
    { id: '13.02.13', title: 'Эксплуатация электрооборудования' },
    { id: '15.02.03', title: 'Многоканальные ТС' },
    { id: '15.02.16', title: 'Технология машиностроения' },
    { id: '15.02.17', title: 'Монтаж и ремонт пром. оборудования' },
    { id: '18.02.10', title: 'Коксохимическое производство' },
    { id: '18.02.12', title: 'Технология аналитического контроля' },
    { id: '22.02.08', title: 'Металлургия черных металлов' },
    { id: '27.02.04', title: 'Автоматизация техпроцессов' },
    { id: '38.02.03', title: 'Операционная деятельность в логистике' },
    { id: '08.02.01', title: 'Строительство зданий и сооружений' },
    { id: '13.01.10', title: 'Электромонтер' },
    { id: '15.01.38', title: 'Оператор станков с ЧПУ' },
    { id: '23.01.09', title: 'Машинист локомотива' },
    { id: '43.02.15', title: 'Поварское и кондитерское дело' },
    { id: '31.02.01', title: 'Лечебное дело' },
    { id: '34.02.01', title: 'Сестринское дело' },
    { id: '31.02.02', title: 'Акушерское дело' },
    { id: '31.02.03', title: 'Лабораторная диагностика' },
    { id: '44.02.02', title: 'Преподавание в начальных классах' },
    { id: '44.02.03', title: 'Педагогика доп. образования' },
    { id: '44.02.06', title: 'Профессиональное обучение' },
    { id: '49.02.01', title: 'Физическая культура' },
    { id: '20.02.02', title: 'Защита в чрезвычайных ситуациях' },
    { id: '08.01.27', title: 'Мастер общестроительных работ' },
    { id: '11.02.17', title: 'Разработка электронных устройств' },
    { id: '19.02.12', title: 'Технология продуктов животного происхождения' },
    { id: '29.02.10', title: 'Конструирование изделий легкой пром.' },
    { id: '42.02.01', title: 'Реклама' },
    { id: '43.02.16', title: 'Туризм и гостеприимство' },
    { id: '43.02.17', title: 'Технологии индустрии красоты' },
    { id: '29.01.04', title: 'Художник по костюму' },
    { id: '43.01.09', title: 'Повар, кондитер' },
    { id: '43.01.06', title: 'Изготовитель пищевых полуфабрикатов' },
    { id: '35.01.11', title: 'Мастер по лесному хозяйству' },
    { id: '23.02.06', title: 'Техническая эксплуатация подвижного состава' },
    { id: '08.02.15', title: 'Информационное моделирование' },
    { id: '21.02.19', title: 'Землеустройство' },
    { id: '21.02.15', title: 'Открытые горные работы' },
    { id: '07.02.01', title: 'Архитектура' },
    { id: '35.02.15', title: 'Кинология' },
    { id: '15.02.19', title: 'Сварочное производство' },
    { id: '36.02.01', title: 'Ветеринария' },
    { id: '36.02.05', title: 'Кинология (спец)' },
    { id: '35.02.20', title: 'Пчеловодство' },
    { id: '23.02.02', title: 'Автомобиле- и тракторостроение' },
    { id: '15.02.09', title: 'Аддитивные технологии' },
    { id: '10.02.04', title: 'ИБ телекоммуникаций' },
    { id: '10.02.05', title: 'ИБ автоматизированных систем' },
    { id: '08.02.08', title: 'Монтаж газового оборудования' },
    { id: '09.02.08', title: 'Интеллектуальные системы' },
    { id: '23.02.07', title: 'Техническое обслуживание двигателей' },
    { id: '35.02.05', title: 'Агрономия' },
    { id: '15.02.06', title: 'Монтаж холодильных машин' },
    { id: '35.02.08', title: 'Электротехнические системы в АПК' },
    { id: '35.02.12', title: 'Садово-парковое строительство' },
    { id: '35.01.26', title: 'Мастер растениеводства' },
    { id: '09.02.06', title: 'Сетевое и системное администрирование' },
    { id: '40.02.02', title: 'Правоохранительная деятельность' },
    { id: '23.02.01', title: 'Организация перевозок' },
    { id: '08.02.12', title: 'Строительство дорог' },
    { id: '23.01.07', title: 'Машинист крана' },
    { id: '23.01.01', title: 'Машинист дорожных машин' },
    { id: '23.01.06', title: 'Машинист дорожных машин (проф)' },
    { id: '23.01.08', title: 'Слесарь по ремонту машин' },
    { id: '44.02.01', title: 'Дошкольное образование' },
    { id: '44.02.04', title: 'Специальное дошкольное образование' },
    { id: '44.02.05', title: 'Коррекционная педагогика' },
    { id: '22.01.11', title: 'Повар на судоремонте' },
    { id: '15.02.10', title: 'Мехатроника и робототехника' },
    { id: '54.02.01', title: 'Дизайн' },
    { id: '54.02.04', title: 'Реставрация' },
    { id: '35.01.28', title: 'Мастер столярных работ' },
    { id: '09.01.03', title: 'Мастер по обработке информации' },
    { id: '09.01.04', title: 'Наладчик аппаратного обеспечения' },
    { id: '08.01.28', title: 'Мастер отделочных работ' }
];

export const mockSpecialties: Specialty[] = ALL_IDENTIFIED_CODES.map(s => ({
    id: s.id,
    title: s.title,
    type: s.id.split('.')[1].startsWith('0') ? 'профессия' : 'специальность',
    description: `Подготовка квалифицированных кадров по направлению ${s.title}.`,
    passingScore: 3.8,
    duration: s.id.split('.')[1].startsWith('0') ? '2 г. 10 мес.' : '3 г. 10 мес.',
    details: placeholderDetails,
    imageUrl: getSemanticImage(s.title),
    tags: generateSemanticTags(s.title),
    specs: generateSpecs(s.title, s.id)
}));
