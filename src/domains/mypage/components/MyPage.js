import { useEffect, useState } from 'react';
import { X, Plus, LogOut, Shield, ChevronRight, User as UserIcon, AlertTriangle } from 'lucide-react';
import { C } from '@/shared/data/mockData';

const HOUSEHOLD_TYPES = ['1인', '2인', '3인 이상', '기타'];
const FAVORITE_FOODS_LIST = ['한식', '일식', '중식', '양식', '채식', '샐러드', '파스타', '피자', '라멘', '분식'];

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

export function MyPage({ user, presetIngredients, onClose, onLogout, onUpdate, onDeleteAccount, onOpenAdmin }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    ...user,
    preferences: {
      ...user.preferences,
      allergies: [],
      avoidIngredients: Array.from(new Set([...user.preferences.avoidIngredients, ...user.preferences.allergies])),
    },
  });
  const [avoidInput, setAvoidInput] = useState('');
  const [showAvoidSuggestions, setShowAvoidSuggestions] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({
      ...user,
      preferences: {
        ...user.preferences,
        allergies: [],
        avoidIngredients: Array.from(new Set([...user.preferences.avoidIngredients, ...user.preferences.allergies])),
      },
    });
  }, [user]);

  const avoidSuggestions = avoidInput.trim() && showAvoidSuggestions
    ? presetIngredients
        .filter((i) => i.active)
        .filter((i) => i.name.includes(avoidInput.trim()))
        .filter((i) => !form.preferences.avoidIngredients.includes(i.name))
        .slice(0, 6)
    : [];

  const toggleFavorite = (item) => {
    const list = form.preferences.favoriteFoods;
    const updated = list.includes(item) ? list.filter((f) => f !== item) : [...list, item];
    setForm({ ...form, preferences: { ...form.preferences, favoriteFoods: updated } });
  };

  const addAvoid = (name = avoidInput) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!form.preferences.avoidIngredients.includes(trimmed)) {
      setForm({ ...form, preferences: { ...form.preferences, avoidIngredients: [...form.preferences.avoidIngredients, trimmed] } });
    }
    setAvoidInput('');
    setShowAvoidSuggestions(false);
  };

  const removeAvoid = (item) => {
    setForm({ ...form, preferences: { ...form.preferences, avoidIngredients: form.preferences.avoidIngredients.filter((a) => a !== item) } });
  };

  const handleSave = () => {
    onUpdate({ ...form, preferences: { ...form.preferences, allergies: [] } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                  placeholder="재료명 검색 또는 입력 후 추가"
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
                      key={item.name}
                      onMouseDown={() => addAvoid(item.name)}
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
                    key={item}
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
                    {item}
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
          <button
            onClick={handleSave}
            style={{
              width: '100%',
              padding: '14px',
              background: saved ? C.surface : C.primary,
              color: saved ? C.primary : '#FFFFFF',
              border: saved ? `1px solid ${C.primaryMid}` : 'none',
              borderRadius: '16px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '12px',
            }}
          >
            {saved ? '✓ 저장되었습니다' : '프로필 저장'}
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

          {/* Delete account */}
          {user.role !== 'admin' && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                width: '100%',
                padding: '11px',
                background: 'none',
                border: 'none',
                color: C.danger,
                fontWeight: 500,
                fontSize: '13px',
                cursor: 'pointer',
                opacity: 0.7,
                marginTop: '4px',
              }}
            >
              회원 탈퇴
            </button>
          )}

          <div style={{ fontSize: '11px', color: C.fgSubtle, textAlign: 'center', marginTop: '8px' }}>
            가입일 {user.joinDate} · {user.role === 'admin' ? '관리자' : '일반 회원'}
          </div>

          {/* Delete account confirmation modal */}
          {showDeleteConfirm && (
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
              onClick={() => setShowDeleteConfirm(false)}
            >
              <div
                style={{ background: C.card, borderRadius: '24px', padding: '28px 24px', width: '100%', maxWidth: '340px', textAlign: 'center' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ width: '52px', height: '52px', background: C.dangerLight, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <AlertTriangle size={24} color={C.danger} />
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: C.fg, marginBottom: '8px' }}>정말 탈퇴하시겠어요?</div>
                <div style={{ fontSize: '13px', color: C.fgMuted, lineHeight: 1.6, marginBottom: '24px' }}>
                  탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{ flex: 1, padding: '12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', fontWeight: 600, fontSize: '14px', color: C.fgMuted, cursor: 'pointer' }}
                  >
                    취소
                  </button>
                  <button
                    onClick={onDeleteAccount}
                    style={{ flex: 1, padding: '12px', background: C.danger, border: 'none', borderRadius: '14px', fontWeight: 700, fontSize: '14px', color: '#FFF', cursor: 'pointer' }}
                  >
                    탈퇴하기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
