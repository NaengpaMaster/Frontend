'use client';

import { useEffect } from 'react';
import { authApi } from '@/apis/authApi';
import { BottomNav } from '@/shared/components/BottomNav';
import { Sidebar } from '@/shared/components/Sidebar';
import { Dashboard } from '@/domains/dashboard/components/Dashboard';
import { FridgeManager } from '@/domains/fridge/components/FridgeManager';
import { RecipeView } from '@/domains/recipes/components/RecipeView';
import { ShoppingList } from '@/domains/shopping/components/ShoppingList';
import { InquiryPage } from '@/domains/inquiry/components/InquiryPage';
import { AuthScreen } from '@/domains/auth/components/AuthScreen';
import { MyPage } from '@/domains/mypage/components/MyPage';
import { AdminPanel } from '@/domains/admin/components/AdminPanel';
import { CATEGORY_EMOJIS, mockDiscardedItems } from '@/shared/data/mockData';

import useAuthStore from '@/domains/auth/store/useAuthStore';
import useUiStore from '@/shared/store/useUiStore';
import useIngredientStore from '@/domains/fridge/store/useIngredientStore';
import useRecipeStore from '@/domains/recipes/store/useRecipeStore';
import useShoppingStore from '@/domains/shopping/store/useShoppingStore';
import useInquiryStore from '@/domains/inquiry/store/useInquiryStore';

export default function App() {
  /* MARKER-MAKE-KIT-INVOKED */

  const {
    currentUser,
    authLoading,
    showMyPage,
    showAdmin,
    setCurrentUser,
    setAuthLoading,
    setShowMyPage,
    setShowAdmin,
    resetAuth,
  } = useAuthStore();
  const { activeTab, setActiveTab } = useUiStore();
  const {
    ingredients, presetIngredients,
    fetchIngredients, addIngredient, addIngredients, updateIngredient, useIngredient, deleteIngredient, setPresetIngredients,
  } = useIngredientStore();
  const {
    recipes, comments,
    toggleFavorite, addRecipe, updateRecipe, deleteRecipe, addComment, setRecipes,
  } = useRecipeStore();
  const {
    shoppingItems,
    addShoppingItem, toggleShoppingItem, deleteShoppingItem, clearChecked,
  } = useShoppingStore();
  const {
    inquiries, users,
    addInquiry, updateInquiry, deleteInquiry, answerInquiry, deleteAnswer, setUsers,
  } = useInquiryStore();

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        await authApi.refresh();
        const user = await authApi.getMe();
        if (!mounted) return;
        setCurrentUser(user);
        setShowAdmin(user?.role === 'admin');
      } catch {
        if (mounted) {
          resetAuth();
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, [resetAuth, setAuthLoading, setCurrentUser, setShowAdmin]);

  useEffect(() => {
    if (!currentUser) return;
    fetchIngredients();
  }, [currentUser, fetchIngredients]);

  useEffect(() => {
    function handleForbidden() {
      setShowAdmin(false);
    }

    window.addEventListener('naengpa:forbidden', handleForbidden);
    return () => window.removeEventListener('naengpa:forbidden', handleForbidden);
  }, [setShowAdmin]);

  useEffect(() => {
    let mounted = true;

    async function refreshProfile() {
      if (!showMyPage) return;

      try {
        const profile = await authApi.getProfile();
        if (mounted) {
          setCurrentUser(profile);
        }
      } catch {
        if (mounted) {
          setShowMyPage(false);
        }
      }
    }

    refreshProfile();

    return () => {
      mounted = false;
    };
  }, [showMyPage, setCurrentUser, setShowMyPage]);

  // ─── Auth handlers ─────────────────────────────────────────────────────────
  const handleLogin = (user) => {
    setCurrentUser(user);
    setShowAdmin(user?.role === 'admin');
  };
  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      resetAuth();
    }
  };
  const handleDeleteAccount = () => {
    if (!currentUser) return;
    setUsers(users.map((u) => u.id === currentUser.id ? { ...u, status: 'inactive' } : u));
    handleLogout();
  };
  const handleUpdateUser = (updated) => {
    setCurrentUser(updated);
    setUsers(users.map((u) => u.id === updated.id ? updated : u));
  };

  // ─── Recipe handlers ────────────────────────────────────────────────────────
  const handleAddRecipe = (data) => addRecipe(data, currentUser?.id);

  // ─── Inquiry handlers ───────────────────────────────────────────────────────
  const handleAddInquiry = (subject, content) => {
    if (!currentUser) return;
    addInquiry({
      id: `q_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      subject,
      content,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    });
  };

  // ─── Shopping → Fridge ─────────────────────────────────────────────────────
  const handleMoveCheckedToFridge = () => {
    const checked = shoppingItems.filter((item) => item.checked);
    if (checked.length === 0) return;

    const moved = checked.map((item, index) => ({
      id: `ing_shop_${Date.now()}_${index}`,
      name: item.name,
      category: item.category,
      quantity: item.quantity || '1개',
      location: '냉장',
      expiryDate: '기한없음',
      emoji: CATEGORY_EMOJIS[item.category],
      addedDate: new Date().toISOString().split('T')[0],
      memo: '장보기 목록에서 반영',
    }));

    addIngredients(moved);
    clearChecked();
    setActiveTab('fridge');
  };

  // ─── Not logged in ─────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ width: '100%', minHeight: '100%', display: 'grid', placeItems: 'center', background: '#F2F4F5' }}>
        <div style={{ color: '#54716B', fontWeight: 700 }}>로그인 상태 확인 중...</div>
      </div>
    );
  }

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
            currentUser={currentUser}
            users={users}
            recipes={recipes}
            inquiries={inquiries}
            presetIngredients={presetIngredients}
            onClose={handleLogout}
            onUpdateUsers={setUsers}
            onUpdateRecipes={setRecipes}
            onAnswerInquiry={answerInquiry}
            onDeleteInquiry={deleteInquiry}
            onDeleteAnswer={deleteAnswer}
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
                discardedItems={mockDiscardedItems}
                onNavigate={setActiveTab}
                onOpenMyPage={() => setShowMyPage(true)}
              />
            )}
            {activeTab === 'fridge' && (
              <FridgeManager
                ingredients={ingredients}
                presetIngredients={presetIngredients}
                onAdd={addIngredient}
                onUpdate={updateIngredient}
                onUse={useIngredient}
                onDelete={deleteIngredient}
              />
            )}
            {activeTab === 'recipe' && (
              <RecipeView
                recipes={recipes}
                ingredients={ingredients}
                currentUser={currentUser}
                comments={comments}
                presetIngredients={presetIngredients}
                onToggleFavorite={toggleFavorite}
                onAddRecipe={handleAddRecipe}
                onUpdateRecipe={updateRecipe}
                onDeleteRecipe={deleteRecipe}
                onAddComment={addComment}
              />
            )}
            {activeTab === 'shopping' && (
              <ShoppingList
                items={shoppingItems}
                onToggle={toggleShoppingItem}
                onDelete={deleteShoppingItem}
                onAdd={addShoppingItem}
                onClearChecked={clearChecked}
                onMoveCheckedToFridge={handleMoveCheckedToFridge}
              />
            )}
            {activeTab === 'inquiry' && (
              <InquiryPage
                inquiries={inquiries}
                currentUser={currentUser}
                onAddInquiry={handleAddInquiry}
                onUpdateInquiry={updateInquiry}
                onDeleteInquiry={deleteInquiry}
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
