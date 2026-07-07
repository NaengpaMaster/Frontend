import { create } from 'zustand';
import { recipes as recipeData } from '@/shared/data/mockData';
import { recipesApi, adminRecipesApi } from '@/apis/recipesApi';

const DIFFICULTY_LABELS = { EASY: '쉬움', NORMAL: '보통', HARD: '어려움' };

const mapUserRecipe = (r) => ({
  id: r.recipeId,
  name: r.recipeName,
  description: r.description,
  category: r.category,
  difficulty: r.difficulty,
  cookTime: r.cookTime,
  matchRate: r.matchRate ?? 0,
  likeCount: r.likeCount ?? 0,
  liked: r.liked ?? false,
  missingIngredients: r.missingIngredients ?? [],
  recommendReasons: r.recommendReasons ?? [],
  expiredIngredientIncluded: r.expiredIngredientIncluded ?? false,
});

const useRecipeStore = create((set) => ({
  // Dashboard / AdminPanel에서 쓰는 목록 (requiredIngredients 배열 형태를 기대함)
  recipes: recipeData,

  // RecipeView(사용자 화면)에서 쓰는 추천 레시피 목록 - 백엔드가 matchRate를 직접 계산해서 내려줌
  userRecipes: [],
  userRecipesLoading: false,
  userRecipesPage: 0,
  userRecipesTotalPages: 0,
  userRecipesParams: {},

  fetchUserRecipes: async (params) => {
    set({ userRecipesLoading: true, userRecipesPage: 0, userRecipesParams: params });
    try {
      const res = await recipesApi.getAll({ ...params, page: 0 });
      const body = res.data?.data ?? res.data;
      const mapped = (body?.content ?? []).map(mapUserRecipe);
      set({ userRecipes: mapped, userRecipesPage: 0, userRecipesTotalPages: body?.totalPages ?? 0 });
    } catch {
      // 추천 결과가 없으면 백엔드가 404를 내려주므로 빈 목록(검색결과 없음)으로 처리
      set({ userRecipes: [], userRecipesTotalPages: 0 });
    } finally {
      set({ userRecipesLoading: false });
    }
  },

  fetchUserRecipesNext: async () => {
    const { userRecipesPage, userRecipesTotalPages, userRecipesLoading, userRecipesParams } = useRecipeStore.getState();
    const nextPage = userRecipesPage + 1;
    if (userRecipesLoading || nextPage >= userRecipesTotalPages) return;
    set({ userRecipesLoading: true });
    try {
      const res = await recipesApi.getAll({ ...userRecipesParams, page: nextPage });
      const body = res.data?.data ?? res.data;
      const mapped = (body?.content ?? []).map(mapUserRecipe);
      set((state) => {
        const existingIds = new Set(state.userRecipes.map((r) => r.id));
        const newOnes = mapped.filter((r) => !existingIds.has(r.id));
        return { userRecipes: [...state.userRecipes, ...newOnes], userRecipesPage: nextPage };
      });
    } catch {
      // 다음 페이지가 없거나 오류면 현재 목록을 유지
    } finally {
      set({ userRecipesLoading: false });
    }
  },

  // 홈 화면(Dashboard) '지금 가능한 레시피' 상위 5개
  homeRecipes: [],
  homeRecipesTotal: 0,
  homeRecipesLoading: false,

  fetchHomeRecipes: async () => {
    set({ homeRecipesLoading: true });
    try {
      const res = await recipesApi.getAll({ match80Only: true, page: 0, size: 5 });
      const body = res.data?.data ?? res.data;
      set({
        homeRecipes: (body?.content ?? []).map(mapUserRecipe),
        homeRecipesTotal: body?.totalElements ?? 0,
      });
    } catch {
      set({ homeRecipes: [], homeRecipesTotal: 0 });
    } finally {
      set({ homeRecipesLoading: false });
    }
  },

  // 홈 화면 '임박 재료 활용 추천' - 추천 점수 상위 목록에서 임박 재료를 쓰는 것만 추려냄
  urgentHomeRecipes: [],

  fetchUrgentHomeRecipes: async () => {
    try {
      const res = await recipesApi.getAll({ page: 0, size: 20 });
      const body = res.data?.data ?? res.data;
      const mapped = (body?.content ?? []).map(mapUserRecipe);
      const urgent = mapped.filter((r) => r.recommendReasons.includes('유통기한 임박 재료 활용')).slice(0, 2);
      set({ urgentHomeRecipes: urgent });
    } catch {
      set({ urgentHomeRecipes: [] });
    }
  },

  addRecipe: async (data, authorId) => {
    const res = await recipesApi.create(data);
    const recipeId = res.data?.data?.recipeId ?? res.data?.recipeId;
    const newRecipe = {
      id: recipeId,
      name: data.name,
      description: data.description,
      cookTime: data.cookingTime,
      difficulty: data.difficulty,
      category: data._categoryName ?? '기타',
      matchRate: 0,
      likeCount: 0,
      liked: false,
      missingIngredients: [],
      authorId,
    };
    set((state) => ({ userRecipes: [newRecipe, ...state.userRecipes] }));
  },

  toggleUserRecipeFavorite: async (id) => {
    const res = await recipesApi.toggleFavorite(id);
    const body = res.data?.data ?? res.data;
    set((state) => ({
      userRecipes: state.userRecipes.map((r) => r.id === id ? { ...r, liked: body.liked, likeCount: body.likeCount } : r),
    }));
  },

  updateRecipe: async (id, data) => {
    await recipesApi.update(id, data);
    set((state) => ({
      userRecipes: state.userRecipes.map((r) => r.id === id ? {
        ...r,
        name: data.name,
        description: data.description,
        cookTime: data.cookingTime,
        difficulty: data.difficulty,
        category: data._categoryName ?? r.category,
      } : r),
    }));
  },

  deleteRecipe: async (id) => {
    await recipesApi.delete(id);
    set((state) => ({
      userRecipes: state.userRecipes.filter((r) => r.id !== id),
    }));
  },

  setRecipes: (recipesOrFn) => set((state) => ({
    recipes: typeof recipesOrFn === 'function'
      ? recipesOrFn(state.recipes)
      : recipesOrFn,
  })),

  adminPage: 0,
  adminSize: 20,
  adminTotalPages: 0,
  adminTotalElements: 0,
  adminLoading: false,
  adminParams: {},

  // 관리자 레시피 목록 - 페이지 번호 선택 방식 (페이지당 개수 설정 가능)
  fetchAdminRecipes: async (params = {}) => {
    const state = useRecipeStore.getState();
    const page = params.page ?? 0;
    const size = params.size ?? state.adminSize;
    const search = params.search !== undefined ? params.search : state.adminParams.search;
    set({ adminLoading: true, adminParams: { search }, adminSize: size });
    try {
      const res = await adminRecipesApi.getAll({ search, page, size });
      const body = res.data?.data ?? res.data;
      const list = body?.content ?? [];
      const mapped = (Array.isArray(list) ? list : []).map((r, idx) => ({
        ...r,
        id: r.recipeId ?? r.id ?? idx,
        category: r.categoryName ?? r.category,
        cookTime: r.cookingTime ?? r.cookTime,
        difficulty: r.difficultyLabel ?? r.difficulty,
        requiredIngredients: r.requiredIngredients ?? Array(r.ingredientCount ?? 0).fill(''),
        description: r.description ?? '',
        steps: r.steps ?? [],
      }));
      set({
        recipes: mapped,
        adminPage: page,
        adminTotalPages: body?.totalPages ?? 0,
        adminTotalElements: body?.totalElements ?? mapped.length,
      });
    } finally {
      set({ adminLoading: false });
    }
  },

  adminUpdateRecipe: async (id, recipeData) => {
    // PATCH /api/v1/recipes/{id}는 본문을 반환하지 않으므로 보낸 데이터로 목록 항목을 직접 갱신
    await adminRecipesApi.update(id, recipeData);
    set((state) => ({
      recipes: state.recipes.map((r) => r.id === id ? {
        ...r,
        name: recipeData.name,
        cookTime: recipeData.cookingTime,
        difficulty: DIFFICULTY_LABELS[recipeData.difficulty] ?? recipeData.difficulty,
        category: recipeData._categoryName ?? r.category,
        requiredIngredients: recipeData._ingredientNames ?? r.requiredIngredients,
        description: recipeData.description,
        steps: recipeData.steps,
      } : r),
    }));
  },

  adminDeleteRecipe: async (id) => {
    await adminRecipesApi.delete(id);
    set((state) => ({
      recipes: state.recipes.filter((r) => r.id !== id),
    }));
  },
}));

export default useRecipeStore;
