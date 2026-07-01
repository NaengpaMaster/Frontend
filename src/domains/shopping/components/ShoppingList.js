import { useState } from 'react';
import { Plus, Trash2, Check, ShoppingCart, X } from 'lucide-react';
import { CATEGORIES, CATEGORY_EMOJIS, C } from '@/shared/data/mockData';
import { IngredientSearchField } from '@/domains/fridge/components/IngredientSearchField';

function openCoupangSearch(name) {
  window.open(`https://www.coupang.com/np/search?q=${encodeURIComponent(name)}`, '_blank', 'noopener,noreferrer');
}

export function ShoppingList({ items, onToggle, onDelete, onAdd, onClearChecked, onMoveCheckedToFridge }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ productId: null, name: '', quantity: '', category: '채소/과일' });

  const checkedCount = items.filter((i) => i.checked).length;

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  const handleAdd = () => {
    if (!form.productId || !form.name) return;
    onAdd({ ...form, checked: false });
    setForm({ productId: null, name: '', quantity: '', category: '채소/과일' });
    setShowAdd(false);
  };

  const inputStyle = {
    width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px',
    padding: '10px 12px', color: C.fg, fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.1em', fontWeight: 700, marginBottom: '2px' }}>SHOPPING</div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: C.fg, margin: 0, letterSpacing: '-0.02em' }}>장보기 목록</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '26px', fontWeight: 900, lineHeight: 1 }}>
              <span style={{ color: C.primary }}>{checkedCount}</span>
              <span style={{ color: C.border, fontSize: '18px' }}>/</span>
              <span style={{ color: C.fg }}>{items.length}</span>
            </div>
            <div style={{ fontSize: '9px', color: C.fgSubtle }}>완료/전체</div>
          </div>
        </div>

        <div style={{ height: '6px', background: C.primaryLight, borderRadius: '3px', overflow: 'hidden', marginBottom: '14px' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: C.primary, borderRadius: '3px', transition: 'width 0.4s ease' }} />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '10px', background: C.primary, color: '#FFF', border: 'none', borderRadius: '14px',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer',
            }}
          >
            <Plus size={14} strokeWidth={2.5} /> 항목 추가
          </button>
          {checkedCount > 0 && (
            <>
              <button
                onClick={onMoveCheckedToFridge}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 12px',
                  background: C.primaryLight, borderRadius: '14px',
                  color: C.primary, fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                }}
              >
                <Check size={12} /> 냉장고 반영
              </button>
              <button
                onClick={onClearChecked}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 12px',
                  background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px',
                  color: C.fgMuted, fontSize: '12px', cursor: 'pointer',
                }}
              >
                <Trash2 size={12} /> 삭제
              </button>
            </>
          )}
        </div>
        {checkedCount > 0 && (
          <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '8px', lineHeight: 1.5 }}>
            냉장고 반영 시 유통기한은 기본값 "기한없음"으로 등록되고, 냉장고 탭에서 직접 수정할 수 있어요.
          </div>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ padding: '14px 20px', background: C.card, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <IngredientSearchField
                value={form.name}
                placeholder="살 재료 이름 검색"
                onSelect={(ingredient) => setForm({
                  ...form,
                  productId: ingredient.productId,
                  name: ingredient.name,
                  category: ingredient.category,
                })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input style={inputStyle} placeholder="수량 (예: 2개)" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', color: C.fgMuted }}>
                {CATEGORY_EMOJIS[form.category]} {form.category}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleAdd}
                disabled={!form.productId || !form.name}
                style={{
                  width: '100%', padding: '10px 16px', background: form.productId && form.name ? C.primary : C.surface,
                  color: form.productId && form.name ? '#FFF' : C.fgMuted, border: 'none', borderRadius: '10px',
                  fontWeight: 700, cursor: form.productId && form.name ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', fontSize: '13px',
                }}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 24px' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: C.fgMuted }}>
            <ShoppingCart size={36} style={{ margin: '0 auto 12px', opacity: 0.25 }} />
            <div style={{ fontSize: '14px', fontWeight: 600 }}>장보기 목록이 비어있어요</div>
            <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>위 버튼으로 항목을 추가하세요</div>
          </div>
        ) : (
          Object.entries(grouped).map(([category, catItems]) => (
            <div key={category} style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: C.fgMuted, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>{CATEGORY_EMOJIS[category]}</span>
                {category.toUpperCase()}
                <span style={{ opacity: 0.5, fontWeight: 400 }}>({catItems.filter((i) => i.checked).length}/{catItems.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 14px', background: C.card,
                      borderRadius: '16px',
                      transition: 'all 0.2s',
                      boxShadow: '0 3px 10px rgba(17,32,29,0.08)',
                    }}
                  >
                    <button
                      onClick={() => onToggle(item.id)}
                      style={{
                        width: '22px', height: '22px', borderRadius: '10px',
                        border: `2px solid ${item.checked ? C.primary : C.border}`,
                        background: item.checked ? C.primary : 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, transition: 'all 0.15s',
                      }}
                    >
                      {item.checked && <Check size={12} color="#FFF" strokeWidth={3} />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: item.checked ? C.fgSubtle : C.fg, textDecoration: item.checked ? 'line-through' : 'none' }}>
                        {item.name}
                      </span>
                      {item.quantity && <span style={{ fontSize: '11px', color: item.checked ? C.fgSubtle : C.fgMuted, marginLeft: '8px' }}>{item.quantity}</span>}
                    </div>
                    <button
                      onClick={() => openCoupangSearch(item.name)}
                      style={{
                        background: C.primaryLight,
                        border: `1px solid ${C.primaryMid}`,
                        borderRadius: '10px',
                        color: C.primary,
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '6px 8px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      즉시 구매
                    </button>
                    <button onClick={() => onDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.fgSubtle, padding: '2px' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
