import { useState, useEffect, useRef } from 'react';
import { X, Users, ChefHat, BarChart3, MessageSquare, Trash2, Edit2, CheckCircle, Clock, Search, Package, Plus, ToggleLeft, ToggleRight, Star, CalendarDays, Info, TrendingUp, TrendingDown, Minus, Heart, House, UserPlus, UserMinus, AlertTriangle, Database, ArrowRight, RefreshCw, Refrigerator, ShoppingBasket, BookOpen, Activity, ChevronRight, Mail } from 'lucide-react';
import {
  C,
  CATEGORY_EMOJIS,
  CATEGORIES,
} from '@/shared/data/mockData';
import { PageControls } from '@/shared/components/PageControls';
import { adminApi } from '@/apis/adminApi';
import { adminStatsApi } from '@/apis/adminStatsApi';
import { RecipeFormModal } from '@/domains/recipes/components/RecipeFormModal';
import { recipesApi, adminRecipesApi } from '@/apis/recipesApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {scoreApi} from '@/apis/scoreApi';

const DIFFICULTY_LABELS = { EASY: '쉬움', NORMAL: '보통', HARD: '어려움' };
const GRANULARITY_LABELS = { DAY: '일별', WEEK: '주별', MONTH: '월별' };

function formatStatisticsDate(date, granularity) {
  if (!date) return '';
  if (granularity === 'MONTH') return date.slice(0, 7);
  if (granularity === 'WEEK') return `${date.slice(5)} 주`;
  return date.slice(5);
}

function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info size={12} color={C.fgMuted} />
      {show && (
        <span
          style={{
            position: 'absolute',
            bottom: '140%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: C.fg,
            color: C.card,
            fontSize: '11px',
            fontWeight: 500,
            padding: '6px 10px',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function mapRecipeDetail(d) {
  return {
    ...d,
    id: d.recipeId ?? d.id,
    name: d.recipeName ?? d.name,
    category: d.category ?? d.categoryName,
    cookTime: d.cookTime ?? d.cookingTime,
    difficulty: d.difficulty,
    requiredIngredients: (d.ingredients ?? d.requiredIngredients ?? []).map((i) =>
      typeof i === 'string' ? { productId: null, name: i } : { productId: i.ingredientId, name: i.ingredientName }
    ),
    steps: (d.steps ?? d.instructions ?? []).map((s) => typeof s === 'string' ? s : s.content),
    description: d.description ?? '',
    likeCount: d.likeCount ?? 0,
  };
}

const TAB_ICONS = {
  home:        { icon: House,         label: '홈' },
  members:     { icon: Users,         label: '회원' },
  recipes:     { icon: ChefHat,       label: '레시피' },
  ingredients: { icon: Package,       label: '사전재료' },
  stats:       { icon: BarChart3,     label: '통계' },
  aiUsage:     { icon: Activity,      label: 'AI사용량' },
  inquiries:   { icon: MessageSquare, label: '문의' },
  fridges:     { icon: Refrigerator, label: '가족공유' },
};

const CATEGORY_IDS = {
  '채소/과일': 1,
  '육류/어류': 3,
  '유제품/계란': 5,
  '양념/소스': 8,
  '가공식품': 9,
  '기타': 10,
};

const CATEGORY_NAMES = Object.fromEntries(Object.entries(CATEGORY_IDS).map(([name, id]) => [id, name]));

const toAdminIngredient = (item) => ({
  productId: item.productId,
  name: item.name,
  category: CATEGORY_NAMES[item.productCategoryId] ?? '기타',
  defaultExpiryDays: item.defaultExpiryDays,
  active: item.isActive,
});

const MEMBER_PAGE_SIZE = 10;

function roleStatusForMode(mode) {
  if (mode === 'admin') return { role: 'ADMIN', status: 'ACTIVE' };
  if (mode === 'inactive') return { role: 'USER', status: 'INACTIVE' };
  return { role: 'USER', status: 'ACTIVE' };
}

function DatePartDropdown({ label, value, options, suffix, onChange, invalid }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  return (
    <span ref={rootRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        style={{ minWidth: suffix === '년' ? '105px' : '76px', minHeight: '38px', padding: '8px 28px 8px 10px', border: `1px solid ${invalid ? C.danger : C.border}`, borderRadius: '10px', background: C.card, color: C.fg, fontSize: '13px', fontWeight: 800, textAlign: 'left', cursor: 'pointer', position: 'relative' }}
      >
        {value}{suffix}
        <span aria-hidden="true" style={{ position: 'absolute', right: '10px', top: '50%', transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`, fontSize: '10px', transition: 'transform 0.15s' }}>⌄</span>
      </button>
      {open && (
        <span style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, zIndex: 100, minWidth: '100%', maxHeight: '220px', overflowY: 'auto', overscrollBehavior: 'contain', padding: '5px', border: `1px solid ${C.borderStrong}`, borderRadius: '11px', background: C.card, boxShadow: '0 10px 26px rgba(17,32,29,0.18)' }}>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => { onChange(option); setOpen(false); }}
              style={{ display: 'block', width: '100%', padding: '8px 10px', border: 'none', borderRadius: '7px', background: option === value ? C.primaryLight : 'transparent', color: option === value ? C.primary : C.fg, fontSize: '12px', fontWeight: option === value ? 900 : 700, textAlign: 'left', whiteSpace: 'nowrap', cursor: 'pointer' }}
            >
              {option}{suffix}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

function DatePartsSelect({ label, value, onChange, invalid = false }) {
  const [year, month, day] = value.split('-').map(Number);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1999 }, (_, index) => currentYear - index);
  const months = Array.from({ length: 12 }, (_, index) => index + 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const changePart = (nextYear, nextMonth, nextDay) => {
    const lastDay = new Date(nextYear, nextMonth, 0).getDate();
    const safeDay = Math.min(nextDay, lastDay);
    onChange(`${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`);
  };

  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 900, color: C.fgMuted, whiteSpace: 'nowrap' }}>
      <span>{label} :</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <DatePartDropdown label={`${label} 연도`} value={year} options={years} suffix="년" invalid={invalid} onChange={(nextYear) => changePart(nextYear, month, day)} />
        <DatePartDropdown label={`${label} 월`} value={month} options={months} suffix="월" invalid={invalid} onChange={(nextMonth) => changePart(year, nextMonth, day)} />
        <DatePartDropdown label={`${label} 일`} value={day} options={days} suffix="일" invalid={invalid} onChange={(nextDay) => changePart(year, month, nextDay)} />
      </span>
    </label>
  );
}

// ─── Admin Home ───────────────────────────────────────────────────────────────
function AdminHomeTab({ currentUser, pendingCount, onNavigate, onRefreshInquiryCounts }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const home = await adminApi.getHome();
      setSummary(home);
      await onRefreshInquiryCounts();
    } catch (err) {
      setError(err.message || '운영 현황을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summaryCards = [
    {
      label: '활성 회원', value: summary?.activeMemberCount, suffix: '명', icon: Users,
      color: C.primary, bg: C.primaryLight, tab: 'members', statusLabel: '현재', statusColor: C.primary,
      description: '서비스를 이용할 수 있는 전체 회원',
    },
    {
      label: '신규 가입 회원', value: summary?.todayNewMemberCount, suffix: '명', icon: UserPlus,
      color: '#3974C6', bg: '#EAF2FF', statusLabel: '오늘', statusColor: '#3974C6',
      description: '오늘 가입한 회원', tab: 'members',
    },
    {
      label: '비활성 전환', value: summary?.todayInactiveMemberCount, suffix: '명', icon: UserMinus,
      color: C.fgMuted, bg: C.surface, statusLabel: '오늘', statusColor: C.fgMuted,
      description: '오늘 비활성 처리된 회원', secondary: `현재 비활성 ${summary?.inactiveMemberCount ?? '—'}명`, tab: 'members',
    },
    {
      label: '전체 미답변 문의', value: summary?.pendingInquiryCount ?? pendingCount, suffix: '건', icon: MessageSquare,
      color: (summary?.pendingInquiryCount ?? pendingCount) > 0 ? C.accent : C.primary,
      bg: (summary?.pendingInquiryCount ?? pendingCount) > 0 ? C.accentLight : C.primaryLight,
      tab: 'inquiries', urgent: (summary?.pendingInquiryCount ?? pendingCount) > 0,
      statusLabel: (summary?.pendingInquiryCount ?? pendingCount) > 0 ? '확인 필요' : '정상',
      statusColor: (summary?.pendingInquiryCount ?? pendingCount) > 0 ? C.accent : C.primary,
      description: (summary?.pendingInquiryCount ?? pendingCount) > 0 ? '답변을 기다리는 문의가 있습니다.' : '대기 중인 문의가 없습니다.',
    },
    {
      label: '24시간 초과 미답변', value: summary?.overduePendingInquiryCount, suffix: '건', icon: AlertTriangle,
      color: C.danger, bg: C.dangerLight,
      urgent: (summary?.overduePendingInquiryCount ?? 0) > 0,
      statusLabel: (summary?.overduePendingInquiryCount ?? 0) > 0 ? '위험' : '정상',
      statusColor: (summary?.overduePendingInquiryCount ?? 0) > 0 ? C.danger : C.primary,
      description: (summary?.overduePendingInquiryCount ?? 0) > 0 ? '24시간 이상 답변을 기다린 문의가 있습니다.' : '24시간 초과 미답변 문의가 없습니다.',
      tab: 'inquiries',
    },
  ];

  const displayValue = (card) => {
    if (loading) return '…';
    return `${card.value ?? 0}${card.suffix ?? ''}`;
  };

  return (
    <div className="admin-shadcn-page admin-home-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '22px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: C.fg, letterSpacing: '-0.03em' }}>
            안녕하세요, {currentUser?.name || currentUser?.nickname || '관리자'}님
          </div>
          <div style={{ marginTop: '5px', fontSize: '13px', color: C.fgMuted }}>오늘의 서비스 운영 현황을 한눈에 확인하세요.</div>
        </div>
        <button
          className="admin-shadcn-button admin-shadcn-button-outline"
          onClick={loadSummary}
          disabled={loading}
          aria-label="운영 현황 새로고침"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 11px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.fgMuted, fontSize: '12px', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', flexShrink: 0 }}
        >
          <RefreshCw size={14} className={loading ? 'admin-home-refreshing' : ''} /> 새로고침
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: '14px', padding: '11px 13px', borderRadius: '10px', background: C.dangerLight, color: C.danger, fontSize: '12px', fontWeight: 700 }}>
          {error}
        </div>
      )}

      <div className="admin-summary-grid" style={{ marginBottom: '22px' }}>
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              className="admin-shadcn-card admin-shadcn-metric-card"
              key={card.label}
              role={card.tab ? 'button' : undefined}
              tabIndex={card.tab ? 0 : undefined}
              onClick={() => card.tab && onNavigate(card.tab)}
              onKeyDown={(event) => { if (card.tab && event.key === 'Enter') onNavigate(card.tab); }}
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', minHeight: '148px', padding: '17px 18px', textAlign: 'left', background: C.card, border: `1px solid ${card.urgent ? `${card.color}55` : C.border}`, borderTop: `3px solid ${card.color}`, borderRadius: '12px', boxShadow: '0 1px 4px rgba(17,32,29,0.06)', cursor: card.tab ? 'pointer' : 'default' }}
            >
              <div style={{ minHeight: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <span style={{ width: '32px', height: '32px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: card.bg, color: card.color, border: `1px solid ${card.color}18` }}>
                    <Icon size={16} />
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1.25, color: C.fgMuted }}>{card.label}</span>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 7px', borderRadius: '999px', background: `${card.statusColor}10`, color: card.statusColor, fontSize: '9px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: card.statusColor }} />
                  {card.statusLabel}
                  {card.tab && <ArrowRight size={11} />}
                </span>
              </div>
              <div style={{ marginTop: '16px', fontSize: '26px', lineHeight: 1, fontWeight: 900, letterSpacing: '-0.03em', color: C.fg }}>{displayValue(card)}</div>
              <div style={{ marginTop: '9px', fontSize: '10px', lineHeight: 1.45, color: C.fgSubtle }}>{card.description}</div>
              {card.secondary && <div style={{ marginTop: '2px', fontSize: '10px', lineHeight: 1.45, color: C.fgMuted, fontWeight: 700 }}>{card.secondary}</div>}
            </div>
          );
        })}
      </div>

    </div>
  );
}

// ─── Members ──────────────────────────────────────────────────────────────────
function MemberSearchTab({ currentUser }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState('active');
  const [page, setPage] = useState(0);
  const [members, setMembers] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [counts, setCounts] = useState({ active: 0, inactive: 0, admin: 0 });
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadCounts = async () => {
    try {
      const [active, inactive, admin] = await Promise.all([
        adminApi.getMembers({ role: 'USER', status: 'ACTIVE', size: 1 }),
        adminApi.getMembers({ role: 'USER', status: 'INACTIVE', size: 1 }),
        adminApi.getMembers({ role: 'ADMIN', status: 'ACTIVE', size: 1 }),
      ]);
      setCounts({ active: active.totalElements, inactive: inactive.totalElements, admin: admin.totalElements });
    } catch {
      // 통계 카드는 목록 로딩 에러와 별개로 조용히 무시
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    setError('');
    try {
      const { role, status } = roleStatusForMode(viewMode);
      const result = await adminApi.getMembers({ role, status, search: debouncedSearch, page, size: MEMBER_PAGE_SIZE });
      setMembers(result.content);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err.message || '회원 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, debouncedSearch, page]);

  const openMemberDetail = async (user) => {
    setDetailLoading(true);
    setError('');
    try {
      setSelectedMember(await adminApi.getMemberDetail(user.memberId));
    } catch (err) {
      setSelectedMember({ ...user, naengpaScore: null });
      setError('상세 조회 API 구현 전이라 목록의 회원 정보를 표시합니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  const toggle = async (user) => {
    const nextStatus = user.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    setActionId(user.id);
    setError('');
    try {
      await adminApi.updateMemberStatus(user.memberId, nextStatus);
      await Promise.all([loadMembers(), loadCounts()]);
      setSelectedMember(null);
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
      await Promise.all([loadMembers(), loadCounts()]);
      setSelectedMember(null);
    } catch (err) {
      setError(err.message || '회원 권한 변경에 실패했습니다.');
    } finally {
      setActionId(null);
    }
  };

  const selectView = (mode) => {
    setViewMode(mode);
    setSearch('');
    setDebouncedSearch('');
    setPage(0);
  };

  return (
    <div className="admin-member-search">
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: '16px', color: C.fg }}>회원 관리</div>
        <div style={{ fontSize: '12px', color: C.fgMuted }}>
          {loading ? '회원 목록 불러오는 중...' : `총 ${counts.active + counts.inactive}명 · 활성 ${counts.active}명`}
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
          className="admin-shadcn-input"
          style={{
            width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px',
            padding: '10px 12px 10px 34px', color: C.fg, fontSize: '13px', outline: 'none', boxSizing: 'border-box',
          }}
          placeholder="회원 이름, 이메일 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Stats row - 클릭하면 해당 뷰로 필터 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: '관리자 수', value: counts.admin, color: C.fg, mode: 'admin' },
          { label: '전체 회원', value: counts.active, color: C.primary, mode: 'active' },
          { label: '탈퇴 회원', value: counts.inactive, color: C.accent, mode: 'inactive' },
        ].map((s) => (
          <div
            key={s.label}
            className="stat-card-hover admin-shadcn-card admin-shadcn-stat-filter"
            onClick={() => selectView(s.mode)}
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
        {members.map((u) => (
          <div
            key={u.id}
            onClick={() => openMemberDetail(u)}
            className="card-hover admin-shadcn-card admin-shadcn-list-item"
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
            <div style={{ color: C.fgSubtle, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <ChevronRight size={18} />
            </div>
          </div>
        ))}
        {!loading && members.length === 0 && (
          <div style={{ textAlign: 'center', padding: '36px 0', color: C.fgMuted, fontSize: '13px' }}>검색 결과가 없어요</div>
        )}
      </div>

      <PageControls page={page} totalPages={totalPages} onChange={setPage} />
      {detailLoading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.45)', zIndex: 650, display: 'grid', placeItems: 'center' }}>
          <div style={{ color: C.card, fontWeight: 800, fontSize: '14px' }}>회원 상세 정보 불러오는 중...</div>
        </div>
      )}

      {selectedMember && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.45)', zIndex: 650, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setSelectedMember(null)}
        >
          <div
            style={{ background: C.bg, borderRadius: '20px', padding: '24px 24px 28px', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(17,32,29,0.25)' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.1em', fontWeight: 700, marginBottom: '4px' }}>MEMBER DETAIL</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: C.fg, margin: 0 }}>{selectedMember.name}</h2>
                  <span style={{ fontSize: '10px', background: selectedMember.role === 'admin' ? C.primaryLight : C.surface, color: selectedMember.role === 'admin' ? C.primary : C.fgMuted, borderRadius: '7px', padding: '3px 7px', fontWeight: 800 }}>
                    {selectedMember.role === 'admin' ? '관리자' : '회원'}
                  </span>
                  <span style={{ fontSize: '10px', background: selectedMember.status === 'inactive' ? C.dangerLight : C.primaryLight, color: selectedMember.status === 'inactive' ? C.danger : C.primary, borderRadius: '7px', padding: '3px 7px', fontWeight: 800 }}>
                    {selectedMember.status === 'inactive' ? '비활성' : '활성'}
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedMember(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.fgMuted, padding: '2px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '18px' }}>
              {[
                { label: '이메일', value: selectedMember.email },
                { label: '가구 유형', value: selectedMember.householdType },
                { label: '가입일', value: selectedMember.joinDate || '-' },
                { label: '냉파 점수', value: selectedMember.naengpaScore == null ? '집계 전' : selectedMember.naengpaScore + '점' },
              ].map((item) => (
                <div key={item.label} style={{ background: C.card, borderRadius: '14px', padding: '13px 14px', boxShadow: '0 2px 8px rgba(17,32,29,0.06)' }}>
                  <div style={{ fontSize: '10px', color: C.fgSubtle, fontWeight: 700, marginBottom: '5px' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', color: C.fg, fontWeight: 800, wordBreak: 'break-all' }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap', paddingTop: '16px', borderTop: `1px solid ${C.border}` }}>
              {selectedMember.status === 'inactive' && selectedMember.role !== 'admin' && (
                <button
                  type="button"
                  disabled={actionId === selectedMember.id}
                  onClick={() => window.confirm('이 회원을 다시 활성화하시겠습니까?') && toggle(selectedMember)}
                  style={{ padding: '9px 14px', background: C.primaryLight, border: `1px solid ${C.primary}`, borderRadius: '10px', color: C.primary, fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  {actionId === selectedMember.id ? '처리 중' : '가입 복구'}
                </button>
              )}
              {selectedMember.status === 'active' && selectedMember.role === 'user' && (
                <>
                  <button
                    type="button"
                    disabled={actionId === selectedMember.id}
                    onClick={() => window.confirm('이 회원을 탈퇴 처리하시겠습니까?') && toggle(selectedMember)}
                    style={{ padding: '9px 14px', background: C.dangerLight, border: 'none', borderRadius: '10px', color: C.danger, fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {actionId === selectedMember.id ? '처리 중' : '탈퇴 처리'}
                  </button>
                  <button
                    type="button"
                    disabled={actionId === selectedMember.id}
                    onClick={() => window.confirm('이 회원을 관리자로 지정하시겠습니까?') && changeRole(selectedMember, 'admin')}
                    style={{ padding: '9px 14px', background: C.primaryLight, border: `1px solid ${C.primary}`, borderRadius: '10px', color: C.primary, fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    관리자 지정
                  </button>
                </>
              )}
              {selectedMember.role === 'admin' && currentUser?.email !== selectedMember.email && (
                <button
                  type="button"
                  disabled={actionId === selectedMember.id}
                  onClick={() => window.confirm('이 관리자의 권한을 해제하시겠습니까?') && changeRole(selectedMember, 'user')}
                  style={{ padding: '9px 14px', background: C.warnLight, border: 'none', borderRadius: '10px', color: C.warn, fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  {actionId === selectedMember.id ? '처리 중' : '권한 해제'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function MemberOverviewTab({ startDate, endDate }) {
  const [statistics, setStatistics] = useState(null);
  const [statisticsError, setStatisticsError] = useState('');

  useEffect(() => {
    let mounted = true;
    setStatisticsError('');
    adminStatsApi.getMemberStatistics(startDate, endDate)
      .then((data) => { if (mounted) setStatistics(data); })
      .catch(() => { if (mounted) setStatisticsError('회원 통계 API 연결 후 표시됩니다.'); });
    return () => { mounted = false; };
  }, [startDate, endDate]);

  const dailyStatistics = (statistics?.dailyStatistics ?? []).map((item) => ({
    ...item,
    inactiveMemberCount: item.inactiveProcessedMemberCount ?? item.inactiveMemberCount ?? 0,
  }));

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: C.fg }}>회원 현황</div>
          <div style={{ marginTop: '3px', fontSize: '12px', color: C.fgMuted }}>회원 변화와 핵심 서비스 이용도를 확인합니다.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px', marginBottom: '12px' }}>
        {[
          { label: '활성 회원', value: statistics ? `${statistics.activeMemberCount}명` : '—명', color: C.primary, bg: C.primaryLight, icon: Users },
          { label: '비활성 회원', value: statistics ? `${statistics.inactiveMemberCount}명` : '—명', color: C.fgMuted, bg: C.surface, icon: UserMinus },
          { label: '선택 기간 신규 가입', value: statistics ? `${statistics.newMemberCount}명` : '—명', secondary: `${startDate} ~ ${endDate}`, color: '#3974C6', bg: '#EAF2FF', icon: UserPlus },
          { label: '선택 기간 비활성 처리', value: statistics ? `${statistics.inactiveProcessedMemberCount}명` : '—명', secondary: '기간 내 중복 회원은 1명으로 집계', color: C.danger, bg: C.dangerLight, icon: AlertTriangle },
        ].map((item) => (
          <div key={item.label} className="admin-shadcn-card admin-shadcn-metric-card" style={{ padding: '16px', borderRadius: '16px', background: C.card, boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
            <div style={{ minHeight: '34px', display: 'flex', alignItems: 'center', gap: '9px' }}>
              <span style={{ width: '34px', height: '34px', flexShrink: 0, borderRadius: '10px', background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><item.icon size={17} /></span>
              <span style={{ fontSize: '14px', lineHeight: 1.25, fontWeight: 900, color: C.fg }}>{item.label}</span>
            </div>
            <div style={{ marginTop: '14px', fontSize: '23px', fontWeight: 900, color: item.color }}>{item.value}</div>
            {item.secondary && <div style={{ marginTop: '5px', fontSize: '10px', fontWeight: 800, color: C.fgMuted }}>{item.secondary}</div>}
          </div>
        ))}
      </div>
      {statisticsError && <div style={{ marginBottom: '12px', color: C.fgSubtle, fontSize: '10px' }}>{statisticsError}</div>}

      <div className="admin-shadcn-card admin-shadcn-panel" style={{ padding: '16px', borderRadius: '16px', background: C.card, boxShadow: '0 2px 10px rgba(17,32,29,0.08)', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 900, color: C.fg }}><Activity size={16} color={C.primary} /> 신규 가입·비활성 처리 회원 추이</div>
          <span style={{ fontSize: '10px', fontWeight: 800, color: C.fgMuted }}>{GRANULARITY_LABELS[statistics?.granularity] ?? '일별'} 집계</span>
        </div>
        <div style={{ height: '230px', marginTop: '14px' }}>
          {dailyStatistics.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStatistics}>
                <XAxis dataKey="date" tickFormatter={(date) => formatStatisticsDate(date, statistics?.granularity)} tick={{ fontSize: 10, fill: C.fgMuted }} minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: C.fgMuted }} />
                <Tooltip />
                <Bar dataKey="newMemberCount" name="신규 가입" fill={C.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="inactiveMemberCount" name="비활성 처리" fill={C.danger} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', borderRadius: '12px', border: `1px dashed ${C.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.fgSubtle, fontSize: '11px' }}>표시할 회원 통계가 없습니다.</div>
          )}
        </div>
        <div style={{ marginTop: '8px', fontSize: '10px', color: C.fgSubtle }}>비활성 처리는 해당 날짜에 한 번 이상 비활성 처리된 고유 회원 수이며 현재 상태와 다를 수 있습니다.</div>
      </div>

    </div>
  );
}

function MemberStatusHistoryTab({ startDate, endDate }) {
  const [page, setPage] = useState(0);
  const [histories, setHistories] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPage(0);
  }, [startDate, endDate]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    adminApi.getMemberStatusHistories({ startDate, endDate, page })
      .then((data) => { if (mounted) setHistories(data); })
      .catch(() => { if (mounted) setError('회원 상태 이력 API 연결 후 표시됩니다.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [startDate, endDate, page]);

  const statusLabel = (status) => {
    if (status === 'ACTIVE') return '활성';
    if (status === 'INACTIVE') return '비활성';
    return status ?? '—';
  };
  const statusColor = (status) => status === 'INACTIVE' ? C.danger : C.primary;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: C.fg }}>회원 상태 변경 이력</div>
          <div style={{ marginTop: '3px', fontSize: '12px', color: C.fgMuted }}>회원의 활성·비활성 상태 변경 기록을 시간순으로 확인합니다.</div>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 800, color: C.fgMuted }}>총 {histories.totalElements}건</span>
      </div>

      <div className="admin-shadcn-card admin-shadcn-table-wrap" style={{ overflowX: 'auto', borderRadius: '16px', background: C.card, boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
        <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ background: C.surface, color: C.fgMuted, textAlign: 'left' }}>
              {['이력 ID', '회원 ID', '회원', '이메일', '이전 상태', '변경 상태', '현재 상태', '변경 시각'].map((label) => (
                <th key={label} style={{ padding: '12px', fontWeight: 900, borderBottom: `1px solid ${C.border}` }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {histories.content.map((history) => (
              <tr key={history.memberStatusHistoryId ?? history.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: '12px', color: C.fgMuted }}>{history.memberStatusHistoryId ?? history.id}</td>
                <td style={{ padding: '12px', color: C.fgMuted }}>{history.memberId}</td>
                <td style={{ padding: '12px', fontWeight: 900, color: C.fg }}>{history.nickname ?? '—'}</td>
                <td style={{ padding: '12px', color: C.fgMuted }}>{history.email ?? '—'}</td>
                <td style={{ padding: '12px', fontWeight: 800, color: statusColor(history.previousStatus) }}>{statusLabel(history.previousStatus)}</td>
                <td style={{ padding: '12px', fontWeight: 900, color: statusColor(history.changedStatus) }}>{statusLabel(history.changedStatus)}</td>
                <td style={{ padding: '12px', fontWeight: 900, color: statusColor(history.currentStatus) }}>{statusLabel(history.currentStatus)}</td>
                <td style={{ padding: '12px', color: C.fgMuted }}>{history.changedAt ?? history.createdAt ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div style={{ padding: '30px', textAlign: 'center', fontSize: '11px', color: C.fgSubtle }}>상태 이력을 불러오는 중...</div>}
        {!loading && !error && histories.content.length === 0 && <div style={{ padding: '30px', textAlign: 'center', fontSize: '11px', color: C.fgSubtle }}>선택한 기간의 상태 변경 이력이 없습니다.</div>}
        {!loading && error && <div style={{ padding: '30px', textAlign: 'center', fontSize: '11px', color: C.fgSubtle }}>{error}</div>}
      </div>

      {histories.totalPages > 1 && <PageControls page={page} totalPages={histories.totalPages} onChange={setPage} />}
    </div>
  );
}

function MemberServiceUsageTab({ startDate, endDate }) {
  const [selectedMetric, setSelectedMetric] = useState('fridge');
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const graphRefs = useRef({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    adminStatsApi.getMemberUsageStatistics(startDate, endDate)
      .then((data) => { if (mounted) setStatistics(data); })
      .catch(() => { if (mounted) setError('서비스 이용 통계를 불러오지 못했습니다.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [startDate, endDate]);

  const usageCards = [
    { key: 'fridge', label: '냉장고 재료 등록', icon: Refrigerator, color: C.primary, bg: C.primaryLight, detail: '선택 기간에 재료를 1개 이상 등록한 회원' },
    { key: 'shopping', label: '장보기 목록 사용', icon: ShoppingBasket, color: '#3974C6', bg: '#EAF2FF', detail: '선택 기간에 장보기 항목을 1개 이상 만든 회원' },
    { key: 'recipe', label: '레시피 작성', icon: BookOpen, color: '#7A5AC8', bg: '#F0EBFF', detail: '선택 기간에 레시피를 1개 이상 작성한 회원' },
  ];
  const moveToGraph = (key) => {
    setSelectedMetric(key);
    requestAnimationFrame(() => {
      graphRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 900, color: C.fg }}>서비스 이용률 상세</div>
          <div style={{ marginTop: '3px', fontSize: '12px', color: C.fgMuted }}>선택한 기간에 회원이 핵심 기능을 얼마나 이용했는지 확인합니다.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px', marginBottom: '12px' }}>
        {usageCards.map(({ key, label, icon: Icon, color, bg, detail }) => {
          const selected = selectedMetric === key;
          const usage = statistics?.[key];
          return (
            <button key={key} className={`admin-shadcn-card admin-shadcn-metric-card${selected ? ' is-selected' : ''}`} onClick={() => moveToGraph(key)} style={{ padding: '16px', textAlign: 'left', borderRadius: '16px', background: C.card, border: `1px solid ${selected ? color + '70' : 'transparent'}`, boxShadow: selected ? `0 2px 10px ${color}20` : '0 2px 10px rgba(17,32,29,0.08)', cursor: 'pointer' }}>
              <div style={{ minHeight: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                  <span style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '11px', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} /></span>
                  <span style={{ fontSize: '14px', lineHeight: 1.25, fontWeight: 900, color: C.fg }}>{label}</span>
                </div>
                <span style={{ fontSize: '9px', fontWeight: 800, color: C.primary }}>현재</span>
              </div>
              <div style={{ marginTop: '13px', fontSize: '22px', fontWeight: 900, color }}>{loading ? '…' : `${usage?.usageRate ?? 0}%`}</div>
              <div style={{ marginTop: '4px', fontSize: '10px', lineHeight: 1.45, color: C.fgSubtle }}>{detail}</div>
              <div style={{ marginTop: '3px', fontSize: '10px', color: C.fgMuted }}>이용 회원 {usage?.userCount ?? 0}명 / 활성 회원 {statistics?.activeMemberCount ?? 0}명</div>
            </button>
          );
        })}
      </div>

      <div className="admin-shadcn-card admin-shadcn-panel" style={{ padding: '16px', borderRadius: '16px', background: C.card, boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 900, color: C.fg }}><Activity size={16} color={C.primary} /> 서비스별 이용 회원 추이</div><span style={{ fontSize: '10px', fontWeight: 800, color: C.fgMuted }}>{GRANULARITY_LABELS[statistics?.granularity] ?? '일별'} 집계</span></div>
        {error && <div style={{ marginTop: '10px', fontSize: '11px', color: C.danger }}>{error}</div>}
        <div style={{ display: 'grid', gap: '14px', marginTop: '14px' }}>
          {usageCards.map((metric) => (
            <section
              key={metric.key}
              ref={(element) => { graphRefs.current[metric.key] = element; }}
              style={{ scrollMarginTop: '18px', padding: '14px', borderRadius: '14px', border: `1px solid ${selectedMetric === metric.key ? metric.color + '70' : C.border}`, background: C.card }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 900, color: C.fg }}>
                <metric.icon size={15} color={metric.color} /> {metric.label} 추이
              </div>
              <div style={{ height: '230px', marginTop: '12px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statistics?.[metric.key]?.dailyStatistics || []}>
                    <XAxis dataKey="date" tickFormatter={(date) => formatStatisticsDate(date, statistics?.granularity)} tick={{ fontSize: 10, fill: C.fgMuted }} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: C.fgMuted }} />
                    <Tooltip />
                    <Bar dataKey="userCount" name="이용 회원" fill={metric.color} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function MembersTab({ currentUser }) {
  const [section, setSection] = useState('overview');
  const toLocalDateValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return toLocalDateValue(date);
  });
  const [endDate, setEndDate] = useState(() => toLocalDateValue(new Date()));
  const [quickPeriod, setQuickPeriod] = useState(30);
  const dateRangeInvalid = startDate > endDate;
  const showDateFilter = section === 'overview' || section === 'history';

  const applyQuickPeriod = (nextPeriod) => {
    const end = new Date();
    const start = new Date();
    if (nextPeriod === 'all') start.setFullYear(2020, 0, 1);
    else start.setDate(start.getDate() - (nextPeriod - 1));
    setStartDate(toLocalDateValue(start));
    setEndDate(toLocalDateValue(end));
    setQuickPeriod(nextPeriod);
  };

  const changeStartDate = (value) => { setStartDate(value); setQuickPeriod(null); };
  const changeEndDate = (value) => { setEndDate(value); setQuickPeriod(null); };

  return (
    <div className="admin-shadcn-page admin-members-page">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: '16px', color: C.fg, marginBottom: '4px' }}>회원 관리</div>
          <div style={{ fontSize: '12px', color: C.fgMuted }}>회원 상태와 서비스 이용 현황을 확인하고 관리합니다.</div>
        </div>
        {showDateFilter && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <DatePartsSelect label="시작일" value={startDate} onChange={changeStartDate} invalid={dateRangeInvalid} />
              <span style={{ color: C.fgSubtle, fontSize: '14px', fontWeight: 800 }}>~</span>
              <DatePartsSelect label="종료일" value={endDate} onChange={changeEndDate} invalid={dateRangeInvalid} />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[7, 30, 'all'].map((option) => (
                <button key={option} type="button" onClick={() => applyQuickPeriod(option)} style={{ minWidth: '66px', padding: '7px 12px', border: `1px solid ${quickPeriod === option ? C.primary : C.border}`, borderRadius: '9px', background: quickPeriod === option ? C.primary : C.card, color: quickPeriod === option ? '#FFF' : C.fgMuted, fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                  {option === 'all' ? '전체' : `최근 ${option}일`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {showDateFilter && dateRangeInvalid && <div style={{ marginTop: '-8px', marginBottom: '12px', textAlign: 'right', color: C.danger, fontSize: '10px', fontWeight: 700 }}>시작일은 종료일보다 늦을 수 없습니다.</div>}
      <div className="admin-shadcn-tabs" style={{ display: 'inline-flex', padding: '4px', marginBottom: '18px', background: C.surface, borderRadius: '12px' }}>
        {[
          { key: 'overview', label: '회원 현황', icon: BarChart3 },
          { key: 'search', label: '회원 검색·관리', icon: Search },
          { key: 'history', label: '상태 변경 이력', icon: Clock },
        ].map(({ key, label, icon: Icon }) => {
          const active = section === key;
          return (
            <button key={key} className={`admin-shadcn-tab${active ? ' is-active' : ''}`} onClick={() => setSection(key)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 13px', border: 'none', borderRadius: '9px', background: active ? C.card : 'transparent', color: active ? C.primary : C.fgMuted, boxShadow: active ? '0 2px 8px rgba(17,32,29,0.08)' : 'none', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}><Icon size={14} />{label}</button>
          );
        })}
      </div>
      {section === 'overview' && <MemberOverviewTab startDate={startDate} endDate={endDate} />}
      {section === 'search' && <MemberSearchTab currentUser={currentUser} />}
      {section === 'history' && <MemberStatusHistoryTab startDate={startDate} endDate={endDate} />}
    </div>
  );
}

// ─── Recipes ──────────────────────────────────────────────────────────────────
const RECIPE_PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

function RecipesTab({ recipes, onFetchRecipes, adminPage, adminTotalPages, adminTotalElements, adminSize, onUpdateRecipe, onDeleteRecipe }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageSize, setPageSize] = useState(adminSize ?? 20);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    onFetchRecipes({ search: debouncedSearch, page: 0, size: pageSize })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, pageSize]);

  const handlePageChange = (nextPage) => {
    setLoading(true);
    setError(null);
    onFetchRecipes({ search: debouncedSearch, page: nextPage, size: pageSize })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const fetchDetail = async (recipe) => {
    const res = await adminRecipesApi.getById(recipe.recipeId ?? recipe.id);
    const d = res.data?.data ?? res.data;
    return mapRecipeDetail(d);
  };

  const loadComments = async (recipeId) => {
    setCommentsLoading(true);
    try {
      const res = await recipesApi.getComments(recipeId);
      const body = res.data?.data ?? res.data;
      setComments(body?.comments ?? []);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSelect = async (recipe) => {
    setDetailLoading(true);
    setError(null);
    setDeleteCommentId(null);
    try {
      const detail = await fetchDetail(recipe);
      setSelected(detail);
      loadComments(detail.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEditClick = async (recipe) => {
    setDetailLoading(true);
    setError(null);
    try {
      setEditing(await fetchDetail(recipe));
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEdit = async (data) => {
    if (!editing) return;
    // 에러를 다시 던져서 RecipeFormModal 자체의 인라인 에러 표시로 보여줌 (모달이 화면을 덮어 바깥 배너가 안 보임)
    await onUpdateRecipe(editing.id, data);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    try {
      await onDeleteRecipe(id);
      setDeleteId(null);
      // 삭제 후 총 개수/목록을 서버 기준으로 다시 맞춤
      await onFetchRecipes({ search: debouncedSearch, page: adminPage, size: pageSize });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!selected) return;
    try {
      await recipesApi.deleteComment(commentId);
      await loadComments(selected.id);
    } catch (err) {
      alert(err.message || '댓글 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteCommentId(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '16px', color: C.fg }}>레시피 관리</div>
          <div style={{ fontSize: '12px', color: C.fgMuted }}>총 {adminTotalElements}개 · 기존 레시피 수정/삭제</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.fgMuted }} />
          <input
            style={{
              width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px',
              padding: '10px 12px 10px 34px', color: C.fg, fontSize: '13px', outline: 'none', boxSizing: 'border-box',
            }}
            placeholder="레시피 이름 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px',
            padding: '0 10px', color: C.fg, fontSize: '13px', outline: 'none', cursor: 'pointer',
          }}
        >
          {RECIPE_PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}개씩</option>
          ))}
        </select>
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
                <button onClick={(e) => { e.stopPropagation(); handleEditClick(r); }} style={{ padding: '6px 10px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.fgMuted, cursor: 'pointer' }}><Edit2 size={13} /></button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }} style={{ padding: '6px 10px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.fgMuted, cursor: 'pointer' }}><Trash2 size={13} /></button>
              </div>
            )}
          </div>
        ))}
        {!loading && recipes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '36px 0', color: C.fgMuted, fontSize: '13px' }}>검색 결과가 없어요</div>
        )}
      </div>

      <PageControls page={adminPage} totalPages={adminTotalPages} onChange={handlePageChange} />

      {detailLoading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.45)', zIndex: 650, display: 'grid', placeItems: 'center' }}>
          <div style={{ color: C.fgMuted, fontWeight: 700, fontSize: '14px' }}>상세 정보 불러오는 중...</div>
        </div>
      )}

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.45)', zIndex: 650, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setSelected(null)}>
          <div
            style={{ background: C.bg, borderRadius: '20px', padding: '24px 24px 28px', width: '100%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(17,32,29,0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.1em', fontWeight: 700, marginBottom: '4px' }}>RECIPE DETAIL</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, color: C.fg, margin: 0, lineHeight: 1.1 }}>{selected.name}</h2>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: C.accent, fontWeight: 700 }}>
                    <Heart size={14} fill={C.accent} color={C.accent} /> {selected.likeCount}
                  </span>
                </div>
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
              <span style={{ fontSize: '12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '5px 10px', color: C.fgMuted }}>{DIFFICULTY_LABELS[selected.difficulty] ?? selected.difficulty}</span>
              <span style={{ fontSize: '12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '5px 10px', color: C.fgMuted }}>{selected.cookTime}분</span>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: C.fgMuted, marginBottom: '10px' }}>필수 재료</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selected.requiredIngredients.map((ri, idx) => (
                  <span key={idx} style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: C.primaryLight, color: C.primary }}>{ri.name ?? ri}</span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
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

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: C.fgMuted, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={13} /> 댓글 {comments.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {commentsLoading ? (
                  <div style={{ fontSize: '12px', color: C.fgSubtle, textAlign: 'center', padding: '16px 0' }}>불러오는 중...</div>
                ) : comments.length === 0 ? (
                  <div style={{ fontSize: '12px', color: C.fgSubtle, textAlign: 'center', padding: '16px 0' }}>등록된 댓글이 없어요</div>
                ) : (
                  comments.map((c) => (
                    <div key={c.commentId} style={{ background: C.surface, borderRadius: '14px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: C.fg }}>
                          {c.writerNickname}
                          {c.modified && <span style={{ fontSize: '10px', color: C.fgSubtle, fontWeight: 400 }}> (수정됨)</span>}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10px', color: C.fgSubtle }}>{c.createdAt?.split('T')[0]}</span>
                          {deleteCommentId === c.commentId ? (
                            <span style={{ display: 'flex', gap: '4px' }}>
                              <button onClick={() => handleDeleteComment(c.commentId)} style={{ fontSize: '10px', fontWeight: 700, color: C.danger, background: 'none', border: 'none', cursor: 'pointer' }}>삭제</button>
                              <button onClick={() => setDeleteCommentId(null)} style={{ fontSize: '10px', color: C.fgSubtle, background: 'none', border: 'none', cursor: 'pointer' }}>취소</button>
                            </span>
                          ) : (
                            <button onClick={() => setDeleteCommentId(c.commentId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.fgSubtle, padding: '2px' }}>
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: C.fg, lineHeight: 1.5 }}>{c.content}</div>
                    </div>
                  ))
                )}
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
  const [addDefaultExpiryDays, setAddDefaultExpiryDays] = useState('');
  const [addDupError, setAddDupError] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('채소/과일');
  const [editDefaultExpiryDays, setEditDefaultExpiryDays] = useState('');
  const [error, setError] = useState('');

  const inputStyle = {
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px',
    padding: '9px 12px', color: C.fg, fontSize: '13px', outline: 'none', boxSizing: 'border-box',
  };

  const refreshProducts = async () => {
    const products = await adminApi.getProducts();
    onUpdate(products.map(toAdminIngredient));
  };

  useEffect(() => {
    refreshProducts().catch((err) => setError(err.message || '사전 재료 목록을 불러오지 못했습니다.'));
  }, []);

  const handleAdd = () => {
    if (!addName.trim()) return;
    if (items.some((i) => i.name === addName.trim())) { setAddDupError(true); return; }
    adminApi.createProduct({
      productCategoryId: CATEGORY_IDS[addCategory],
      name: addName.trim(),
      defaultExpiryDays: addDefaultExpiryDays ? Number(addDefaultExpiryDays) : null,
    })
      .then(refreshProducts)
      .then(() => {
        setAddName('');
        setAddDefaultExpiryDays('');
        setAddDupError(false);
      })
      .catch((err) => setError(err.message || '사전 재료 등록에 실패했습니다.'));
  };

  const handleToggle = (idx) => {
    const item = items[idx];
    adminApi.setProductActive(item.productId, !item.active)
      .then(refreshProducts)
      .catch((err) => setError(err.message || '사전 재료 상태 변경에 실패했습니다.'));
  };

  const handleEditSave = (idx) => {
    if (!editName.trim()) return;
    if (items.some((item, i) => i !== idx && item.name === editName.trim())) return;
    adminApi.updateProduct(items[idx].productId, {
      productCategoryId: CATEGORY_IDS[editCategory],
      name: editName.trim(),
      defaultExpiryDays: editDefaultExpiryDays ? Number(editDefaultExpiryDays) : null,
    })
      .then(refreshProducts)
      .then(() => setEditIdx(null))
      .catch((err) => setError(err.message || '사전 재료 수정에 실패했습니다.'));
  };

  const activeCount = items.filter((i) => i.active).length;
  const filtered = search.trim() ? items.filter((i) => i.name.includes(search.trim()) || i.category.includes(search.trim())) : items;

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: '16px', color: C.fg, marginBottom: '4px' }}>사전 재료 관리</div>
      <div style={{ fontSize: '12px', color: C.fgMuted, marginBottom: '12px' }}>총 {items.length}개 · 활성 {activeCount}개 · 냉장고 재료 검색에 노출됩니다</div>

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
          <input
            type="number"
            min="0"
            style={{ ...inputStyle, width: '150px', flexShrink: 0 }}
            placeholder="유통기한(일)"
            value={addDefaultExpiryDays}
            onChange={(e) => setAddDefaultExpiryDays(e.target.value)}
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
                    <input
                      type="number"
                      min="0"
                      style={{ ...inputStyle, width: '120px', fontSize: '12px', flexShrink: 0 }}
                      placeholder="유통기한"
                      value={editDefaultExpiryDays}
                      onChange={(e) => setEditDefaultExpiryDays(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(idx); if (e.key === 'Escape') setEditIdx(null); }}
                    />
                  </div>
                  <button onClick={() => handleEditSave(idx)} style={{ padding: '5px 10px', background: C.primary, color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>저장</button>
                  <button onClick={() => setEditIdx(null)} style={{ padding: '5px 8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '12px', color: C.fgMuted, cursor: 'pointer', flexShrink: 0 }}>취소</button>
                </>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: C.fg }}>{item.name}</div>
                    <div style={{ fontSize: '10px', color: C.fgMuted }}>
                      {item.category} · 기본 유통기한 {item.defaultExpiryDays != null ? `${item.defaultExpiryDays}일` : '미설정'}
                    </div>
                  </div>
                  <button onClick={() => handleToggle(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.active ? C.primary : C.fgSubtle, padding: '2px' }}>
                    {item.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  <button onClick={() => {
                    setEditIdx(idx);
                    setEditName(item.name);
                    setEditCategory(item.category);
                    setEditDefaultExpiryDays(item.defaultExpiryDays ?? '');
                  }} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '5px 8px', cursor: 'pointer', color: C.fgMuted }}>
                    <Edit2 size={12} />
                  </button>
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
function StatsTab() {
  const toLocalDateValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [section, setSection] = useState('usage');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return toLocalDateValue(date);
  });
  const [endDate, setEndDate] = useState(() => toLocalDateValue(new Date()));
  const [quickPeriod, setQuickPeriod] = useState(30);
  const [summary, setSummary] = useState(null);
  const [materialStatistics, setMaterialStatistics] = useState(null);
  const [recipeStatistics, setRecipeStatistics] = useState(null);
  const [recipeCategoryType, setRecipeCategoryType] = useState('all');
  const [categoryStats, setCategoryStats] = useState([]);
  const [topIngredients, setTopIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dateRangeInvalid = startDate > endDate;

  const applyQuickPeriod = (nextPeriod) => {
    const end = new Date();
    const start = new Date();
    if (nextPeriod === 'all') {
      start.setFullYear(2020, 0, 1);
    } else {
      start.setDate(start.getDate() - (nextPeriod - 1));
    }
    setStartDate(toLocalDateValue(start));
    setEndDate(toLocalDateValue(end));
    setQuickPeriod(nextPeriod);
  };

  const changeStartDate = (value) => {
    setStartDate(value);
    setQuickPeriod(null);
  };

  const changeEndDate = (value) => {
    setEndDate(value);
    setQuickPeriod(null);
  };

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      if (dateRangeInvalid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const [summaryData, materialData, recipeData, ingredients] = await Promise.all([
          adminStatsApi.getSummary(startDate, endDate),
          adminStatsApi.getMaterialStatistics(startDate, endDate),
          adminStatsApi.getRecipeStatistics(startDate, endDate),
          adminStatsApi.getTopIngredients(startDate, endDate),
        ]);
        if (mounted) {
          setSummary(summaryData);
          setMaterialStatistics(materialData);
          setRecipeStatistics(recipeData);
          setCategoryStats(materialData?.categoryStatistics || []);
          setTopIngredients(ingredients);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || '통계를 불러오지 못했습니다.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      mounted = false;
    };
  }, [startDate, endDate, dateRangeInvalid]);

  const byCategory = categoryStats
    .map((c) => ({ name: c.categoryName.split('/')[0], count: c.expiredCount }))
    .sort((a, b) => b.count - a.count);
  const dailyMaterialStatistics = materialStatistics?.dailyStatistics ?? [];
  const materialTotals = dailyMaterialStatistics.reduce(
    (totals, item) => ({
      registered: totals.registered + (item.registeredCount ?? 0),
      expired: totals.expired + (item.expiredCount ?? 0),
    }),
    { registered: 0, expired: 0 }
  );

  const expiredIngredientChangeRate = summary?.expiredIngredientChangeRate;
  const recipeCategoryFilters = [
    { key: 'all', label: '전체', countKey: 'recipeCount' },
    { key: 'base', label: '기본 제공', countKey: 'baseRecipeCount' },
    { key: 'member', label: '회원 등록', countKey: 'memberRecipeCount' },
    { key: 'admin', label: '관리자 등록', countKey: 'adminRecipeCount' },
  ];
  const selectedRecipeFilter = recipeCategoryFilters.find(
    (filter) => filter.key === recipeCategoryType
  );
  const selectedRecipeCategories = (recipeStatistics?.categoryStatistics ?? [])
    .map((item) => ({
      categoryName: item.categoryName,
      recipeCount: item[selectedRecipeFilter.countKey] ?? 0,
    }))
    .filter((item) => item.recipeCount > 0)
    .sort((a, b) => b.recipeCount - a.recipeCount);

  return (
    <div className="admin-shadcn-page admin-stats-page">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: '16px', color: C.fg, marginBottom: '4px' }}>서비스 통계</div>
          <div style={{ fontSize: '12px', color: C.fgMuted }}>선택한 기간의 냉파 성과와 콘텐츠 흐름을 확인합니다.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <DatePartsSelect label="시작일" value={startDate} onChange={changeStartDate} invalid={dateRangeInvalid} />
            <span style={{ color: C.fgSubtle, fontSize: '14px', fontWeight: 800 }}>~</span>
            <DatePartsSelect label="종료일" value={endDate} onChange={changeEndDate} invalid={dateRangeInvalid} />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[7, 30, 'all'].map((option) => (
              <button key={option} type="button" onClick={() => applyQuickPeriod(option)} style={{ minWidth: '66px', padding: '7px 12px', border: `1px solid ${quickPeriod === option ? C.primary : C.border}`, borderRadius: '9px', background: quickPeriod === option ? C.primary : C.card, color: quickPeriod === option ? '#FFF' : C.fgMuted, fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                {option === 'all' ? '전체' : `최근 ${option}일`}
              </button>
            ))}
          </div>
        </div>
      </div>
      {dateRangeInvalid && <div style={{ marginTop: '-8px', marginBottom: '12px', textAlign: 'right', color: C.danger, fontSize: '10px', fontWeight: 700 }}>시작일은 종료일보다 늦을 수 없습니다.</div>}

      <div className="admin-shadcn-tabs" style={{ display: 'inline-flex', padding: '4px', marginBottom: '18px', background: C.surface, borderRadius: '12px' }}>
        {[
          { key: 'usage', label: '회원·이용 분석', icon: Activity },
          { key: 'materials', label: '재료·냉파 분석', icon: Refrigerator },
          { key: 'recipes', label: '레시피 분석', icon: BookOpen },
        ].map(({ key, label, icon: Icon }) => {
          const active = section === key;
          return (
            <button key={key} className={`admin-shadcn-tab${active ? ' is-active' : ''}`} onClick={() => setSection(key)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 13px', border: 'none', borderRadius: '9px', background: active ? C.card : 'transparent', color: active ? C.primary : C.fgMuted, boxShadow: active ? '0 2px 8px rgba(17,32,29,0.08)' : 'none', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}><Icon size={14} />{label}</button>
          );
        })}
      </div>

      {error && (
        <div style={{ background: C.dangerLight, color: C.danger, borderRadius: '10px', padding: '10px 12px', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
          {error}
        </div>
      )}

      {section === 'usage' && <MemberServiceUsageTab startDate={startDate} endDate={endDate} />}

      {section === 'materials' && (
        <>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px', marginBottom: '12px' }}>
        {[
          { label: '평균 냉파 점수', value: loading ? '…' : `${summary?.averageScore ?? 0}점`, detail: `선택 기간 점수 갱신 회원 ${summary?.scoreMemberCount ?? 0}명 기준`, icon: Star, color: C.primary, bg: C.primaryLight },
          { label: '기간 내 등록 재료', value: loading ? '…' : `${summary?.registeredIngredientCount ?? 0}건`, detail: `${startDate} ~ ${endDate}`, icon: Package, color: '#3974C6', bg: '#EAF2FF' },
          { label: '기간 내 만료 재료', value: loading ? '…' : `${summary?.expiredIngredientCount ?? 0}건`, detail: expiredIngredientChangeRate == null ? '이전 기간 데이터 없음' : `이전 동일 기간 대비 ${expiredIngredientChangeRate > 0 ? '↑ ' : expiredIngredientChangeRate < 0 ? '↓ ' : ''}${Math.abs(expiredIngredientChangeRate).toFixed(1)}%`, icon: CalendarDays, color: C.danger, bg: C.dangerLight },
        ].map(({ label, value, detail, icon: Icon, color, bg }) => (
          <div key={label} className="admin-shadcn-card admin-shadcn-metric-card" style={{ minHeight: '140px', padding: '17px 18px', border: `1px solid ${C.border}`, borderTop: `3px solid ${color}`, borderRadius: '12px', background: C.card, boxShadow: '0 1px 4px rgba(17,32,29,0.06)' }}>
            <div style={{ minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}><span style={{ width: '32px', height: '32px', borderRadius: '8px', background: bg, color, border: `1px solid ${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} /></span><span style={{ fontSize: '13px', fontWeight: 800, color: C.fgMuted }}>{label}</span></div>
              <span style={{ padding: '4px 7px', borderRadius: '999px', background: C.surface, fontSize: '9px', fontWeight: 800, color: C.primary }}>선택 기간</span>
            </div>
            <div style={{ marginTop: '16px', fontSize: '26px', lineHeight: 1, fontWeight: 900, letterSpacing: '-0.03em', color: C.fg }}>{value}</div>
            <div style={{ marginTop: '9px', fontSize: '10px', color: C.fgSubtle }}>{detail}</div>
          </div>
        ))}
      </div>

      <div className="admin-shadcn-card admin-shadcn-panel" style={{ background: C.card, borderRadius: '16px', padding: '14px 16px', marginBottom: '10px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}><div style={{ fontSize: '14px', fontWeight: 700, color: C.fg }}>재료 등록·만료 추이</div><span style={{ fontSize: '10px', fontWeight: 800, color: C.fgMuted }}>{GRANULARITY_LABELS[materialStatistics?.granularity] ?? '일별'} 집계</span></div>
        <div style={{ height: '240px' }}>
          {dailyMaterialStatistics.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyMaterialStatistics} margin={{ top: 8, right: 16, left: -6, bottom: 0 }}>
                <XAxis dataKey="date" tickFormatter={(date) => formatStatisticsDate(date, materialStatistics?.granularity)} tick={{ fontSize: 10, fill: C.fgMuted }} axisLine={{ stroke: C.borderStrong }} tickLine={false} minTickGap={24} />
                <YAxis tick={{ fontSize: 11, fill: C.fgMuted }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: C.card, borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 16px rgba(17,32,29,0.1)' }} cursor={{ fill: C.surface }} labelFormatter={(date) => formatStatisticsDate(date, materialStatistics?.granularity)} />
                <Bar dataKey="registeredCount" fill="#3974C6" name="등록 재료" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expiredCount" fill={C.danger} name="만료 재료" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', borderRadius: '12px', border: `1px dashed ${C.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.fgSubtle, fontSize: '11px' }}>선택 기간에 재료 등록·만료 내역이 없습니다.</div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '18px', marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${C.border}`, fontSize: '11px', fontWeight: 800 }}>
          <span style={{ color: '#3974C6' }}>총 등록 {materialTotals.registered}건</span>
          <span style={{ color: C.danger }}>총 만료 {materialTotals.expired}건</span>
        </div>
      </div>

      <div className="admin-shadcn-card admin-shadcn-panel" style={{ background: C.card, borderRadius: '16px', padding: '14px 16px', marginBottom: '10px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: C.fg, marginBottom: '12px' }}>카테고리별 만료량</div>
        {byCategory.map((item) => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '11px 12px', borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: C.fg }}>{item.name}</span>
            <span style={{ minWidth: '54px', textAlign: 'right', fontSize: '13px', fontWeight: 900, color: C.danger }}>{item.count}건</span>
          </div>
        ))}
        {!loading && byCategory.length === 0 && (
          <div style={{ fontSize: '12px', color: C.fgMuted, textAlign: 'center', padding: '18px 0' }}>선택 기간에 만료된 카테고리가 없습니다.</div>
        )}
      </div>

      {/* Top wasted */}
      <div className="admin-shadcn-card admin-shadcn-panel" style={{ background: C.card, borderRadius: '16px', padding: '14px 16px', marginBottom: '10px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: C.fg, marginBottom: '10px' }}>가장 많이 만료된 재료 TOP 5</div>
        {topIngredients.map((item) => (
          <div key={item.rank} style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto auto', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
            <div style={{ minWidth: '20px', fontSize: '13px', fontWeight: 700, color: item.rank === 1 ? C.accent : C.fgMuted }}>{item.rank}</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: C.fg }}>{item.productName}</div>
            <div style={{ fontSize: '12px', color: C.fgMuted, fontWeight: 600 }}>{item.discardedCount}회</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: 700, color: item.rankChange > 0 ? C.primary : item.rankChange < 0 ? C.danger : C.fgSubtle, minWidth: '30px', justifyContent: 'flex-end' }}>
              {item.rankChange == null ? 'NEW' : item.rankChange === 0 ? <Minus size={11} /> : item.rankChange > 0 ? <><TrendingUp size={11} />{item.rankChange}</> : <><TrendingDown size={11} />{Math.abs(item.rankChange)}</>}
            </div>
          </div>
        ))}
        {!loading && topIngredients.length === 0 && (
          <div style={{ fontSize: '12px', color: C.fgMuted, textAlign: 'center', padding: '12px 0' }}>선택 기간에 만료된 재료가 없습니다.</div>
        )}
      </div>

        </>
      )}

      {section === 'recipes' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            {[
              { label: '선택 기간 신규 레시피', value: summary?.createdRecipeCount, detail: `${startDate} ~ ${endDate} · 회원·관리자 등록 포함`, icon: Plus, color: '#7A5AC8', bg: '#F0EBFF' },
              { label: '전체 레시피', value: recipeStatistics?.totalRecipeCount, detail: '삭제되지 않은 전체 레시피', icon: BookOpen, color: '#7A5AC8', bg: '#F0EBFF' },
              { label: '기본 제공 레시피', value: recipeStatistics?.baseRecipeCount, detail: '작성자 정보가 없는 초기 레시피', icon: Database, color: C.fgMuted, bg: C.surface },
              { label: '회원 등록 레시피', value: recipeStatistics?.memberRecipeCount, detail: '일반 회원이 등록한 레시피', icon: Users, color: C.primary, bg: C.primaryLight },
              { label: '관리자 등록 레시피', value: recipeStatistics?.adminRecipeCount, detail: '관리자 계정이 등록한 레시피', icon: ChefHat, color: '#3974C6', bg: '#EAF2FF' },
            ].map(({ label, value, detail, icon: Icon, color, bg }) => (
              <div key={label} className="admin-shadcn-card admin-shadcn-metric-card" style={{ padding: '16px', borderRadius: '16px', background: C.card, boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
                <div style={{ minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}><span style={{ width: '36px', height: '36px', borderRadius: '11px', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} /></span><span style={{ fontSize: '14px', fontWeight: 900, color: C.fg }}>{label}</span></div><span style={{ fontSize: '9px', fontWeight: 800, color: C.primary }}>현재</span></div>
                <div style={{ marginTop: '14px', fontSize: '23px', fontWeight: 900, color }}>{loading ? '…' : `${value ?? 0}개`}</div>
                <div style={{ marginTop: '5px', fontSize: '10px', color: C.fgMuted }}>{detail}</div>
              </div>
            ))}
          </div>

          <div className="admin-shadcn-card admin-shadcn-panel" style={{ padding: '16px', marginBottom: '12px', borderRadius: '16px', background: C.card, boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}><div style={{ fontSize: '14px', fontWeight: 900, color: C.fg }}>카테고리별 레시피</div><span style={{ fontSize: '9px', fontWeight: 800, color: C.fgSubtle }}>선택 기간</span></div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {recipeCategoryFilters.map((filter) => {
                const active = recipeCategoryType === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setRecipeCategoryType(filter.key)}
                    style={{ padding: '7px 11px', border: `1px solid ${active ? '#7A5AC8' : C.border}`, borderRadius: '9px', background: active ? '#7A5AC8' : C.card, color: active ? '#FFF' : C.fgMuted, fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
            {selectedRecipeCategories.map((item) => (
              <div key={item.categoryName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '11px 12px', borderTop: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: C.fg }}>{item.categoryName}</span>
                <span style={{ minWidth: '54px', textAlign: 'right', fontSize: '13px', fontWeight: 900, color: '#7A5AC8' }}>{item.recipeCount}개</span>
              </div>
            ))}
            {!loading && selectedRecipeCategories.length === 0 && (
              <div style={{ fontSize: '12px', color: C.fgMuted, textAlign: 'center', padding: '18px 0' }}>선택 기간에 해당 유형으로 등록된 레시피가 없습니다.</div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Inquiries ────────────────────────────────────────────────────────────────
const INQUIRY_PAGE_SIZE = 10;

function InquiriesTab({ inquiries, onFetchInquiries, onFetchInquiryDetail, onFetchInquiryCounts, pendingCount, answeredCount, onAnswer, onDeleteInquiry, onDeleteAnswer }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [sortDirection, setSortDirection] = useState('ASC');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detailLoadingId, setDetailLoadingId] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadList = async () => {
    setLoading(true);
    try {
      const meta = await onFetchInquiries({ isAnswered: activeTab === 'answered', page, size: INQUIRY_PAGE_SIZE, sortDirection });
      setTotalPages(meta?.totalPages ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    onFetchInquiryCounts();
  }, [onFetchInquiryCounts]);

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page, sortDirection]);

  const currentList = inquiries;

  const refreshAfterMutation = async () => {
    await Promise.all([loadList(), onFetchInquiryCounts()]);
  };

  const handleExpand = async (inq) => {
    if (expanded === inq.id) {
      setExpanded(null);
      setEditingAnswerId(null);
      return;
    }

    setDetailLoadingId(inq.id);
    try {
      const detail = inq.content === undefined
        ? await onFetchInquiryDetail(inq.id)
        : inq;
      setExpanded(inq.id);
      setAnswerText(detail?.answer ?? '');
      setEditingAnswerId(detail?.answer ? null : inq.id);
    } catch (err) {
      alert(err.message || '문의 상세 조회 중 오류가 발생했습니다.');
    } finally {
      setDetailLoadingId(null);
    }
  };

  const handleDeleteInquiry = async (id) => {
    try {
      await onDeleteInquiry(id);
      await refreshAfterMutation();
    } catch (err) {
      alert(err.message || '문의 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteConfirmId(null);
      if (expanded === id) setExpanded(null);
    }
  };

  const handleDeleteAnswer = async (id) => {
    try {
      await onDeleteAnswer(id);
      await refreshAfterMutation();
      setExpanded(null);
    } catch (err) {
      alert(err.message || '답변 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSubmitAnswer = async (id) => {
    if (!answerText.trim()) return;
    setSubmitting(true);
    try {
      await onAnswer(id, answerText.trim());
      await refreshAfterMutation();
      setEditingAnswerId(null);
      setExpanded(null);
    } catch (err) {
      alert(err.message || '답변 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabBtn = (tab, label, count, Icon) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => { setActiveTab(tab); setSortDirection(tab === 'answered' ? 'DESC' : 'ASC'); setPage(0); setExpanded(null); setEditingAnswerId(null); }}
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
        <div style={{ fontSize: '12px', color: C.fgMuted }}>전체 {pendingCount + answeredCount}건</div>
      </div>

      <div style={{ display: 'flex', background: C.card, borderRadius: '14px 14px 0 0', borderBottom: `1px solid ${C.border}`, marginBottom: '12px' }}>
        {tabBtn('pending', '미답변', pendingCount, Clock)}
        {tabBtn('answered', '답변완료', answeredCount, CheckCircle)}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
        <span style={{ marginRight: '2px', fontSize: '11px', fontWeight: 700, color: C.fgMuted }}>정렬</span>
        {[
          { value: 'ASC', label: activeTab === 'pending' ? '오래된 문의순' : '오래된 답변순' },
          { value: 'DESC', label: activeTab === 'pending' ? '최신 문의순' : '최근 답변순' },
        ].map((option) => {
          const isSelected = sortDirection === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => { setSortDirection(option.value); setPage(0); }}
              style={{
                padding: '6px 10px', borderRadius: '9px', cursor: 'pointer',
                border: `1px solid ${isSelected ? C.primary : C.border}`,
                background: isSelected ? C.primaryLight : C.card,
                color: isSelected ? C.primary : C.fgMuted,
                fontSize: '11px', fontWeight: isSelected ? 800 : 600,
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {!loading && currentList.length === 0 ? (
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
                    <div style={{ fontSize: '11px', color: C.fgMuted }}>{inq.userName} · {inq.createdAt}{detailLoadingId === inq.id ? ' · 불러오는 중...' : ''}</div>
                  </div>
                </button>
                {deleteConfirmId === inq.id ? (
                  <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                    <button onClick={() => handleDeleteInquiry(inq.id)} style={{ padding: '4px 8px', background: C.dangerLight, border: 'none', borderRadius: '8px', color: C.danger, fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>삭제</button>
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
                            onClick={() => handleDeleteAnswer(inq.id)}
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
                          onClick={() => handleSubmitAnswer(inq.id)}
                          disabled={!answerText.trim() || submitting}
                          style={{
                            flex: 2, padding: '9px 16px',
                            background: answerText.trim() ? C.primary : C.surface,
                            color: answerText.trim() ? '#FFF' : C.fgMuted,
                            border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px',
                            cursor: answerText.trim() && !submitting ? 'pointer' : 'not-allowed',
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

      <PageControls page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

function LlmUsageLogsTab() {
  const FALLBACK_USD_TO_KRW_RATE = 1460;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exchangeRate, setExchangeRate] = useState(FALLBACK_USD_TO_KRW_RATE);
  const [exchangeRateSource, setExchangeRateSource] = useState('기본 환율');
  const [featureType, setFeatureType] = useState('ALL');

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.getLlmUsageLogs();
      setLogs(result);
    } catch (err) {
      setError(err.message || 'LLM 사용량 로그를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadExchangeRate = async () => {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      const krwRate = Number(data?.rates?.KRW);

      if (!response.ok || Number.isNaN(krwRate) || krwRate <= 0) {
        throw new Error('환율 조회 실패');
      }

      setExchangeRate(krwRate);
      setExchangeRateSource('실시간 환율');
    } catch {
      setExchangeRate(FALLBACK_USD_TO_KRW_RATE);
      setExchangeRateSource('기본 환율');
    }
  };

  useEffect(() => {
    loadLogs();
    loadExchangeRate();
  }, []);

  const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCost = (value) => {
    const number = Number(value ?? 0);
    if (Number.isNaN(number)) return '-';
    const krw = number * exchangeRate;
    return `약 ₩${Math.round(krw).toLocaleString()}`;
  };

  const filteredLogs = featureType === 'ALL'
    ? logs
    : logs.filter((log) => log.featureType === featureType);
  const successCount = filteredLogs.filter((log) => log.status === 'SUCCESS').length;
  const failedCount = filteredLogs.filter((log) => log.status === 'FAILED').length;
  const totalTokens = filteredLogs.reduce((sum, log) => sum + Number(log.totalTokens ?? 0), 0);
  const totalCost = filteredLogs.reduce((sum, log) => sum + Number(log.estimatedCost ?? 0), 0);

  const summaryCards = [
    { label: '전체 호출', value: `${filteredLogs.length}건`, icon: Activity, color: C.primary, bg: C.primaryLight },
    { label: '성공', value: `${successCount}건`, icon: CheckCircle, color: C.primary, bg: C.primaryLight },
    { label: '실패', value: `${failedCount}건`, icon: AlertTriangle, color: C.danger, bg: C.dangerLight },
    { label: '총 토큰', value: totalTokens.toLocaleString(), icon: Database, color: '#3974C6', bg: '#EAF2FF' },
    { label: '예상 비용', value: formatCost(totalCost), icon: TrendingUp, color: C.accent, bg: C.accentLight },
  ];

  return (
    <div className="admin-shadcn-page admin-ai-usage-page">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: '16px', color: C.fg, marginBottom: '4px' }}>LLM 사용량 로그</div>
          <div style={{ fontSize: '12px', color: C.fgMuted }}>
            전체 회원의 AI 추천 호출 이력과 실패 원인을 확인합니다. 환율: 1 USD = ₩{Math.round(exchangeRate).toLocaleString()} ({exchangeRateSource})
          </div>
        </div>
        <button
          className="admin-shadcn-button admin-shadcn-button-outline"
          onClick={loadLogs}
          disabled={loading}
          style={{ padding: '8px 11px', cursor: loading ? 'wait' : 'pointer', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'admin-home-refreshing' : ''} /> 새로고침
        </button>
      </div>

      {error && (
        <div style={{ background: C.dangerLight, color: C.danger, borderRadius: '12px', padding: '11px 13px', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
          {error}
        </div>
      )}

      <div className="admin-shadcn-tabs" style={{ display: 'inline-flex', marginBottom: '18px', flexWrap: 'wrap' }}>
        {[
          ['ALL', '전체'],
          ['SHOPPING_RECOMMENDATION', '장보기 추천'],
          ['INQUIRY_QNA', '문의 Q&A'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`admin-shadcn-tab${featureType === value ? ' is-active' : ''}`}
            onClick={() => setFeatureType(value)}
            style={{
              padding: '7px 12px', cursor: 'pointer', fontSize: '11px', fontWeight: 800,
              border: 'none', background: featureType === value ? C.card : 'transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '14px' }}>
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="admin-shadcn-card admin-shadcn-metric-card" style={{ minHeight: '126px', padding: '16px 17px', borderTop: `3px solid ${card.color}`, borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: card.bg, color: card.color, border: `1px solid ${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} />
                </span>
                <span style={{ color: C.fgMuted, fontSize: '12px', fontWeight: 800 }}>{card.label}</span>
              </div>
              <div style={{ color: C.fg, fontSize: '25px', lineHeight: 1, letterSpacing: '-0.03em', fontWeight: 900, marginTop: '17px' }}>{card.value}</div>
            </div>
          );
        })}
      </div>

      <div className="admin-shadcn-card admin-shadcn-panel admin-shadcn-table-wrap" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '28px', textAlign: 'center', color: C.fgMuted, fontSize: '13px', fontWeight: 700 }}>LLM 사용량 로그를 불러오는 중입니다.</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '28px', textAlign: 'center', color: C.fgMuted, fontSize: '13px', fontWeight: 700 }}>LLM 사용량 로그가 없습니다.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1040px' }}>
              <thead>
                <tr style={{ background: C.surface, color: C.fgMuted, fontSize: '11px', textAlign: 'left' }}>
                  {['회원', '기능', '모델', '상태', 'Prompt', 'Completion', 'Total', '예상 비용', '실패 메시지', '호출 일시'].map((header) => (
                    <th key={header} style={{ padding: '11px 12px', fontWeight: 900, borderBottom: `1px solid ${C.border}` }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const failed = log.status === 'FAILED';
                  return (
                    <tr key={log.llmUsageLogId} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '12px', color: C.fg, fontWeight: 900 }}>{log.nickname || '알 수 없음'}</div>
                        <div style={{ fontSize: '10px', color: C.fgMuted, marginTop: '3px' }}>{log.email || `memberId ${log.memberId}`}</div>
                      </td>
                      <td style={{ padding: '12px', color: C.fg, fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                        {log.featureType === 'INQUIRY_QNA' ? '문의 Q&A' : '장보기 추천'}
                      </td>
                      <td style={{ padding: '12px', color: C.fgMuted, fontSize: '12px', fontWeight: 700 }}>{log.modelName}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: '999px', background: failed ? C.dangerLight : C.primaryLight, color: failed ? C.danger : C.primary, fontSize: '10px', fontWeight: 900 }}>
                          {failed ? 'FAILED' : 'SUCCESS'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: C.fg, fontSize: '12px', fontWeight: 800 }}>{log.promptTokens ?? 0}</td>
                      <td style={{ padding: '12px', color: C.fg, fontSize: '12px', fontWeight: 800 }}>{log.completionTokens ?? 0}</td>
                      <td style={{ padding: '12px', color: C.fg, fontSize: '12px', fontWeight: 900 }}>{log.totalTokens ?? 0}</td>
                      <td style={{ padding: '12px', color: C.fgMuted, fontSize: '12px', fontWeight: 800 }}>{formatCost(log.estimatedCost)}</td>
                      <td style={{ padding: '12px', color: failed ? C.danger : C.fgSubtle, fontSize: '11px', maxWidth: '240px', whiteSpace: 'normal', lineHeight: 1.4 }}>
                        {log.failureMessage || '-'}
                      </td>
                      <td style={{ padding: '12px', color: C.fgMuted, fontSize: '11px', whiteSpace: 'nowrap' }}>{formatDateTime(log.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


function FamilyFridgesTab() {
  const [fridges, setFridges] = useState([]);
  const [selectedFridge, setSelectedFridge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDateTime = (value) => {
    if (!value) return '-';
    return String(value).replace('T', ' ').slice(0, 16);
  };

  const isSubscribedFridge = (fridge) => ['ACTIVE', 'TRIALING'].includes(fridge?.subscriptionStatus);
  const getSubscriptionLabel = (fridge) => isSubscribedFridge(fridge) ? '구독' : '무료';

  const loadFridges = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.getFridges();
      setFridges(result || []);
      setSelectedFridge((current) => {
        if (!current) return result?.[0] ?? null;
        return result?.find((fridge) => fridge.fridgeId === current.fridgeId) ?? result?.[0] ?? null;
      });
    } catch (err) {
      setError(err.message || '가족공유 냉장고 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFridges();
  }, []);

  const handleSelectFridge = async (fridgeId) => {
    const cached = fridges.find((fridge) => fridge.fridgeId === fridgeId);
    setSelectedFridge(cached || null);
    try {
      const detail = await adminApi.getFridge(fridgeId);
      setSelectedFridge(detail);
      setFridges((items) => items.map((item) => item.fridgeId === fridgeId ? detail : item));
    } catch (err) {
      setError(err.message || '가족공유 냉장고 상세를 불러오지 못했습니다.');
    }
  };

  const handleRemoveMember = async (member) => {
    if (!selectedFridge || member.role === 'OWNER' || !isSubscribedFridge(selectedFridge)) return;
    if (!window.confirm(`${member.email || member.nickname || '구성원'}님을 가족공유 냉장고에서 내보낼까요?`)) return;
    try {
      await adminApi.removeFridgeMember(selectedFridge.fridgeId, member.memberId);
      const detail = await adminApi.getFridge(selectedFridge.fridgeId);
      setSelectedFridge(detail);
      setFridges((items) => items.map((item) => item.fridgeId === detail.fridgeId ? detail : item));
    } catch (err) {
      alert(err.message || '구성원 내보내기에 실패했습니다.');
    }
  };

  const handleCancelInvite = async (invite) => {
    if (!selectedFridge) return;
    if (!window.confirm(`${invite.inviteeEmail || '초대 대상'}님에게 보낸 가족공유 초대를 취소할까요?`)) return;
    try {
      await adminApi.cancelFridgeInvite(selectedFridge.fridgeId, invite.fridgeInviteId);
      const detail = await adminApi.getFridge(selectedFridge.fridgeId);
      setSelectedFridge(detail);
      setFridges((items) => items.map((item) => item.fridgeId === detail.fridgeId ? detail : item));
    } catch (err) {
      alert(err.message || '초대 취소에 실패했습니다.');
    }
  };

  const memberCount = selectedFridge ? `${selectedFridge.activeMemberCount}/${selectedFridge.maxMemberCount}` : '-';

  return (
    <div className="admin-shadcn-page admin-fridges-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-end', marginBottom: '18px' }}>
        <div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: C.fg, letterSpacing: '-0.03em' }}>가족공유 관리</div>
          <div style={{ fontSize: '12px', color: C.fgMuted, marginTop: '5px' }}>가족공유 냉장고 현황을 확인하고 구독 냉장고의 구성원만 운영 조치할 수 있습니다.</div>
        </div>
        <button onClick={loadFridges} disabled={loading} style={{ border: `1px solid ${C.border}`, borderRadius: '12px', background: C.card, color: C.fg, padding: '9px 13px', fontSize: '12px', fontWeight: 900, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> 새로고침
        </button>
      </div>

      {error && <div style={{ marginBottom: '12px', padding: '12px', borderRadius: '12px', background: C.dangerLight, color: C.danger, fontSize: '12px', fontWeight: 800 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 0.9fr) minmax(420px, 1.1fr)', gap: '14px', alignItems: 'start' }}>
        <div className="admin-shadcn-card" style={{ background: C.card, borderRadius: '16px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: '14px', fontWeight: 900, color: C.fg }}>냉장고 목록</div>
            <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '3px' }}>총 {fridges.length}개</div>
          </div>
          <div style={{ display: 'grid', maxHeight: '620px', overflowY: 'auto' }}>
            {fridges.length === 0 && <div style={{ padding: '18px', color: C.fgMuted, fontSize: '13px' }}>{loading ? '불러오는 중...' : '가족공유 냉장고가 없습니다.'}</div>}
            {fridges.map((fridge) => {
              const active = selectedFridge?.fridgeId === fridge.fridgeId;
              return (
                <button key={fridge.fridgeId} onClick={() => handleSelectFridge(fridge.fridgeId)} style={{ border: 'none', borderBottom: `1px solid ${C.border}`, background: active ? C.primaryLight : C.card, textAlign: 'left', padding: '13px 16px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: C.fg, fontSize: '13px', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fridge.name}</div>
                      <div style={{ color: C.fgMuted, fontSize: '11px', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fridge.ownerEmail || '-'}</div>
                    </div>
                    <div style={{ display: 'grid', gap: '4px', justifyItems: 'end', flexShrink: 0 }}>
                      <span style={{ borderRadius: '999px', padding: '3px 7px', background: isSubscribedFridge(fridge) ? C.primaryLight : C.surface, color: isSubscribedFridge(fridge) ? C.primary : C.fgMuted, fontSize: '10px', fontWeight: 900 }}>{getSubscriptionLabel(fridge)}</span>
                      <span style={{ color: C.fgMuted, fontSize: '10px', fontWeight: 800 }}>{fridge.activeMemberCount}/{fridge.maxMemberCount}명</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="admin-shadcn-card" style={{ background: C.card, borderRadius: '16px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)', padding: '16px' }}>
          {!selectedFridge ? (
            <div style={{ color: C.fgMuted, fontSize: '13px' }}>냉장고를 선택해주세요.</div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: C.fg, fontSize: '18px', fontWeight: 900 }}>{selectedFridge.name}</div>
                  <div style={{ color: C.fgMuted, fontSize: '12px', marginTop: '4px' }}>owner: {selectedFridge.ownerEmail || '-'}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span style={{ borderRadius: '999px', padding: '5px 9px', background: C.primaryLight, color: C.primary, fontSize: '11px', fontWeight: 900 }}>구성원 {memberCount}</span>
                  <span style={{ borderRadius: '999px', padding: '5px 9px', background: C.surface, color: C.fgMuted, fontSize: '11px', fontWeight: 900 }}>초대대기 {selectedFridge.pendingInviteCount}</span>
                  <span style={{ borderRadius: '999px', padding: '5px 9px', background: isSubscribedFridge(selectedFridge) ? C.primaryLight : C.surface, color: isSubscribedFridge(selectedFridge) ? C.primary : C.fgMuted, fontSize: '11px', fontWeight: 900 }}>{getSubscriptionLabel(selectedFridge)}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: C.fg, marginBottom: '8px' }}>구성원</div>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                  {(selectedFridge.members || []).map((member) => (
                    <div key={`${member.fridgeMemberId}-${member.memberId}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(190px, 1.4fr) 72px 116px 92px', gap: '10px', alignItems: 'center', padding: '11px 12px', borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: C.fg, fontSize: '12px', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email || '-'}</div>
                        <div style={{ color: C.fgMuted, fontSize: '11px', marginTop: '2px' }}>{member.nickname || '-'}</div>
                      </div>
                      <div style={{ color: member.role === 'OWNER' ? C.primary : C.fgMuted, fontSize: '11px', fontWeight: 900 }}>{member.role}</div>
                      <div style={{ color: C.fgMuted, fontSize: '11px' }}>{formatDateTime(member.joinedAt)}</div>
                      {isSubscribedFridge(selectedFridge) && member.role !== 'OWNER' ? (
                        <button onClick={() => handleRemoveMember(member)} style={{ width: '86px', justifySelf: 'end', border: `1px solid ${C.danger}`, borderRadius: '9px', background: C.dangerLight, color: C.danger, padding: '7px 9px', fontSize: '11px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <UserMinus size={13} /> 내보내기
                        </button>
                      ) : (
                        <span style={{ width: '86px', justifySelf: 'end', textAlign: 'center', color: C.fgMuted, fontSize: '11px', fontWeight: 800 }}>-</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: C.fg, marginBottom: '8px' }}>대기중 초대</div>
                <div style={{ border: `1px solid ${C.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                  {(selectedFridge.pendingInvites || []).length === 0 && <div style={{ padding: '13px', color: C.fgMuted, fontSize: '12px' }}>대기중 초대가 없습니다.</div>}
                  {(selectedFridge.pendingInvites || []).map((invite) => (
                    <div key={invite.fridgeInviteId} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '10px', alignItems: 'center', padding: '11px 12px', borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ color: C.fgMuted, fontSize: '11px' }}>보낸 사람<br /><b style={{ color: C.fg }}>{invite.inviterEmail || '-'}</b></div>
                      <div style={{ color: C.fgMuted, fontSize: '11px' }}>받는 사람<br /><b style={{ color: C.fg }}>{invite.inviteeEmail || '-'}</b></div>
                      <div style={{ color: C.fgMuted, fontSize: '11px' }}>{formatDateTime(invite.createdAt)}</div>
                      <button onClick={() => handleCancelInvite(invite)} style={{ border: `1px solid ${C.danger}`, borderRadius: '9px', background: C.dangerLight, color: C.danger, padding: '7px 9px', fontSize: '11px', fontWeight: 900, cursor: 'pointer' }}>초대 취소</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminPanel ──────────────────────────────────────────────────────────
export function AdminPanel({
  currentUser, initialTab = 'home', recipes, inquiries, presetIngredients, onClose,
  onFetchRecipes, adminPage, adminTotalPages, adminTotalElements, adminSize,
  onAdminUpdateRecipe, onAdminDeleteRecipe,
  onFetchInquiries, onFetchInquiryDetail, onFetchInquiryCounts, pendingInquiriesCount, answeredInquiriesCount,
  onAnswerInquiry, onDeleteInquiry, onDeleteAnswer, onUpdatePresetIngredients,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [weeklyReportSending, setWeeklyReportSending] = useState(false);

  useEffect(() => {
    onFetchInquiryCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleRunScheduler = async () => {
    if (schedulerRunning) return;
    setSchedulerRunning(true);
    try {
      await scoreApi.postScheduler();
    } finally {
      setSchedulerRunning(false);
    }
  };

  const handleSendWeeklyFridgeReports = async () => {
    if (weeklyReportSending) return;
    if (!window.confirm('주간 냉장고 리포트 메일을 지금 발송할까요?')) return;
    setWeeklyReportSending(true);
    try {
      const result = await adminApi.sendWeeklyFridgeReports({ force: true });
      window.alert(`주간 냉장고 리포트 메일 발송을 실행했습니다.\\n발송 성공: ${result?.sentCount ?? 0}건`);
    } finally {
      setWeeklyReportSending(false);
    }
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleRunScheduler}
            disabled={schedulerRunning}
            style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '8px 14px', cursor: schedulerRunning ? 'wait' : 'pointer', color: C.fgMuted, fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Clock size={14} /> {schedulerRunning ? '실행 중...' : '스케줄러 실행'}
          </button>
          <button
            onClick={handleSendWeeklyFridgeReports}
            disabled={weeklyReportSending}
            style={{ background: C.primaryLight, border: `1px solid ${C.primary}33`, borderRadius: '14px', padding: '8px 14px', cursor: weeklyReportSending ? 'wait' : 'pointer', color: C.primary, fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Mail size={14} /> {weeklyReportSending ? '발송 중...' : '주간 메일 발송'}
          </button>
          <button onClick={onClose} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '8px 14px', cursor: 'pointer', color: C.fgMuted, fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <X size={14} /> 닫기
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div
        style={{
          background: C.card,
          borderBottom: `1px solid ${C.border}`,
          display: 'grid',
          gridTemplateColumns: `repeat(${Object.keys(TAB_ICONS).length}, 1fr)`,
          flexShrink: 0,
        }}
      >
        {Object.entries(TAB_ICONS).map(([key, { icon: Icon, label }]) => {
          const isActive = activeTab === key;
          const badge = key === 'inquiries' && pendingInquiriesCount > 0 ? pendingInquiriesCount : null;
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', scrollbarGutter: 'stable' }}>
        <div style={{ width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
          {activeTab === 'home'        && <AdminHomeTab currentUser={currentUser} pendingCount={pendingInquiriesCount} onNavigate={setActiveTab} onRefreshInquiryCounts={onFetchInquiryCounts} />}
        {activeTab === 'members'     && <MembersTab currentUser={currentUser} />}
        {activeTab === 'recipes'     && <RecipesTab recipes={recipes} onFetchRecipes={onFetchRecipes} adminPage={adminPage} adminTotalPages={adminTotalPages} adminTotalElements={adminTotalElements} adminSize={adminSize} onUpdateRecipe={onAdminUpdateRecipe} onDeleteRecipe={onAdminDeleteRecipe} />}
        {activeTab === 'ingredients' && <IngredientsTab items={presetIngredients} onUpdate={onUpdatePresetIngredients} />}
        {activeTab === 'stats'       && <StatsTab />}
        {activeTab === 'aiUsage'     && <LlmUsageLogsTab />}
        {activeTab === 'fridges'     && <FamilyFridgesTab />}
        {activeTab === 'inquiries'   && (
          <InquiriesTab
            inquiries={inquiries}
            onFetchInquiries={onFetchInquiries}
            onFetchInquiryDetail={onFetchInquiryDetail}
            onFetchInquiryCounts={onFetchInquiryCounts}
            pendingCount={pendingInquiriesCount}
            answeredCount={answeredInquiriesCount}
            onAnswer={onAnswerInquiry}
            onDeleteInquiry={onDeleteInquiry}
            onDeleteAnswer={onDeleteAnswer}
          />
        )}
        </div>
      </div>
    </div>
  );
}
