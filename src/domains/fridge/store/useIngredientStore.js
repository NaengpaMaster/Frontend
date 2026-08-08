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
  accessibleFridges: [],
  selectedFridgeId: null,
  loading: false,
  error: null,

  fetchAccessibleFridges: async () => {
    const fridges = await fridgeApi.getAccessibleFridges();
    set((state) => ({
      accessibleFridges: fridges || [],
      selectedFridgeId: state.selectedFridgeId ?? fridges?.find((fridge) => fridge.mine)?.fridgeId ?? fridges?.[0]?.fridgeId ?? null,
    }));
    return fridges || [];
  },

  setSelectedFridgeId: (selectedFridgeId) => set({ selectedFridgeId }),

  fetchIngredients: async (fridgeId) => {
    set({ loading: true, error: null });
    try {
      const targetFridgeId = fridgeId ?? get().selectedFridgeId;
      const items = await fridgeApi.getItems(targetFridgeId);
      set({ ingredients: items.map(toViewIngredient) });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addIngredient: async (data) => {
    const targetFridgeId = get().selectedFridgeId;
    await fridgeApi.createItem({
      productId: data.productId,
      quantity: data.quantity,
      expiryDate: data.expiryDate,
      memo: data.memo,
    }, targetFridgeId);

    await get().fetchIngredients(targetFridgeId);
  },

  addIngredients: (items) => set((state) => ({
    ingredients: [...state.ingredients, ...items],
  })),

  updateIngredient: async (id, data) => {
    const targetFridgeId = get().selectedFridgeId;
    await fridgeApi.updateItem(id, {
      productId: data.productId,
      quantity: data.quantity,
      expiryDate: data.expiryDate,
      memo: data.memo,
    }, targetFridgeId);

    await get().fetchIngredients(targetFridgeId);
  },

  useIngredient: async (id, remainingQuantity) => {
    if (remainingQuantity) {
      const targetFridgeId = get().selectedFridgeId;
      await fridgeApi.usePartial(id, remainingQuantity, targetFridgeId);
      await get().fetchIngredients(targetFridgeId);
      return;
    }

    const targetFridgeId = get().selectedFridgeId;
    await fridgeApi.useAll(id, targetFridgeId);
    await get().fetchIngredients(targetFridgeId);
  },

  deleteIngredient: async (id) => {
    const targetFridgeId = get().selectedFridgeId;
    await fridgeApi.deleteItem(id, targetFridgeId);
    await get().fetchIngredients(targetFridgeId);
  },

  transferIngredient: async (id, data) => {
    await fridgeApi.transferItem(id, data);
    await get().fetchIngredients(get().selectedFridgeId);
  },

  requestIngredient: async (id, data) => {
    await fridgeApi.requestItem(id, data);
  },

  setPresetIngredients: (presetsOrFn) => set((state) => ({
    presetIngredients: typeof presetsOrFn === 'function'
      ? presetsOrFn(state.presetIngredients)
      : presetsOrFn,
  })),
}));

export default useIngredientStore;
