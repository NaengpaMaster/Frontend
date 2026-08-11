import { create } from 'zustand';
import { shoppingApi } from '@/apis/shoppingApi';

const CATEGORY_NAMES = {
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

const toViewShoppingItem = (item) => ({
  id: item.shoppingItemId,
  productId: item.productId,
  name: item.productName,
  category: CATEGORY_NAMES[item.productCategoryId] ?? '기타',
  quantity: item.quantity,
  checked: item.isPurchased,
});

const toViewRecommendationItem = (item) => ({
  productId: item.productId,
  productCategoryId: item.productCategoryId,
  name: item.productName,
  quantity: item.quantity || '1개',
  reason: item.reason || '냉장고와 장보기 목록을 기준으로 추천되었습니다.',
});

const useShoppingStore = create((set, get) => ({
  shoppingItems: [],
  selectedFridgeId: null,
  recommendationItems: [],
  recommendationLoading: false,
  recommendationError: null,
  loading: false,
  error: null,

  fetchShoppingItems: async (fridgeId) => {
    set({ loading: true, error: null });
    try {
      const targetFridgeId = fridgeId ?? get().selectedFridgeId;
      const items = await shoppingApi.getAll(targetFridgeId);
      set({ shoppingItems: items.map(toViewShoppingItem) });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  setSelectedFridgeId: (selectedFridgeId) => set((state) => {
    if (state.selectedFridgeId === selectedFridgeId) {
      return { selectedFridgeId };
    }
    return {
      selectedFridgeId,
      recommendationItems: [],
      recommendationError: null,
    };
  }),

  addShoppingItem: async (item, fridgeId) => {
    const targetFridgeId = fridgeId ?? get().selectedFridgeId;
    const created = await shoppingApi.create({
      productId: item.productId,
      quantity: item.quantity,
    }, targetFridgeId);

    await get().fetchShoppingItems(targetFridgeId);
    return created;
  },

  fetchAgentRecommendations: async (limit = 5, fridgeId) => {
    set({ recommendationLoading: true, recommendationError: null });
    try {
      const excludeProductIds = [...get().shoppingItems, ...get().recommendationItems]
        .map((item) => item.productId)
        .filter(Boolean)
        .filter((productId, index, productIds) => productIds.indexOf(productId) === index);

      // 추천 결과는 바로 DB에 저장하지 않고, 사용자가 확인 후 담을 수 있도록 화면 상태에만 보관
      const targetFridgeId = fridgeId ?? get().selectedFridgeId;
      const response = await shoppingApi.recommendWithAgent({ limit, excludeProductIds, fridgeId: targetFridgeId });
      set({ recommendationItems: (response.items || []).map(toViewRecommendationItem) });
    } catch (error) {
      set({ recommendationError: error.message, recommendationItems: [] });
    } finally {
      set({ recommendationLoading: false });
    }
  },

  addAgentRecommendationItem: async (item) => {
    try {
      await shoppingApi.addAgentRecommendation({
        productId: item.productId,
        quantity: item.quantity || '1개',
      });

      await get().fetchShoppingItems(get().selectedFridgeId);
      set({
        recommendationItems: get().recommendationItems.filter(
          (recommendationItem) => recommendationItem.productId !== item.productId
        ),
      });
    } catch (error) {
      set({ recommendationError: error.message });
    }
  },

  toggleShoppingItem: async (id) => {
    const item = get().shoppingItems.find((shoppingItem) => shoppingItem.id === id);
    if (!item) return;

    const targetFridgeId = get().selectedFridgeId;
    await shoppingApi.toggle(id, !item.checked, targetFridgeId);
    await get().fetchShoppingItems(targetFridgeId);
  },

  updateShoppingItem: async (id, quantity) => {
    const targetFridgeId = get().selectedFridgeId;
    await shoppingApi.update(id, { quantity }, targetFridgeId);
    await get().fetchShoppingItems(targetFridgeId);
  },

  deleteShoppingItem: async (id) => {
    const targetFridgeId = get().selectedFridgeId;
    await shoppingApi.delete(id, targetFridgeId);
    await get().fetchShoppingItems(targetFridgeId);
  },

  clearChecked: async () => {
    const checkedItems = get().shoppingItems.filter((item) => item.checked);
    const targetFridgeId = get().selectedFridgeId;
    await Promise.all(checkedItems.map((item) => shoppingApi.delete(item.id, targetFridgeId)));
    await get().fetchShoppingItems(targetFridgeId);
  },

  moveCheckedToFridge: async () => {
    const checkedItems = get().shoppingItems.filter((item) => item.checked);
    const targetFridgeId = get().selectedFridgeId;
    await Promise.all(checkedItems.map((item) => shoppingApi.moveToFridge(item.id, {
      expiryDate: null,
      memo: '장보기 목록에서 반영',
    }, targetFridgeId)));
    await get().fetchShoppingItems(targetFridgeId);
  },
}));

export default useShoppingStore;
