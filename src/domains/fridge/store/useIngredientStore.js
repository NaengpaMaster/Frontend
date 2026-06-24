import { create } from 'zustand';
import { initialIngredients, initialPresetIngredients } from '@/shared/data/mockData';

const useIngredientStore = create((set) => ({
  ingredients: initialIngredients,
  presetIngredients: initialPresetIngredients,

  addIngredient: (data) => set((state) => ({
    ingredients: [
      ...state.ingredients,
      { ...data, id: `ing_${Date.now()}`, addedDate: new Date().toISOString().split('T')[0] },
    ],
  })),

  addIngredients: (items) => set((state) => ({
    ingredients: [...state.ingredients, ...items],
  })),

  updateIngredient: (id, data) => set((state) => ({
    ingredients: state.ingredients.map((i) => i.id === id ? { ...i, ...data } : i),
  })),

  useIngredient: (id, remainingQuantity) => set((state) => ({
    ingredients: remainingQuantity
      ? state.ingredients.map((i) => i.id === id ? { ...i, quantity: remainingQuantity } : i)
      : state.ingredients.filter((i) => i.id !== id),
  })),

  deleteIngredient: (id) => set((state) => ({
    ingredients: state.ingredients.filter((i) => i.id !== id),
  })),

  setPresetIngredients: (presetsOrFn) => set((state) => ({
    presetIngredients: typeof presetsOrFn === 'function'
      ? presetsOrFn(state.presetIngredients)
      : presetsOrFn,
  })),
}));

export default useIngredientStore;
