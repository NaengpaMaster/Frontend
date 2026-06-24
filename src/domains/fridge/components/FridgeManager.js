import { useState } from 'react';
import { CheckCircle, Edit2, Plus, Search, X, Trash2 } from 'lucide-react';
import {
  getDaysUntilExpiry, getExpiryStatus, getDayLabel, STATUS_COLORS,
  CATEGORIES, CATEGORY_EMOJIS, TODAY, C,
} from '@/shared/data/mockData';
import { IngredientSearchField } from './IngredientSearchField';

function DayCounter({ expiryDate }) {
  const days = getDaysUntilExpiry(expiryDate);
  const status = getExpiryStatus(days);
  const colors = STATUS_COLORS[status];
  return (
    <div style={{ background: colors.bg, borderRadius: '14px', padding: '5px 10px', textAlign: 'center', minWidth: '56px' }}>
      <div style={{ fontSize: '14px', fontWeight: 900, color: colors.text, lineHeight: 1 }}>{getDayLabel(days)}</div>
      <div style={{ fontSize: '9px', color: colors.text, opacity: 0.7, marginTop: '2px' }}>
        {Number.isFinite(days) ? new Date(expiryDate).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) : '직접 수정'}
      </div>
    </div>
  );
}

function IngredientModal({
  initial,
  title,
  presetIngredients,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    category: initial?.category ?? '채소/과일',
    quantity: initial?.quantity ?? '',
    location: initial?.location ?? '냉장',
    expiryDate: initial?.expiryDate === '기한없음' ? '' : initial?.expiryDate ?? '',
    emoji: initial?.emoji ?? CATEGORY_EMOJIS[initial?.category ?? '채소/과일'],
    memo: initial?.memo ?? '',
  });

  const inputStyle = {
    width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px',
    padding: '10px 12px', color: C.fg, fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle = { fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: C.fgMuted, display: 'block', marginBottom: '5px' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div
        style={{
          background: C.bg, borderTop: `1px solid ${C.border}`, borderRadius: '24px 24px 0 0',
          width: '100%', maxWidth: '480px', margin: '0 auto', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (fixed) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 16px', flexShrink: 0, borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontWeight: 700, fontSize: '18px', color: C.fg }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.fgMuted }}><X size={20} /></button>
        </div>

        {/* Body (scrolls) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ ...labelStyle }}><span style={{ color: C.danger }}>*</span> 재료 이름</label>
              <IngredientSearchField
                value={form.name}
                placeholder="재료 이름을 검색하세요"
                presetIngredients={presetIngredients}
                onSelect={(ingredient) => {
                  if (ingredient.name) {
                    setForm((prev) => ({ ...prev, name: ingredient.name, category: ingredient.category, emoji: CATEGORY_EMOJIS[ingredient.category] }));
                  }
                }}
                onFormSubmit={() => {
                  if (form.name && form.quantity && form.expiryDate) { onSave(form); onClose(); }
                }}
              />
            </div>
            <div>
              <label style={labelStyle}><span style={{ color: C.danger }}>*</span> 카테고리</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {CATEGORIES.map((c) => (
                  <div
                    key={c}
                    style={{
                      padding: '6px 10px',
                      background: form.category === c ? C.primary : C.surface,
                      color: form.category === c ? '#FFF' : C.fgSubtle,
                      border: `1px solid ${form.category === c ? C.primary : C.border}`,
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: form.category === c ? 700 : 400,
                      opacity: form.category === c ? 1 : 0.45,
                    }}
                  >
                    {CATEGORY_EMOJIS[c]} {c}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}><span style={{ color: C.danger }}>*</span> 수량</label>
              <input style={inputStyle} placeholder="예: 2개, 300g, 1/2통" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <label style={{ ...labelStyle }}><span style={{ color: C.danger }}>*</span> 유통기한</label>
              <input type="date" style={inputStyle} min={TODAY} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>메모 <span style={{ color: C.fgSubtle, fontWeight: 400 }}>(선택)</span></label>
              <textarea
                style={{ ...inputStyle, height: '52px', resize: 'none' }}
                placeholder="예: 반찬용, 소분 완료, 빨리 먹기"
                value={form.memo}
                onChange={(e) => setForm({ ...form, memo: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Footer (fixed) */}
        <div style={{ padding: '16px 20px', flexShrink: 0, borderTop: `1px solid ${C.border}`, background: C.bg }}>
          <button
            onClick={() => { if (form.name && form.quantity && form.expiryDate) { onSave(form); onClose(); } }}
            disabled={!form.name || !form.quantity || !form.expiryDate}
            style={{
              width: '100%',
              background: form.name && form.quantity && form.expiryDate ? C.primary : C.surface,
              color: form.name && form.quantity && form.expiryDate ? '#FFFFFF' : C.fgMuted,
              border: 'none', borderRadius: '16px', padding: '14px',
              fontWeight: 700, fontSize: '15px',
              cursor: form.name && form.quantity && form.expiryDate ? 'pointer' : 'not-allowed',
            }}
          >
            {initial ? '수정 완료' : '냉장고에 넣기'}
          </button>
        </div>
      </div>
    </div>
  );
}

function UseModal({
  ingredient,
  onClose,
  onUse,
}) {
  const [mode, setMode] = useState('all');
  const [remaining, setRemaining] = useState('');

  const inputStyle = {
    width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px',
    padding: '10px 12px', color: C.fg, fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.4)', zIndex: 120, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ background: C.bg, borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: '480px', margin: '0 auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '18px', color: C.fg }}>사용량 반영</div>
            <div style={{ fontSize: '12px', color: C.fgMuted, marginTop: '3px' }}>{ingredient.name} · 현재 {ingredient.quantity}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.fgMuted }}><X size={20} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          {[
            { id: 'all', label: '전부 사용', desc: '목록에서 제거' },
            { id: 'partial', label: '일부 사용', desc: '남은 수량 수정' },
          ].map((item) => {
            const isActive = mode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setMode(item.id)}
                style={{
                  padding: '12px 10px',
                  background: isActive ? C.primaryLight : C.card,
                  border: `1px solid ${isActive ? C.primaryMid : C.border}`,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 800, color: isActive ? C.primary : C.fg }}>{item.label}</div>
                <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '2px' }}>{item.desc}</div>
              </button>
            );
          })}
        </div>

        {mode === 'partial' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: C.fgMuted, display: 'block', marginBottom: '6px' }}>남은 수량</label>
            <input style={inputStyle} placeholder="예: 1개, 150g, 1/4통" value={remaining} onChange={(e) => setRemaining(e.target.value)} />
          </div>
        )}

        <button
          disabled={mode === 'partial' && !remaining.trim()}
          onClick={() => { onUse(ingredient.id, mode === 'partial' ? remaining.trim() : undefined); onClose(); }}
          style={{
            width: '100%',
            background: mode === 'all' || remaining.trim() ? C.primary : C.surface,
            color: mode === 'all' || remaining.trim() ? '#FFFFFF' : C.fgMuted,
            border: 'none',
            borderRadius: '16px',
            padding: '14px',
            fontWeight: 800,
            fontSize: '15px',
            cursor: mode === 'all' || remaining.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          사용 내역 반영
        </button>
      </div>
    </div>
  );
}

export function FridgeManager({ ingredients, presetIngredients, onAdd, onUpdate, onUse, onDelete }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('전체');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [using, setUsing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = ingredients
    .filter((i) => {
      const matchSearch = i.name.includes(search) || i.category.includes(search);
      const matchCat = activeCategory === '전체' || i.category === activeCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      return getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate);
    });

  const urgentCount = ingredients.filter((i) => { const d = getDaysUntilExpiry(i.expiryDate); return d >= 0 && d <= 3; }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.1em', fontWeight: 700, marginBottom: '2px' }}>FRIDGE</div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: C.fg, letterSpacing: '-0.02em', lineHeight: 1, margin: 0 }}>냉장고 관리</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: C.fg, lineHeight: 1 }}>{ingredients.length}</div>
            <div style={{ fontSize: '9px', color: C.fgSubtle }}>
              {urgentCount > 0 && <span style={{ color: C.accent }}>임박 {urgentCount}개 · </span>}
              전체 재료
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.fgMuted }} />
          <input
            style={{
              width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px',
              padding: '9px 12px 9px 32px', color: C.fg, fontSize: '13px', outline: 'none', boxSizing: 'border-box',
            }}
            placeholder="재료 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.fgMuted }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '14px' }}>
          {(['전체', ...CATEGORIES]).map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  whiteSpace: 'nowrap', padding: '6px 12px',
                  background: isActive ? C.primary : C.surface,
                  color: isActive ? '#FFFFFF' : C.fgMuted,
                  border: `1px solid ${isActive ? C.primary : C.border}`,
                  borderRadius: '20px', fontSize: '12px',
                  fontWeight: isActive ? 700 : 400, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                }}
              >
                {cat === '전체' ? '전체' : `${CATEGORY_EMOJIS[cat]} ${cat}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed sort bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 20px', borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <span style={{ fontSize: '12px', color: C.fgMuted }}>{filtered.length}개 재료</span>
        <span style={{ fontSize: '11px', color: C.primary, fontWeight: 800 }}>유통기한 임박순 고정</span>
      </div>

      {/* Ingredient list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 24px', background: C.card }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: C.fgMuted, fontSize: '14px' }}>
            {search ? '검색 결과가 없어요' : '재료를 추가해보세요!'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((ingredient) => (
              <div
                key={ingredient.id}
                style={{
                    display: 'grid',
                    gridTemplateColumns: '42px 1fr auto',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 0',
                    borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    background: C.primaryLight,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    flexShrink: 0,
                  }}
                >
                  {CATEGORY_EMOJIS[ingredient.category]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 700, color: C.fg, fontSize: '15px' }}>{ingredient.name}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: C.fgMuted }}>{ingredient.quantity} · {ingredient.category}</div>
                  {ingredient.memo && (
                    <div style={{ fontSize: '11px', color: C.fgSubtle, marginTop: '3px' }}>메모: {ingredient.memo}</div>
                  )}
                </div>
                <DayCounter expiryDate={ingredient.expiryDate} />
                <div style={{ gridColumn: '2 / 4', display: 'flex', gap: '6px', marginTop: '-4px' }}>
                  <button onClick={() => setUsing(ingredient)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: C.primaryLight, borderRadius: '10px', color: C.primary, padding: '6px 9px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                    <CheckCircle size={12} /> 사용
                  </button>
                  <button onClick={() => setEditing(ingredient)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.fgMuted, padding: '6px 9px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                    <Edit2 size={12} /> 수정
                  </button>
                  {deleteConfirm === ingredient.id ? (
                    <>
                      <button onClick={() => { onDelete(ingredient.id); setDeleteConfirm(null); }} style={{ background: C.dangerLight, borderRadius: '10px', color: C.danger, padding: '6px 9px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>삭제 확인</button>
                      <button onClick={() => setDeleteConfirm(null)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.fgMuted, padding: '6px 9px', fontSize: '11px', cursor: 'pointer' }}>취소</button>
                    </>
                  ) : (
                    <button onClick={() => setDeleteConfirm(ingredient.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.fgMuted, padding: '6px 9px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                      <Trash2 size={12} /> 삭제
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        style={{
          position: 'fixed', bottom: '74px', right: '20px',
          width: '52px', height: '52px',
          background: C.primary, color: '#FFFFFF',
          border: 'none', borderRadius: '14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 16px ${C.primary}40`,
          zIndex: 50,
        }}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {showAdd && <IngredientModal title="재료 추가" presetIngredients={presetIngredients} onClose={() => setShowAdd(false)} onSave={onAdd} />}
      {editing && (
        <IngredientModal
          title="재료 수정"
          initial={editing}
          presetIngredients={presetIngredients}
          onClose={() => setEditing(null)}
          onSave={(data) => { onUpdate(editing.id, data); setEditing(null); }}
        />
      )}
      {using && <UseModal ingredient={using} onClose={() => setUsing(null)} onUse={onUse} />}
    </div>
  );
}
