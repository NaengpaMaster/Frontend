import { useState, useRef } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { C } from '@/shared/data/mockData';
import { IngredientSearchField } from '@/domains/fridge/components/IngredientSearchField';

const CATEGORIES = ['찌개', '볶음', '볶음밥', '반찬', '수프', '국', '구이', '무침', '기타'];
const DIFFICULTIES = ['쉬움', '보통', '어려움'];

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
  transition: 'border-color 0.15s',
};

const labelStyle = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: C.fgMuted,
  display: 'block',
  marginBottom: '6px',
};

function ErrorBadge({ msg }) {
  return (
    <span style={{
      fontSize: '10px',
      fontWeight: 600,
      color: C.danger,
      marginLeft: '6px',
      letterSpacing: 0,
    }}>
      {msg}
    </span>
  );
}

function TagInput({
  label,
  tags,
  placeholder,
  color = C.primaryLight,
  textColor = C.primary,
  presetIngredients,
  hasError,
  onChange,
}) {
  const [input, setInput] = useState('');
  const [fieldKey, setFieldKey] = useState(0);

  const add = (name = input) => {
    if (!name.trim() || tags.includes(name.trim())) return;
    onChange([...tags, name.trim()]);
    setInput('');
    setFieldKey((k) => k + 1);
  };

  return (
    <div>
      <label style={labelStyle}>
        {label}
        {hasError && <ErrorBadge msg="1개 이상 입력해주세요" />}
      </label>
      <div style={{
        borderRadius: '12px',
        border: `1.5px solid ${hasError ? C.danger : 'transparent'}`,
        padding: hasError ? '8px' : '0',
        background: hasError ? C.dangerLight : 'transparent',
        transition: 'all 0.15s',
      }}>
        <div style={{ marginBottom: tags.length > 0 ? '8px' : '0' }}>
          <IngredientSearchField
            key={fieldKey}
            value={input}
            placeholder={placeholder}
            excluded={tags}
            presetIngredients={presetIngredients}
            onSelect={(ingredient) => {
              if (!ingredient.name) { setInput(''); return; }
              add(ingredient.name);
            }}
          />
        </div>
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  background: color,
                  borderRadius: '20px',
                  fontSize: '12px',
                  color: textColor,
                  fontWeight: 600,
                }}
              >
                {tag}
                <button
                  onClick={() => onChange(tags.filter((t) => t !== tag))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: textColor, padding: 0, lineHeight: 1 }}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function RecipeFormModal({ initial = {}, onSave, onClose, title = '레시피 등록', presetIngredients }) {
  const [form, setForm] = useState({
    name: initial.name ?? '',
    category: initial.category ?? '기타',
    description: initial.description ?? '',
    cookTime: initial.cookTime ?? 15,
    difficulty: initial.difficulty ?? '쉬움',
    requiredIngredients: initial.requiredIngredients ?? [],
    optionalIngredients: [],
    steps: initial.steps ?? [''],
    isFavorite: initial.isFavorite ?? false,
    likeCount: initial.likeCount ?? 0,
  });

  const [fieldErrors, setFieldErrors] = useState({ name: false, ingredients: false, steps: false });

  const nameRef = useRef(null);
  const ingredientsRef = useRef(null);
  const stepsRef = useRef(null);

  const updateStep = (idx, val) => {
    const next = [...form.steps];
    next[idx] = val;
    setForm({ ...form, steps: next });
    if (val.trim()) setFieldErrors((prev) => ({ ...prev, steps: false }));
  };

  const addStep = () => {
    if (form.steps.length >= 10) return;
    setForm({ ...form, steps: [...form.steps, ''] });
  };

  const removeStep = (idx) => setForm({ ...form, steps: form.steps.filter((_, i) => i !== idx) });

  const handleSave = () => {
    const errs = {
      name: !form.name.trim(),
      ingredients: form.requiredIngredients.length === 0,
      steps: form.steps.filter((s) => s.trim()).length === 0,
    };

    if (errs.name || errs.ingredients || errs.steps) {
      setFieldErrors(errs);
      // 첫 번째 에러 필드로 스크롤
      const target = errs.name ? nameRef : errs.ingredients ? ingredientsRef : stepsRef;
      target.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    onSave({ ...form, optionalIngredients: [], steps: form.steps.filter((s) => s.trim()), likeCount: form.likeCount });
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.45)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.bg,
          borderRadius: '24px 24px 0 0',
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            background: C.card,
            borderBottom: `1px solid ${C.border}`,
            borderRadius: '24px 24px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: '18px', color: C.fg }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.fgMuted }}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name */}
            <div ref={nameRef}>
              <label style={labelStyle}>
                레시피 이름 *
                {fieldErrors.name && <ErrorBadge msg="이름을 입력해주세요" />}
              </label>
              <input
                style={{
                  ...inputStyle,
                  border: `1.5px solid ${fieldErrors.name ? C.danger : C.border}`,
                  background: fieldErrors.name ? C.dangerLight : C.surface,
                }}
                placeholder="예: 김치찌개, 계란볶음밥"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (e.target.value.trim()) setFieldErrors((prev) => ({ ...prev, name: false }));
                }}
              />
            </div>

            {/* Category + Time + Difficulty */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div>
                <label style={labelStyle}>카테고리</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>조리시간(분)</label>
                <input
                  style={inputStyle}
                  type="number"
                  min={1}
                  max={180}
                  value={form.cookTime}
                  onChange={(e) => setForm({ ...form, cookTime: Number(e.target.value) })}
                />
              </div>
              <div>
                <label style={labelStyle}>난이도</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                >
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>레시피 설명</label>
              <textarea
                style={{ ...inputStyle, resize: 'none', height: '80px' }}
                placeholder="이 레시피를 한 줄로 소개해주세요"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Required Ingredients */}
            <div ref={ingredientsRef}>
              <TagInput
                label="필수 재료 *"
                tags={form.requiredIngredients}
                placeholder="재료 입력 후 Enter"
                presetIngredients={presetIngredients}
                hasError={fieldErrors.ingredients}
                onChange={(tags) => {
                  setForm({ ...form, requiredIngredients: tags });
                  if (tags.length > 0) setFieldErrors((prev) => ({ ...prev, ingredients: false }));
                }}
              />
            </div>

            {/* Steps */}
            <div ref={stepsRef}>
              <label style={labelStyle}>
                조리 과정 *
                {fieldErrors.steps && <ErrorBadge msg="1단계 이상 입력해주세요" />}
              </label>
              <div style={{
                borderRadius: '12px',
                border: `1.5px solid ${fieldErrors.steps ? C.danger : 'transparent'}`,
                padding: fieldErrors.steps ? '8px' : '0',
                background: fieldErrors.steps ? C.dangerLight : 'transparent',
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {form.steps.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          minWidth: '26px',
                          height: '26px',
                          marginTop: '9px',
                          background: C.primary,
                          color: '#FFF',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </div>
                      <textarea
                        style={{ ...inputStyle, flex: 1, resize: 'none', height: '70px' }}
                        placeholder={`${idx + 1}단계 조리 과정을 입력하세요`}
                        value={step}
                        onChange={(e) => updateStep(idx, e.target.value)}
                      />
                      {form.steps.length > 1 && (
                        <button
                          onClick={() => removeStep(idx)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.fgSubtle, marginTop: '12px', padding: '4px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addStep}
                    disabled={form.steps.length >= 10}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 14px',
                      background: C.surface,
                      border: `1px dashed ${form.steps.length >= 10 ? C.border : C.borderStrong}`,
                      borderRadius: '10px',
                      color: form.steps.length >= 10 ? C.fgSubtle : C.fgMuted,
                      fontSize: '13px',
                      cursor: form.steps.length >= 10 ? 'not-allowed' : 'pointer',
                      width: '100%',
                      justifyContent: 'center',
                      opacity: form.steps.length >= 10 ? 0.5 : 1,
                    }}
                  >
                    <Plus size={14} /> 단계 추가 {form.steps.length >= 10 && '(최대 10단계)'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: `1px solid ${C.border}`,
            background: C.card,
            display: 'flex',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '13px',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: '16px',
              color: C.fgMuted,
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 2,
              padding: '13px',
              background: C.primary,
              border: 'none',
              borderRadius: '16px',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            레시피 저장
          </button>
        </div>
      </div>
    </div>
  );
}
