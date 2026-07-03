import { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { C } from '@/shared/data/mockData';
import { IngredientSearchField } from '@/domains/fridge/components/IngredientSearchField';
import { recipesApi } from '@/apis/recipesApi';

const DIFFICULTIES = [
  { value: 'EASY', label: '쉬움' },
  { value: 'NORMAL', label: '보통' },
  { value: 'HARD', label: '어려움' },
];

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

// 상세조회 응답엔 categoryId가 없고 이름만 내려오므로 카테고리 목록을 받아 역으로 ID를 찾는다
function resolveCategoryId(initial, categories) {
  if (initial.categoryId) return initial.categoryId;
  const matched = categories.find((c) => c.name === initial.category);
  return matched ? matched.recipeCategoryId : (categories[0]?.recipeCategoryId ?? null);
}

// 재료를 {productId, name} 형태로 정규화. 기존 mock 데이터처럼 문자열로만 온 경우 productId는 null.
function normalizeIngredients(list) {
  return (list ?? []).map((item) =>
    typeof item === 'string' ? { productId: null, name: item } : { productId: item.productId ?? null, name: item.name }
  );
}

function IngredientTagInput({ ingredients, presetIngredients, hasError, onChange }) {
  const [input, setInput] = useState('');
  const [fieldKey, setFieldKey] = useState(0);

  const add = (item) => {
    if (!item.name.trim() || ingredients.some((i) => i.name === item.name.trim())) return;
    onChange([...ingredients, { productId: item.productId ?? null, name: item.name.trim() }]);
    setInput('');
    setFieldKey((k) => k + 1);
  };

  return (
    <div>
      <label style={labelStyle}>
        필수 재료 *
        {hasError && <ErrorBadge msg="검색 후 목록에서 선택해 1개 이상 추가해주세요" />}
      </label>
      <div style={{
        borderRadius: '12px',
        border: `1.5px solid ${hasError ? C.danger : 'transparent'}`,
        padding: hasError ? '8px' : '0',
        background: hasError ? C.dangerLight : 'transparent',
        transition: 'all 0.15s',
      }}>
        <div style={{ marginBottom: ingredients.length > 0 ? '8px' : '0' }}>
          <IngredientSearchField
            key={fieldKey}
            value={input}
            placeholder="재료 검색 후 선택"
            excluded={ingredients.map((i) => i.name)}
            presetIngredients={presetIngredients}
            onSelect={(ingredient) => {
              if (!ingredient.name) { setInput(''); return; }
              if (ingredient.productId) add(ingredient);
              else setInput(ingredient.name);
            }}
          />
        </div>
        {ingredients.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {ingredients.map((tag) => (
              <span
                key={tag.name}
                title={tag.productId ? undefined : '검색 결과에서 선택하지 않아 저장 시 제외됩니다'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  background: tag.productId ? C.primaryLight : C.dangerLight,
                  borderRadius: '20px',
                  fontSize: '12px',
                  color: tag.productId ? C.primary : C.danger,
                  fontWeight: 600,
                }}
              >
                {tag.name}
                <button
                  onClick={() => onChange(ingredients.filter((i) => i.name !== tag.name))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}
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
  const [recipeCategories, setRecipeCategories] = useState([]);
  const [foodCategories, setFoodCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [form, setForm] = useState({
    name: initial.name ?? '',
    categoryId: initial.categoryId ?? null,
    foodCategoryId: initial.foodCategoryId ?? null,
    description: initial.description ?? '',
    cookingTime: initial.cookTime ?? initial.cookingTime ?? 15,
    difficulty: initial.difficulty ?? 'EASY',
    ingredients: normalizeIngredients(initial.requiredIngredients),
    steps: initial.steps?.length ? initial.steps : [''],
  });

  const [fieldErrors, setFieldErrors] = useState({ name: false, ingredients: false, steps: false });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const nameRef = useRef(null);
  const ingredientsRef = useRef(null);
  const stepsRef = useRef(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const [rcRes, fcRes] = await Promise.all([
          recipesApi.getRecipeCategories(),
          recipesApi.getFoodCategories(),
        ]);
        const rc = rcRes.data?.data ?? rcRes.data ?? [];
        const fc = fcRes.data?.data ?? fcRes.data ?? [];
        setRecipeCategories(rc);
        setFoodCategories(fc);
        setForm((prev) => ({
          ...prev,
          categoryId: prev.categoryId ?? resolveCategoryId(initial, rc),
          foodCategoryId: prev.foodCategoryId ?? fc[0]?.foodCategoryId ?? null,
        }));
      } catch {
        // 카테고리 로드 실패 시 선택 불가 상태로 두고 저장 시 에러 노출
      } finally {
        setCategoriesLoading(false);
      }
    }
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleSave = async () => {
    const validIngredients = form.ingredients.filter((i) => i.productId);
    const errs = {
      name: !form.name.trim(),
      ingredients: validIngredients.length === 0,
      steps: form.steps.filter((s) => s.trim()).length === 0,
    };

    if (errs.name || errs.ingredients || errs.steps) {
      setFieldErrors(errs);
      const target = errs.name ? nameRef : errs.ingredients ? ingredientsRef : stepsRef;
      target.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description,
      cookingTime: form.cookingTime,
      difficulty: form.difficulty,
      categoryId: form.categoryId,
      foodCategoryId: form.foodCategoryId,
      productIds: validIngredients.map((i) => i.productId),
      steps: form.steps.filter((s) => s.trim()),
      // 백엔드로는 전송되지만 응답에 없는 표시용 정보라 프런트 store에서 화면 갱신에만 사용함
      _categoryName: recipeCategories.find((c) => c.recipeCategoryId === form.categoryId)?.name,
      _ingredientNames: validIngredients.map((i) => i.name),
    };

    setSaving(true);
    setSaveError('');
    try {
      await onSave(payload);
    } catch (err) {
      setSaveError(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
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
            {saveError && (
              <div style={{ background: C.dangerLight, borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: C.danger, fontWeight: 600 }}>
                {saveError}
              </div>
            )}

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

            {/* Category + FoodCategory + Time + Difficulty */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={labelStyle}>레시피 카테고리 *</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.categoryId ?? ''}
                  disabled={categoriesLoading}
                  onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                >
                  {categoriesLoading
                    ? <option>불러오는 중...</option>
                    : recipeCategories.map((c) => (
                        <option key={c.recipeCategoryId} value={c.recipeCategoryId}>{c.name}</option>
                      ))
                  }
                </select>
              </div>
              <div>
                <label style={labelStyle}>음식 카테고리 *</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.foodCategoryId ?? ''}
                  disabled={categoriesLoading}
                  onChange={(e) => setForm({ ...form, foodCategoryId: Number(e.target.value) })}
                >
                  {categoriesLoading
                    ? <option>불러오는 중...</option>
                    : foodCategories.map((c) => (
                        <option key={c.foodCategoryId} value={c.foodCategoryId}>{c.name}</option>
                      ))
                  }
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={labelStyle}>조리시간(분)</label>
                <input
                  style={inputStyle}
                  type="number"
                  min={1}
                  max={180}
                  value={form.cookingTime}
                  onChange={(e) => setForm({ ...form, cookingTime: Number(e.target.value) })}
                />
              </div>
              <div>
                <label style={labelStyle}>난이도</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                >
                  {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
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
              <IngredientTagInput
                ingredients={form.ingredients}
                presetIngredients={presetIngredients}
                hasError={fieldErrors.ingredients}
                onChange={(ingredients) => {
                  setForm({ ...form, ingredients });
                  if (ingredients.some((i) => i.productId)) setFieldErrors((prev) => ({ ...prev, ingredients: false }));
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
            disabled={saving}
            style={{
              flex: 2,
              padding: '13px',
              background: saving ? C.fgSubtle : C.primary,
              border: 'none',
              borderRadius: '16px',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '15px',
              cursor: saving ? 'default' : 'pointer',
            }}
          >
            {saving ? '저장 중...' : '레시피 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
