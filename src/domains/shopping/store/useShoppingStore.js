import { create } from 'zustand';
import { initialShoppingItems } from '@/shared/data/mockData';

const useShoppingStore = create((set) => ({
  shoppingItems: initialShoppingItems,

  addShoppingItem: (item) => set((state) => ({
    shoppingItems: [...state.shoppingItems, { ...item, id: `shop_${Date.now()}` }],
  })),

  toggleShoppingItem: (id) => set((state) => ({
    shoppingItems: state.shoppingItems.map((i) => i.id === id ? { ...i, checked: !i.checked } : i),
  })),

  deleteShoppingItem: (id) => set((state) => ({
    shoppingItems: state.shoppingItems.filter((i) => i.id !== id),
  })),

  clearChecked: () => set((state) => ({
    shoppingItems: state.shoppingItems.filter((i) => !i.checked),
  })),
}));

export default useShoppingStore;
