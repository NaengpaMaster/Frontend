import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Users, ChefHat, BarChart3, MessageSquare, Trash2, Edit2, CheckCircle, Clock, Search, Package, Plus, ToggleLeft, ToggleRight, Star, CalendarDays, Info } from 'lucide-react';
import {
  C,
  mockDiscardedItems, CATEGORY_EMOJIS,
  CATEGORIES,
} from '@/shared/data/mockData';
import { adminApi } from '@/apis/adminApi';
import { RecipeFormModal } from '@/domains/recipes/components/RecipeFormModal';
import { adminRecipesApi } from '@/apis/recipesApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TAB_ICONS = {
  members:     { icon: Users,         label: '회원' },
  recipes:     { icon: ChefHat,       label: '레시피' },
  ingredients: { icon: Package,       label: '사전재료' },
  stats:       { icon: BarChart3,     label: '통계' },
  inquiries:   { icon: MessageSquare, label: '문의' },
};

// ─── Members ──────────────────────────────────────────────────────────────────
function MembersTab({ users, onUpdate, currentUser }) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('active');
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState('');

  const refreshMembers = async () => {
    setLoading(true);
    setError('');
    try {
      const members = await adminApi.getMemberOverview();
      onUpdate(members);
    } catch (err) {
      setError(err.message || '회원 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function loadMembers() {
      setLoading(true);
      setError('');
      try {
        const members = await adminApi.getMemberOverview();
        if (mounted) {
          onUpdate(members);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || '회원 목록을 불러오지 못했습니다.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadMembers();

    return () => {
      mounted = false;
    };
  }, [onUpdate]);

  const allMembers = users.filter((u) => u.role !== 'admin');
  const activeMembers = allMembers.filter((u) => u.status === 'active');
  const inactiveMembers = allMembers.filter((u) => u.status === 'inactive');
  const adminUsers = users.filter((u) => u.role === 'admin');

  const baseList = viewMode === 'active' ? activeMembers : viewMode === 'inactive' ? inactiveMembers : adminUsers;
  const filtered = baseList.filter((u) => u.name.includes(search) || u.email.includes(search) || u.householdType.includes(search));

  const toggle = async (user) => {
    const nextStatus = user.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    setActionId(user.id);
    setError('');
    try {
      await adminApi.updateMemberStatus(user.memberId, nextStatus);
      await refreshMembers();
    } catch (err) {
      setError(err.message || '회원 상태 변경에 실패했습니다.');
    } finally {
      setActionId(null);
    }
  };

  const changeRole = async (user, newRole) => {
    setActionId(user.id);
    setError('');
    try {
      await adminApi.updateMemberRole(user.memberId, newRole === 'admin' ? 'ADMIN' : 'USER');
      await refreshMembers();
    } catch (err) {
      setError(err.message || '회원 권한 변경에 실패했습니다.');
    } finally {
      setActionId(null);
    }
  };


  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: '16px', color: C.fg }}>회원 관리</div>
        <div style={{ fontSize: '12px', color: C.fgMuted }}>
          {loading ? '회원 목록 불러오는 중...' : `총 ${allMembers.length}명 · 활성 ${activeMembers.length}명`}
        </div>
      </div>

      {error && (
        <div style={{ background: C.dangerLight, color: C.danger, borderRadius: '10px', padding: '10px 12px', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
          {error}
        </div>
      )}

      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.fgMuted }} />
        <input
          style={{
            width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px',
            padding: '10px 12px 10px 34px', color: C.fg, fontSize: '13px', outline: 'none', boxSizing: 'border-box',
          }}
          placeholder="회원 이름, 이메일, 가구 유형 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Stats row - 클릭하면 해당 뷰로 필터 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: '관리자 수', value: adminUsers.length, color: C.fg, mode: 'admin' },
          { label: '전체 회원', value: allMembers.length, color: C.primary, mode: 'active' },
          { label: '탈퇴 회원', value: inactiveMembers.length, color: C.accent, mode: 'inactive' },
        ].map((s) => (
          <div
            key={s.label}
            className="stat-card-hover"
            onClick={() => { setViewMode(s.mode); setSearch(''); }}
            style={{
              background: C.card,
              borderRadius: '14px',
              padding: '12px',
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(17,32,29,0.08)',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '22px', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '9px', color: C.fgSubtle, marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map((u) => (
          <div
            key={u.id}
            style={{
              background: C.card,
              borderRadius: '16px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              opacity: u.status === 'inactive' ? 0.65 : 1,
              boxShadow: '0 2px 10px rgba(17,32,29,0.08)',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '16px',
                background: u.role === 'admin' ? C.primaryLight : C.surface,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
              }}
            >
              {u.role === 'admin' ? '🛡️' : '👤'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: C.fg }}>{u.name}</span>
                <span style={{ fontSize: '9px', background: u.role === 'admin' ? C.primaryLight : C.surface, color: u.role === 'admin' ? C.primary : C.fgMuted, borderRadius: '6px', padding: '1px 5px', fontWeight: 700 }}>
                  {u.role === 'admin' ? '관리자' : '회원'}
                </span>
                {u.status === 'inactive' && (
                  <span style={{ fontSize: '9px', background: C.dangerLight, color: C.danger, borderRadius: '6px', padding: '1px 5px', fontWeight: 800 }}>
                    탈퇴됨
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '1px' }}>
                {u.email} · {u.householdType} · 가입 {u.joinDate}{u.status === 'inactive' ? ' · 탈퇴 상태' : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              {viewMode !== 'admin' && (
                <button
                  onClick={() => toggle(u)}
                  disabled={actionId === u.id}
                  style={{
                    padding: '6px 10px',
                    background: u.status === 'active' ? C.dangerLight : C.primaryLight,
                    borderRadius: '10px',
                    color: u.status === 'active' ? C.danger : C.primary,
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: actionId === u.id ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap',
                    border: 'none',
                  }}
                >
                  {actionId === u.id ? '처리 중' : u.status === 'active' ? '탈퇴 처리' : '가입 복구'}
                </button>
              )}
              {viewMode === 'active' && (
                <button
                  onClick={() => changeRole(u, 'admin')}
                  disabled={actionId === u.id}
                  style={{
                    padding: '6px 10px',
                    background: C.primaryLight,
                    borderRadius: '10px',
                    color: C.primary,
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: actionId === u.id ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap',
                    border: `1px solid ${C.primary}`,
                  }}
                >
                  관리자 지정
                </button>
              )}
              {viewMode === 'admin' && currentUser?.email !== u.email && (
                <button
                  onClick={() => changeRole(u, 'user')}
                  disabled={actionId === u.id}
                  style={{
                    padding: '6px 10px',
                    background: C.warnLight,
                    borderRadius: '10px',
                    color: C.warn,
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: actionId === u.id ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap',
                    border: 'none',
                  }}
                >
                  권한 해제
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '36px 0', color: C.fgMuted, fontSize: '13px' }}>검색 결과가 없어요</div>
        )}
      </div>
    </div>
  );
}

// ─── Recipes ──────────────────────────────────────────────────────────────────
function RecipesTab({ recipes, onFetchRecipes, onFetchNextPage, adminLoading, adminPage, adminTotalPages, onUpdateRecipe, onDeleteRecipe }) {
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const observerRef = useRef(null);

  const sentinelRef = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onFetchNextPage(); },
      { threshold: 0.1 },
    );
    observerRef.current.observe(node);
  }, [onFetchNextPage]);

  const handleSelect = async (recipe) => {
    setDetailLoading(true);
    setError(null);
    try {
      const res = await adminRecipesApi.getById(recipe.recipeId ?? recipe.id);
      const d = res.data?.data ?? res.data;
      console.log('[adminRecipes] detail response:', d);
      setSelected({
        ...d,
        id: d.recipeId ?? d.id,
        name: d.recipeName ?? d.name,
        category: d.categoryName ?? d.category,
        cookTime: d.cookingTime ?? d.cookTime,
        difficulty: d.difficultyLabel ?? d.difficulty,
        requiredIngredients: d.ingredients?.map((i) => typeof i === 'string' ? i : i.ingredientName) ?? d.requiredIngredients ?? [],
        steps: (d.steps ?? d.instructions ?? []).map((s) => typeof s === 'string' ? s : s.content),
        description: d.description ?? '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    onFetchRecipes()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [onFetchRecipes]);

  const handleEdit = async (data) => {
    if (!editing) return;
    try {
      await onUpdateRecipe(editing.id, data);
      setEditing(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await onDeleteRecipe(id);
      setDeleteId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '16px', color: C.fg }}>레시피 관리</div>
          <div style={{ fontSize: '12px', color: C.fgMuted }}>총 {recipes.length}개 · 기존 레시피 수정/삭제</div>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '36px 0', color: C.fgMuted, fontSize: '13px' }}>레시피 불러오는 중...</div>
      )}
      {error && (
        <div style={{ textAlign: 'center', padding: '12px', marginBottom: '12px', background: C.dangerLight, borderRadius: '12px', color: C.danger, fontSize: '13px', fontWeight: 600 }}>{error}</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {recipes.map((r) => (
          <div
            key={r.id}
            onClick={() => handleSelect(r)}
            className="card-hover"
            style={{
              width: '100%',
              background: C.card,
              borderRadius: '16px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(17,32,29,0.08)',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: C.fg }}>{r.name}</span>
                <span style={{ fontSize: '10px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '4px', padding: '1px 5px', color: C.fgMuted }}>{r.category}</span>
              </div>
              <div style={{ fontSize: '11px', color: C.fgMuted }}>
                {r.difficulty} · {r.cookTime}분 · 재료 {r.requiredIngredients.length}개
              </div>
            </div>
            {deleteId === r.id ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} style={{ padding: '6px 10px', background: C.dangerLight, borderRadius: '10px', color: C.danger, fontSize: '11px', fontWeight: 700, cursor: 'pointer', border: 'none' }}>삭제</button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteId(null); }} style={{ padding: '6px 10px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.fgMuted, fontSize: '11px', cursor: 'pointer' }}>취소</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={(e) => { e.stopPropagation(); setEditing(r); }} style={{ padding: '6px 10px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.fgMuted, cursor: 'pointer' }}><Edit2 size={13} /></button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }} style={{ padding: '6px 10px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.fgMuted, cursor: 'pointer' }}><Trash2 size={13} /></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {adminPage + 1 < adminTotalPages && (
        <div ref={sentinelRef} style={{ textAlign: 'center', padding: '20px 0', color: C.fgMuted, fontSize: '13px' }}>
          {adminLoading ? '불러오는 중...' : ''}
        </div>
      )}

      {detailLoading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.45)', zIndex: 650, display: 'grid', placeItems: 'center' }}>
          <div style={{ color: C.fgMuted, fontWeight: 700, fontSize: '14px' }}>상세 정보 불러오는 중...</div>
        </div>
      )}

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.45)', zIndex: 650, display: 'flex', alignItems: 'flex-end' }} onClick={() => setSelected(null)}>
          <div
            style={{ background: C.bg, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: '480px', margin: '0 auto', maxHeight: '88vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.1em', fontWeight: 700, marginBottom: '4px' }}>RECIPE DETAIL</div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: C.fg, margin: 0, lineHeight: 1.1 }}>{selected.name}</h2>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => { setEditing(selected); setSelected(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', background: C.primaryLight, border: 'none', borderRadius: '10px', color: C.primary, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                >
                  <Edit2 size={14} /> 수정
                </button>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.fgMuted }}><X size={20} /></button>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: C.fgMuted, lineHeight: 1.6, marginBottom: '16px' }}>{selected.description}</p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '5px 10px', color: C.fgMuted }}>{selected.category}</span>
              <span style={{ fontSize: '12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '5px 10px', color: C.fgMuted }}>{selected.difficulty}</span>
              <span style={{ fontSize: '12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '5px 10px', color: C.fgMuted }}>{selected.cookTime}분</span>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: C.fgMuted, marginBottom: '10px' }}>필수 재료</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selected.requiredIngredients.map((ri, idx) => (
                  <span key={idx} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: C.primaryLight, color: C.primary }}>{ri}</span>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: C.fgMuted, marginBottom: '12px' }}>조리 과정</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selected.steps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ minWidth: '26px', height: '26px', background: C.primary, color: '#FFF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>{idx + 1}</div>
                    <p style={{ fontSize: '13px', color: C.fg, lineHeight: 1.6, margin: 0, paddingTop: '3px' }}>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <RecipeFormModal
          initial={editing}
          title="레시피 수정"
          onSave={handleEdit}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

// ─── Preset Ingredients ───────────────────────────────────────────────────────
function IngredientsTab({ items, onUpdate }) {
  const [search, setSearch] = useState('');
  const [addName, setAddName] = useState('');
  const [addCategory, setAddCategory] = useState('채소/과일');
  const [addDupError, setAddDupError] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('채소/과일');
  const [deleteIdx, setDeleteIdx] = useState(null);

  const inputStyle = {
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px',
    padding: '9px 12px', color: C.fg, fontSize: '13px', outline: 'none', boxSizing: 'border-box',
  };

  const handleAdd = () => {
    if (!addName.trim()) return;
    if (items.some((i) => i.name === addName.trim())) { setAddDupError(true); return; }
    onUpdate([...items, { name: addName.trim(), category: addCategory, active: true }]);
    setAddName('');
    setAddDupError(false);
  };

  const handleToggle = (idx) => {
    onUpdate(items.map((item, i) => i === idx ? { ...item, active: !item.active } : item));
  };

  const handleDelete = (idx) => {
    onUpdate(items.filter((_, i) => i !== idx));
    setDeleteIdx(null);
  };

  const handleEditSave = (idx) => {
    if (!editName.trim()) return;
    if (items.some((item, i) => i !== idx && item.name === editName.trim())) return;
    onUpdate(items.map((item, i) => i === idx ? { ...item, name: editName.trim(), category: editCategory } : item));
    setEditIdx(null);
  };

  const activeCount = items.filter((i) => i.active).length;
  const filtered = search.trim() ? items.filter((i) => i.name.includes(search.trim()) || i.category.includes(search.trim())) : items;

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: '16px', color: C.fg, marginBottom: '4px' }}>사전 재료 관리</div>
      <div style={{ fontSize: '12px', color: C.fgMuted, marginBottom: '12px' }}>총 {items.length}개 · 활성 {activeCount}개 · 냉장고 재료 검색에 노출됩니다</div>

      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.fgMuted }} />
        <input
          style={{
            width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px',
            padding: '10px 12px 10px 34px', color: C.fg, fontSize: '13px', outline: 'none', boxSizing: 'border-box',
          }}
          placeholder="재료명 또는 카테고리 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Add new */}
      <div style={{ background: C.card, borderRadius: '16px', padding: '14px 16px', marginBottom: '16px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: C.fg, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Plus size={13} color={C.primary} /> 재료 추가
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select style={{ ...inputStyle, width: '130px', flexShrink: 0, cursor: 'pointer' }} value={addCategory} onChange={(e) => setAddCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>)}
          </select>
          <input
            style={{
              ...inputStyle,
              flex: 1,
              minWidth: '100px',
              ...(addDupError ? { border: `1px solid ${C.danger}`, background: C.dangerLight } : {}),
            }}
            placeholder="재료명"
            value={addName}
            onChange={(e) => { setAddName(e.target.value); setAddDupError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button onClick={handleAdd} style={{ padding: '9px 14px', background: C.primary, color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', flexShrink: 0 }}>추가</button>
        </div>
        {addDupError && (
          <div style={{ fontSize: '11px', color: C.danger, marginTop: '6px', fontWeight: 600 }}>이미 등록된 재료입니다</div>
        )}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '36px 0', color: C.fgMuted, fontSize: '13px' }}>검색 결과가 없어요</div>
        )}
        {filtered.map((item) => {
          const idx = items.indexOf(item);
          return (
            <div
              key={idx}
              style={{
                background: C.card,
                borderRadius: '14px',
                padding: '11px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                opacity: item.active ? 1 : 0.5,
                boxShadow: '0 2px 8px rgba(17,32,29,0.07)',
              }}
            >
              <span style={{ fontSize: '16px' }}>{CATEGORY_EMOJIS[item.category]}</span>
              {editIdx === idx ? (
                <>
                  <div style={{ flex: 1, display: 'flex', gap: '6px', minWidth: 0 }}>
                    <input
                      style={{
                        ...inputStyle,
                        flex: 1,
                        fontSize: '13px',
                        minWidth: 0,
                        ...(items.some((it, i) => i !== idx && it.name === editName.trim()) && editName.trim()
                          ? { border: `1px solid ${C.danger}`, background: C.dangerLight }
                          : {}),
                      }}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(idx); if (e.key === 'Escape') setEditIdx(null); }}
                      autoFocus
                    />
                    <select
                      style={{ ...inputStyle, fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>)}
                    </select>
                  </div>
                  <button onClick={() => handleEditSave(idx)} style={{ padding: '5px 10px', background: C.primary, color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>저장</button>
                  <button onClick={() => setEditIdx(null)} style={{ padding: '5px 8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '12px', color: C.fgMuted, cursor: 'pointer', flexShrink: 0 }}>취소</button>
                </>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: C.fg }}>{item.name}</div>
                    <div style={{ fontSize: '10px', color: C.fgMuted }}>{item.category}</div>
                  </div>
                  <button onClick={() => handleToggle(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.active ? C.primary : C.fgSubtle, padding: '2px' }}>
                    {item.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  <button onClick={() => { setEditIdx(idx); setEditName(item.name); setEditCategory(item.category); }} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', color: C.fgMuted }}>
                    <Edit2 size={12} />
                  </button>
                  {deleteIdx === idx ? (
                    <>
                      <button onClick={() => handleDelete(idx)} style={{ padding: '5px 8px', background: C.dangerLight, border: 'none', borderRadius: '8px', color: C.danger, fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>삭제</button>
                      <button onClick={() => setDeleteIdx(null)} style={{ padding: '5px 6px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.fgMuted, fontSize: '11px', cursor: 'pointer' }}>취소</button>
                    </>
                  ) : (
                    <button onClick={() => setDeleteIdx(idx)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', color: C.fgMuted }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function StatsTab({ discarded }) {
  const expiredItems = discarded.filter((d) => d.reason === '유통기한 만료');
  const byCategory = Object.entries(
    expiredItems.reduce((acc, d) => {
      acc[d.category] = (acc[d.category] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, count]) => ({ name: name.split('/')[0], count }))
    .sort((a, b) => b.count - a.count);
  const nameCounts = expiredItems.reduce((acc, d) => {
    acc[d.name] = (acc[d.name] ?? 0) + 1;
    return acc;
  }, {});
  const topWasted = Object.entries(nameCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const totalExpired = expiredItems.length;
  const wasteScore = Math.max(0, Math.min(100, 100 - totalExpired * 2 + 3 + 5));
  const recentExpired = expiredItems.slice(0, 5);
  const statCardStyle = {
    background: C.card,
    borderRadius: '16px',
    padding: '14px',
    boxShadow: '0 2px 10px rgba(17,32,29,0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: '16px', color: C.fg, marginBottom: '4px' }}>냉파 통계</div>
      <div style={{ fontSize: '12px', color: C.fgMuted, marginBottom: '16px' }}>사용자들의 냉파 활동을 한눈에 파악하세요.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <div style={statCardStyle}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary, flexShrink: 0 }}>
            <Star size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: C.fg, fontWeight: 700 }}>
              냉파 점수 평균 <Info size={12} color={C.fgMuted} />
            </div>
            <div style={{ fontSize: '22px', color: C.primary, fontWeight: 900, lineHeight: 1.1, marginTop: '6px' }}>{wasteScore}점</div>
            <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '4px' }}>사용자 냉파 점수 평균</div>
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: C.dangerLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, flexShrink: 0 }}>
            <CalendarDays size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: C.fg, fontWeight: 700 }}>
              유통기한 만료 건수 <Info size={12} color={C.fgMuted} />
            </div>
            <div style={{ fontSize: '22px', color: C.accent, fontWeight: 900, lineHeight: 1.1, marginTop: '6px' }}>{totalExpired}건</div>
            <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '4px' }}>최근 7일 기준</div>
          </div>
        </div>
      </div>

      {/* Bar chart by category */}
      <div style={{ background: C.card, borderRadius: '16px', padding: '14px 16px', marginBottom: '10px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: C.fg, marginBottom: '12px' }}>카테고리별 만료량</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byCategory} margin={{ top: 8, right: 16, left: -6, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.fgMuted, fontWeight: 600 }} axisLine={{ stroke: C.borderStrong }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: C.fgMuted }} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 4]} />
            <Tooltip
              contentStyle={{ background: C.card, borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 16px rgba(17,32,29,0.1)' }}
              cursor={{ fill: C.surface }}
            />
            <Bar dataKey="count" fill={C.primary} radius={[2, 2, 0, 0]} name="만료 횟수" barSize={150} label={{ position: 'top', fill: C.fg, fontSize: 11, fontWeight: 700 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top wasted */}
      <div style={{ background: C.card, borderRadius: '16px', padding: '14px 16px', marginBottom: '10px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: C.fg, marginBottom: '10px' }}>가장 많이 만료된 재료 TOP 5</div>
        {topWasted.map(([name, count], idx) => (
          <div key={name} style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
            <div style={{ minWidth: '20px', fontSize: '13px', fontWeight: 700, color: idx === 0 ? C.accent : C.fgMuted }}>{idx + 1}</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: C.fg }}>{name}</div>
            <div style={{ fontSize: '12px', color: C.fgMuted, fontWeight: 600 }}>{count}회</div>
          </div>
        ))}
      </div>

      {/* Recent discarded */}
      <div style={{ background: C.card, borderRadius: '16px', padding: '14px 16px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: C.fg, marginBottom: '10px' }}>최근 만료 기록</div>
        {recentExpired.map((d) => (
          <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', width: '22px', textAlign: 'center' }}>{CATEGORY_EMOJIS[d.category]}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: C.fg }}>{d.name}</div>
                <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '1px' }}>{d.reason}</div>
              </div>
            </div>
            <span style={{ fontSize: '11px', color: C.fgMuted }}>{d.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Inquiries ────────────────────────────────────────────────────────────────
function InquiriesTab({ inquiries, onAnswer, onDeleteInquiry, onDeleteAnswer }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [expanded, setExpanded] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const pendingList = inquiries
    .filter((i) => i.status === 'pending')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const answeredList = inquiries
    .filter((i) => i.status === 'answered')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const currentList = activeTab === 'pending' ? pendingList : answeredList;

  const handleExpand = (inq) => {
    if (expanded === inq.id) {
      setExpanded(null);
      setEditingAnswerId(null);
    } else {
      setExpanded(inq.id);
      setAnswerText(inq.answer ?? '');
      setEditingAnswerId(inq.answer ? null : inq.id);
    }
  };

  const tabBtn = (tab, label, count, Icon) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => { setActiveTab(tab); setExpanded(null); setEditingAnswerId(null); }}
        style={{
          flex: 1, padding: '9px 0', background: 'none', border: 'none',
          borderBottom: `2px solid ${isActive ? C.primary : 'transparent'}`,
          color: isActive ? C.primary : C.fgMuted,
          fontWeight: isActive ? 700 : 500, fontSize: '13px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
        }}
      >
        <Icon size={13} />
        {label}
        {count > 0 && (
          <span style={{
            background: tab === 'pending' ? C.accent : C.primaryMid,
            color: '#FFF', borderRadius: '10px', fontSize: '10px',
            fontWeight: 700, padding: '1px 6px', lineHeight: 1.4,
          }}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: '16px', color: C.fg, marginBottom: '2px' }}>문의 관리</div>
        <div style={{ fontSize: '12px', color: C.fgMuted }}>전체 {inquiries.length}건</div>
      </div>

      <div style={{ display: 'flex', background: C.card, borderRadius: '14px 14px 0 0', borderBottom: `1px solid ${C.border}`, marginBottom: '12px' }}>
        {tabBtn('pending', '미답변', pendingList.length, Clock)}
        {tabBtn('answered', '답변완료', answeredList.length, CheckCircle)}
      </div>

      {currentList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: C.fgMuted, fontSize: '13px' }}>
          {activeTab === 'pending' ? '미답변 문의가 없어요' : '답변 완료된 문의가 없어요'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {currentList.map((inq) => (
            <div
              key={inq.id}
              style={{
                background: C.card,
                border: `1px solid ${activeTab === 'pending' ? C.accent + '50' : C.border}`,
                borderRadius: '16px',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', padding: '14px 16px', gap: '10px' }}>
                <button
                  onClick={() => handleExpand(inq)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: C.fg, marginBottom: '2px' }}>{inq.subject}</div>
                    <div style={{ fontSize: '11px', color: C.fgMuted }}>{inq.userName} · {inq.createdAt}</div>
                  </div>
                </button>
                {deleteConfirmId === inq.id ? (
                  <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                    <button onClick={() => { onDeleteInquiry(inq.id); setDeleteConfirmId(null); if (expanded === inq.id) setExpanded(null); }} style={{ padding: '4px 8px', background: C.dangerLight, border: 'none', borderRadius: '8px', color: C.danger, fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>삭제</button>
                    <button onClick={() => setDeleteConfirmId(null)} style={{ padding: '4px 7px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.fgMuted, fontSize: '11px', cursor: 'pointer' }}>취소</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirmId(inq.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.fgSubtle, padding: '2px', flexShrink: 0 }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {expanded === inq.id && (
                <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: '13px', color: C.fg, lineHeight: 1.6, padding: '12px 0' }}>{inq.content}</div>
                  {inq.answer && editingAnswerId !== inq.id ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: C.fgMuted }}>관리자 답변</div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => { setEditingAnswerId(inq.id); setAnswerText(inq.answer); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '6px', color: C.fgMuted, fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}
                          >
                            <Edit2 size={11} /> 수정
                          </button>
                          <button
                            onClick={() => { onDeleteAnswer(inq.id); setExpanded(null); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px', background: 'none', border: `1px solid ${C.border}`, borderRadius: '6px', color: C.danger, fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}
                          >
                            <Trash2 size={11} /> 삭제
                          </button>
                        </div>
                      </div>
                      <div style={{ background: C.primaryLight, borderRadius: '10px', padding: '10px 14px' }}>
                        <div style={{ fontSize: '13px', color: C.fg, lineHeight: 1.6 }}>{inq.answer}</div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: C.fgMuted, marginBottom: '6px' }}>관리자 답변</div>
                      <textarea
                        style={{
                          width: '100%', background: C.surface, border: `1px solid ${C.border}`,
                          borderRadius: '10px', padding: '10px 12px', color: C.fg, fontSize: '13px',
                          outline: 'none', resize: 'none', height: '90px', boxSizing: 'border-box',
                          display: 'block', marginBottom: '8px',
                        }}
                        placeholder="답변을 입력하세요..."
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        autoFocus={!!inq.answer}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            if (!answerText.trim()) return;
                            onAnswer(inq.id, answerText.trim());
                            setEditingAnswerId(null);
                            setExpanded(null);
                          }}
                          disabled={!answerText.trim()}
                          style={{
                            flex: 2, padding: '9px 16px',
                            background: answerText.trim() ? C.primary : C.surface,
                            color: answerText.trim() ? '#FFF' : C.fgMuted,
                            border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px',
                            cursor: answerText.trim() ? 'pointer' : 'not-allowed',
                          }}
                        >
                          {inq.answer ? '저장' : '답변 등록'}
                        </button>
                        {inq.answer && (
                          <button
                            onClick={() => { setEditingAnswerId(null); setAnswerText(inq.answer); }}
                            style={{ flex: 1, padding: '9px 12px', background: C.surface, border: `1px solid ${C.border}`, color: C.fgMuted, borderRadius: '10px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                          >
                            취소
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main AdminPanel ──────────────────────────────────────────────────────────
export function AdminPanel({
  currentUser, users, recipes, inquiries, presetIngredients, onClose,
  onUpdateUsers, onFetchRecipes, onFetchNextPage, adminLoading, adminPage, adminTotalPages,
  onAdminUpdateRecipe, onAdminDeleteRecipe,
  onAnswerInquiry, onDeleteInquiry, onDeleteAnswer, onUpdatePresetIngredients,
}) {
  const [activeTab, setActiveTab] = useState('members');

  const pendingInquiries = inquiries.filter((i) => i.status === 'pending').length;

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, zIndex: 500, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          background: C.card,
          borderBottom: `1px solid ${C.border}`,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.1em', fontWeight: 700 }}>ADMIN</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: C.fg, letterSpacing: '-0.02em', lineHeight: 1.1 }}>관리자 대시보드</div>
        </div>
        <button onClick={onClose} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '8px 14px', cursor: 'pointer', color: C.fgMuted, fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <X size={14} /> 닫기
        </button>
      </div>

      {/* Tab bar */}
      <div
        style={{
          background: C.card,
          borderBottom: `1px solid ${C.border}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          flexShrink: 0,
        }}
      >
        {Object.entries(TAB_ICONS).map(([key, { icon: Icon, label }]) => {
          const isActive = activeTab === key;
          const badge = key === 'inquiries' && pendingInquiries > 0 ? pendingInquiries : null;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '10px 4px 8px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? `2px solid ${C.primary}` : '2px solid transparent',
                color: isActive ? C.primary : C.fgMuted,
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
              <span style={{ fontSize: '10px', fontWeight: isActive ? 700 : 400 }}>{label}</span>
              {badge && (
                <span style={{
                  position: 'absolute',
                  top: '8px',
                  right: '14px',
                  width: '16px',
                  height: '16px',
                  background: C.accent,
                  color: '#FFF',
                  borderRadius: '50%',
                  fontSize: '9px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', scrollbarGutter: 'stable' }}>
        {activeTab === 'members'     && <MembersTab users={users} onUpdate={onUpdateUsers} currentUser={currentUser} />}
        {activeTab === 'recipes'     && <RecipesTab recipes={recipes} onFetchRecipes={onFetchRecipes} onFetchNextPage={onFetchNextPage} adminLoading={adminLoading} adminPage={adminPage} adminTotalPages={adminTotalPages} onUpdateRecipe={onAdminUpdateRecipe} onDeleteRecipe={onAdminDeleteRecipe} />}
        {activeTab === 'ingredients' && <IngredientsTab items={presetIngredients} onUpdate={onUpdatePresetIngredients} />}
        {activeTab === 'stats'       && <StatsTab discarded={mockDiscardedItems} />}
        {activeTab === 'inquiries'   && <InquiriesTab inquiries={inquiries} onAnswer={onAnswerInquiry} onDeleteInquiry={onDeleteInquiry} onDeleteAnswer={onDeleteAnswer} />}
      </div>
    </div>
  );
}
