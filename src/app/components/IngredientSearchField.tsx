import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { C, CATEGORY_EMOJIS, IngredientCategory, PRESET_INGREDIENTS, PresetIngredientItem } from '../data/mockData';

interface IngredientSearchFieldProps {
  value: string;
  placeholder?: string;
  excluded?: string[];
  presetIngredients?: PresetIngredientItem[];
  onSelect: (ingredient: { name: string; category: IngredientCategory }) => void;
  onFormSubmit?: () => void;
}

export function IngredientSearchField({
  value,
  placeholder = '재료 이름 검색',
  excluded = [],
  presetIngredients,
  onSelect,
  onFormSubmit,
}: IngredientSearchFieldProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // 외부에서 value가 바뀌면 (ex. 수정 모달 초기값) query도 동기화
  useEffect(() => {
    setQuery(value);
    setIsOpen(false);
  }, [value]);

  const sourceList = presetIngredients
    ? presetIngredients.filter((item) => item.active)
    : PRESET_INGREDIENTS;

  const keyword = query.trim();
  const results = isOpen && keyword
    ? sourceList
        .filter((item) => !excluded.includes(item.name))
        .filter((item) => item.name.includes(keyword) || item.category.includes(keyword))
        .slice(0, 6)
    : [];

  // 검색어 바뀔 때 하이라이트 초기화
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [keyword]);

  const handleSelect = (item: { name: string; category: IngredientCategory }) => {
    setQuery(item.name);   // 입력창에 선택된 이름 즉시 반영
    setIsOpen(false);      // 드롭다운 닫기
    setHighlightedIndex(-1);
    onSelect(item);        // 부모 form 업데이트
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);       // 타이핑하면 드롭다운 열기
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSelect({ name: '', category: '기타' });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (!isOpen || results.length === 0) return;
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      if (!isOpen || results.length === 0) return;
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (isOpen && results.length > 0) {
        e.preventDefault();
        const idx = highlightedIndex >= 0 ? highlightedIndex : 0;
        handleSelect(results[idx]);
      } else {
        e.preventDefault();
        setIsOpen(false);
        onFormSubmit?.();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const inputStyle = {
    width: '100%',
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: '10px',
    padding: '10px 36px 10px 34px',
    color: C.fg,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.fgMuted }} />
        <input
          style={inputStyle}
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
        />
        {query && (
          <button
            onClick={handleClear}
            type="button"
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.fgMuted, padding: 0 }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', maxHeight: '200px', overflowY: 'auto' }}>
          {results.map((item, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <button
                key={`${item.category}-${item.name}`}
                type="button"
                onMouseDown={(e) => {
                  // onBlur보다 먼저 실행되게 mouseDown에서 처리
                  e.preventDefault();
                  handleSelect(item);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  background: isHighlighted ? C.primaryLight : C.card,
                  borderRadius: '14px',
                  border: isHighlighted ? `1px solid ${C.primaryMid}` : '1px solid transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: isHighlighted ? `0 2px 10px ${C.primary}20` : '0 2px 8px rgba(17,32,29,0.08)',
                  transition: 'background 0.1s, border-color 0.1s',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: isHighlighted ? C.primary : C.fg, fontWeight: 700 }}>
                  <span>{CATEGORY_EMOJIS[item.category]}</span>
                  {item.name}
                </span>
                <span style={{ fontSize: '10px', color: isHighlighted ? C.primary : C.fgMuted }}>{item.category}</span>
              </button>
            );
          })}
          <div style={{ fontSize: '10px', color: C.fgSubtle, textAlign: 'center', padding: '2px 0' }}>
            ↑↓ 이동 · Enter 선택
          </div>
        </div>
      )}
    </div>
  );
}
