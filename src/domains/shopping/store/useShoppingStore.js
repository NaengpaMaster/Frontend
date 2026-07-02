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

const useShoppingStore = create((set, get) => ({
  shoppingItems: [],
  loading: false,
  error: null,

  fetchShoppingItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await shoppingApi.getAll();
      set({ shoppingItems: items.map(toViewShoppingItem) });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addShoppingItem: async (item) => {
    const created = await shoppingApi.create({
      productId: item.productId,
      quantity: item.quantity,
    });

    await get().fetchShoppingItems();
    return created;
  },

  toggleShoppingItem: async (id) => {
    const item = get().shoppingItems.find((shoppingItem) => shoppingItem.id === id);
    if (!item) return;

    await shoppingApi.toggle(id, !item.checked);
    await get().fetchShoppingItems();
  },

  deleteShoppingItem: async (id) => {
    await shoppingApi.delete(id);
    await get().fetchShoppingItems();
  },

  clearChecked: async () => {
    const checkedItems = get().shoppingItems.filter((item) => item.checked);
    await Promise.all(checkedItems.map((item) => shoppingApi.delete(item.id)));
    await get().fetchShoppingItems();
  },

  moveCheckedToFridge: async () => {
    const checkedItems = get().shoppingItems.filter((item) => item.checked);
    await Promise.all(checkedItems.map((item) => shoppingApi.moveToFridge(item.id, {
      expiryDate: null,
      memo: '장보기 목록에서 반영',
    })));
    await get().fetchShoppingItems();
  },
}));

export default useShoppingStore;
