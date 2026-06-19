import { useState } from 'react';
import { BottomNav, TabId } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { FridgeManager } from './components/FridgeManager';
import { RecipeView } from './components/RecipeView';
import { ShoppingList } from './components/ShoppingList';
import { InquiryPage } from './components/InquiryPage';
import { AuthScreen } from './components/AuthScreen';
import { MyPage } from './components/MyPage';
import { AdminPanel } from './components/AdminPanel';
import {
  Ingredient, Recipe, ShoppingItem, User, Inquiry, IngredientCategory,
  RecipeComment, PresetIngredientItem,
  initialIngredients, recipes as recipeData,
  initialShoppingItems,
  mockUsers, mockInquiries, mockComments, initialPresetIngredients,
  CATEGORY_EMOJIS,
} from './data/mockData';

export default function App() {
  /* MARKER-MAKE-KIT-INVOKED */

  // ─── Auth ──────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showMyPage, setShowMyPage] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // ─── App state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [recipes, setRecipes] = useState<Recipe[]>(recipeData);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(initialShoppingItems);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [inquiries, setInquiries] = useState<Inquiry[]>(mockInquiries);
  const [comments, setComments] = useState<RecipeComment[]>(mockComments);
  const [presetIngredients, setPresetIngredients] = useState<PresetIngredientItem[]>(initialPresetIngredients);

  // ─── Auth handlers ─────────────────────────────────────────────────────────
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setShowAdmin(user.role === 'admin');
  };
  const handleLogout = () => { setCurrentUser(null); setShowMyPage(false); setShowAdmin(false); };
  const handleDeleteAccount = () => {
    if (!currentUser) return;
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, status: 'inactive' } : u)));
    handleLogout();
  };
  const handleUpdateUser = (updated: User) => {
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  // ─── Ingredient handlers ────────────────────────────────────────────────────
  const handleAddIngredient = (data: Omit<Ingredient, 'id' | 'addedDate'>) => {
    setIngredients((prev) => [...prev, { ...data, id: `ing_${Date.now()}`, addedDate: new Date().toISOString().split('T')[0] }]);
  };
  const handleUpdateIngredient = (id: string, data: Omit<Ingredient, 'id' | 'addedDate'>) => {
    setIngredients((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
  };
  const handleUseIngredient = (id: string, remainingQuantity?: string) => {
    setIngredients((prev) => (
      remainingQuantity
        ? prev.map((i) => (i.id === id ? { ...i, quantity: remainingQuantity } : i))
        : prev.filter((i) => i.id !== id)
    ));
  };
  const handleDeleteIngredient = (id: string) => setIngredients((prev) => prev.filter((i) => i.id !== id));

  // ─── Recipe handlers ────────────────────────────────────────────────────────
  const handleToggleFavorite = (id: string) => setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r)));
  const handleAddRecipe = (data: Omit<Recipe, 'id'>) => setRecipes((prev) => [...prev, { ...data, id: `r_${Date.now()}`, authorId: currentUser?.id }]);
  const handleUpdateRecipe = (id: string, data: Omit<Recipe, 'id'>) => setRecipes((prev) => prev.map((r) => (r.id === id ? { ...data, id } : r)));
  const handleDeleteRecipe = (id: string) => setRecipes((prev) => prev.filter((r) => r.id !== id));
  const handleAddComment = (comment: Omit<RecipeComment, 'id'>) => setComments((prev) => [...prev, { ...comment, id: `c_${Date.now()}` }]);

  // ─── Shopping handlers ──────────────────────────────────────────────────────
  const handleAddShoppingItem = (item: Omit<ShoppingItem, 'id'>) => setShoppingItems((prev) => [...prev, { ...item, id: `shop_${Date.now()}` }]);
  const handleToggleShoppingItem = (id: string) => setShoppingItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  const handleDeleteShoppingItem = (id: string) => setShoppingItems((prev) => prev.filter((i) => i.id !== id));
  const handleClearChecked = () => setShoppingItems((prev) => prev.filter((i) => !i.checked));
  const handleMoveCheckedToFridge = () => {
    const checked = shoppingItems.filter((item) => item.checked);
    if (checked.length === 0) return;

    const moved: Ingredient[] = checked.map((item, index) => {
      const category = item.category as IngredientCategory;
      return {
        id: `ing_shop_${Date.now()}_${index}`,
        name: item.name,
        category,
        quantity: item.quantity || '1개',
        location: '냉장',
        expiryDate: '기한없음',
        emoji: CATEGORY_EMOJIS[category],
        addedDate: new Date().toISOString().split('T')[0],
        memo: '장보기 목록에서 반영',
      };
    });

    setIngredients((prev) => [...prev, ...moved]);
    handleClearChecked();
    setActiveTab('fridge');
  };

  // ─── Inquiry handlers ───────────────────────────────────────────────────────
  const handleAddInquiry = (subject: string, content: string) => {
    if (!currentUser) return;
    setInquiries((prev) => [
      {
        id: `q_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        subject,
        content,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
      },
      ...prev,
    ]);
  };
  const handleUpdateInquiry = (id: string, subject: string, content: string) => {
    setInquiries((prev) => prev.map((q) => (q.id === id ? { ...q, subject, content } : q)));
  };

  // ─── Admin handlers ─────────────────────────────────────────────────────────
  const handleAnswerInquiry = (id: string, answer: string) => {
    setInquiries((prev) => prev.map((q) => (q.id === id ? { ...q, answer, status: 'answered' } : q)));
  };
  const handleDeleteInquiry = (id: string) => setInquiries((prev) => prev.filter((q) => q.id !== id));
  const handleDeleteAnswer = (id: string) => {
    setInquiries((prev) => prev.map((q) => (q.id === id ? { ...q, answer: undefined, status: 'pending' as const } : q)));
  };

  // ─── Not logged in ─────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div style={{ width: '100%', minHeight: '100%', display: 'flex', justifyContent: 'center', background: '#F2F4F5' }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <AuthScreen onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  // ─── Admin panel fullscreen ────────────────────────────────────────────────
  if (showAdmin && currentUser.role === 'admin') {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', background: '#F2F4F5' }}>
        <div style={{ width: '100%', maxWidth: '720px', height: '100%', position: 'relative', overflow: 'hidden' }}>
          <AdminPanel
            users={users}
            recipes={recipes}
            inquiries={inquiries}
            presetIngredients={presetIngredients}
            onClose={handleLogout}
            onUpdateUsers={setUsers}
            onUpdateRecipes={setRecipes}
            onAnswerInquiry={handleAnswerInquiry}
            onDeleteInquiry={handleDeleteInquiry}
            onDeleteAnswer={handleDeleteAnswer}
            onUpdatePresetIngredients={setPresetIngredients}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#F2F4F5' }}>
      <Sidebar
        active={activeTab}
        onChange={setActiveTab}
        currentUser={currentUser}
        onOpenMyPage={() => setShowMyPage(true)}
        onOpenAdmin={() => setShowAdmin(true)}
      />
      <div className="app-main" style={{ display: 'flex', justifyContent: 'center', height: '100%', overflow: 'hidden' }}>
      <div
        className="app-content-frame"
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#F2F4F5',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Scrollable content */}
        <div className="app-scroll-pad" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {activeTab === 'home' && (
            <Dashboard
              ingredients={ingredients}
              recipes={recipes}
              currentUser={currentUser}
              onNavigate={setActiveTab}
              onOpenMyPage={() => setShowMyPage(true)}
            />
          )}
          {activeTab === 'fridge' && (
            <FridgeManager
              ingredients={ingredients}
              presetIngredients={presetIngredients}
              onAdd={handleAddIngredient}
              onUpdate={handleUpdateIngredient}
              onUse={handleUseIngredient}
              onDelete={handleDeleteIngredient}
            />
          )}
          {activeTab === 'recipe' && (
            <RecipeView
              recipes={recipes}
              ingredients={ingredients}
              currentUser={currentUser}
              comments={comments}
              presetIngredients={presetIngredients}
              onToggleFavorite={handleToggleFavorite}
              onAddRecipe={handleAddRecipe}
              onUpdateRecipe={handleUpdateRecipe}
              onDeleteRecipe={handleDeleteRecipe}
              onAddComment={handleAddComment}
            />
          )}
          {activeTab === 'shopping' && (
            <ShoppingList
              items={shoppingItems}
              onToggle={handleToggleShoppingItem}
              onDelete={handleDeleteShoppingItem}
              onAdd={handleAddShoppingItem}
              onClearChecked={handleClearChecked}
              onMoveCheckedToFridge={handleMoveCheckedToFridge}
            />
          )}
          {activeTab === 'inquiry' && (
            <InquiryPage
              inquiries={inquiries}
              currentUser={currentUser}
              onAddInquiry={handleAddInquiry}
              onUpdateInquiry={handleUpdateInquiry}
              onDeleteInquiry={handleDeleteInquiry}
            />
          )}
        </div>

        <BottomNav active={activeTab} onChange={setActiveTab} />

        {/* My Page overlay */}
        {showMyPage && (
          <MyPage
            user={currentUser}
            presetIngredients={presetIngredients}
            onClose={() => setShowMyPage(false)}
            onLogout={handleLogout}
            onUpdate={handleUpdateUser}
            onDeleteAccount={handleDeleteAccount}
            onOpenAdmin={() => setShowAdmin(true)}
          />
        )}
      </div>
      </div>
    </div>
  );
}
