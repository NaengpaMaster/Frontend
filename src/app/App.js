'use client';

import { useEffect, useState } from 'react';
import { authApi } from '@/apis/authApi';
import { fridgeApi } from '@/apis/fridgeApi';
import { notificationApi } from '@/apis/notificationApi';
import { subscriptionApi } from '@/apis/subscriptionApi';
import { BottomNav } from '@/shared/components/BottomNav';
import { Sidebar } from '@/shared/components/Sidebar';
import { Dashboard } from '@/domains/dashboard/components/Dashboard';
import { FridgeManager } from '@/domains/fridge/components/FridgeManager';
import { FamilyFridgeModal } from '@/domains/fridge/components/FamilyFridgeModal';
import { RecipeView } from '@/domains/recipes/components/RecipeView';
import { ShoppingList } from '@/domains/shopping/components/ShoppingList';
import { InquiryPage } from '@/domains/inquiry/components/InquiryPage';
import { AuthScreen } from '@/domains/auth/components/AuthScreen';
import { MyPage } from '@/domains/mypage/components/MyPage';
import { SubscriptionPage } from '@/domains/subscription/components/SubscriptionPage';
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
  const [homeLoading, setHomeLoading] = useState(true);
  const [fridgeInfo, setFridgeInfo] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [showSubscriptionPage, setShowSubscriptionPage] = useState(false);
  const [showFamilyFridgeModal, setShowFamilyFridgeModal] = useState(false);
  const [receivedFamilyInvites, setReceivedFamilyInvites] = useState([]);
  const [homeIngredients, setHomeIngredients] = useState([]);

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
    ingredients, presetIngredients, accessibleFridges, selectedFridgeId,
    fetchAccessibleFridges, setSelectedFridgeId,
    fetchIngredients, addIngredient, updateIngredient, useIngredient, deleteIngredient, transferIngredient, requestIngredient, setPresetIngredients,
  } = useIngredientStore();
  const {
    recipes, userRecipes, userRecipesLoading, userRecipesPage, userRecipesTotalPages,
    addRecipe, updateRecipe, deleteRecipe, fetchUserRecipes, fetchUserRecipesNext, toggleUserRecipeFavorite,
    homeRecipes, homeRecipesTotal, fetchHomeRecipes, urgentHomeRecipes, fetchUrgentHomeRecipes,
    fetchAdminRecipes, adminUpdateRecipe, adminDeleteRecipe,
    adminPage, adminTotalPages, adminTotalElements, adminSize,
  } = useRecipeStore();
  const [pendingRecipeId, setPendingRecipeId] = useState(null);
  const {
    shoppingItems,
    recommendationItems, recommendationLoading, recommendationError,
    fetchShoppingItems, addShoppingItem, toggleShoppingItem, updateShoppingItem, deleteShoppingItem, clearChecked, moveCheckedToFridge, setSelectedFridgeId: setShoppingSelectedFridgeId,
    fetchAgentRecommendations, addAgentRecommendationItem,
  } = useShoppingStore();
  const {
    inquiries, adminInquiries, users, adminPendingCount, adminAnsweredCount,
    fetchInquiries, addInquiry, updateInquiry, deleteInquiry,
    fetchAdminInquiries, fetchAdminInquiryDetail, fetchAdminInquiryCounts, adminAnswerInquiry, adminDeleteInquiry, adminDeleteAnswer, setUsers,
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
    let mounted = true;

    async function fetchHomeData() {
      if (!currentUser) {
        setHomeLoading(true);
        setFridgeInfo(null);
        setSubscriptionStatus(null);
        setReceivedFamilyInvites([]);
        setHomeIngredients([]);
        return;
      }

      setHomeLoading(true);
      setSubscriptionLoading(true);
      try {
        const results = await Promise.allSettled([
          fetchAccessibleFridges(),
          fetchShoppingItems(selectedFridgeId),
          fetchHomeRecipes(),
          fetchUrgentHomeRecipes(),
          fridgeApi.getMyFridge(),
          subscriptionApi.getMySubscription(),
          fridgeApi.getReceivedInvites(),
        ]);
        if (!mounted) return;

        const accessibleFridgesResult = results[0];
        if (accessibleFridgesResult.status === 'fulfilled') {
          const fridges = accessibleFridgesResult.value || [];
          const defaultFridgeId = fridges.find((fridge) => fridge.mine)?.fridgeId ?? fridges[0]?.fridgeId;
          if (defaultFridgeId) {
            const myItems = await fridgeApi.getItems(defaultFridgeId);
            const mappedMyItems = myItems.map((item) => ({
              id: item.fridgeItemId,
              productId: item.productId,
              name: item.productName,
              category: ({ 1: '채소/과일', 2: '채소/과일', 3: '육류/어류', 4: '육류/어류', 5: '유제품/계란', 6: '기타', 7: '기타', 8: '양념/소스', 9: '가공식품', 10: '기타' })[item.productCategoryId] ?? '기타',
              quantity: item.quantity,
              expiryDate: item.expiryDate,
              memo: item.memo,
            }));
            setHomeIngredients(mappedMyItems);
            await fetchIngredients(defaultFridgeId);
          }
        }

        const fridgeResult = results[4];
        const subscriptionResult = results[5];
        const receivedInvitesResult = results[6];
        setFridgeInfo(fridgeResult.status === 'fulfilled' ? fridgeResult.value : null);
        setSubscriptionStatus(subscriptionResult.status === 'fulfilled' ? subscriptionResult.value : null);
        setReceivedFamilyInvites(receivedInvitesResult.status === 'fulfilled' ? receivedInvitesResult.value || [] : []);
      } finally {
        if (mounted) {
          setHomeLoading(false);
          setSubscriptionLoading(false);
        }
      }
    }

    fetchHomeData();

    return () => {
      mounted = false;
    };
  }, [currentUser, fetchAccessibleFridges, fetchIngredients, fetchShoppingItems, fetchHomeRecipes, fetchUrgentHomeRecipes]);

  useEffect(() => {
    if (!currentUser || !selectedFridgeId) return;
    setShoppingSelectedFridgeId(selectedFridgeId);
    fetchIngredients(selectedFridgeId);
    fetchShoppingItems(selectedFridgeId);
  }, [currentUser, selectedFridgeId, fetchIngredients, fetchShoppingItems, setShoppingSelectedFridgeId]);

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

  const handleOpenFamilyManagement = () => {
    setShowFamilyFridgeModal(true);
  };

  const refreshFamilyInvites = async () => {
    try {
      const invites = await fridgeApi.getReceivedInvites();
      setReceivedFamilyInvites(invites || []);
    } catch {
      setReceivedFamilyInvites([]);
    }
  };

  const handleAcceptFamilyInvite = async (inviteId) => {
    await fridgeApi.acceptInvite(inviteId);
    await Promise.allSettled([
      fetchIngredients(),
      fridgeApi.getMyFridge().then(setFridgeInfo),
      refreshFamilyInvites(),
    ]);
  };

  const handleRejectFamilyInvite = async (inviteId) => {
    await fridgeApi.rejectInvite(inviteId);
    await refreshFamilyInvites();
  };

  // ─── Recipe handlers ────────────────────────────────────────────────────────
  const handleAddRecipe = (data) => addRecipe(data, currentUser?.id);

  const refreshHomeRecommendations = async () => {
    await Promise.allSettled([
      fetchHomeRecipes(),
      fetchUrgentHomeRecipes(),
    ]);
  };

  const handleAddIngredient = async (data) => {
    setHomeLoading(true);
    try {
      await addIngredient(data);
      await refreshHomeRecommendations();
    } finally {
      setHomeLoading(false);
    }
  };

  const handleUpdateIngredient = async (id, data) => {
    setHomeLoading(true);
    try {
      await updateIngredient(id, data);
      await refreshHomeRecommendations();
    } finally {
      setHomeLoading(false);
    }
  };

  const handleUseIngredient = async (id, remainingQuantity) => {
    setHomeLoading(true);
    try {
      await useIngredient(id, remainingQuantity);
      await refreshHomeRecommendations();
    } finally {
      setHomeLoading(false);
    }
  };

  const handleDeleteIngredient = async (id) => {
    setHomeLoading(true);
    try {
      await deleteIngredient(id);
      await refreshHomeRecommendations();
    } finally {
      setHomeLoading(false);
    }
  };

  const handleTransferIngredient = async (id, data) => {
    setHomeLoading(true);
    try {
      await transferIngredient(id, data);
      await refreshHomeRecommendations();
    } finally {
      setHomeLoading(false);
    }
  };

  const handleRequestIngredient = async (id, data) => {
    await requestIngredient(id, data);
  };

  // ─── Inquiry handlers ───────────────────────────────────────────────────────
  const handleAddInquiry = async (subject, content) => {
    if (!currentUser) return;
    await addInquiry(subject, content);
  };

  // ─── Shopping → Fridge ─────────────────────────────────────────────────────
  const handleMoveCheckedToFridge = async () => {
    setHomeLoading(true);
    try {
      await moveCheckedToFridge();
      await fetchIngredients(selectedFridgeId);
      await refreshHomeRecommendations();
      setActiveTab('fridge');
    } finally {
      setHomeLoading(false);
    }
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
            recipes={recipes}
            inquiries={adminInquiries}
            presetIngredients={presetIngredients}
            onClose={handleLogout}
            onFetchRecipes={fetchAdminRecipes}
            adminPage={adminPage}
            adminTotalPages={adminTotalPages}
            adminTotalElements={adminTotalElements}
            adminSize={adminSize}
            onAdminUpdateRecipe={adminUpdateRecipe}
            onAdminDeleteRecipe={adminDeleteRecipe}
            onFetchInquiries={fetchAdminInquiries}
            onFetchInquiryDetail={fetchAdminInquiryDetail}
            onFetchInquiryCounts={fetchAdminInquiryCounts}
            pendingInquiriesCount={adminPendingCount}
            answeredInquiriesCount={adminAnsweredCount}
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
                ingredients={homeIngredients}
                homeRecipes={homeRecipes}
                homeRecipesTotal={homeRecipesTotal}
                urgentHomeRecipes={urgentHomeRecipes}
                currentUser={currentUser}
                fridgeInfo={fridgeInfo}
                subscriptionStatus={subscriptionStatus}
                familyInvites={receivedFamilyInvites}
                loading={homeLoading}
                onNavigate={setActiveTab}
                onOpenMyPage={() => setShowMyPage(true)}
                onOpenFamilyManagement={handleOpenFamilyManagement}
                onAcceptFamilyInvite={handleAcceptFamilyInvite}
                onRejectFamilyInvite={handleRejectFamilyInvite}
                onOpenRecipe={(id) => { setPendingRecipeId(id); setActiveTab('recipe'); }}
              />
            )}
            {activeTab === 'fridge' && (
              <FridgeManager
                ingredients={ingredients}
                presetIngredients={presetIngredients}
                accessibleFridges={accessibleFridges}
                selectedFridgeId={selectedFridgeId}
                onSelectFridge={setSelectedFridgeId}
                onAdd={handleAddIngredient}
                onUpdate={handleUpdateIngredient}
                onUse={handleUseIngredient}
                onDelete={handleDeleteIngredient}
                onTransfer={handleTransferIngredient}
                onRequest={handleRequestIngredient}
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
                accessibleFridges={accessibleFridges}
                selectedFridgeId={selectedFridgeId}
                onSelectFridge={setSelectedFridgeId}
                onToggle={toggleShoppingItem}
                onUpdate={updateShoppingItem}
                onDelete={deleteShoppingItem}
                onAdd={addShoppingItem}
                onClearChecked={clearChecked}
                onMoveCheckedToFridge={handleMoveCheckedToFridge}
                recommendationItems={recommendationItems}
                recommendationLoading={recommendationLoading}
                recommendationError={recommendationError}
                onFetchRecommendations={fetchAgentRecommendations}
                onAddRecommendation={addAgentRecommendationItem}
              />
            )}
            {activeTab === 'inquiry' && (
              <InquiryPage
                inquiries={inquiries}
                currentUser={currentUser}
                onFetchInquiries={fetchInquiries}
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
              fridgeInfo={fridgeInfo}
              subscriptionStatus={subscriptionStatus}
              subscriptionLoading={subscriptionLoading}
              onOpenSubscription={() => setShowSubscriptionPage(true)}
              onOpenFamilyManagement={handleOpenFamilyManagement}
            />
          )}

          {showSubscriptionPage && (
            <SubscriptionPage
              subscriptionStatus={subscriptionStatus}
              onClose={() => setShowSubscriptionPage(false)}
            />
          )}

          {showFamilyFridgeModal && (
            <FamilyFridgeModal
              onClose={() => setShowFamilyFridgeModal(false)}
              subscriptionStatus={subscriptionStatus}
              currentUser={currentUser}
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
