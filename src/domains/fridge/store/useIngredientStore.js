import { create } from 'zustand';
import { initialPresetIngredients } from '@/shared/data/mockData';
import { fridgeApi } from '@/apis/fridgeApi';

export const CATEGORY_NAMES = {
  1: '채소/과일',
  2: '채소/과일',
  3: '육류/어류',
  4: '육류/어류',
  5: '유제품/계란',
  6: '기타',
  7: '기타',
  8: '양념/소스',
  9: '가공식품',
  10: '기타',
};

const toViewIngredient = (item) => ({
  id: item.fridgeItemId,
  productId: item.productId,
  name: item.productName,
  category: CATEGORY_NAMES[item.productCategoryId] ?? '기타',
  quantity: item.quantity,
  expiryDate: item.expiryDate,
  memo: item.memo,
});

const useIngredientStore = create((set, get) => ({
  ingredients: [],
  presetIngredients: initialPresetIngredients,
  loading: false,
  error: null,

  fetchIngredients: async () => {
    set({ loading: true, error: null });
    try {
      const items = await fridgeApi.getItems();
      set({ ingredients: items.map(toViewIngredient) });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addIngredient: async (data) => {
    await fridgeApi.createItem({
      productId: data.productId,
      quantity: data.quantity,
      expiryDate: data.expiryDate,
      memo: data.memo,
    });

    await get().fetchIngredients();
  },

  addIngredients: (items) => set((state) => ({
    ingredients: [...state.ingredients, ...items],
  })),

  updateIngredient: async (id, data) => {
    await fridgeApi.updateItem(id, {
      productId: data.productId,
      quantity: data.quantity,
      expiryDate: data.expiryDate,
      memo: data.memo,
    });

    await get().fetchIngredients();
  },

  useIngredient: async (id, remainingQuantity) => {
    if (remainingQuantity) {
      await fridgeApi.usePartial(id, remainingQuantity);
      await get().fetchIngredients();
      return;
    }

    await fridgeApi.useAll(id);
    await get().fetchIngredients();
  },

  deleteIngredient: async (id) => {
    await fridgeApi.deleteItem(id);
    await get().fetchIngredients();
  },

  setPresetIngredients: (presetsOrFn) => set((state) => ({
    presetIngredients: typeof presetsOrFn === 'function'
      ? presetsOrFn(state.presetIngredients)
      : presetsOrFn,
  })),
}));

export default useIngredientStore;
