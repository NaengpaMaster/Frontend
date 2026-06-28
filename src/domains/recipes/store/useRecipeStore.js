import { create } from 'zustand';
import { recipes as recipeData, mockComments } from '@/shared/data/mockData';
import { adminRecipesApi } from '@/apis/recipesApi';

const useRecipeStore = create((set) => ({
  recipes: recipeData,
  comments: mockComments,

  toggleFavorite: (id) => set((state) => ({
    recipes: state.recipes.map((r) => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r),
  })),

  addRecipe: (data, authorId) => set((state) => ({
    recipes: [...state.recipes, { ...data, id: `r_${Date.now()}`, authorId }],
  })),

  updateRecipe: (id, data) => set((state) => ({
    recipes: state.recipes.map((r) => r.id === id ? { ...data, id } : r),
  })),

  deleteRecipe: (id) => set((state) => ({
    recipes: state.recipes.filter((r) => r.id !== id),
  })),

  addComment: (comment) => set((state) => ({
    comments: [...state.comments, { ...comment, id: `c_${Date.now()}` }],
  })),

  setRecipes: (recipesOrFn) => set((state) => ({
    recipes: typeof recipesOrFn === 'function'
      ? recipesOrFn(state.recipes)
      : recipesOrFn,
  })),

  adminPage: 0,
  adminTotalPages: 0,
  adminLoading: false,

  fetchAdminRecipes: async () => {
    set({ adminLoading: true, adminPage: 0 });
    try {
      const res = await adminRecipesApi.getAll(0);
      const body = res.data?.data ?? res.data;
      const list = body?.recipes ?? body ?? [];
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
      set({ recipes: mapped, adminPage: 0, adminTotalPages: body?.totalPages ?? 1 });
    } finally {
      set({ adminLoading: false });
    }
  },

  fetchAdminRecipesNext: async () => {
    const { adminPage, adminTotalPages, adminLoading } = useRecipeStore.getState();
    const nextPage = adminPage + 1;
    if (adminLoading || nextPage >= adminTotalPages) return;
    set({ adminLoading: true });
    try {
      const res = await adminRecipesApi.getAll(nextPage);
      const body = res.data?.data ?? res.data;
      const list = body?.recipes ?? body ?? [];
      const mapped = (Array.isArray(list) ? list : []).map((r, idx) => ({
        ...r,
        id: r.recipeId ?? r.id ?? `${nextPage}_${idx}`,
        category: r.categoryName ?? r.category,
        cookTime: r.cookingTime ?? r.cookTime,
        difficulty: r.difficultyLabel ?? r.difficulty,
        requiredIngredients: r.requiredIngredients ?? Array(r.ingredientCount ?? 0).fill(''),
        description: r.description ?? '',
        steps: r.steps ?? [],
      }));
      set((state) => {
        const existingIds = new Set(state.recipes.map((r) => r.id));
        const newRecipes = mapped.filter((r) => !existingIds.has(r.id));
        return { recipes: [...state.recipes, ...newRecipes], adminPage: nextPage };
      });
    } finally {
      set({ adminLoading: false });
    }
  },

  adminUpdateRecipe: async (id, recipeData) => {
    const res = await adminRecipesApi.update(id, recipeData);
    const updated = res.data?.data ?? res.data;
    set((state) => ({
      recipes: state.recipes.map((r) => r.id === id ? updated : r),
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
