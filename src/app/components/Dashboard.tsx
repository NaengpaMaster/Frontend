import { useState } from 'react';
import { ChevronRight, Zap, TrendingDown, User, X } from 'lucide-react';
import {
  Ingredient, Recipe, User as UserType,
  getDaysUntilExpiry, getExpiryStatus, getDayLabel,
  STATUS_COLORS, getRecipeMatch, TODAY, C,
  CATEGORY_EMOJIS, mockDiscardedItems, DiscardedItem,
} from '../data/mockData';
import type { TabId } from './BottomNav';

interface DashboardProps {
  ingredients: Ingredient[];
  recipes: Recipe[];
  currentUser: UserType;
  onNavigate: (tab: TabId) => void;
  onOpenMyPage: () => void;
}

function DayBadge({ expiryDate }: { expiryDate: string }) {
  const days = getDaysUntilExpiry(expiryDate);
  const status = getExpiryStatus(days);
  const colors = STATUS_COLORS[status];
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        borderRadius: '20px',
        padding: '2px 8px',
        fontSize: '11px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {getDayLabel(days)}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: C.fgMuted, textTransform: 'uppercase', marginBottom: '12px' }}>
      {children}
    </div>
  );
}

function getNaengpaGrade(score: number) {
  if (score >= 90) return '냉파 마스터';
  if (score >= 80) return '냉파 고인물';
  if (score >= 60) return '냉파 에이스';
  if (score >= 40) return '냉장고 탐험가';
  if (score >= 20) return '냉파 수련생';
  return '냉털 새내기';
}

function ScoreDetailModal({
  score,
  grade,
  discarded,
  expiredCount,
  onClose,
}: {
  score: number;
  grade: string;
  discarded: DiscardedItem[];
  expiredCount: number;
  onClose: () => void;
}) {
  const gradeRows = [
    ['0~19', '냉털 새내기'],
    ['20~39', '냉파 수련생'],
    ['40~59', '냉장고 탐험가'],
    ['60~79', '냉파 에이스'],
    ['80~89', '냉파 고인물'],
    ['90~100', '냉파 마스터'],
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.45)', zIndex: 160, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div
        style={{ background: C.bg, borderRadius: '24px 24px 0 0', padding: '22px 20px 36px', width: '100%', maxWidth: '480px', margin: '0 auto', maxHeight: '88vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.1em', fontWeight: 800, marginBottom: '4px' }}>NAENGPA SCORE</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: C.fg }}>냉파 점수 상세</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.fgMuted, cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ background: C.primary, color: '#FFF', borderRadius: '18px', padding: '18px', marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, opacity: 0.85 }}>현재 등급</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '6px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700 }}>{grade}</div>
            <div style={{ fontSize: '34px', fontWeight: 900, lineHeight: 1 }}>{score}<span style={{ fontSize: '14px' }}>점</span></div>
          </div>
        </div>

        <div style={{ background: C.card, borderRadius: '16px', padding: '14px 16px', marginBottom: '14px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: C.fg, marginBottom: '6px' }}>점수 산정 기준</div>
          <div style={{ fontSize: '12px', color: C.fgMuted, lineHeight: 1.6 }}>
            관리자 낭비 통계의 폐기 기록과 현재 냉장고의 만료 재료를 반영해 산정합니다.
            폐기 기록 1건당 7점, 만료 재료 1개당 5점이 차감됩니다.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
            <div style={{ background: C.surface, borderRadius: '14px', padding: '10px' }}>
              <div style={{ fontSize: '10px', color: C.fgMuted }}>폐기 기록</div>
              <div style={{ fontSize: '20px', color: C.accent, fontWeight: 900 }}>{discarded.length}건</div>
            </div>
            <div style={{ background: C.surface, borderRadius: '14px', padding: '10px' }}>
              <div style={{ fontSize: '10px', color: C.fgMuted }}>만료 재료</div>
              <div style={{ fontSize: '20px', color: C.danger, fontWeight: 900 }}>{expiredCount}개</div>
            </div>
          </div>
        </div>

        <div style={{ background: C.card, borderRadius: '16px', padding: '14px 16px', marginBottom: '14px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: C.fg, marginBottom: '10px' }}>등급표</div>
          {gradeRows.map(([range, label]) => (
            <div key={range} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: '12px', color: C.fgMuted }}>{range}점</span>
              <span style={{ fontSize: '12px', color: label === grade ? C.primary : C.fg, fontWeight: label === grade ? 900 : 600 }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ background: C.card, borderRadius: '16px', padding: '14px 16px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: C.fg, marginBottom: '10px' }}>점수 산정 내역</div>
          {discarded.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>{CATEGORY_EMOJIS[item.category]}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: C.fg }}>{item.name}</div>
                  <div style={{ fontSize: '10px', color: C.fgMuted }}>{item.reason} · {item.date}</div>
                </div>
              </div>
              <span style={{ fontSize: '11px', color: C.accent, fontWeight: 700 }}>-7점</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


export function Dashboard({ ingredients, recipes, currentUser, onNavigate, onOpenMyPage }: DashboardProps) {
  const [showScoreDetail, setShowScoreDetail] = useState(false);
  const sorted = [...ingredients].sort(
    (a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate)
  );

  const urgent = sorted.filter((i) => { const d = getDaysUntilExpiry(i.expiryDate); return d <= 3 && d >= 0; });
  const expired = sorted.filter((i) => getDaysUntilExpiry(i.expiryDate) < 0);

  const recipesWithMatch = recipes
    .map((r) => ({ ...r, match: getRecipeMatch(r, ingredients) }))
    .filter((r) => r.match.percentage >= 80)
    .sort((a, b) => b.match.percentage - a.match.percentage)
    .slice(0, 4);

  const urgentRecipes = recipes
    .map((r) => ({ ...r, match: getRecipeMatch(r, ingredients) }))
    .filter((r) => {
      const urgentNames = urgent.map((i) => i.name);
      return r.requiredIngredients.some((ri) => urgentNames.includes(ri)) && r.match.percentage >= 50;
    })
    .slice(0, 2);

  const dateStr = new Date(TODAY).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  const wasteScore = Math.max(0, 100 - mockDiscardedItems.length * 7 - expired.length * 5);
  const grade = getNaengpaGrade(wasteScore);

  return (
    <div style={{ padding: '0 0 24px', background: C.bg }}>
      {/* Header */}
      <div
        style={{
          padding: '20px 20px 16px',
          background: C.card,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: C.fgMuted, letterSpacing: '0.06em', marginBottom: '2px' }}>{dateStr}</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: C.fg, letterSpacing: '-0.02em', lineHeight: 1.1 }}>냉파 마스터</div>
          <div style={{ display: 'inline-flex', marginTop: '7px', marginBottom: '3px', padding: '2px 8px', borderRadius: '20px', background: C.primaryLight, color: C.primary, fontSize: '10px', fontWeight: 700 }}>
            {grade}
          </div>
          <div style={{ fontSize: '12px', color: C.fgMuted, marginTop: '2px' }}>안녕하세요, {currentUser.name}님 👋</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <button
            onClick={() => setShowScoreDetail(true)}
            style={{
              background: C.primary,
              color: '#FFFFFF',
              borderRadius: '16px',
              padding: '8px 12px',
              textAlign: 'center',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', opacity: 0.8 }}>냉파점수</div>
            <div style={{ fontSize: '20px', fontWeight: 900, lineHeight: 1 }}>{wasteScore}</div>
            <div style={{ fontSize: '9px', fontWeight: 700, opacity: 0.9, marginTop: '2px' }}>{grade}</div>
          </button>
          <button
            onClick={onOpenMyPage}
            style={{
              width: '42px',
              height: '42px',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: C.fgMuted,
              alignSelf: 'center',
            }}
          >
            <User size={18} />
          </button>
        </div>
      </div>

      {showScoreDetail && (
        <ScoreDetailModal
          score={wasteScore}
          grade={grade}
          discarded={mockDiscardedItems}
          expiredCount={expired.length}
          onClose={() => setShowScoreDetail(false)}
        />
      )}

      {/* Urgent alert strip */}
      {urgent.length > 0 && (
        <button
          onClick={() => onNavigate('fridge')}
          style={{
            width: '100%',
            background: C.accentLight,
            borderTop: 'none',
            borderBottom: `1px solid ${C.accent}30`,
            borderLeft: 'none',
            borderRight: 'none',
            padding: '11px 20px',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Zap size={14} color={C.accent} fill={C.accent} />
          <span style={{ fontSize: '12px', color: C.accent, fontWeight: 700, flex: 1 }}>
            지금 먹어야 해요! —&nbsp;
            {urgent.map((i) => `${i.name} (D-${getDaysUntilExpiry(i.expiryDate)})`).join(' · ')}
          </span>
          <ChevronRight size={14} color={C.accent} />
        </button>
      )}

      <div className="dash-grid">
      <div className="dash-col-left">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: C.card, borderBottom: `1px solid ${C.border}` }}>
        {[
          { label: '전체 재료',   value: ingredients.length,                       color: C.fg,      tab: 'fridge' as const },
          { label: '임박 재료',   value: urgent.length + expired.length,           color: urgent.length + expired.length > 0 ? C.accent : C.primary, tab: 'fridge' as const },
          { label: '가능 레시피', value: recipesWithMatch.length,                  color: C.primary, tab: 'recipe' as const },
        ].map((stat, i) => (
          <button
            key={stat.label}
            onClick={() => onNavigate(stat.tab)}
            style={{
              padding: '18px 12px',
              textAlign: 'center',
              background: 'none',
              border: 'none',
              borderRight: i < 2 ? `1px solid ${C.border}` : 'none',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '30px', fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: '9px', color: C.fgSubtle, marginTop: '4px', letterSpacing: '0.04em' }}>{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Urgent recipe recs */}
      {urgentRecipes.length > 0 && (
        <div style={{ padding: '20px 20px 0' }}>
          <SectionLabel>
            <span style={{ color: C.accent }}>⚡</span> 임박 재료 활용 추천
          </SectionLabel>
          <div className="card-grid">
            {urgentRecipes.map((r) => (
              <button
                key={r.id}
                onClick={() => onNavigate('recipe')}
                className="card-hover"
                style={{
                  background: C.card,
                  borderLeft: `3px solid ${C.accent}`,
                  borderRadius: '0 14px 14px 0',
                  padding: '14px 16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                  boxShadow: '0 4px 16px rgba(17,32,29,0.09)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: C.fg, fontSize: '15px' }}>{r.name}</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: C.fgMuted }}>{r.cookTime}분</span>
                  </div>
                </div>
                {r.match.missingIngredients.length > 0 && (
                  <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '6px' }}>부족: {r.match.missingIngredients.join(', ')}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Available recipes */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <SectionLabel>지금 가능한 레시피</SectionLabel>
          <button onClick={() => onNavigate('recipe')} style={{ fontSize: '12px', color: C.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            전체보기 →
          </button>
        </div>
        {recipesWithMatch.length === 0 ? (
          <div style={{ color: C.fgMuted, fontSize: '13px', textAlign: 'center', padding: '20px 0', background: C.card, borderRadius: '16px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
            재료를 더 등록하면 레시피를 추천해드려요
          </div>
        ) : (
          <div className="card-grid">
            {recipesWithMatch.map((r) => (
              <button
                key={r.id}
                onClick={() => onNavigate('recipe')}
                className="card-hover"
                style={{
                  background: C.card,
                  borderRadius: '14px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  boxShadow: '0 3px 12px rgba(17,32,29,0.08)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: C.fg, fontSize: '14px' }}>{r.name}</div>
                  <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '2px' }}>
                    {r.difficulty} · {r.cookTime}분
                    {r.match.missingIngredients.length > 0 && ` · 부족: ${r.match.missingIngredients.join(', ')}`}
                  </div>
                </div>
                <ChevronRight size={16} color={C.fgSubtle} />
              </button>
            ))}
          </div>
        )}
      </div>

      </div>

      <div className="dash-col-right">
      {/* Storage summary */}
      <div style={{ padding: '20px 20px 0' }}>
        <SectionLabel>보관 현황</SectionLabel>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['냉장', '냉동'] as const).map((loc) => {
            const count = ingredients.filter((i) => i.location === loc).length;
            const icons: Record<string, string> = { 냉장: '❄️', 냉동: '🧊' };
            return (
              <div
                key={loc}
                style={{
                  flex: 1,
                  background: C.card,
                  borderRadius: '16px',
                  padding: '14px 8px',
                  textAlign: 'center',
                  boxShadow: '0 3px 12px rgba(17,32,29,0.08)',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{icons[loc]}</div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: C.fg }}>{count}</div>
                <div style={{ fontSize: '9px', color: C.fgSubtle, letterSpacing: '0.04em' }}>{loc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expired warning */}
      {expired.length > 0 && (
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ background: C.dangerLight, borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingDown size={16} color={C.danger} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: C.danger }}>기한 만료 재료</div>
              <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '2px' }}>{expired.map((i) => i.name).join(', ')} — 냉장고를 확인해주세요</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent ingredients */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <SectionLabel>유통기한 임박 재료</SectionLabel>
          <button onClick={() => onNavigate('fridge')} style={{ fontSize: '12px', color: C.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            냉장고 →
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {sorted.slice(0, 9).map((ingredient) => (
            <div
              key={ingredient.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: C.card,
                borderRadius: '20px',
                padding: '6px 12px',
                boxShadow: '0 3px 10px rgba(17,32,29,0.08)',
              }}
            >
              <span style={{ fontSize: '13px' }}>{CATEGORY_EMOJIS[ingredient.category]}</span>
              <span style={{ fontSize: '12px', color: C.fg, fontWeight: 500 }}>{ingredient.name}</span>
              <DayBadge expiryDate={ingredient.expiryDate} />
            </div>
          ))}
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}
