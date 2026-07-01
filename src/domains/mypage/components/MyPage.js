import { useEffect, useState } from 'react';
import { X, Plus, LogOut, Shield, ChevronRight, User as UserIcon } from 'lucide-react';
import { fridgeApi } from '@/apis/fridgeApi';
import { C } from '@/shared/data/mockData';

const HOUSEHOLD_TYPES = ['1인', '2인', '3인 이상', '기타'];
const FAVORITE_FOODS_LIST = ['한식', '중식', '양식', '일식', '아시안', '후식', '분식'];

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

export function MyPage({ user, onClose, onLogout, onUpdate, onOpenAdmin }) {
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

  useEffect(() => {
    setForm({
      ...user,
      preferences: normalizePreferences(user),
    });
  }, [user]);

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

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
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

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: C.bg, zIndex: 200, display: 'flex', justifyContent: 'center' }}
    >
      <div
        style={{
          background: C.bg,
          width: '100%',
          maxWidth: '560px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 20px 16px',
            borderBottom: `1px solid ${C.border}`,
            background: C.card,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '18px',
                background: C.primaryLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserIcon size={22} color={C.primary} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: C.fg }}>{user.name}</div>
              <div style={{ fontSize: '12px', color: C.fgMuted }}>{user.email}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.fgMuted }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Admin shortcut */}
          {user.role === 'admin' && (
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

          {/* Profile info */}
          <div style={{ marginBottom: '20px' }}>
            <div style={sectionTitle}>기본 정보</div>
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
                <div style={{ fontSize: '11px', color: C.fgMuted, marginBottom: '8px' }}>가구 유형</div>
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

          {/* Favorite foods */}
          <div style={{ marginBottom: '20px' }}>
            <div style={sectionTitle}>선호 음식</div>
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
            <div style={sectionTitle}>못 먹는 재료</div>
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
      </div>
    </div>
  );
}
