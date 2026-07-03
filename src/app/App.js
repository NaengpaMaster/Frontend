'use client';

import { useEffect, useState } from 'react';
import { authApi } from '@/apis/authApi';
import { notificationApi } from '@/apis/notificationApi';
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
import { ExpiryNotificationPopup } from '@/shared/components/ExpiryNotificationPopup';

import useAuthStore from '@/domains/auth/store/useAuthStore';
import useUiStore from '@/shared/store/useUiStore';
import useIngredientStore from '@/domains/fridge/store/useIngredientStore';
import useRecipeStore from '@/domains/recipes/store/useRecipeStore';
import useShoppingStore from '@/domains/shopping/store/useShoppingStore';
import useInquiryStore from '@/domains/inquiry/store/useInquiryStore';

function getNotificationKey(notifications) {
  return notifications
    .map((notification) => notification.notificationId)
    .filter(Boolean)
    .sort((a, b) => a - b)
    .join(',');
}

export default function App() {
  /* MARKER-MAKE-KIT-INVOKED */
  const [showExpiryPopup, setShowExpiryPopup] = useState(false);
  const [dismissedNotificationKey, setDismissedNotificationKey] = useState('');
  const [notifications, setNotifications] = useState([]);

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
    fetchIngredients, addIngredient, updateIngredient, useIngredient, deleteIngredient, setPresetIngredients,
  } = useIngredientStore();
  const {
    recipes, userRecipes, userRecipesLoading, userRecipesPage, userRecipesTotalPages,
    addRecipe, updateRecipe, deleteRecipe, fetchUserRecipes, fetchUserRecipesNext, toggleUserRecipeFavorite,
    homeRecipes, homeRecipesTotal, fetchHomeRecipes, urgentHomeRecipes, fetchUrgentHomeRecipes,
    fetchAdminRecipes, fetchAdminRecipesNext, adminUpdateRecipe, adminDeleteRecipe,
    adminLoading, adminPage, adminTotalPages,
  } = useRecipeStore();
  const [pendingRecipeId, setPendingRecipeId] = useState(null);
  const {
    shoppingItems,
    fetchShoppingItems, addShoppingItem, toggleShoppingItem, deleteShoppingItem, clearChecked, moveCheckedToFridge,
  } = useShoppingStore();
  const {
    inquiries, adminInquiries, users,
    fetchInquiries, addInquiry, updateInquiry, deleteInquiry,
    fetchAdminInquiries, adminAnswerInquiry, adminDeleteInquiry, adminDeleteAnswer, setUsers,
  } = useInquiryStore();

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      if (!authApi.hasStoredRefreshToken()) {
        resetAuth();
        setAuthLoading(false);
        return;
      }

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
    fetchShoppingItems();
    fetchHomeRecipes();
    fetchUrgentHomeRecipes();
    fetchInquiries();
  }, [currentUser, fetchIngredients, fetchShoppingItems, fetchHomeRecipes, fetchUrgentHomeRecipes, fetchInquiries]);

  useEffect(() => {
    let mounted = true;

    async function fetchNotifications() {
      if (!currentUser || activeTab !== 'home') return;

      try {
        const unreadNotifications = await notificationApi.getUnread();
        if (!mounted) return;

        const notificationKey = getNotificationKey(unreadNotifications);
        setNotifications(unreadNotifications);
        setShowExpiryPopup(unreadNotifications.length > 0 && notificationKey !== dismissedNotificationKey);
      } catch {
        if (mounted) {
          setNotifications([]);
          setShowExpiryPopup(false);
        }
      }
    }

    fetchNotifications();

    return () => {
      mounted = false;
    };
  }, [activeTab, currentUser, dismissedNotificationKey]);

  const dismissExpiryPopup = () => {
    setDismissedNotificationKey(getNotificationKey(notifications));
    setShowExpiryPopup(false);
  };

  const confirmNotifications = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications([]);
    } finally {
      dismissExpiryPopup();
    }
  };

  useEffect(() => {
    function handleForbidden() {
      setShowAdmin(false);
    }

    window.addEventListener('naengpa:forbidden', handleForbidden);
    return () => window.removeEventListener('naengpa:forbidden', handleForbidden);
  }, [setShowAdmin]);

  useEffect(() => {
    function handleUnauthorized() {
      resetAuth();
    }

    window.addEventListener('naengpa:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('naengpa:unauthorized', handleUnauthorized);
  }, [resetAuth]);

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
  const handleUpdateUser = async (updated) => {
    const saved = await authApi.updateProfile(updated);
    setCurrentUser(saved);
    setUsers(users.map((u) => u.id === saved.id ? saved : u));
    return saved;
  };

  // ─── Recipe handlers ────────────────────────────────────────────────────────
  const handleAddRecipe = (data) => addRecipe(data, currentUser?.id);

  // ─── Inquiry handlers ───────────────────────────────────────────────────────
  const handleAddInquiry = async (subject, content) => {
    if (!currentUser) return;
    await addInquiry(subject, content);
  };

  // ─── Shopping → Fridge ─────────────────────────────────────────────────────
  const handleMoveCheckedToFridge = async () => {
    await moveCheckedToFridge();
    await fetchIngredients();
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
            inquiries={adminInquiries}
            presetIngredients={presetIngredients}
            onClose={handleLogout}
            onUpdateUsers={setUsers}
            onFetchRecipes={fetchAdminRecipes}
            onFetchNextPage={fetchAdminRecipesNext}
            adminLoading={adminLoading}
            adminPage={adminPage}
            adminTotalPages={adminTotalPages}
            onAdminUpdateRecipe={adminUpdateRecipe}
            onAdminDeleteRecipe={adminDeleteRecipe}
            onFetchInquiries={fetchAdminInquiries}
            onAnswerInquiry={adminAnswerInquiry}
            onDeleteInquiry={adminDeleteInquiry}
            onDeleteAnswer={adminDeleteAnswer}
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
                homeRecipes={homeRecipes}
                homeRecipesTotal={homeRecipesTotal}
                urgentHomeRecipes={urgentHomeRecipes}
                currentUser={currentUser}
                onNavigate={setActiveTab}
                onOpenMyPage={() => setShowMyPage(true)}
                onOpenRecipe={(id) => { setPendingRecipeId(id); setActiveTab('recipe'); }}
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
                recipes={userRecipes}
                recipesLoading={userRecipesLoading}
                onFetchRecipes={fetchUserRecipes}
                onFetchNextPage={fetchUserRecipesNext}
                hasNextPage={userRecipesPage + 1 < userRecipesTotalPages}
                onToggleFavorite={toggleUserRecipeFavorite}
                presetIngredients={presetIngredients}
                onAddRecipe={handleAddRecipe}
                onUpdateRecipe={updateRecipe}
                onDeleteRecipe={deleteRecipe}
                onAddToShoppingList={addShoppingItem}
                onRemoveFromShoppingList={deleteShoppingItem}
                initialRecipeId={pendingRecipeId}
                onInitialRecipeHandled={() => setPendingRecipeId(null)}
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
              onClose={() => setShowMyPage(false)}
              onLogout={handleLogout}
              onUpdate={handleUpdateUser}
              onOpenAdmin={() => setShowAdmin(true)}
            />
          )}

          {showExpiryPopup && (
            <ExpiryNotificationPopup
              notifications={notifications}
              onClose={dismissExpiryPopup}
              onConfirm={confirmNotifications}
              onGoFridge={async () => {
                await confirmNotifications();
                setActiveTab('fridge');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
