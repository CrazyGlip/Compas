
export interface SpecialtyScore {
    specialtyId: string;
    score: number;
}

export interface Employer {
    name: string;
    description: string;
    logo?: string;
}

export interface Profession {
    id: number;
    name: string;
    sphere: string;
    salaryFrom: number;
    salaryTo: number;
    collegeIds: string[];
    description: string;
    trend: 'hot' | 'growing' | 'stable';
    relatedSpecialtyIds?: string[];
    employers?: Employer[];
    tags?: string[];
}

export type View = 
    | { name: 'dashboard' }
    | { name: 'myPlan' }
    | { name: 'specialties' }
    | { name: 'specialtyDetail'; specialtyId: string }
    | { name: 'colleges' }
    | { name: 'collegeDetail'; collegeId: string }
    | { name: 'educationTypeSelection' }
    | { name: 'quiz' }
    | { name: 'quizId'?: string; quizType?: 'classic' | 'swipe' | 'battle' | 'klimov' }
    | { name: 'quizResult'; scores: any; quizType: string; quizTitle?: string; quizId?: string }
    | { name: 'profile' }
    | { name: 'top50' }
    | { name: 'calendar' }
    | { name: 'shorts' }
    | { name: 'news' }
    | { name: 'newsDetail'; newsId: string }
    | { name: 'auth' }
    | { name: 'settings' }
    | { name: 'quizEditor'; quizId?: string }
    | { name: 'subjectEditor' }
    | { name: 'tagEditor' }
    | { name: 'gameCenter' }
    | { name: 'securityGame' }
    | { name: 'architectGame' }
    | { name: 'agroDroneGame' }
    | { name: 'energyGame' }
    | { name: 'bugHunterGame' }
    | { name: 'chefGame' }
    | { name: 'triageGame' }
    | { name: 'logisticsGame' };

export interface ChecklistItem {
    id: string;
    text: string;
    isCompleted: boolean;
    type: 'link' | 'navigation' | 'info';
    payload?: any;
}

export interface PlanItem {
    id: string;
    type: 'specialty' | 'college';
    checklist: ChecklistItem[];
}

export interface AchievementState {
    hasCalculatedScore: boolean;
    planCount: number;
    quizzesPassed: number;
    specialtiesInPlan: number;
    collegesInPlan: number;
    videosWatched: number;
    hasUsedComparison: boolean;
    videosLiked: number;
}

export interface RecommendationWeights {
    quizWeight: number;
    gradeWeight: number;
    subjectLikeWeight: number;
    planLikeWeight: number;
    baseQuizScore: number;
    baseGradeScore: number;
    baseLikeScore: number;
    basePlanScore: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Subject {
    id: string;
    name: string;
    grade: number;
    weight: number;
    isFavorite: boolean;
}

export interface WeightedTag {
    tagId: string;
    weight: number;
}

export interface SubjectRelation {
    subjectId: string;
    tags: WeightedTag[];
}

export interface Tag {
    id: string;
    name: string;
    category: string;
}

export interface UserQuizResult {
    id: string;
    user_id: string;
    quiz_id: string;
    quiz_title: string;
    top_category: string;
    scores: Record<string, number>;
    created_at: string;
}

export interface Specialty {
    id: string;
    title: string;
    type: 'профессия' | 'специальность';
    description: string;
    fullDescription?: string;
    passingScore: number; 
    duration: string;
    imageUrl: string;
    gallery?: string[];
    tags?: string[];
    specs?: WeightedTag[];
    details: {
        dayInLife: string;
        pros: string[];
        cons: string[];
        salary: {
            novice: { from: number; to: number };
            experienced: { from: number; to: number };
        };
        skills: string[];
        careerTrack: { step: number; title: string }[];
    };
    _score?: number;
    _reason?: string;
}

export interface College {
    id: string;
    name: string;
    fullName?: string;
    activityInfo?: string;
    address?: string;
    city: string;
    phone?: string;
    admissionLink?: string;
    epguLink?: string;
    vkUrl?: string;
    maxUrl?: string;
    websiteUrl?: string;
    geoTag?: string;
    imageUrl: string;
    logoUrl: string;
    gallery: string[];
    passingScore: number; 
    educationForms: string[];
    specialtyIds: string[];
    specialtyScores?: SpecialtyScore[]; 
    hasDormitory: boolean;
    isAccessible: boolean;
    accessibilityNotes?: string;
    specs?: WeightedTag[];
}

export interface NewsItem {
    id: string;
    title: string;
    date: string;
    summary: string;
    content: string;
    imageUrl: string;
    tags: string[];
    gallery: string[];
}

export interface ShortVideo {
    id: string;
    title: string;
    description: string;
    author: string;
    imageUrl: string;
    videoUrl: string;
    likes: number;
    views: string;
    collegeId?: string;
    specialtyId?: string;
    collegeName?: string;
    specialtyTitle?: string;
}

export interface CalendarEvent {
    id: string;
    collegeId: string;
    title: string;
    date: string;
    type: string;
    collegeName?: string;
    collegeLogoUrl?: string;
}

export interface DBQuiz {
    id: string;
    title: string;
    description: string;
    type: string;
    image_url: string;
    is_published: boolean;
    questions?: DBQuestion[];
}

export interface DBQuestion {
    id: string;
    quiz_id: string;
    text: string;
    order: number;
    question_type: string;
    image_url?: string;
    payload?: any;
    answers?: DBAnswer[];
}

export interface DBAnswer {
    id: string;
    question_id: string;
    text: string;
    target_category: string;
    score_weight?: number;
    image_url?: string;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    condition: (state: AchievementState) => boolean;
    targetView?: View;
}

export interface GameScore {
    id: string;
    gameId: string;
    score: number;
    playedAt: string;
}

export type QuizScores = Record<string, number>;
export type QuizScoresSwipe = Record<string, number>;
export type QuizScoresBattle = Record<string, number>;
