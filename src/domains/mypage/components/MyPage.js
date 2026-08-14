import { useEffect, useState } from 'react';
import { X, Plus, LogOut, Shield, ChevronRight, User as UserIcon, Crown, Refrigerator, Link2, Unlink, HandHeart, Lightbulb, MessageSquare, Pencil } from 'lucide-react';
import { authApi } from '@/apis/authApi';
import { getAccessToken } from '@/apis/axiosClient';
import { fridgeApi } from '@/apis/fridgeApi';
import { C } from '@/shared/data/mockData';

const HOUSEHOLD_TYPES = ['1인', '2인', '3인 이상', '기타'];
const FAVORITE_FOODS_LIST = ['한식', '중식', '양식', '일식', '아시안', '후식', '분식'];
const NICKNAME_PATTERN = /^[가-힣A-Za-z0-9 ]+$/;
const INVALID_NICKNAME_MESSAGE = '닉네임은 한글, 영문, 숫자, 공백만 사용할 수 있습니다.';

const SOCIAL_PROVIDER_LABELS = {
  KAKAO: '카카오',
  NAVER: '네이버',
};

const SOCIAL_PROVIDER_STYLES = {
  KAKAO: { logo: 'K', background: '#FEE500', color: '#191919' },
  NAVER: { logo: 'N', background: '#03C75A', color: '#FFFFFF' },
};

const SUBSCRIPTION_STATUS_LABELS = {
  TRIALING: '무료 체험 중',
  ACTIVE: '프리미엄 이용 중',
  CANCELED: '해지 예약',
  EXPIRED: '만료',
};

const inputStyle = {
  width: '100%',
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: '10px',
  padding: '10px 12px',
  color: C.fg,
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const sectionTitle = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  color: C.fgMuted,
  marginBottom: '10px',
  textTransform: 'uppercase',
};

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

function normalizeAvoidIngredient(item) {
  if (typeof item === 'string') {
    return { productId: null, name: item, productCategoryId: null, category: '기타' };
  }

  return {
    productId: item.productId ?? null,
    name: item.name,
    productCategoryId: item.productCategoryId ?? null,
    category: CATEGORY_NAMES[item.productCategoryId] ?? item.category ?? '기타',
  };
}

function normalizePreferences(user) {
  const preferences = user.preferences || {};
  const avoidIngredients = [
    ...(preferences.avoidIngredients || []),
    ...(preferences.allergies || []),
  ].map(normalizeAvoidIngredient);
  const uniqueAvoidIngredients = Array.from(
    new Map(avoidIngredients.map((item) => [item.productId ?? item.name, item])).values()
  );

  return {
    ...preferences,
    favoriteFoods: preferences.favoriteFoods || [],
    allergies: [],
    avoidIngredients: uniqueAvoidIngredients,
  };
}

export function MyPage({
  user,
  onClose,
  onLogout,
  onWithdraw,
  onUpdate,
  onOpenAdmin,
  fridgeInfo,
  subscriptionStatus,
  subscriptionLoading = false,
  onOpenSubscription,
  onOpenFamilyManagement,
  onNavigate,
  embedded = false,
  editOnly = false,
}) {
  const [form, setForm] = useState({
    ...user,
    preferences: normalizePreferences(user),
  });
  const [avoidInput, setAvoidInput] = useState('');
  const [showAvoidSuggestions, setShowAvoidSuggestions] = useState(false);
  const [avoidSuggestions, setAvoidSuggestions] = useState([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialError, setSocialError] = useState('');
  const [editMode, setEditMode] = useState(editOnly);

  useEffect(() => {
    setForm({
      ...user,
      preferences: normalizePreferences(user),
    });
  }, [user]);

  useEffect(() => {
    setEditMode(editOnly);
  }, [editOnly]);

  useEffect(() => {
    let alive = true;
    setSocialLoading(true);
    setSocialError('');

    authApi.getSocialAccounts()
      .then((accounts) => {
        if (alive) setSocialAccounts(accounts || []);
      })
      .catch((error) => {
        if (alive) setSocialError(error.message || '소셜 연동 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (alive) setSocialLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [user?.memberId, user?.id]);

  useEffect(() => {
    const keyword = avoidInput.trim();
    if (!keyword || !showAvoidSuggestions) {
      setAvoidSuggestions([]);
      return;
    }

    let alive = true;
    fridgeApi.searchProducts(keyword)
      .then((items) => {
        if (!alive) return;
        const selectedIds = new Set(form.preferences.avoidIngredients.map((item) => item.productId).filter(Boolean));
        const selectedNames = new Set(form.preferences.avoidIngredients.map((item) => item.name));
        setAvoidSuggestions(
          items
            .map(normalizeAvoidIngredient)
            .filter((item) => !selectedIds.has(item.productId) && !selectedNames.has(item.name))
            .slice(0, 6)
        );
      })
      .catch(() => {
        if (alive) setAvoidSuggestions([]);
      });

    return () => {
      alive = false;
    };
  }, [avoidInput, form.preferences.avoidIngredients, showAvoidSuggestions]);

  const toggleFavorite = (item) => {
    const list = form.preferences.favoriteFoods;
    const updated = list.includes(item) ? list.filter((f) => f !== item) : [...list, item];
    setForm({ ...form, preferences: { ...form.preferences, favoriteFoods: updated } });
  };

  const addAvoid = (item) => {
    const nextItem = typeof item === 'object' && item !== null
      ? normalizeAvoidIngredient(item)
      : normalizeAvoidIngredient({ name: avoidInput.trim() });
    if (!nextItem.name || !nextItem.productId) return;
    const exists = form.preferences.avoidIngredients.some((avoidIngredient) =>
      (nextItem.productId && avoidIngredient.productId === nextItem.productId)
      || avoidIngredient.name === nextItem.name
    );

    if (!exists) {
      setForm({
        ...form,
        preferences: {
          ...form.preferences,
          avoidIngredients: [...form.preferences.avoidIngredients, nextItem],
        },
      });
    }
    setAvoidInput('');
    setShowAvoidSuggestions(false);
  };

  const removeAvoid = (item) => {
    setForm({
      ...form,
      preferences: {
        ...form.preferences,
        avoidIngredients: form.preferences.avoidIngredients.filter((avoidIngredient) =>
          (item.productId || item.name) !== (avoidIngredient.productId || avoidIngredient.name)
        ),
      },
    });
  };

  const handleLinkSocialAccount = (provider) => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setSocialError('소셜 계정 연동을 위해 다시 로그인해주세요.');
      return;
    }

    const query = new URLSearchParams({ linkAccessToken: accessToken });
    window.location.href = `/oauth2/authorization/${provider.toLowerCase()}?${query.toString()}`;
  };

  const handleUnlinkSocialAccount = async (provider) => {
    const providerLabel = SOCIAL_PROVIDER_LABELS[provider] || provider;
    if (!window.confirm(`${providerLabel} 연동을 해지할까요?`)) return;

    setSocialError('');
    try {
      await authApi.unlinkSocialAccount(provider);
      setSocialAccounts((accounts) => accounts.filter((account) => account.provider !== provider));
    } catch (error) {
      setSocialError(error.message || '소셜 연동 해지에 실패했습니다.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    const nickname = (form.name || form.nickname || '').trim();
    if (!NICKNAME_PATTERN.test(nickname)) {
      setSaveError(INVALID_NICKNAME_MESSAGE);
      setSaving(false);
      return;
    }
    try {
      const savedUser = await onUpdate({ ...form, preferences: { ...form.preferences, allergies: [] } });
      if (savedUser) {
        setForm({ ...savedUser, preferences: normalizePreferences(savedUser) });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setSaveError(error.message || '프로필 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const isPremium = subscriptionStatus?.premium;
  const currentMemberId = user?.memberId ?? Number(user?.id);
  const isFamilyPremiumMember = isPremium
    && subscriptionStatus?.memberId
    && currentMemberId
    && Number(subscriptionStatus.memberId) !== Number(currentMemberId);
  const subscriptionLabel = subscriptionStatus?.status
    ? SUBSCRIPTION_STATUS_LABELS[subscriptionStatus.status] ?? subscriptionStatus.status
    : '무료 이용 중';
  const premiumTitle = isFamilyPremiumMember ? '가족 프리미엄 이용 중' : subscriptionLabel;
  const premiumBadge = isFamilyPremiumMember ? '가족 구성원' : '구독 중';
  const myPageMenus = [
    { id: 'share', label: '재료 함께 나눔', description: '주변 이웃과 재료 나눔', Icon: HandHeart, color: C.primary, background: C.primaryLight },
    { id: 'quiz', label: '퀴즈', description: '냉파 퀴즈 참여', Icon: Lightbulb, color: C.warn, background: C.warnLight },
    { id: 'inquiry', label: '문의', description: '문의 작성·확인', Icon: MessageSquare, color: '#3974C6', background: '#EAF2FF' },
    { id: 'subscription', label: '구독 관리', description: '구독 상태·결제 관리', Icon: Crown, color: C.primary, background: C.primaryLight },
  ];

  const handleOpenMenu = (menuId) => {
    if (menuId === 'subscription') {
      onOpenSubscription?.();
    } else {
      onNavigate?.(menuId);
    }
    if (!embedded) {
      onClose?.();
    }
  };


  const handleWithdrawClick = async () => {
    if (subscriptionStatus?.premium && !subscriptionStatus?.cancelReserved) {
      alert('현재 구독 중이라 회원탈퇴가 불가합니다. 구독 취소 후 다시 시도해주세요.');
      return;
    }

    if (!window.confirm('정말 회원을 탈퇴하시겠습니까?')) {
      return;
    }

    try {
      await onWithdraw?.();
    } catch (error) {
      alert(error?.response?.data?.message || error?.message || '회원탈퇴에 실패했습니다.');
    }
  };

  return (
    <div
      style={embedded
        ? { minHeight: '100%', background: C.bg, display: 'flex', justifyContent: 'center' }
        : { position: 'fixed', inset: 0, background: C.bg, zIndex: 200, display: 'flex', justifyContent: 'center' }}
    >
      <div
        style={{
          background: C.bg,
          width: '100%',
          maxWidth: embedded ? '960px' : '560px',
          display: 'flex',
          flexDirection: 'column',
          overflow: embedded ? 'visible' : 'hidden',
        }}
      >
        {!editOnly && (
          <>
            {/* Header */}
            <div
              style={{
                padding: '20px 20px 16px',
                borderBottom: `1px solid ${C.border}`,
                background: C.card,
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0 }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '18px',
                  background: C.primaryLight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <UserIcon size={22} color={C.primary} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '16px', color: C.fg }}>{user.name}</div>
                <div style={{ fontSize: '12px', color: C.fgMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
              </div>
            </div>
            {!embedded && (
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.fgMuted, flexShrink: 0 }}>
                <X size={20} />
              </button>
            )}
          </div>
          <div
            style={{
              width: '100%',
              background: isPremium ? 'linear-gradient(135deg, #0E8478 0%, #0AAE9F 100%)' : '#F5FAF8',
              border: isPremium ? 'none' : `1px solid ${C.border}`,
              borderRadius: '18px',
              padding: '14px',
              color: isPremium ? '#FFFFFF' : C.fg,
              boxSizing: 'border-box',
              boxShadow: isPremium ? '0 12px 24px rgba(14,132,120,0.18)' : 'inset 0 0 0 1px rgba(255,255,255,0.45)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '11px', minWidth: 0 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '15px', background: isPremium ? 'rgba(255,255,255,0.16)' : '#E0F4F0', display: 'grid', placeItems: 'center', flexShrink: 0, color: isPremium ? '#FFFFFF' : C.primary }}>
                  {isPremium ? <Crown size={19} /> : <Refrigerator size={19} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 950, color: isPremium ? '#FFFFFF' : C.primary }}>
                      {subscriptionLoading ? '구독 확인 중' : isPremium ? premiumTitle : '프리미엄 구독 안내'}
                    </span>
                    <span style={{ padding: '3px 7px', borderRadius: '999px', background: isPremium ? 'rgba(255,255,255,0.18)' : C.primaryLight, color: isPremium ? '#FFFFFF' : C.primary, fontSize: '10px', fontWeight: 900 }}>
                      {isPremium ? premiumBadge : '미구독'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '5px', color: isPremium ? '#EAFBF8' : C.fgMuted, lineHeight: 1.35 }}>
                    {isPremium
                      ? isFamilyPremiumMember
                        ? '결제자 가족 냉장고에 참여 중이라 프리미엄 기능을 함께 사용할 수 있어요.'
                        : '무료 기능에 더해 프리미엄 기능 3가지를 사용할 수 있어요.'
                      : 'AI 추천, 영수증 등록, 가족 공유는 구독으로 이용할 수 있어요.'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '9px' }}>
                    {[
                      { label: 'AI 장보기', enabled: isPremium },
                      { label: '영수증 등록', enabled: isPremium },
                      { label: '가족공유', enabled: isPremium },
                    ].map((feature) => (
                      <span
                        key={feature.label}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '999px',
                          background: isPremium ? 'rgba(255,255,255,0.14)' : '#FFFFFF',
                          color: isPremium ? '#EAFBF8' : C.fgMuted,
                          fontSize: '10px',
                          fontWeight: 800,
                          border: isPremium ? '1px solid rgba(255,255,255,0.12)' : `1px solid ${C.border}`,
                        }}
                      >
                        {feature.enabled ? 'O' : 'X'} {feature.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ flexShrink: 0, alignSelf: 'center', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '7px' }}>
                {!isPremium ? (
                  <button
                    onClick={onOpenSubscription}
                    disabled={subscriptionLoading}
                    style={{ padding: '11px 14px', border: 'none', borderRadius: '14px', background: subscriptionLoading ? C.card : C.primary, color: subscriptionLoading ? C.fgMuted : '#FFFFFF', fontSize: '12px', fontWeight: 950, cursor: subscriptionLoading ? 'wait' : 'pointer', boxShadow: subscriptionLoading ? 'none' : '0 8px 18px rgba(14,132,120,0.18)' }}
                  >
                    구독 보기
                  </button>
                ) : null}
              </div>
            </div>
          </div>
            </div>
          </>
        )}

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: editOnly ? '16px 20px 24px' : '20px',
            background: 'transparent',
          }}
        >
          {/* Admin shortcut */}
          {!editOnly && user.role === 'admin' && (
            <button
              onClick={() => { onOpenAdmin(); onClose(); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: C.primaryLight,
                borderRadius: '16px',
                marginBottom: '20px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Shield size={18} color={C.primary} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: C.primary }}>관리자 대시보드</div>
                  <div style={{ fontSize: '11px', color: C.fgMuted }}>회원·레시피·통계·문의 관리</div>
                </div>
              </div>
              <ChevronRight size={16} color={C.primary} />
            </button>
          )}

          {!editOnly && (
            <div style={{ marginBottom: '20px' }}>
              <div style={sectionTitle}>서비스 메뉴</div>
            <div className="mypage-service-menu" style={{ display: 'grid', gridTemplateColumns: embedded ? 'repeat(5, minmax(0, 1fr))' : 'repeat(4, 1fr)', gap: '12px' }}>
              {myPageMenus.map(({ id, label, description, Icon, color, background }) => (
                <button
                  key={id}
                  className="mypage-service-card"
                  onClick={() => handleOpenMenu(id)}
                  style={{
                    minHeight: embedded ? '118px' : '92px',
                    padding: embedded ? '18px 12px' : '12px 8px',
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: '18px',
                    color: C.fg,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ width: embedded ? '44px' : '34px', height: embedded ? '44px' : '34px', borderRadius: '14px', background, color, display: 'grid', placeItems: 'center' }}>
                    <Icon size={embedded ? 22 : 18} strokeWidth={2.2} />
                  </span>
                  <span style={{ fontSize: embedded ? '14px' : '12px', fontWeight: 900, lineHeight: 1.2 }}>{label}</span>
                  <span style={{ fontSize: embedded ? '12px' : '10px', color: C.fgMuted, lineHeight: 1.25 }}>{description}</span>
                </button>
              ))}
              {!editMode && (
                <button
                  className="mypage-service-card"
                  onClick={() => onNavigate?.('mypage-edit')}
                  style={{
                    minHeight: embedded ? '118px' : '92px',
                    padding: embedded ? '18px 12px' : '12px 8px',
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: '18px',
                    color: C.fg,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ width: embedded ? '44px' : '34px', height: embedded ? '44px' : '34px', borderRadius: '14px', background: C.primaryLight, color: C.primary, display: 'grid', placeItems: 'center' }}>
                    <Pencil size={embedded ? 21 : 17} />
                  </span>
                  <span style={{ fontSize: embedded ? '14px' : '12px', fontWeight: 900, lineHeight: 1.2 }}>마이페이지 수정</span>
                  <span style={{ fontSize: embedded ? '12px' : '10px', color: C.fgMuted, lineHeight: 1.25 }}>내 정보 수정</span>
                </button>
              )}
              </div>
            </div>
          )}

          {!editMode && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={handleWithdrawClick}
                  style={{
                    width: '100%', padding: '12px', background: C.dangerLight, border: `1px solid ${C.danger}`,
                    borderRadius: '16px', color: C.danger, fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  회원탈퇴
                </button>
                <button
                  onClick={onLogout}
                  style={{
                    width: '100%', padding: '12px', background: 'none', border: `1px solid ${C.border}`,
                    borderRadius: '16px', color: C.fgMuted, fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  <LogOut size={15} />
                  로그아웃
                </button>
              </div>

              <div style={{ fontSize: '11px', color: C.fgSubtle, textAlign: 'center', marginTop: '8px' }}>
                가입일 {user.joinDate} · {user.role === 'admin' ? '관리자' : '일반 회원'}
              </div>
            </>
          )}

          {editMode && (
            <>
              {editOnly ? (
                <div style={{ padding: '20px', background: C.card, borderBottom: `1px solid ${C.border}`, margin: '-16px -20px 16px' }}>
                  <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.1em', fontWeight: 700, marginBottom: '2px' }}>
                    MY PAGE
                  </div>
                  <h1 style={{ fontSize: '22px', fontWeight: 700, color: C.fg, margin: 0, letterSpacing: '-0.02em' }}>
                    마이페이지 수정
                  </h1>
                  <div style={{ fontSize: '12px', color: C.fgMuted, marginTop: '5px' }}>
                    닉네임, 선호 음식, 못 먹는 재료와 소셜 계정 연동을 관리합니다.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={sectionTitle}>마이페이지 수정</div>
                  <button onClick={() => setEditMode(false)} style={{ background: 'none', border: 'none', color: C.fgMuted, fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                    닫기
                  </button>
                </div>
              )}

              <div style={editOnly ? { background: C.card, border: `1px solid ${C.border}`, borderRadius: '22px', padding: '18px', marginBottom: '16px' } : undefined}>
              {/* Profile info */}
              <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: 900, color: C.fg, marginBottom: '12px' }}>기본 정보</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', color: C.fgMuted, marginBottom: '5px' }}>이름</div>
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value, nickname: e.target.value })}
                />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: C.fgMuted, marginBottom: '5px' }}>이메일</div>
                <input style={{ ...inputStyle, color: C.fgMuted, cursor: 'not-allowed' }} value={form.email} readOnly />
              </div>
              <div>
                <div style={{ fontSize: '13px', color: C.fg, fontWeight: 900, marginBottom: '8px' }}>가구 유형</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {HOUSEHOLD_TYPES.map((ht) => (
                    <button
                      key={ht}
                      onClick={() => setForm({ ...form, householdType: ht })}
                      style={{
                        padding: '8px 4px',
                        background: form.householdType === ht ? C.primaryLight : C.surface,
                        border: `1px solid ${form.householdType === ht ? C.primary : C.border}`,
                        borderRadius: '10px',
                        color: form.householdType === ht ? C.primary : C.fgMuted,
                        fontSize: '11px',
                        fontWeight: form.householdType === ht ? 700 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      {ht}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Social accounts */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: 900, color: C.fg, marginBottom: '12px' }}>소셜 로그인 연동</div>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: '16px', background: C.card, overflow: 'hidden' }}>
              {socialLoading ? (
                <div style={{ padding: '14px', color: C.fgMuted, fontSize: '12px' }}>연동 정보를 확인 중입니다.</div>
              ) : (
                <>
                  {Object.keys(SOCIAL_PROVIDER_LABELS).map((provider) => {
                    const account = socialAccounts.find((item) => item.provider === provider);
                    const linked = Boolean(account);

                    return (
                      <div key={provider} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '13px 14px', borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '13px',
                              background: SOCIAL_PROVIDER_STYLES[provider]?.background || C.primaryLight,
                              color: SOCIAL_PROVIDER_STYLES[provider]?.color || C.primary,
                              display: 'grid',
                              placeItems: 'center',
                              flexShrink: 0,
                              fontSize: '15px',
                              fontWeight: 950,
                              letterSpacing: '-0.03em',
                            }}
                          >
                            {SOCIAL_PROVIDER_STYLES[provider]?.logo || <Link2 size={16} />}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ color: C.fg, fontSize: '13px', fontWeight: 900 }}>{SOCIAL_PROVIDER_LABELS[provider]}</div>
                            <div style={{ color: C.fgMuted, fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {linked ? account.providerEmail || user.email || '연동 완료' : '아직 연동되지 않았습니다.'}
                            </div>
                          </div>
                        </div>
                        {linked ? (
                          <button
                            onClick={() => handleUnlinkSocialAccount(provider)}
                            disabled={socialAccounts.length <= 1}
                            title={socialAccounts.length <= 1 ? '마지막 소셜 연동은 해지할 수 없습니다.' : '연동 해지'}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', border: `1px solid ${socialAccounts.length <= 1 ? C.border : C.danger}`, borderRadius: '10px', background: socialAccounts.length <= 1 ? C.surface : C.dangerLight, color: socialAccounts.length <= 1 ? C.fgMuted : C.danger, padding: '7px 9px', fontSize: '11px', fontWeight: 800, cursor: socialAccounts.length <= 1 ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                          >
                            <Unlink size={12} />
                            해지
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLinkSocialAccount(provider)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', border: `1px solid ${C.primary}`, borderRadius: '10px', background: C.primaryLight, color: C.primary, padding: '7px 10px', fontSize: '11px', fontWeight: 900, cursor: 'pointer', flexShrink: 0 }}
                          >
                            <Link2 size={12} />
                            연동하기
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            <div style={{ fontSize: '11px', color: C.fgMuted, lineHeight: 1.4, marginTop: '8px' }}>
              카카오/네이버를 추가로 연동하면 다음 로그인부터 원하는 소셜 계정으로 접속할 수 있어요. 마지막 로그인 수단은 계정 보호를 위해 해지할 수 없습니다.
            </div>
            {socialError && (
              <div style={{ background: C.dangerLight, color: C.danger, borderRadius: '12px', padding: '9px 11px', fontSize: '12px', fontWeight: 700, marginTop: '8px' }}>
                {socialError}
              </div>
            )}
          </div>

          {/* Favorite foods */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: 900, color: C.fg, marginBottom: '12px' }}>선호 음식</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {FAVORITE_FOODS_LIST.map((food) => {
                const isOn = form.preferences.favoriteFoods.includes(food);
                return (
                  <button
                    key={food}
                    onClick={() => toggleFavorite(food)}
                    style={{
                      padding: '6px 12px',
                      background: isOn ? C.primary : C.surface,
                      border: `1px solid ${isOn ? C.primary : C.border}`,
                      borderRadius: '20px',
                      color: isOn ? '#FFFFFF' : C.fgMuted,
                      fontSize: '12px',
                      fontWeight: isOn ? 700 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {food}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Avoid ingredients */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '15px', fontWeight: 900, color: C.fg, marginBottom: '12px' }}>못 먹는 재료</div>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="사전 재료 검색 후 선택"
                  value={avoidInput}
                  onChange={(e) => { setAvoidInput(e.target.value); setShowAvoidSuggestions(true); }}
                  onKeyDown={(e) => e.key === 'Enter' && addAvoid()}
                  onFocus={() => { if (avoidInput.trim()) setShowAvoidSuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowAvoidSuggestions(false), 150)}
                />
                <button
                  onClick={() => addAvoid()}
                  style={{
                    padding: '10px 14px',
                    background: C.primary,
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
              {avoidSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: '50px',
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(17,32,29,0.12)',
                  zIndex: 10,
                  marginTop: '4px',
                  overflow: 'hidden',
                }}>
                  {avoidSuggestions.map((item) => (
                    <button
                      key={item.productId ?? item.name}
                      onMouseDown={() => addAvoid(item)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: C.fg,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      <span>{item.name}</span>
                      <span style={{ fontSize: '10px', color: C.fgMuted }}>{item.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {form.preferences.avoidIngredients.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {form.preferences.avoidIngredients.map((item) => (
                  <span
                    key={item.productId ?? item.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      background: C.warnLight,
                      borderRadius: '20px',
                      fontSize: '12px',
                      color: C.warn,
                      fontWeight: 600,
                    }}
                  >
                    {item.name}
                    <button
                      onClick={() => removeAvoid(item)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.warn, padding: 0, lineHeight: 1 }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Save */}
          {saveError && (
            <div
              style={{
                background: C.dangerLight,
                color: C.danger,
                borderRadius: '12px',
                padding: '10px 12px',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '10px',
              }}
            >
              {saveError}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '14px',
              background: saved ? C.surface : C.primary,
              color: saved ? C.primary : '#FFFFFF',
              border: saved ? `1px solid ${C.primaryMid}` : 'none',
              borderRadius: '16px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: saving ? 'wait' : 'pointer',
              transition: 'all 0.2s',
              marginBottom: '12px',
            }}
          >
            {saving ? '저장 중...' : saved ? '✓ 저장되었습니다' : '프로필 저장'}
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              padding: '12px',
              background: 'none',
              border: `1px solid ${C.border}`,
              borderRadius: '16px',
              color: C.fgMuted,
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <LogOut size={15} />
            로그아웃
          </button>

          <div style={{ fontSize: '11px', color: C.fgSubtle, textAlign: 'center', marginTop: '8px' }}>
            가입일 {user.joinDate} · {user.role === 'admin' ? '관리자' : '일반 회원'}
          </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
