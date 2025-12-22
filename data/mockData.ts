
import type { Subject, Profession, NewsItem, ShortVideo, CalendarEvent, DBQuiz, DBQuestion, DBAnswer, Tag, SubjectRelation } from '../types';
import { mockSpecialties } from './specialties';
import { mockColleges } from './colleges';
import { mockEvents } from './events';
import { specialtyImages } from './assets';

export { mockSpecialties, mockColleges, mockEvents };

export const mockNews: NewsItem[] = [
    {
        id: 'n1',
        title: 'Новый учебный год 2025: к чему готовиться?',
        date: '2025-01-15',
        summary: 'Основные изменения в правилах приема в колледжи Липецкой области.',
        content: '<p>В 2025 году абитуриентов ждут новые правила подачи документов. Вводится приоритетное зачисление для победителей региональных олимпиад и расширяются квоты на целевое обучение от ведущих предприятий региона.</p>',
        imageUrl: 'https://images.unsplash.com/photo-1523240715630-3889025e1141?auto=format&fit=crop&w=800&q=80',
        tags: ['Поступление', '2025'],
        gallery: []
    }
];

export const mockShorts: ShortVideo[] = [
    {
        id: 'v1',
        title: 'День в ЛМК',
        description: 'Как проходят будни студентов металлургического колледжа.',
        author: 'СтудСовет',
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
        videoUrl: 'https://yrlxygbsmfndcfntdmon.supabase.co/storage/v1/object/public/videos/student_life.mp4',
        likes: 124,
        views: '1.2k',
        collegeId: 'lmk',
        specialtyId: '09.02.07'
    }
];

export const mockTop50Professions: Profession[] = [
  {
    "id": 1,
    "name": "Сварщик (ручной и частично механизированной сварки)",
    "sphere": "Промышленность",
    "salaryFrom": 60000,
    "salaryTo": 150000,
    "collegeIds": ["lmk", "gtk", "ekpt", "chat"],
    "description": "Критически важная профессия для металлургии и машиностроения. Высокий спрос на НЛМК и предприятиях ОЭЗ.",
    "trend": "hot",
    "relatedSpecialtyIds": ["15.01.05", "15.02.19"],
    "employers": [
      { "name": "НЛМК", "description": "Крупнейший сталелитейный комбинат мира." },
      { "name": "Липецкстальконструкция", "description": "Изготовление сложных металлоконструкций." }
    ]
  },
  {
    "id": 2,
    "name": "Разработчик (Программист)",
    "sphere": "IT",
    "salaryFrom": 60000,
    "salaryTo": 200000,
    "collegeIds": ["kiivms", "ltptut", "lmk"],
    "description": "Разработка ПО, поддержка корпоративных систем и внедрение ИИ. Кадры востребованы во всех отраслях цифровизации.",
    "trend": "growing",
    "relatedSpecialtyIds": ["09.02.07", "09.02.06", "09.02.08"],
    "employers": [
      { "name": "Сбер", "description": "Крупный IT-хаб в Липецке." },
      { "name": "Ростелеком-ИТ", "description": "Разработка государственных и финтех-сервисов." }
    ]
  },
  {
    "id": 3,
    "name": "Специалист по эксплуатации и ремонту с/х техники",
    "sphere": "Сельское хозяйство",
    "salaryFrom": 50000,
    "salaryTo": 120000,
    "collegeIds": ["kkat", "chat", "dat", "zpt", "uptk"],
    "description": "Работа с современными комбайнами и тракторами, оснащенными GPS-навигацией и автопилотами.",
    "trend": "hot",
    "relatedSpecialtyIds": ["35.02.16", "35.01.27"],
    "employers": [
      { "name": "ГК Трио", "description": "Один из лидеров агросектора региона." },
      { "name": "АГРОИНВЕСТ", "description": "Современный парк сельхозтехники." }
    ]
  },
  {
    "id": 4,
    "name": "Медсестра / Медбрат",
    "sphere": "Медицина",
    "salaryFrom": 35000,
    "salaryTo": 65000,
    "collegeIds": ["lmk_med", "emk_lukicha", "lmk_med_usman"],
    "description": "Фундаментальное звено системы здравоохранения. Гарантированное трудоустройство в госучреждения и частные клиники.",
    "trend": "stable",
    "relatedSpecialtyIds": ["34.02.01", "31.02.01"],
    "employers": [
      { "name": "Липецкая областная больница №1", "description": "Главное мед. учреждение региона." },
      { "name": "Клиника Эксперт", "description": "Современная сеть медицинских центров." }
    ]
  },
  {
    "id": 5,
    "name": "Специалист по аддитивным технологиям (3D-печать)",
    "sphere": "Высокие технологии",
    "salaryFrom": 45000,
    "salaryTo": 95000,
    "collegeIds": ["kiivms"],
    "description": "Создание прототипов и готовых изделий методом 3D-печати. Будущее мелкосерийного производства.",
    "trend": "growing",
    "relatedSpecialtyIds": ["15.02.09"],
    "employers": [
      { "name": "Технопарк-Липецк", "description": "Инновационные стартапы и производство." },
      { "name": "ОЭЗ Липецк", "description": "Заводы международных резидентов." }
    ]
  },
  {
    "id": 6,
    "name": "Мастер общестроительных работ",
    "sphere": "Строительство",
    "salaryFrom": 55000,
    "salaryTo": 110000,
    "collegeIds": ["lksait", "lisk", "gtk", "uptk"],
    "description": "Универсальный специалист, востребованный на возведении жилых комплексов и промышленных объектов.",
    "trend": "growing",
    "relatedSpecialtyIds": ["08.01.27", "08.02.01"],
    "employers": [
      { "name": "Трест Липецкстрой", "description": "Крупнейший застройщик региона." },
      { "name": "Спецфундаментстрой", "description": "Промышленное строительство." }
    ]
  },
  {
    "id": 7,
    "name": "Электромонтер (Электрик)",
    "sphere": "Энергетика",
    "salaryFrom": 45000,
    "salaryTo": 90000,
    "collegeIds": ["lmk", "gtk", "zpt", "dat", "lisk"],
    "description": "Обеспечение бесперебойной работы электросетей и оборудования. Базовая профессия для любого предприятия.",
    "trend": "stable",
    "relatedSpecialtyIds": ["13.01.10", "13.02.13"],
    "employers": [
      { "name": "Россети Центр", "description": "Электросети всей области." },
      { "name": "НЛМК-Энерго", "description": "Энергетический комплекс комбината." }
    ]
  },
  {
    "id": 8,
    "name": "Логист / Специалист по перевозкам",
    "sphere": "Транспорт",
    "salaryFrom": 40000,
    "salaryTo": 85000,
    "collegeIds": ["lktg", "zpt", "lmk", "lkptiu"],
    "description": "Управление цепочками поставок. Липецк — крупный транспортный узел, что делает логистику ключевой сферой.",
    "trend": "growing",
    "relatedSpecialtyIds": ["23.02.01", "38.02.03"],
    "employers": [
      { "name": "DPD Липецк", "description": "Международный логистический хаб." },
      { "name": "X5 Transport", "description": "Логистика сетей Пятерочка и Перекресток." }
    ]
  },
  {
    "id": 9,
    "name": "Повар-кондитер",
    "sphere": "Сервис и Питание",
    "salaryFrom": 35000,
    "salaryTo": 80000,
    "collegeIds": ["lkis", "chat", "ekit"],
    "description": "Работа в ресторанном бизнесе и на пищевых производствах (хлебозаводы, кондитерские фабрики).",
    "trend": "stable",
    "relatedSpecialtyIds": ["43.01.09", "43.02.15"],
    "employers": [
      { "name": "Лимак", "description": "Крупнейший хлебокомбинат." },
      { "name": "Ресторан Антонио", "description": "Лидер в сфере HoReCa." }
    ]
  },
  {
    "id": 10,
    "name": "Оператор станков с ЧПУ",
    "sphere": "Промышленность",
    "salaryFrom": 55000,
    "salaryTo": 130000,
    "collegeIds": ["kiivms", "lpt", "ekpt"],
    "description": "Работа на высокотехнологичном оборудовании. Сочетание инженерных знаний и навыков программирования.",
    "trend": "hot",
    "relatedSpecialtyIds": ["15.01.38", "15.02.16"],
    "employers": [
      { "name": "Yokohama R.P.Z.", "description": "Производство шин мирового уровня." },
      { "name": "ООО Прогресс", "description": "Автоматизированные линии ФрутоНяня." }
    ]
  },
  {
    "id": 11,
    "name": "Ветеринарный фельдшер",
    "sphere": "Сельское хозяйство",
    "salaryFrom": 35000,
    "salaryTo": 75000,
    "collegeIds": ["kkat", "chat"],
    "description": "Забота о здоровье животных на крупных агрокомплексах и в ветеринарных клиниках.",
    "trend": "stable",
    "relatedSpecialtyIds": ["36.02.01"],
    "employers": [
      { "name": "Агро-Липецк", "description": "Крупный агрохолдинг." },
      { "name": "Областная ветстанция", "description": "Государственная ветеринарная служба." }
    ]
  },
  {
    "id": 12,
    "name": "Специалист по информационной безопасности",
    "sphere": "IT",
    "salaryFrom": 55000,
    "salaryTo": 150000,
    "collegeIds": ["kiivms"],
    "description": "Защита данных от киберугроз. Одна из самых быстрорастущих и высокооплачиваемых специальностей.",
    "trend": "growing",
    "relatedSpecialtyIds": ["10.02.05", "10.02.04"],
    "employers": [
      { "name": "ИТ-кластер Липецкой области", "description": "Специализированные IT-центры." },
      { "name": "МФЦ", "description": "Защита персональных данных граждан." }
    ]
  },
  {
    "id": 13,
    "name": "Автомеханик (Мастер по ремонту авто)",
    "sphere": "Транспорт",
    "salaryFrom": 45000,
    "salaryTo": 120000,
    "collegeIds": ["lktg", "ekpt", "zpt", "chat", "dat"],
    "description": "Диагностика и ремонт легковых и грузовых автомобилей. Огромный рынок частных и корпоративных сервисов.",
    "trend": "stable",
    "relatedSpecialtyIds": ["23.01.17", "23.02.07"],
    "employers": [
      { "name": "L-Авто", "description": "Крупная сеть автоцентров." },
      { "name": "Моторинвест", "description": "Производитель электромобилей Evolute." }
    ]
  },
  {
    "id": 14,
    "name": "Учитель начальных классов",
    "sphere": "Образование",
    "salaryFrom": 30000,
    "salaryTo": 55000,
    "collegeIds": ["leb_pk", "umk"],
    "description": "Важнейшая социальная миссия. Постоянный спрос в связи со строительством новых школ в регионе.",
    "trend": "stable",
    "relatedSpecialtyIds": ["44.02.02"],
    "employers": [
      { "name": "Школы города Липецка", "description": "Муниципальные образовательные учреждения." },
      { "name": "Центр IT-Куб", "description": "Дополнительное образование." }
    ]
  },
  {
    "id": 15,
    "name": "Графический дизайнер",
    "sphere": "Искусство и Медиа",
    "salaryFrom": 35000,
    "salaryTo": 90000,
    "collegeIds": ["lkis", "egki_hrennikova"],
    "description": "Создание визуального контента, брендинг и работа в рекламных агентствах.",
    "trend": "growing",
    "relatedSpecialtyIds": ["54.02.01"],
    "employers": [
      { "name": "Рекламные агентства Липецка", "description": "Дизайн рекламы и полиграфии." },
      { "name": "Отделы маркетинга НЛМК/Прогресс", "description": "Корпоративный дизайн." }
    ]
  },
  {
    "id": 16,
    "name": "Технолог пищевого производства",
    "sphere": "Пищевая промышленность",
    "salaryFrom": 40000,
    "salaryTo": 85000,
    "collegeIds": ["zpt", "dat", "lkis"],
    "description": "Контроль качества и разработка рецептур на заводах по переработке мяса, молока и зерна.",
    "trend": "stable",
    "relatedSpecialtyIds": ["19.02.11", "19.02.12"],
    "employers": [
      { "name": "Лебедяньмолоко", "description": "Крупный молочный завод." },
      { "name": "Черкизово", "description": "Лидер мясной промышленности." }
    ]
  },
  {
    "id": 17,
    "name": "Помощник машиниста (РЖД)",
    "sphere": "Транспорт",
    "salaryFrom": 50000,
    "salaryTo": 100000,
    "collegeIds": ["ekit", "gtk", "lpt"],
    "description": "Работа на железнодорожных магистралях и внутризаводских путях крупных предприятий.",
    "trend": "stable",
    "relatedSpecialtyIds": ["23.01.09", "23.02.06"],
    "employers": [
      { "name": "РЖД", "description": "Российские железные дороги." },
      { "name": "УТ НЛМК", "description": "Управление транспорта комбината." }
    ]
  },
  {
    "id": 18,
    "name": "Специалист по туризму и гостеприимству",
    "sphere": "Сервис",
    "salaryFrom": 30000,
    "salaryTo": 70000,
    "collegeIds": ["lkis", "lkptiu", "ekpt"],
    "description": "Организация отдыха и управление отелями. Сфера активно развивается в рамках проекта «Липецкая Земля».",
    "trend": "growing",
    "relatedSpecialtyIds": ["43.02.16"],
    "employers": [
      { "name": "Отель Меркюр Липецк", "description": "Международный гостиничный сервис." },
      { "name": "Кудыкина Гора", "description": "Крупнейший парк отдыха в регионе." }
    ]
  },
  {
    "id": 19,
    "name": "Агроном",
    "sphere": "Сельское хозяйство",
    "salaryFrom": 45000,
    "salaryTo": 110000,
    "collegeIds": ["kkat", "chat", "uptk"],
    "description": "Управление урожайностью, подбор удобрений и защита растений. Интеллектуальное ядро агробизнеса.",
    "trend": "growing",
    "relatedSpecialtyIds": ["35.02.05"],
    "employers": [
      { "name": "Отрада-Ген", "description": "Высокотехнологичный агрохолдинг." },
      { "name": "ЛипецкАгро", "description": "Тепличные комплексы пятого поколения." }
    ]
  },
  {
    "id": 20,
    "name": "Бухгалтер / Экономист",
    "sphere": "Бизнес",
    "salaryFrom": 35000,
    "salaryTo": 80000,
    "collegeIds": ["lkptiu", "ekpt", "lmk"],
    "description": "Финансовый учет и планирование. Профессия требует точности и знания актуального законодательства.",
    "trend": "stable",
    "relatedSpecialtyIds": ["38.02.01"],
    "employers": [
      { "name": "Областной казначейский центр", "description": "Государственный финансовый сектор." },
      { "name": "НЛМК-Учет", "description": "Единый сервисный центр учета." }
    ]
  },
  {
    "id": 21,
    "name": "Полицейский / Юрист",
    "sphere": "Право",
    "salaryFrom": 45000,
    "salaryTo": 80000,
    "collegeIds": ["ltptut"],
    "description": "Обеспечение правопорядка и юридическое сопровождение. Карьера в МВД или юстиции.",
    "trend": "stable",
    "relatedSpecialtyIds": ["40.02.02"],
    "employers": [
      { "name": "УМВД по Липецкой области", "description": "Органы внутренних дел." },
      { "name": "Арбитражный суд", "description": "Судебная система региона." }
    ]
  },
  {
    "id": 22,
    "name": "Спасатель / Пожарный (МЧС)",
    "sphere": "Безопасность",
    "salaryFrom": 40000,
    "salaryTo": 75000,
    "collegeIds": ["umk"],
    "description": "Героическая работа по ликвидации ЧС. Требует отличной физической подготовки и стрессоустойчивости.",
    "trend": "stable",
    "relatedSpecialtyIds": ["20.02.02"],
    "employers": [
      { "name": "ГУ МЧС Липецк", "description": "Пожарно-спасательные части." },
      { "name": "Управление ГПСС", "description": "Региональная служба спасения." }
    ]
  },
  {
    "id": 23,
    "name": "Парикмахер-стилист",
    "sphere": "Красота",
    "salaryFrom": 35000,
    "salaryTo": 100000,
    "collegeIds": ["lkis"],
    "description": "Создание образов и уход. Возможность работать как в салоне, так и на себя.",
    "trend": "stable",
    "relatedSpecialtyIds": ["43.02.17"],
    "employers": [
      { "name": "Салоны красоты бизнес-класса", "description": "Топ-студии города." },
      { "name": "Школа стиля", "description": "Обучение и мастер-классы." }
    ]
  },
  {
    "id": 24,
    "name": "Металлург (Технолог)",
    "sphere": "Промышленность",
    "salaryFrom": 55000,
    "salaryTo": 140000,
    "collegeIds": ["lmk", "lpt"],
    "description": "Управление процессами выплавки стали. Ключевые специалисты для экономики Липецка.",
    "trend": "hot",
    "relatedSpecialtyIds": ["22.02.08"],
    "employers": [
      { "name": "НЛМК", "description": "Мировой лидер металлургии." },
      { "name": "Бекарт Липецк", "description": "Завод по производству стального корда." }
    ]
  },
  {
    "id": 25,
    "name": "Землеустроитель / Кадастровый инженер",
    "sphere": "Строительство и Право",
    "salaryFrom": 40000,
    "salaryTo": 95000,
    "collegeIds": ["lksait", "uptk", "ltptut"],
    "description": "Межевание земель и оформление недвижимости. Высокий спрос в частном секторе и госслужбах.",
    "trend": "growing",
    "relatedSpecialtyIds": ["21.02.19"],
    "employers": [
      { "name": "Кадастр 48", "description": "Геодезические и кадастровые работы." },
      { "name": "Росреестр Липецк", "description": "Государственная регистрация земель." }
    ]
  },
  {
    "id": 26,
    "name": "Кинолог",
    "sphere": "Безопасность / Природа",
    "salaryFrom": 30000,
    "salaryTo": 65000,
    "collegeIds": ["kkat"],
    "description": "Подготовка и работа со служебными собаками в силовых структурах и поисковых службах.",
    "trend": "stable",
    "relatedSpecialtyIds": ["36.02.05"],
    "employers": [
      { "name": "Кинологическая служба МВД", "description": "Служебное собаководство." },
      { "name": "Поисково-спасательный отряд", "description": "Поиск пропавших людей." }
    ]
  },
  {
    "id": 27,
    "name": "Звукорежиссер / Звукооператор",
    "sphere": "Культура",
    "salaryFrom": 30000,
    "salaryTo": 80000,
    "collegeIds": ["loki_igumnova"],
    "description": "Техническое обеспечение концертов, праздников и работа на студиях звукозаписи.",
    "trend": "growing",
    "relatedSpecialtyIds": ["53.02.08"],
    "employers": [
      { "name": "Областной центр культуры", "description": "Главная концертная площадка." },
      { "name": "Липецк FM", "description": "Радио и звукозапись." }
    ]
  },
  {
    "id": 28,
    "name": "Ландшафтный дизайнер",
    "sphere": "Строительство / Искусство",
    "salaryFrom": 35000,
    "salaryTo": 90000,
    "collegeIds": ["lksait", "uptk"],
    "description": "Проектирование парков, скверов и частных садов. Городское благоустройство — важный тренд.",
    "trend": "growing",
    "relatedSpecialtyIds": ["35.02.12"],
    "employers": [
      { "name": "Зеленхоз Липецк", "description": "Озеленение и благоустройство города." },
      { "name": "Дизайн-студии ландшафта", "description": "Частные проекты садов." }
    ]
  },
  {
    "id": 29,
    "name": "Фельдшер",
    "sphere": "Медицина",
    "salaryFrom": 45000,
    "salaryTo": 75000,
    "collegeIds": ["lmk_med", "emk_lukicha", "lmk_med_usman"],
    "description": "Самостоятельный прием пациентов и работа на скорой помощи. Ответственная и важная роль.",
    "trend": "hot",
    "relatedSpecialtyIds": ["31.02.01"],
    "employers": [
      { "name": "Станция скорой помощи Липецк", "description": "Экстренная медицинская помощь." },
      { "name": "ФАПы районов области", "description": "Работа в сельской местности." }
    ]
  },
  {
    "id": 30,
    "name": "Машинист дорожных машин",
    "sphere": "Строительство / Дороги",
    "salaryFrom": 55000,
    "salaryTo": 120000,
    "collegeIds": ["lktg"],
    "description": "Управление экскаваторами и асфальтоукладчиками. Высокая зарплата на строительстве федеральных трасс.",
    "trend": "hot",
    "relatedSpecialtyIds": ["23.01.06"],
    "employers": [
      { "name": "Липецкдоравтоцентр", "description": "Ремонт и строительство дорог области." },
      { "name": "ООО Автобан-Липецк", "description": "Строительство крупных трасс." }
    ]
  }
];

export const globalTags: Tag[] = [
    { id: 'dom-tech', name: 'Техника и Производство', category: 'domain' },
    { id: 'dom-it', name: 'IT и Цифра', category: 'domain' },
    { id: 'dom-const', name: 'Строительство и Среда', category: 'domain' },
    { id: 'dom-med', name: 'Медицина и Здоровье', category: 'domain' },
    { id: 'dom-art', name: 'Искусство и Культура', category: 'domain' },
    { id: 'dom-soc', name: 'Педагогика и Общество', category: 'domain' },
    { id: 'dom-serv', name: 'Сервис и Туризм', category: 'domain' },
    { id: 'dom-agro', name: 'Природа и Агро', category: 'domain' },
    { id: 'attr-logic', name: 'Логика и Анализ', category: 'attribute' },
    { id: 'attr-sys', name: 'Системность', category: 'attribute' },
    { id: 'attr-focus', name: 'Концентрация', category: 'attribute' },
    { id: 'attr-hands-fine', name: 'Тонкая моторика', category: 'attribute' },
    { id: 'attr-hands-hard', name: 'Физический труд', category: 'attribute' },
    { id: 'attr-tools', name: 'Работа инструментом', category: 'attribute' },
    { id: 'attr-voice', name: 'Голос и Речь', category: 'attribute' },
    { id: 'attr-visual', name: 'Визуальное восприятие', category: 'attribute' },
    { id: 'attr-empathy', name: 'Эмпатия', category: 'attribute' },
    { id: 'attr-comm', name: 'Общительность', category: 'attribute' },
    { id: 'attr-teach', name: 'Наставничество', category: 'attribute' },
    { id: 'attr-risk', name: 'Смелость / Риск', category: 'attribute' },
    { id: 'attr-mobility', name: 'Подвижность', category: 'attribute' },
    { id: 'attr-creativity', name: 'Креативность', category: 'attribute' },
];

export const defaultSubjectRelations: SubjectRelation[] = [
    { subjectId: 'algebra', tags: [{ tagId: 'attr-logic', weight: 100 }, { tagId: 'dom-it', weight: 40 }] },
    { subjectId: 'geometry', tags: [{ tagId: 'attr-logic', weight: 80 }, { tagId: 'attr-visual', weight: 70 }, { tagId: 'dom-const', weight: 60 }] },
    { subjectId: 'physics', tags: [{ tagId: 'dom-tech', weight: 100 }, { tagId: 'attr-sys', weight: 90 }, { tagId: 'attr-tools', weight: 50 }] },
    { subjectId: 'informatics', tags: [{ tagId: 'dom-it', weight: 100 }, { tagId: 'attr-logic', weight: 90 }, { tagId: 'attr-sys', weight: 70 }] },
    { subjectId: 'biology', tags: [{ tagId: 'dom-med', weight: 90 }, { tagId: 'dom-agro', weight: 90 }] },
    { subjectId: 'chemistry', tags: [{ tagId: 'dom-med', weight: 80 }, { tagId: 'dom-agro', weight: 60 }] },
    { subjectId: 'social_studies', tags: [{ tagId: 'dom-soc', weight: 100 }, { tagId: 'attr-comm', weight: 80 }] },
];

export const defaultSubjects: Subject[] = [
  { id: 'russian', name: 'Русский язык', grade: 0, weight: 1, isFavorite: false },
  { id: 'algebra', name: 'Алгебра', grade: 0, weight: 1, isFavorite: false },
  { id: 'geometry', name: 'Геометрия', grade: 0, weight: 1, isFavorite: false },
  { id: 'literature', name: 'Литература', grade: 0, weight: 1, isFavorite: false },
  { id: 'foreign_language', name: 'Иностранный язык', grade: 0, weight: 1, isFavorite: false },
  { id: 'history', name: 'История', grade: 0, weight: 1, isFavorite: false },
  { id: 'social_studies', name: 'Обществознание', grade: 0, weight: 1, isFavorite: false },
  { id: 'geography', name: 'География', grade: 0, weight: 1, isFavorite: false },
  { id: 'biology', name: 'Биология', grade: 0, weight: 1, isFavorite: false },
  { id: 'physics', name: 'Физика', grade: 0, weight: 1, isFavorite: false },
  { id: 'chemistry', name: 'Химия', grade: 0, weight: 1, isFavorite: false },
  { id: 'informatics', name: 'Информатика', grade: 0, weight: 1, isFavorite: false },
  { id: 'pe', name: 'Физкультура', grade: 0, weight: 1, isFavorite: false },
];

export const swipeQuizQuestions: any[] = [
  { id: 1, text: 'Я люблю копаться в настройках гаджетов и программ', category: 'dom-it' },
  { id: 2, text: 'Мне интересно, как устроены заводы и крупные механизмы', category: 'dom-tech' },
  { id: 3, text: 'Я с удовольствием рисую или создаю что-то красивое', category: 'dom-art' },
  { id: 4, text: 'Мне важно помогать людям и заботиться об их здоровье', category: 'dom-med' },
  { id: 5, text: 'Я люблю организовывать мероприятия и праздники', category: 'dom-soc' },
  { id: 6, text: 'Я интересуюсь экологией и миром живой природы', category: 'dom-agro' },
  { id: 7, text: 'Я хотел бы строить дома или проектировать города', category: 'dom-const' },
  { id: 8, text: 'Мне нравится сфера обслуживания и общения с клиентами', category: 'dom-serv' },
  { id: 9, text: 'Я хотел бы создавать мобильные приложения', category: 'dom-it' },
  { id: 10, text: 'Меня привлекает работа на современном производстве', category: 'dom-tech' },
  { id: 11, text: 'Я люблю посещать театры, выставки и музеи', category: 'dom-art' },
  { id: 12, text: 'Мне интересна химия и биология в медицине', category: 'dom-med' },
  { id: 13, text: 'Я легко нахожу общий язык с детьми', category: 'dom-soc' },
  { id: 14, text: 'Я люблю ухаживать за растениями или животными', category: 'dom-agro' },
  { id: 15, text: 'Дизайн интерьеров кажется мне отличным делом', category: 'dom-const' },
  { id: 16, text: 'Я всегда ищу логику и закономерности в событиях', category: 'attr-logic' },
  { id: 17, text: 'Порядок и система для меня важнее хаоса', category: 'attr-sys' },
  { id: 18, text: 'Я могу долго концентрироваться на одной задаче', category: 'attr-focus' },
  { id: 19, text: 'У меня хорошо получается работать руками с мелкими деталями', category: 'attr-hands-fine' },
  { id: 20, text: 'Я не боюсь тяжелой физической работы', category: 'attr-hands-hard' },
  { id: 21, text: 'Я умею пользоваться инструментами (молоток, отвертка и т.д.)', category: 'attr-tools' },
  { id: 22, text: 'У меня выразительный голос и я люблю выступать', category: 'attr-voice' },
  { id: 23, text: 'Я мыслю образами и картинками', category: 'attr-visual' },
  { id: 24, text: 'Я тонко чувствую эмоции других людей', category: 'attr-empathy' },
  { id: 25, text: 'Я люблю много общаться и быть в центре внимания', category: 'attr-comm' },
  { id: 26, text: 'Я готов брать ответственность за группу людей', category: 'attr-teach' },
  { id: 27, text: 'Риск и экстрим меня не пугают, а бодрят', category: 'attr-risk' },
  { id: 28, text: 'Я ненавижу сидеть на одном месте, мне нужно движение', category: 'attr-mobility' },
  { id: 29, text: 'Я часто придумываю нестандартные решения проблем', category: 'attr-creativity' },
  { id: 30, text: 'Анализ данных и таблиц кажется мне увлекательным', category: 'attr-logic' },
];

export const DDO_QUESTIONS = [
    { text: "Что выберешь?", options: [{ text: "Ухаживать за животными", tag: "nature" }, { text: "Обслуживать машины", tag: "tech" }] },
    { text: "Что интереснее?", options: [{ text: "Помогать больным людям", tag: "communication" }, { text: "Составлять таблицы", tag: "sign" }] },
    { text: "Твое занятие?", options: [{ text: "Рисовать афиши", tag: "art" }, { text: "Следить за ростом растений", tag: "nature" }] },
    { text: "Где бы ты работал?", options: [{ text: "В мастерской", tag: "tech" }, { text: "В редакции журнала", tag: "sign" }] }
];

export const CLASSIC_QUIZ_DATA = [
    {
        text: "Какая сфера деятельности привлекает вас больше всего?",
        options: [
            { text: "Техника и производство", tag: "dom-tech" },
            { text: "IT и разработка", tag: "dom-it" },
            { text: "Дизайн и творчество", tag: "dom-art" },
            { text: "Медицина", tag: "dom-med" }
        ]
    }
];

export const battleQuestions: any[] = [
    {
        id: 1,
        optionA: { text: 'Лечить животных', imageUrl: specialtyImages['36.02.01'], category: 'dom-agro' }, 
        optionB: { text: 'Чинить машины', imageUrl: 'https://yrlxygbsmfndcfntdmon.supabase.co/storage/v1/object/public/images/Avto.jpg', category: 'dom-tech' }
    }
];
