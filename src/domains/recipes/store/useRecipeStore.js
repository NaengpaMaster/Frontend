import { create } from 'zustand';
import { recipes as recipeData, mockComments } from '@/shared/data/mockData';

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
}));

export default useRecipeStore;
