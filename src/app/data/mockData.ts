// ─── Color palette (light mode) ───────────────────────────────────────────────
export const C = {
  bg: '#F2F4F5',
  card: '#FFFFFF',
  surface: '#EBEEEF',
  surfaceHover: '#E1E5E6',
  fg: '#11201D',
  fgMuted: '#54716B',
  fgSubtle: '#8AA39E',
  border: 'rgba(17,32,29,0.1)',
  borderStrong: 'rgba(17,32,29,0.2)',
  primary: '#0E8478',
  primaryLight: '#E0F3F0',
  primaryMid: '#B3E1D9',
  accent: '#FF6A4D',
  accentLight: '#FFEAE4',
  warn: '#B07800',
  warnLight: '#FFF8E1',
  danger: '#D32F2F',
  dangerLight: '#FFEBEE',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

export type IngredientLocation = '냉장' | '냉동';
export type IngredientCategory =
  | '채소/과일'
  | '육류/어류'
  | '유제품/계란'
  | '양념/소스'
  | '가공식품'
  | '기타';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  quantity: string;
  location: IngredientLocation;
  expiryDate: string;
  emoji: string;
  addedDate: string;
  memo?: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  cookTime: number;
  difficulty: '쉬움' | '보통' | '어려움';
  requiredIngredients: string[];
  optionalIngredients: string[];
  steps: string[];
  description: string;
  isFavorite: boolean;
  likeCount: number;
  authorId?: string;
}

export interface RecipeComment {
  id: string;
  recipeId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  householdType: '1인' | '2인' | '3인 이상' | '기타';
  preferences: {
    favoriteFoods: string[];
    allergies: string[];
    avoidIngredients: string[];
  };
  joinDate: string;
  status: 'active' | 'inactive';
}

export interface Inquiry {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  content: string;
  status: 'pending' | 'answered' | 'closed';
  createdAt: string;
  answer?: string;
}

export interface PresetIngredientItem {
  name: string;
  category: IngredientCategory;
  active: boolean;
}

export type WeatherCondition = '맑음' | '흐림' | '비' | '더움' | '눈';

export interface Weather {
  condition: WeatherCondition;
  temperature: number;
  description: string;
}

export const mockWeather: Weather = {
  condition: '비',
  temperature: 18,
  description: '비가 내리는 날씨예요',
};

export const WEATHER_RECIPE_MAP: Record<WeatherCondition, { categories: string[]; emoji: string; message: string }> = {
  맑음: { categories: ['볶음', '볶음밥', '반찬'], emoji: '☀️', message: '맑은 날엔 간단한 볶음요리가 딱!' },
  흐림: { categories: ['찌개', '수프', '국'], emoji: '☁️', message: '흐린 날엔 따뜻한 국물요리 어떠세요?' },
  비: { categories: ['찌개', '수프', '국', '볶음'], emoji: '🌧️', message: '비 오는 날엔 따뜻한 찌개가 최고!' },
  눈: { categories: ['찌개', '수프', '국'], emoji: '❄️', message: '눈 오는 날엔 뜨끈한 국물요리를!' },
  더움: { categories: ['무침', '반찬', '기타'], emoji: '🌞', message: '더운 날엔 간단하고 시원한 요리 추천!' },
};

export interface DiscardedItem {
  id: string;
  name: string;
  category: IngredientCategory;
  reason: '유통기한 만료' | '상함' | '불필요';
  date: string;
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

export const TODAY = '2026-06-12';

export function getDaysUntilExpiry(expiryDate: string): number {
  if (!expiryDate || expiryDate === '기한없음') return Number.POSITIVE_INFINITY;
  const today = new Date(TODAY);
  const expiry = new Date(expiryDate);
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'neutral';

/** 임박 기준: D-1 이하는 critical(레드), D-3 이하는 warning(오렌지). 그 외엔 중립 그레이. */
export function getExpiryStatus(days: number): ExpiryStatus {
  if (days < 0) return 'expired';
  if (days <= 1) return 'critical';
  if (days <= 3) return 'warning';
  return 'neutral';
}

export function getDayLabel(days: number): string {
  if (!Number.isFinite(days)) return '기한없음';
  if (days < 0) return `D+${Math.abs(days)}`;
  if (days === 0) return 'D-day';
  return `D-${days}`;
}

export const STATUS_COLORS: Record<ExpiryStatus, { bg: string; text: string; border: string }> = {
  expired:  { bg: '#FFEBEE', text: '#D32F2F', border: '#D32F2F' },
  critical: { bg: '#FFEBEE', text: '#D32F2F', border: '#D32F2F' },
  warning:  { bg: '#FFF0E9', text: '#E05A00', border: '#E05A00' },
  neutral:  { bg: '#EBEEEF', text: '#54716B', border: '#54716B' },
};

export function getRecipeMatch(recipe: Recipe, ingredients: Ingredient[]) {
  const names = ingredients.map((i) => i.name);
  const matched = recipe.requiredIngredients.filter((r) => names.includes(r));
  const missing = recipe.requiredIngredients.filter((r) => !names.includes(r));
  const pct = Math.round((matched.length / recipe.requiredIngredients.length) * 100);
  return { matchCount: matched.length, totalRequired: recipe.requiredIngredients.length, percentage: pct, missingIngredients: missing };
}

// ─── Seed data ──────────────────────────────────────────────────────────────────

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: '김지원',
    email: 'user@test.com',
    password: '1234',
    role: 'user',
    householdType: '1인',
    preferences: { favoriteFoods: ['한식', '샐러드'], allergies: ['갑각류'], avoidIngredients: ['고수'] },
    joinDate: '2026-04-15',
    status: 'active',
  },
  {
    id: 'u2',
    name: '관리자',
    email: 'admin@test.com',
    password: 'admin',
    role: 'admin',
    householdType: '기타',
    preferences: { favoriteFoods: [], allergies: [], avoidIngredients: [] },
    joinDate: '2026-01-01',
    status: 'active',
  },
  {
    id: 'u3',
    name: '이서윤',
    email: 'lee@test.com',
    password: '1234',
    role: 'user',
    householdType: '2인',
    preferences: { favoriteFoods: ['일식', '파스타'], allergies: ['견과류'], avoidIngredients: [] },
    joinDate: '2026-03-22',
    status: 'active',
  },
  {
    id: 'u4',
    name: '박민준',
    email: 'park@test.com',
    password: '1234',
    role: 'user',
    householdType: '3인 이상',
    preferences: { favoriteFoods: ['한식'], allergies: [], avoidIngredients: ['마늘'] },
    joinDate: '2026-05-10',
    status: 'inactive',
  },
  {
    id: 'u5',
    name: '최유리',
    email: 'choi@test.com',
    password: '1234',
    role: 'user',
    householdType: '1인',
    preferences: { favoriteFoods: ['채식'], allergies: ['유제품'], avoidIngredients: [] },
    joinDate: '2026-05-30',
    status: 'active',
  },
];

export const initialIngredients: Ingredient[] = [
  { id: '1',  name: '두부',   category: '가공식품',   quantity: '1모',   location: '냉장', expiryDate: '2026-06-13', emoji: '🤍', addedDate: '2026-06-10' },
  { id: '2',  name: '대파',   category: '채소/과일', quantity: '1/2단', location: '냉장', expiryDate: '2026-06-14', emoji: '🌿', addedDate: '2026-06-10' },
  { id: '3',  name: '계란',   category: '유제품/계란', quantity: '6개',  location: '냉장', expiryDate: '2026-06-15', emoji: '🥚', addedDate: '2026-06-08' },
  { id: '4',  name: '우유',   category: '유제품/계란', quantity: '500ml',location: '냉장', expiryDate: '2026-06-16', emoji: '🥛', addedDate: '2026-06-09' },
  { id: '5',  name: '삼겹살', category: '육류/어류',  quantity: '200g', location: '냉동', expiryDate: '2026-06-20', emoji: '🥩', addedDate: '2026-06-07' },
  { id: '7',  name: '양파',   category: '채소/과일', quantity: '2개',  location: '냉장', expiryDate: '2026-07-01', emoji: '🧅', addedDate: '2026-06-01' },
  { id: '8',  name: '마늘',   category: '채소/과일', quantity: '1통',  location: '냉장', expiryDate: '2026-07-10', emoji: '🧄', addedDate: '2026-06-01' },
  { id: '9',  name: '김치',   category: '가공식품',   quantity: '300g', location: '냉장', expiryDate: '2026-07-15', emoji: '🌶️', addedDate: '2026-05-20' },
  { id: '11', name: '고추장', category: '양념/소스',  quantity: '1/2통',location: '냉장', expiryDate: '2026-11-01', emoji: '🫙', addedDate: '2026-03-15' },
  { id: '12', name: '된장',   category: '양념/소스',  quantity: '1통',  location: '냉장', expiryDate: '2026-12-01', emoji: '🫙', addedDate: '2026-03-01' },
];

export const recipes: Recipe[] = [
  {
    id: 'r1', name: '된장찌개', category: '찌개', cookTime: 20, difficulty: '쉬움',
    requiredIngredients: ['두부', '된장', '대파', '마늘', '양파'],
    optionalIngredients: [],
    description: '집에 있는 재료로 간편하게 끓이는 구수한 된장찌개',
    steps: ['냄비에 멸치육수 2컵을 끓입니다', '된장 2큰술을 풀어줍니다', '두부, 양파, 마늘을 넣고 10분 끓입니다', '대파를 넣고 2분 더 끓이면 완성'],
    isFavorite: true, likeCount: 24,
  },
  {
    id: 'r2', name: '두부김치', category: '볶음', cookTime: 15, difficulty: '쉬움',
    requiredIngredients: ['두부', '김치', '대파', '참기름'],
    optionalIngredients: [],
    description: '고소한 두부와 새콤한 김치의 환상 조합',
    steps: ['두부를 두께 1cm로 슬라이스합니다', '팬에 기름을 두르고 두부를 노릇하게 굽습니다', '김치를 볶다가 대파, 참기름으로 마무리'],
    isFavorite: false, likeCount: 11,
  },
  {
    id: 'r3', name: '계란볶음밥', category: '볶음밥', cookTime: 10, difficulty: '쉬움',
    requiredIngredients: ['계란', '대파', '참기름', '당근'],
    optionalIngredients: [],
    description: '냉장고 속 자투리 채소로 만드는 든든한 한 끼',
    steps: ['당근과 대파를 잘게 썹니다', '팬에 기름을 두르고 채소를 볶습니다', '밥을 넣고 강불에 볶아줍니다', '계란을 풀어 넣고 잘 섞으면 완성'],
    isFavorite: false, likeCount: 31,
  },
  {
    id: 'r4', name: '계란말이', category: '반찬', cookTime: 10, difficulty: '보통',
    requiredIngredients: ['계란', '대파', '당근'],
    optionalIngredients: [],
    description: '도시락에도 좋은 영양 가득 계란말이',
    steps: ['계란 3개를 풀고 소금 1/2 티스푼을 넣습니다', '대파, 당근을 잘게 다집니다', '팬에 기름을 바르고 약불에서 천천히 말아줍니다'],
    isFavorite: true, likeCount: 18,
  },
  {
    id: 'r5', name: '삼겹살 김치볶음', category: '볶음', cookTime: 25, difficulty: '보통',
    requiredIngredients: ['삼겹살', '김치', '마늘', '고추장'],
    optionalIngredients: [],
    description: '냉동 삼겹살로 만드는 얼큰한 볶음 요리',
    steps: ['삼겹살을 먹기 좋은 크기로 자릅니다', '마늘을 볶다가 삼겹살을 넣습니다', '김치, 고추장을 넣고 함께 볶습니다', '마지막에 대파, 참기름으로 마무리'],
    isFavorite: false, likeCount: 8,
  },
  {
    id: 'r6', name: '양파 수프', category: '수프', cookTime: 30, difficulty: '보통',
    requiredIngredients: ['양파', '마늘', '우유'],
    optionalIngredients: [],
    description: '달콤하게 캐러멜라이즈한 양파로 만드는 진한 수프',
    steps: ['양파를 얇게 슬라이스합니다', '버터에 양파를 20분간 캐러멜라이즈합니다', '마늘, 우유를 넣고 블렌딩합니다', '소금, 후추로 간을 맞춥니다'],
    isFavorite: false, likeCount: 5,
  },
  {
    id: 'r7', name: '고추장 제육볶음', category: '볶음', cookTime: 20, difficulty: '쉬움',
    requiredIngredients: ['삼겹살', '고추장', '양파', '마늘', '대파'],
    optionalIngredients: [],
    description: '매콤달콤한 양념에 볶은 인기 가정식',
    steps: ['삼겹살을 얇게 슬라이스합니다', '고추장, 간장, 설탕을 섞어 양념을 만듭니다', '양파, 마늘과 함께 볶다가 양념을 넣습니다', '대파, 참기름으로 마무리'],
    isFavorite: false, likeCount: 14,
  },
];

export const mockComments: RecipeComment[] = [
  { id: 'cm1', recipeId: 'r1', userId: 'u3', userName: '이서윤', content: '진짜 맛있었어요! 된장을 조금 더 넣었더니 더 구수하더라고요 👍', createdAt: '2026-06-10' },
  { id: 'cm2', recipeId: 'r1', userId: 'u5', userName: '최유리', content: '초보인데도 쉽게 만들 수 있었어요!', createdAt: '2026-06-11' },
  { id: 'cm3', recipeId: 'r3', userId: 'u1', userName: '김지원', content: '냉장고 정리할 때 딱이네요 ㅎㅎ', createdAt: '2026-06-12' },
];

export const initialShoppingItems: ShoppingItem[] = [
  { id: 's1', name: '쌈채소',         quantity: '1봉',  category: '채소/과일', checked: false },
  { id: 's2', name: '간장',           quantity: '1병',  category: '양념/소스', checked: true  },
  { id: 's3', name: '돼지고기 앞다리살', quantity: '500g', category: '육류/어류', checked: false },
  { id: 's4', name: '애호박',          quantity: '1개',  category: '채소/과일', checked: false },
  { id: 's5', name: '소금',            quantity: '1봉',  category: '양념/소스', checked: true  },
];

export const mockDiscardedItems: DiscardedItem[] = [
  { id: 'd1', name: '시금치',   category: '채소/과일',  reason: '유통기한 만료', date: '2026-06-10' },
  { id: 'd2', name: '두부',     category: '가공식품',   reason: '유통기한 만료', date: '2026-06-08' },
  { id: 'd3', name: '요거트',   category: '유제품/계란', reason: '유통기한 만료', date: '2026-06-07' },
  { id: 'd4', name: '버섯',     category: '채소/과일',  reason: '상함',         date: '2026-06-05' },
  { id: 'd5', name: '쌈채소',   category: '채소/과일',  reason: '유통기한 만료', date: '2026-06-03' },
  { id: 'd6', name: '두부',     category: '가공식품',   reason: '유통기한 만료', date: '2026-05-28' },
  { id: 'd7', name: '삼겹살',   category: '육류/어류',  reason: '유통기한 만료', date: '2026-05-25' },
];

export const mockInquiries: Inquiry[] = [
  { id: 'q1', userId: 'u3', userName: '이서윤', subject: '레시피 추천 기준이 궁금해요', content: '보유 재료 매칭 퍼센트는 어떻게 계산되나요?', status: 'answered', createdAt: '2026-06-10', answer: '보유하신 재료 중 레시피에 필요한 재료가 몇 가지인지 비율로 계산됩니다. 예를 들어 필요 재료 5개 중 4개를 보유하시면 80%로 표시됩니다.' },
  { id: 'q2', userId: 'u1', userName: '김지원', subject: '못 먹는 재료 설정이 안 됩니다', content: '마이페이지에서 못 먹는 재료를 저장했는데 반영이 안 되는 것 같아요.', status: 'pending', createdAt: '2026-06-11' },
  { id: 'q3', userId: 'u5', userName: '최유리', subject: '앱이 가끔 느려요', content: '재료를 많이 등록하면 앱이 느려지는 현상이 있어요.', status: 'pending', createdAt: '2026-06-12' },
  { id: 'q4', userId: 'u4', userName: '박민준', subject: '레시피 추가 요청', content: '잡채 레시피도 추가해주실 수 있나요?', status: 'closed', createdAt: '2026-06-05', answer: '좋은 의견 감사합니다! 다음 업데이트에 반영할 예정입니다.' },
];

export const CATEGORIES: IngredientCategory[] = [
  '채소/과일', '육류/어류', '유제품/계란', '양념/소스', '가공식품', '기타',
];

export const PRESET_INGREDIENTS: { name: string; category: IngredientCategory }[] = [
  // 채소/과일
  { name: '대파', category: '채소/과일' },
  { name: '당근', category: '채소/과일' },
  { name: '양파', category: '채소/과일' },
  { name: '마늘', category: '채소/과일' },
  { name: '쌈채소', category: '채소/과일' },
  { name: '애호박', category: '채소/과일' },
  { name: '배추', category: '채소/과일' },
  { name: '시금치', category: '채소/과일' },
  { name: '감자', category: '채소/과일' },
  { name: '고구마', category: '채소/과일' },
  { name: '오이', category: '채소/과일' },
  { name: '브로콜리', category: '채소/과일' },
  { name: '파프리카', category: '채소/과일' },
  { name: '토마토', category: '채소/과일' },
  { name: '버섯', category: '채소/과일' },
  { name: '콩나물', category: '채소/과일' },
  { name: '무', category: '채소/과일' },
  { name: '부추', category: '채소/과일' },
  { name: '깻잎', category: '채소/과일' },
  { name: '고추', category: '채소/과일' },
  { name: '청경채', category: '채소/과일' },
  { name: '숙주', category: '채소/과일' },
  { name: '양배추', category: '채소/과일' },
  { name: '피망', category: '채소/과일' },

  // 육류/어류
  { name: '삼겹살', category: '육류/어류' },
  { name: '돼지고기 앞다리살', category: '육류/어류' },
  { name: '닭가슴살', category: '육류/어류' },
  { name: '닭다리', category: '육류/어류' },
  { name: '소고기', category: '육류/어류' },
  { name: '참치캔', category: '육류/어류' },
  { name: '새우', category: '육류/어류' },
  { name: '오징어', category: '육류/어류' },
  { name: '베이컨', category: '육류/어류' },
  { name: '소시지', category: '육류/어류' },
  { name: '연어', category: '육류/어류' },
  { name: '고등어', category: '육류/어류' },
  { name: '꽁치', category: '육류/어류' },
  { name: '돼지고기 목살', category: '육류/어류' },

  // 유제품/계란
  { name: '계란', category: '유제품/계란' },
  { name: '우유', category: '유제품/계란' },
  { name: '버터', category: '유제품/계란' },
  { name: '치즈', category: '유제품/계란' },
  { name: '요거트', category: '유제품/계란' },
  { name: '생크림', category: '유제품/계란' },
  { name: '두유', category: '유제품/계란' },
  { name: '모짜렐라', category: '유제품/계란' },
  { name: '슬라이스치즈', category: '유제품/계란' },

  // 양념/소스
  { name: '참기름', category: '양념/소스' },
  { name: '고추장', category: '양념/소스' },
  { name: '된장', category: '양념/소스' },
  { name: '간장', category: '양념/소스' },
  { name: '소금', category: '양념/소스' },
  { name: '굴소스', category: '양념/소스' },
  { name: '케찹', category: '양념/소스' },
  { name: '마요네즈', category: '양념/소스' },
  { name: '올리브오일', category: '양념/소스' },
  { name: '식용유', category: '양념/소스' },
  { name: '식초', category: '양념/소스' },
  { name: '설탕', category: '양념/소스' },
  { name: '후추', category: '양념/소스' },
  { name: '고춧가루', category: '양념/소스' },
  { name: '다진마늘', category: '양념/소스' },
  { name: '들기름', category: '양념/소스' },
  { name: '청주', category: '양념/소스' },
  { name: '미림', category: '양념/소스' },

  // 가공식품
  { name: '두부', category: '가공식품' },
  { name: '김치', category: '가공식품' },
  { name: '어묵', category: '가공식품' },
  { name: '떡볶이떡', category: '가공식품' },
  { name: '라면', category: '가공식품' },
  { name: '햄', category: '가공식품' },
  { name: '스팸', category: '가공식품' },
  { name: '순두부', category: '가공식품' },
  { name: '만두', category: '가공식품' },
  { name: '냉동밥', category: '가공식품' },
  { name: '묵', category: '가공식품' },
  { name: '누룽지', category: '가공식품' },
  { name: '곤약', category: '가공식품' },

  // 기타
  { name: '밀가루', category: '기타' },
  { name: '전분', category: '기타' },
  { name: '빵가루', category: '기타' },
  { name: '쌀', category: '기타' },
  { name: '파스타면', category: '기타' },
  { name: '쌀국수', category: '기타' },
  { name: '식빵', category: '기타' },
  { name: '당면', category: '기타' },
  { name: '냉동만두', category: '기타' },
  { name: '오트밀', category: '기타' },
];

export const initialPresetIngredients: PresetIngredientItem[] = PRESET_INGREDIENTS.map((item) => ({
  ...item,
  active: true,
}));

export const CATEGORY_EMOJIS: Record<IngredientCategory, string> = {
  '채소/과일': '🥬',
  '육류/어류': '🥩',
  '유제품/계란': '🥛',
  '양념/소스': '🫙',
  '가공식품': '📦',
  '기타': '🍱',
};
