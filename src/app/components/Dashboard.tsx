import { useState } from 'react';
import { BarChart3, ChevronRight, Zap, TrendingDown, User, X } from 'lucide-react';
import {
  Ingredient, Recipe, User as UserType,
  getDaysUntilExpiry, getExpiryStatus, getDayLabel,
  STATUS_COLORS, getRecipeMatch, TODAY, C,
  CATEGORY_EMOJIS, mockDiscardedItems, DiscardedItem, mockWeather,
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

function getGradeEmoji(score: number) {
  if (score >= 90) return '🏆';
  if (score >= 70) return '⭐';
  if (score >= 50) return '🧭';
  if (score >= 30) return '🌱';
  return '🥄';
}

function getNaengpaScore(discarded: DiscardedItem[]) {
  const expiredCount = discarded.filter((item) => item.reason === '유통기한 만료').length;
  return Math.max(0, Math.min(100, 100 - expiredCount * 2 + 3 + 5));
}

function ScoreDetailModal({
  score,
  grade,
  discarded,
  onClose,
}: {
  score: number;
  grade: string;
  discarded: DiscardedItem[];
  onClose: () => void;
}) {
  const expiredDiscarded = discarded.filter((item) => item.reason === '유통기한 만료');
  const scoreHistory = [
    ...expiredDiscarded.slice(0, 5).map((item) => ({
      id: item.id,
      icon: CATEGORY_EMOJIS[item.category],
      title: item.name,
      meta: '만료 재료 1일',
      date: item.date,
      score: -2,
    })),
    { id: 'recipe-1', icon: '📒', title: '된장찌개 등록', meta: '레시피 1건 등록', date: '2026-06-01', score: 3 },
    { id: 'streak-1', icon: '✅', title: '만료 재료 없음 4일 유지', meta: '', date: '', score: 5 },
  ];
  const cardStyle: React.CSSProperties = {
    background: C.card,
    borderRadius: '18px',
    padding: '18px',
    boxShadow: '0 8px 24px rgba(17,32,29,0.08)',
  };
  const tableRows = [
    ['만료 재료 1일당', '-2점', C.accent],
    ['레시피 1건 등록', '+3점', C.primary],
    ['만료 재료 없음 유지 4일마다', '+5점', C.primary],
  ];
  const gradeRows = [
    ['0~19점', '냉털 새내기'],
    ['20~39점', '냉파 수련생'],
    ['40~59점', '냉장고 탐험가'],
    ['60~79점', '냉파 에이스'],
    ['80~89점', '냉파 고인물'],
    ['90~100점', '냉파 마스터'],
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.45)', zIndex: 160, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
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
          boxShadow: '0 -18px 60px rgba(17,32,29,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
          <div>
            <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.1em', fontWeight: 800, marginBottom: '4px' }}>NAENGPA SCORE</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: C.fg }}>냉파 점수 상세</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.fgMuted, cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ background: 'linear-gradient(135deg, #0E8478 0%, #049D8E 100%)', color: '#FFF', borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 900, opacity: 0.9 }}>현재 등급</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '14px', marginTop: '8px' }}>
              <div style={{ fontSize: '22px', fontWeight: 900 }}>{getGradeEmoji(score)} {grade}</div>
              <div style={{ fontSize: '44px', fontWeight: 900, lineHeight: 0.9 }}>{score}<span style={{ fontSize: '16px', marginLeft: '3px' }}>점</span></div>
            </div>
          </div>

          <div style={{ ...cardStyle, marginBottom: '14px' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: C.fg, marginBottom: '12px' }}>등급표</div>
            {gradeRows.map(([range, label]) => {
              const isCurrent = label === grade;
              return (
                <div key={range} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '11px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '14px', color: C.fgMuted, fontWeight: 700 }}>{range}</span>
                  <span style={{ fontSize: '14px', color: isCurrent ? C.primary : C.fg, fontWeight: 900, textAlign: 'right' }}>{label}</span>
                </div>
              );
            })}
          </div>

          <div style={{ ...cardStyle, marginBottom: '14px' }}>
          <div style={{ fontSize: '18px', fontWeight: 900, color: C.fg, marginBottom: '12px' }}>점수 산정 기준</div>
          <div style={{ fontSize: '15px', color: C.fgMuted, lineHeight: 1.6, marginBottom: '18px' }}>
            만료 점수, 레시피/재료 등록을 반영해 산정합니다.
          </div>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: C.surface, fontSize: '15px', fontWeight: 900, color: C.fg }}>
              <div style={{ padding: '12px 20px', borderRight: `1px solid ${C.border}` }}>항목</div>
              <div style={{ padding: '12px 20px', textAlign: 'center' }}>차감 기준</div>
            </div>
            {tableRows.map(([label, point, color]) => (
              <div key={label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: `1px solid ${C.border}`, fontSize: '15px', color: C.fg }}>
                <div style={{ padding: '13px 20px', borderRight: `1px solid ${C.border}` }}>{label}</div>
                <div style={{ padding: '13px 20px', textAlign: 'center', color, fontWeight: 900 }}>{point}</div>
              </div>
            ))}
          </div>
          </div>

          <div style={{ ...cardStyle, marginBottom: '14px' }}>
          <div style={{ fontSize: '18px', fontWeight: 900, color: C.fg, marginBottom: '12px' }}>점수 산정 내역</div>
          {scoreHistory.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '13px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', minWidth: 0 }}>
                <span style={{ width: '36px', fontSize: '24px', textAlign: 'center' }}>{item.icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '17px', fontWeight: 900, color: C.fg }}>{item.title}</div>
                  {(item.meta || item.date) && (
                    <div style={{ fontSize: '13px', color: C.fgMuted, marginTop: '2px' }}>
                      {item.meta}{item.meta && item.date && ' · '}{item.date}
                    </div>
                  )}
                </div>
              </div>
              <span style={{ fontSize: '18px', color: item.score < 0 ? C.accent : C.primary, fontWeight: 900, whiteSpace: 'nowrap' }}>{item.score > 0 ? '+' : ''}{item.score}점</span>
            </div>
          ))}
          </div>

        </div>
      </div>
    </div>
  );
}

function StatsDetailModal({
  discarded,
  onClose,
}: {
  discarded: DiscardedItem[];
  onClose: () => void;
}) {
  const expiredDiscarded = discarded.filter((item) => item.reason === '유통기한 만료');
  const categoryCounts = Object.entries(
    expiredDiscarded.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, count]) => ({ name: name.split('/')[0], count }))
    .sort((a, b) => b.count - a.count);
  const topExpired = Object.entries(
    expiredDiscarded.reduce<Record<string, number>>((acc, item) => {
      acc[item.name] = (acc[item.name] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCategoryCount = Math.max(...categoryCounts.map((item) => item.count), 1);
  const cardStyle: React.CSSProperties = {
    background: C.card,
    borderRadius: '18px',
    padding: '18px',
    boxShadow: '0 8px 24px rgba(17,32,29,0.08)',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.45)', zIndex: 160, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
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
          boxShadow: '0 -18px 60px rgba(17,32,29,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
          <div>
            <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.1em', fontWeight: 800, marginBottom: '4px' }}>NAENGPA STATS</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: C.fg }}>냉파 통계</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.fgMuted, cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ ...cardStyle, marginBottom: '14px' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: C.fg, marginBottom: '18px' }}>가장 많이 만료된 재료 TOP 5</div>
            {topExpired.map(([name, count], idx) => (
              <div key={name} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', alignItems: 'center', gap: '14px', padding: '10px 0' }}>
                <div style={{ fontSize: '15px', fontWeight: 900, color: idx === 0 ? C.accent : C.fgMuted }}>{idx + 1}</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: C.fg }}>{name}</div>
                <div style={{ fontSize: '15px', color: C.fgMuted, fontWeight: 800, textAlign: 'right' }}>{count}회</div>
              </div>
            ))}
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: C.fg, marginBottom: '20px' }}>카테고리별 만료량</div>
            <div style={{ height: '176px', display: 'grid', gridTemplateColumns: '36px 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: C.fgMuted, fontSize: '14px', fontWeight: 700 }}>
                {[4, 3, 2, 1, 0].map((n) => <span key={n}>{n}</span>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${categoryCounts.length}, 1fr)`, alignItems: 'end', gap: '18px', borderBottom: `1px solid ${C.border}`, paddingTop: '4px' }}>
                {categoryCounts.map((item) => (
                  <div key={item.name} style={{ textAlign: 'center' }}>
                    <div style={{ color: C.fg, fontWeight: 900, marginBottom: '8px' }}>{item.count}</div>
                    <div style={{ height: `${(item.count / maxCategoryCount) * 112}px`, background: 'linear-gradient(180deg, #069B8D, #0E8478)', borderRadius: '2px 2px 0 0' }} />
                    <div style={{ fontSize: '14px', color: C.fgMuted, marginTop: '12px', whiteSpace: 'nowrap' }}>{item.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export function Dashboard({ ingredients, recipes, currentUser, onNavigate, onOpenMyPage }: DashboardProps) {
  const [showScoreDetail, setShowScoreDetail] = useState(false);
  const [showStatsDetail, setShowStatsDetail] = useState(false);
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
  const wasteScore = getNaengpaScore(mockDiscardedItems);
  const grade = getNaengpaGrade(wasteScore);
  const gradeEmoji = getGradeEmoji(wasteScore);

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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '7px', marginBottom: '3px', padding: '2px 8px', borderRadius: '20px', background: C.primaryLight, color: C.primary, fontSize: '10px', fontWeight: 700 }}>
            <span>{gradeEmoji}</span>
            <span>{grade}</span>
          </div>
          <div style={{ fontSize: '12px', color: C.fgMuted, marginTop: '2px' }}>안녕하세요, {currentUser.name}님 👋</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <button
            onClick={() => setShowScoreDetail(true)}
            style={{
              background: C.primaryLight,
              color: C.primary,
              borderRadius: '14px',
              padding: '8px 11px',
              textAlign: 'center',
              border: `1px solid ${C.primaryMid}`,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.06em' }}>냉파점수</div>
            <div style={{ fontSize: '20px', fontWeight: 900, lineHeight: 1.1 }}>{wasteScore}<span style={{ fontSize: '10px', marginLeft: '1px' }}>점</span></div>
            <div style={{ fontSize: '9px', fontWeight: 800, marginTop: '1px' }}>보기</div>
          </button>
          <button
            onClick={() => setShowStatsDetail(true)}
            style={{
              width: '62px',
              minHeight: '72px',
              background: C.primaryLight,
              color: C.primary,
              borderRadius: '14px',
              padding: '8px 9px',
              textAlign: 'center',
              border: `1px solid ${C.primaryMid}`,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
            }}
          >
            <BarChart3 size={18} strokeWidth={2.5} />
            <div style={{ fontSize: '14px', fontWeight: 900, lineHeight: 1 }}>통계</div>
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
          onClose={() => setShowScoreDetail(false)}
        />
      )}
      {showStatsDetail && (
        <StatsDetailModal
          discarded={mockDiscardedItems}
          onClose={() => setShowStatsDetail(false)}
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
        <div style={{ padding: '28px 20px 0' }}>
          <div style={{ fontSize: '24px', fontWeight: 900, color: C.fg, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: C.accent }}>⚡</span> 임박 재료 활용 추천
          </div>
          <div className="card-grid">
            {urgentRecipes.map((r) => (
              <button
                key={r.id}
                onClick={() => onNavigate('recipe')}
                className="card-hover"
                style={{
                  background: C.card,
                  borderLeft: `6px solid ${C.accent}`,
                  borderRadius: '8px 16px 16px 8px',
                  padding: '28px 32px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                  minHeight: '104px',
                  boxShadow: '0 8px 28px rgba(17,32,29,0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <span style={{ fontWeight: 900, color: C.fg, fontSize: '26px', letterSpacing: '-0.02em' }}>{r.name}</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '22px', color: C.fgMuted }}>{r.cookTime}분</span>
                  </div>
                </div>
                {r.match.missingIngredients.length > 0 && (
                  <div style={{ fontSize: '19px', color: C.fgMuted, marginTop: '8px' }}>부족: {r.match.missingIngredients.join(', ')}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: '32px 20px 0' }}>
        <div style={{ fontSize: '24px', fontWeight: 900, color: C.fg, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>☀️</span> 오늘의 날씨 추천
        </div>
        <div style={{ fontSize: '18px', color: C.fgMuted, marginBottom: '22px' }}>
          서울 송파구&nbsp;&nbsp; | &nbsp;&nbsp;{mockWeather.temperature}°C&nbsp;&nbsp; | &nbsp;&nbsp;{mockWeather.description}
        </div>
        <div className="card-grid">
          {recipes
            .filter((r) => ['냉모밀', '오이냉국'].includes(r.name))
            .concat([
              { ...recipes[0], id: 'weather-cold-noodle', name: '냉모밀', cookTime: 10, difficulty: '쉬움' as const },
              { ...recipes[0], id: 'weather-cucumber-soup', name: '오이냉국', cookTime: 15, difficulty: '쉬움' as const },
            ])
            .slice(0, 2)
            .map((r) => (
              <button
                key={r.id}
                onClick={() => onNavigate('recipe')}
                className="card-hover"
                style={{
                  background: C.card,
                  borderRadius: '16px',
                  padding: '28px 32px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                  minHeight: '118px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 8px 28px rgba(17,32,29,0.08)',
                }}
              >
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: C.fg, letterSpacing: '-0.02em' }}>{r.name}</div>
                  <div style={{ fontSize: '20px', color: C.fgMuted, marginTop: '4px' }}>{r.difficulty} · {r.cookTime}분</div>
                </div>
                <ChevronRight size={28} color={C.fgMuted} />
              </button>
            ))}
        </div>
      </div>

      {/* Available recipes */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '24px', fontWeight: 900, color: C.fg }}>지금 가능한 레시피</div>
          <button onClick={() => onNavigate('recipe')} style={{ fontSize: '18px', color: C.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 900 }}>
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
                  padding: '20px 28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  minHeight: '94px',
                  boxShadow: '0 8px 28px rgba(17,32,29,0.08)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, color: C.fg, fontSize: '21px' }}>{r.name}</div>
                  <div style={{ fontSize: '16px', color: C.fgMuted, marginTop: '4px' }}>
                    {r.difficulty} · {r.cookTime}분
                    {r.match.missingIngredients.length > 0 && ` · 부족: ${r.match.missingIngredients.join(', ')}`}
                  </div>
                </div>
                <ChevronRight size={22} color={C.fgSubtle} />
              </button>
            ))}
          </div>
        )}
      </div>

      </div>

      <div className="dash-col-right">
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
