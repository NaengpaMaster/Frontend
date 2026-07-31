import { useState, useEffect, useRef } from 'react';
import { X, Users, ChefHat, BarChart3, MessageSquare, Trash2, Edit2, CheckCircle, Clock, Search, Package, Plus, ToggleLeft, ToggleRight, Star, CalendarDays, Info, TrendingUp, TrendingDown, Minus, Heart, House, UserPlus, UserMinus, BellRing, AlertTriangle, Database, ArrowRight, RefreshCw, Refrigerator, ShoppingBasket, BookOpen, Activity, ChevronRight } from 'lucide-react';
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
  inquiries:   { icon: MessageSquare, label: '문의' },
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
function AdminHomeTab({ currentUser, pendingCount, answeredCount, presetIngredients, onNavigate, onRefreshInquiryCounts }) {
  const [memberCounts, setMemberCounts] = useState({ active: null, inactive: null });
  const [recipeCount, setRecipeCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkedAt, setCheckedAt] = useState(null);

  const loadSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const [active, inactive, , recipeResponse] = await Promise.all([
        adminApi.getMembers({ role: 'USER', status: 'ACTIVE', size: 1 }),
        adminApi.getMembers({ role: 'USER', status: 'INACTIVE', size: 1 }),
        onRefreshInquiryCounts(),
        adminRecipesApi.getAll({ page: 0, size: 1 }),
      ]);
      const recipeBody = recipeResponse.data?.data ?? recipeResponse.data;
      setMemberCounts({ active: active.totalElements, inactive: inactive.totalElements });
      setRecipeCount(recipeBody?.totalElements ?? 0);
      setCheckedAt(new Date());
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
      label: '활성 회원', value: memberCounts.active, suffix: '명', icon: Users,
      color: C.primary, bg: C.primaryLight, tab: 'members', statusLabel: '현재', statusColor: C.primary,
      description: '서비스를 이용할 수 있는 전체 회원',
    },
    {
      label: '신규 가입 회원', value: null, suffix: '명', icon: UserPlus,
      color: '#3974C6', bg: '#EAF2FF', pending: true, statusLabel: 'API 연결 예정', statusColor: C.fgSubtle,
      description: '오늘', secondary: '최근 7일 —명', tab: 'members',
    },
    {
      label: '탈퇴 · 비활성 전환', value: null, suffix: '명', icon: UserMinus,
      color: C.fgMuted, bg: C.surface, pending: true, statusLabel: 'API 연결 예정', statusColor: C.fgSubtle,
      description: '오늘', secondary: `최근 7일 —명 · 현재 비활성 ${memberCounts.inactive ?? '—'}명`, tab: 'members',
    },
    {
      label: '전체 미답변 문의', value: pendingCount, suffix: '건', icon: MessageSquare,
      color: pendingCount > 0 ? C.accent : C.primary,
      bg: pendingCount > 0 ? C.accentLight : C.primaryLight,
      tab: 'inquiries', urgent: pendingCount > 0,
      statusLabel: pendingCount > 0 ? '확인 필요' : '정상',
      statusColor: pendingCount > 0 ? C.accent : C.primary,
      description: pendingCount > 0 ? '답변을 기다리는 문의가 있습니다.' : '대기 중인 문의가 없습니다.',
    },
    {
      label: '24시간 초과 미답변', value: null, suffix: '건', icon: AlertTriangle,
      color: C.danger, bg: C.dangerLight, pending: true, statusLabel: 'API 연결 예정', statusColor: C.fgSubtle,
      description: '1건 이상이면 위험 상태로 표시', tab: 'inquiries',
    },
    {
      label: '통계 마지막 집계', value: null, icon: Database,
      color: C.warn, bg: C.warnLight, pending: true, statusLabel: 'API 연결 예정', statusColor: C.fgSubtle,
      description: '집계 지연 또는 실패 시 위험 상태로 표시', tab: 'stats',
    },
    {
      label: '전체 레시피', value: recipeCount, suffix: '개', icon: BookOpen,
      color: '#7A5AC8', bg: '#F0EBFF', statusLabel: '현재', statusColor: '#7A5AC8',
      description: '서비스에 등록된 전체 레시피', secondary: '회원 등록 레시피 —개', tab: 'recipes',
    },
    {
      label: '사전재료', value: presetIngredients?.length ?? 0, suffix: '개', icon: Package,
      color: '#3974C6', bg: '#EAF2FF', statusLabel: '현재', statusColor: '#3974C6',
      description: `활성 ${(presetIngredients ?? []).filter((item) => item.active).length}개 · 비활성 ${(presetIngredients ?? []).filter((item) => !item.active).length}개`, tab: 'ingredients',
    },
  ];

  const displayValue = (card) => {
    if (loading && !card.pending) return '…';
    if (card.pending) return '—';
    return `${card.value ?? 0}${card.suffix ?? ''}`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '22px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: C.fg, letterSpacing: '-0.03em' }}>
            안녕하세요, {currentUser?.name || currentUser?.nickname || '관리자'}님
          </div>
          <div style={{ marginTop: '5px', fontSize: '13px', color: C.fgMuted }}>오늘의 서비스 운영 현황을 한눈에 확인하세요.</div>
        </div>
        <button
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
              key={card.label}
              role={card.tab ? 'button' : undefined}
              tabIndex={card.tab ? 0 : undefined}
              onClick={() => card.tab && onNavigate(card.tab)}
              onKeyDown={(event) => { if (card.tab && event.key === 'Enter') onNavigate(card.tab); }}
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', minHeight: '160px', padding: '16px', textAlign: 'left', background: C.card, border: 'none', borderRadius: '16px', boxShadow: card.urgent ? `0 2px 10px ${C.accent}22` : '0 2px 10px rgba(17,32,29,0.08)', cursor: card.tab ? 'pointer' : 'default' }}
            >
              <div style={{ minHeight: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <span style={{ width: '36px', height: '36px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '11px', background: card.bg, color: card.color }}>
                    <Icon size={18} />
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 900, lineHeight: 1.25, color: C.fg }}>{card.label}</span>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: card.statusColor, fontSize: '10px', fontWeight: 800 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: card.statusColor }} />
                  {card.statusLabel}
                  {card.tab && <ArrowRight size={13} />}
                </span>
              </div>
              <div style={{ marginTop: '15px', fontSize: '24px', lineHeight: 1, fontWeight: 900, color: card.color }}>{displayValue(card)}</div>
              <div style={{ marginTop: '8px', fontSize: '11px', lineHeight: 1.45, color: C.fgMuted }}>{card.description}</div>
              {card.secondary && <div style={{ marginTop: '2px', fontSize: '10px', lineHeight: 1.45, color: C.fgMuted, fontWeight: 700 }}>{card.secondary}</div>}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
        <div style={{ padding: '16px', background: C.card, borderRadius: '16px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <BellRing size={17} color={pendingCount > 0 ? C.accent : C.primary} />
            <span style={{ fontSize: '14px', fontWeight: 800, color: C.fg }}>확인이 필요한 업무</span>
          </div>
          <div style={{ padding: '12px', borderRadius: '12px', background: pendingCount > 0 ? C.accentLight : C.primaryLight, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: C.fg }}>{pendingCount > 0 ? `답변을 기다리는 문의가 ${pendingCount}건 있어요.` : '현재 미답변 문의가 없습니다.'}</div>
              <div style={{ marginTop: '3px', fontSize: '11px', color: C.fgMuted }}>답변 완료 {answeredCount}건</div>
            </div>
            <button onClick={() => onNavigate('inquiries')} style={{ padding: '7px 10px', border: 'none', borderRadius: '9px', background: pendingCount > 0 ? C.accent : C.primary, color: '#FFF', fontSize: '11px', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              문의 확인
            </button>
          </div>
        </div>

        <div style={{ padding: '16px', background: C.card, borderRadius: '16px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: C.fg, marginBottom: '12px' }}>운영 상태 기준</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { color: C.primary, text: '정상 · 미답변 문의가 없고 통계 집계가 정상인 상태' },
              { color: C.accent, text: '확인 필요 · 처리할 미답변 문의가 있는 상태' },
              { color: C.danger, text: '위험 · 24시간 초과 문의 또는 통계 집계 지연·실패' },
            ].map(({ color, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11px', lineHeight: 1.45, color: C.fgMuted }}>
                <span style={{ width: '8px', height: '8px', marginTop: '4px', flexShrink: 0, borderRadius: '50%', background: color }} />
                {text}
              </div>
            ))}
          </div>
          <div style={{ height: '1px', background: C.border, margin: '14px 0' }} />
          <div style={{ fontSize: '12px', fontWeight: 800, color: C.fg, marginBottom: '9px' }}>바로가기</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {[
              { label: '회원 관리', tab: 'members', icon: Users },
              { label: '통계 확인', tab: 'stats', icon: BarChart3 },
            ].map(({ label, tab, icon: Icon }) => (
              <button key={tab} onClick={() => onNavigate(tab)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '12px', background: C.surface, border: 'none', borderRadius: '11px', color: C.fg, fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><Icon size={15} color={C.primary} />{label}</span>
                <ArrowRight size={13} color={C.fgSubtle} />
              </button>
            ))}
          </div>
          <div style={{ marginTop: '11px', fontSize: '10px', color: C.fgSubtle }}>
            {checkedAt ? `마지막 새로고침 ${checkedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}` : '운영 현황을 불러오는 중입니다.'}
          </div>
        </div>
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

  const toggle = async (user) => {
    const nextStatus = user.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    setActionId(user.id);
    setError('');
    try {
      await adminApi.updateMemberStatus(user.memberId, nextStatus);
      await Promise.all([loadMembers(), loadCounts()]);
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
    <div>
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
            className="stat-card-hover"
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
        {!loading && members.length === 0 && (
          <div style={{ textAlign: 'center', padding: '36px 0', color: C.fgMuted, fontSize: '13px' }}>검색 결과가 없어요</div>
        )}
      </div>

      <PageControls page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

function MemberOverviewTab({ startDate, endDate }) {
  const [counts, setCounts] = useState({ active: null, inactive: null });

  useEffect(() => {
    let mounted = true;
    Promise.all([
      adminApi.getMembers({ role: 'USER', status: 'ACTIVE', size: 1 }),
      adminApi.getMembers({ role: 'USER', status: 'INACTIVE', size: 1 }),
    ]).then(([active, inactive]) => {
      if (mounted) setCounts({ active: active.totalElements, inactive: inactive.totalElements });
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

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
          { label: '활성 회원', value: counts.active == null ? '…' : `${counts.active}명`, color: C.primary, bg: C.primaryLight, icon: Users },
          { label: '비활성 회원', value: counts.inactive == null ? '…' : `${counts.inactive}명`, color: C.fgMuted, bg: C.surface, icon: UserMinus },
          { label: '오늘 신규 가입', value: '—명', secondary: '최근 7일 —명', color: '#3974C6', bg: '#EAF2FF', icon: UserPlus, pending: true },
          { label: '오늘 탈퇴 회원', value: '—명', secondary: '최근 7일 —명', color: C.danger, bg: C.dangerLight, icon: AlertTriangle, pending: true },
        ].map((item) => (
          <div key={item.label} style={{ padding: '16px', borderRadius: '16px', background: C.card, boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
            <div style={{ minHeight: '34px', display: 'flex', alignItems: 'center', gap: '9px' }}>
              <span style={{ width: '34px', height: '34px', flexShrink: 0, borderRadius: '10px', background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><item.icon size={17} /></span>
              <span style={{ fontSize: '14px', lineHeight: 1.25, fontWeight: 900, color: C.fg }}>{item.label}</span>
            </div>
            <div style={{ marginTop: '14px', fontSize: '23px', fontWeight: 900, color: item.color }}>{item.value}</div>
            {item.secondary && <div style={{ marginTop: '5px', fontSize: '10px', fontWeight: 800, color: C.fgMuted }}>{item.secondary}</div>}
            {item.pending && <div style={{ marginTop: '3px', fontSize: '9px', color: C.fgSubtle }}>회원 통계 API 연결 예정</div>}
          </div>
        ))}
      </div>

      <div style={{ padding: '16px', borderRadius: '16px', background: C.card, boxShadow: '0 2px 10px rgba(17,32,29,0.08)', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 900, color: C.fg }}><Activity size={16} color={C.primary} /> 신규 가입·탈퇴 회원 추이</div>
        <div style={{ height: '230px', marginTop: '14px', borderRadius: '12px', background: `repeating-linear-gradient(to bottom, transparent, transparent 45px, ${C.border} 46px)`, border: `1px dashed ${C.borderStrong}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.fgSubtle }}>
          <BarChart3 size={28} style={{ marginBottom: '8px', opacity: 0.55 }} />
          <div style={{ fontSize: '12px', fontWeight: 800 }}>기간별 회원 변화 그래프</div>
          <div style={{ marginTop: '4px', fontSize: '10px' }}>신규 가입은 초록색, 탈퇴 회원은 빨간색으로 표시됩니다.</div>
          <div style={{ marginTop: '2px', fontSize: '10px' }}>{startDate} ~ {endDate}</div>
          <div style={{ marginTop: '2px', fontSize: '10px' }}>백엔드 통계 API 연결 예정</div>
        </div>
      </div>

    </div>
  );
}

function MemberServiceUsageTab({ startDate, endDate }) {
  const [selectedMetric, setSelectedMetric] = useState('fridge');
  const graphRefs = useRef({});

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
          return (
            <button key={key} onClick={() => moveToGraph(key)} style={{ padding: '16px', textAlign: 'left', borderRadius: '16px', background: C.card, border: `1px solid ${selected ? color + '70' : 'transparent'}`, boxShadow: selected ? `0 2px 10px ${color}20` : '0 2px 10px rgba(17,32,29,0.08)', cursor: 'pointer' }}>
              <div style={{ minHeight: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                  <span style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '11px', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} /></span>
                  <span style={{ fontSize: '14px', lineHeight: 1.25, fontWeight: 900, color: C.fg }}>{label}</span>
                </div>
                <span style={{ fontSize: '9px', fontWeight: 800, color: C.fgSubtle }}>API 연결 예정</span>
              </div>
              <div style={{ marginTop: '13px', fontSize: '22px', fontWeight: 900, color }}>—%</div>
              <div style={{ marginTop: '4px', fontSize: '10px', lineHeight: 1.45, color: C.fgSubtle }}>{detail}</div>
              <div style={{ marginTop: '3px', fontSize: '10px', color: C.fgMuted }}>이용 회원 —명 / 활성 회원 —명</div>
            </button>
          );
        })}
      </div>

      <div style={{ padding: '16px', borderRadius: '16px', background: C.card, boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 900, color: C.fg }}><Activity size={16} color={C.primary} /> 서비스별 이용 회원 추이</div>
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
              <div style={{ height: '230px', marginTop: '12px', borderRadius: '12px', background: `repeating-linear-gradient(to bottom, transparent, transparent 45px, ${C.border} 46px)`, border: `1px dashed ${C.borderStrong}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.fgSubtle }}>
                <BarChart3 size={28} color={metric.color} style={{ marginBottom: '8px', opacity: 0.55 }} />
                <div style={{ fontSize: '12px', fontWeight: 800 }}>날짜별 {metric.label} 회원 추이</div>
                <div style={{ marginTop: '4px', fontSize: '10px' }}>{startDate} ~ {endDate}</div>
                <div style={{ marginTop: '2px', fontSize: '10px' }}>백엔드 서비스 이용 통계 API 연결 예정</div>
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
  const showDateFilter = section === 'overview';

  const applyQuickPeriod = (nextPeriod) => {
    const end = new Date();
    const start = new Date();
    if (nextPeriod === 'all') start.setFullYear(2000, 0, 1);
    else start.setDate(start.getDate() - (nextPeriod - 1));
    setStartDate(toLocalDateValue(start));
    setEndDate(toLocalDateValue(end));
    setQuickPeriod(nextPeriod);
  };

  const changeStartDate = (value) => { setStartDate(value); setQuickPeriod(null); };
  const changeEndDate = (value) => { setEndDate(value); setQuickPeriod(null); };

  return (
    <div>
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
      <div style={{ display: 'inline-flex', padding: '4px', marginBottom: '18px', background: C.surface, borderRadius: '12px' }}>
        {[
          { key: 'overview', label: '회원 현황', icon: BarChart3 },
          { key: 'search', label: '회원 검색·관리', icon: Search },
        ].map(({ key, label, icon: Icon }) => {
          const active = section === key;
          return (
            <button key={key} onClick={() => setSection(key)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 13px', border: 'none', borderRadius: '9px', background: active ? C.card : 'transparent', color: active ? C.primary : C.fgMuted, boxShadow: active ? '0 2px 8px rgba(17,32,29,0.08)' : 'none', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}><Icon size={14} />{label}</button>
          );
        })}
      </div>
      {section === 'overview' && <MemberOverviewTab startDate={startDate} endDate={endDate} />}
      {section === 'search' && <MemberSearchTab currentUser={currentUser} />}
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
  const [section, setSection] = useState('overview');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return toLocalDateValue(date);
  });
  const [endDate, setEndDate] = useState(() => toLocalDateValue(new Date()));
  const [quickPeriod, setQuickPeriod] = useState(30);
  const [period, setPeriod] = useState(30);
  const [scoreAverage, setScoreAverage] = useState(null);
  const [expiredCount, setExpiredCount] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [topIngredients, setTopIngredients] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dateRangeInvalid = startDate > endDate;

  const applyQuickPeriod = (nextPeriod) => {
    const end = new Date();
    const start = new Date();
    if (nextPeriod === 'all') {
      start.setFullYear(2000, 0, 1);
    } else {
      start.setDate(start.getDate() - (nextPeriod - 1));
    }
    setStartDate(toLocalDateValue(start));
    setEndDate(toLocalDateValue(end));
    setQuickPeriod(nextPeriod);
    setPeriod(nextPeriod);
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
      setLoading(true);
      setError('');
      try {
        const [score, expired, categories, ingredients, trend] = await Promise.all([
          adminStatsApi.getScoreAverage(),
          adminStatsApi.getExpiredCount(),
          adminStatsApi.getCategoryStats(period),
          adminStatsApi.getTopIngredients(),
          adminStatsApi.getWeeklyTrend(),
        ]);
        if (mounted) {
          setScoreAverage(score);
          setExpiredCount(expired);
          setCategoryStats(categories);
          setTopIngredients(ingredients);
          setWeeklyTrend(trend?.weeks || []);
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
  }, [period]);

  const byCategory = categoryStats
    .map((c) => ({ name: c.categoryName.split('/')[0], count: c.expiredCount }))
    .sort((a, b) => b.count - a.count);

  const weekChangePct = expiredCount?.weekChangePct;

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

      <div style={{ display: 'inline-flex', padding: '4px', marginBottom: '18px', background: C.surface, borderRadius: '12px' }}>
        {[
          { key: 'overview', label: '통계 요약', icon: BarChart3 },
          { key: 'usage', label: '회원·이용 분석', icon: Activity },
          { key: 'materials', label: '재료·냉파 분석', icon: Refrigerator },
          { key: 'recipes', label: '레시피·콘텐츠 분석', icon: BookOpen },
        ].map(({ key, label, icon: Icon }) => {
          const active = section === key;
          return (
            <button key={key} onClick={() => setSection(key)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 13px', border: 'none', borderRadius: '9px', background: active ? C.card : 'transparent', color: active ? C.primary : C.fgMuted, boxShadow: active ? '0 2px 8px rgba(17,32,29,0.08)' : 'none', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}><Icon size={14} />{label}</button>
          );
        })}
      </div>

      {error && (
        <div style={{ background: C.dangerLight, color: C.danger, borderRadius: '10px', padding: '10px 12px', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
          {error}
        </div>
      )}

      {section === 'usage' && <MemberServiceUsageTab startDate={startDate} endDate={endDate} />}

      {section === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            {[
              { label: '평균 냉파 점수', value: loading ? '…' : `${scoreAverage?.averageScore ?? 0}점`, detail: `활성 회원 ${scoreAverage?.memberCount ?? 0}명 기준`, icon: Star, color: C.primary, bg: C.primaryLight, connected: true },
              { label: '기간 내 등록 재료', value: '—건', detail: '이전 기간 대비 —%', icon: Package, color: '#3974C6', bg: '#EAF2FF' },
              { label: '기간 내 만료 재료', value: loading ? '…' : `${expiredCount?.thisWeekCount ?? 0}건`, detail: '현재 API는 이번 주 기준', icon: CalendarDays, color: C.danger, bg: C.dangerLight, connected: true },
              { label: '재료 만료율', value: '—%', detail: '등록 재료 대비 만료 비율', icon: TrendingDown, color: C.accent, bg: C.accentLight },
              { label: '신규 등록 레시피', value: '—개', detail: '회원·관리자 등록 포함', icon: BookOpen, color: '#7A5AC8', bg: '#F0EBFF' },
            ].map(({ label, value, detail, icon: Icon, color, bg, connected }) => (
              <div key={label} style={{ padding: '16px', borderRadius: '16px', background: C.card, boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
                <div style={{ minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}><span style={{ width: '36px', height: '36px', borderRadius: '11px', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} /></span><span style={{ fontSize: '14px', fontWeight: 900, color: C.fg }}>{label}</span></div>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: connected ? C.primary : C.fgSubtle }}>{connected ? '현재' : 'API 연결 예정'}</span>
                </div>
                <div style={{ marginTop: '14px', fontSize: '23px', fontWeight: 900, color }}>{value}</div>
                <div style={{ marginTop: '5px', fontSize: '10px', color: C.fgMuted }}>{detail}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '16px', borderRadius: '16px', background: C.card, boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}><div style={{ fontSize: '14px', fontWeight: 900, color: C.fg }}>핵심 지표 변화</div><span style={{ fontSize: '10px', fontWeight: 800, color: C.fgSubtle }}>일별 통계 스케줄러 연결 예정</span></div>
            <div style={{ height: '250px', marginTop: '14px', borderRadius: '12px', border: `1px dashed ${C.borderStrong}`, background: `repeating-linear-gradient(to bottom, transparent, transparent 49px, ${C.border} 50px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.fgSubtle }}><BarChart3 size={28} style={{ opacity: 0.55 }} /><div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 800 }}>등록 재료·만료 재료·신규 레시피 추이</div><div style={{ marginTop: '4px', fontSize: '10px' }}>{startDate} ~ {endDate}</div></div>
          </div>
        </div>
      )}

      {section === 'materials' && (
        <>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <div style={statCardStyle}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary, flexShrink: 0 }}>
            <Star size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: C.fg, fontWeight: 700 }}>
              냉파 점수 평균 <Info size={12} color={C.fgMuted} />
            </div>
            <div style={{ fontSize: '22px', color: C.primary, fontWeight: 900, lineHeight: 1.1, marginTop: '6px' }}>
              {loading ? '-' : `${scoreAverage?.averageScore ?? 0}점`}
            </div>
            <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '4px' }}>
              {loading ? '불러오는 중...' : `활성 회원 ${scoreAverage?.memberCount ?? 0}명 기준`}
            </div>
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: C.dangerLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, flexShrink: 0 }}>
            <CalendarDays size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: C.fg, fontWeight: 700 }}>
              이번주 유통기한 만료 건수 <InfoTooltip text="이번 주 월요일부터 일요일까지 등록된 만료 건수입니다." />
            </div>
            <div style={{ fontSize: '22px', color: C.accent, fontWeight: 900, lineHeight: 1.1, marginTop: '6px' }}>
              {loading ? '-' : `${expiredCount?.thisWeekCount ?? 0}건`}
            </div>
            <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {!loading && weekChangePct != null ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: weekChangePct > 0 ? C.danger : weekChangePct < 0 ? C.primary : C.fgMuted, fontWeight: 700 }}>
                  {weekChangePct > 0 ? <TrendingUp size={11} /> : weekChangePct < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
                  지난주 대비 {Math.abs(weekChangePct).toFixed(1)}% {weekChangePct > 0 ? '상승' : weekChangePct < 0 ? '하락' : '변동없음'}
                </span>
              ) : (
                '이번주 기준'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bar chart by category */}
      <div style={{ background: C.card, borderRadius: '16px', padding: '14px 16px', marginBottom: '10px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: C.fg, marginBottom: '12px' }}>카테고리별 만료량</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byCategory} margin={{ top: 24, right: 16, left: -6, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.fgMuted, fontWeight: 600 }} axisLine={{ stroke: C.borderStrong }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: C.fgMuted }} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, (dataMax) => (dataMax > 0 ? Math.ceil(dataMax * 1.25) : 1)]} />
            <Tooltip
              contentStyle={{ background: C.card, borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 16px rgba(17,32,29,0.1)' }}
              cursor={{ fill: C.surface }}
            />
            <Bar dataKey="count" fill={C.primary} radius={[2, 2, 0, 0]} name="만료 횟수" maxBarSize={48} label={{ position: 'top', fill: C.fg, fontSize: 11, fontWeight: 700 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top wasted */}
      <div style={{ background: C.card, borderRadius: '16px', padding: '14px 16px', marginBottom: '10px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
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
          <div style={{ fontSize: '12px', color: C.fgMuted, textAlign: 'center', padding: '12px 0' }}>이번주 만료된 재료가 없습니다.</div>
        )}
      </div>

      {/* Weekly trend */}
      <div style={{ background: C.card, borderRadius: '16px', padding: '14px 16px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: C.fg, marginBottom: '12px' }}>주간 만료 추이</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weeklyTrend} margin={{ top: 8, right: 16, left: -6, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.fgMuted, fontWeight: 600 }} axisLine={{ stroke: C.borderStrong }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: C.fgMuted }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: C.card, borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 16px rgba(17,32,29,0.1)' }}
              cursor={{ fill: C.surface }}
            />
            <Bar dataKey="count" fill={C.accent} radius={[2, 2, 0, 0]} name="만료 건수" />
          </BarChart>
        </ResponsiveContainer>
      </div>
        </>
      )}

      {section === 'recipes' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px', marginBottom: '12px' }}>
            {[
              { label: '전체 레시피', detail: '삭제되지 않은 전체 레시피', icon: BookOpen, color: '#7A5AC8', bg: '#F0EBFF' },
              { label: '기본 제공 레시피', detail: '작성자 정보가 없는 초기 레시피', icon: Database, color: C.fgMuted, bg: C.surface },
              { label: '회원 등록 레시피', detail: '일반 회원이 등록한 레시피', icon: Users, color: C.primary, bg: C.primaryLight },
              { label: '관리자 등록 레시피', detail: '관리자 계정이 등록한 레시피', icon: ChefHat, color: '#3974C6', bg: '#EAF2FF' },
            ].map(({ label, detail, icon: Icon, color, bg }) => (
              <div key={label} style={{ padding: '16px', borderRadius: '16px', background: C.card, boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
                <div style={{ minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}><span style={{ width: '36px', height: '36px', borderRadius: '11px', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} /></span><span style={{ fontSize: '14px', fontWeight: 900, color: C.fg }}>{label}</span></div><span style={{ fontSize: '9px', fontWeight: 800, color: C.fgSubtle }}>API 연결 예정</span></div>
                <div style={{ marginTop: '14px', fontSize: '23px', fontWeight: 900, color }}>—개</div>
                <div style={{ marginTop: '5px', fontSize: '10px', color: C.fgMuted }}>{detail}</div>
              </div>
            ))}
          </div>

          {[
            { title: '날짜별 레시피 등록 추이', description: '기본 제공·회원·관리자 등록 레시피를 구분합니다.', color: '#7A5AC8' },
            { title: '카테고리별 레시피 현황', description: '카테고리별 레시피 수와 비율을 확인합니다.', color: '#3974C6' },
          ].map((chart) => (
            <div key={chart.title} style={{ padding: '16px', marginBottom: '12px', borderRadius: '16px', background: C.card, boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}><div style={{ fontSize: '14px', fontWeight: 900, color: C.fg }}>{chart.title}</div><span style={{ fontSize: '9px', fontWeight: 800, color: C.fgSubtle }}>API 연결 예정</span></div>
              <div style={{ height: '220px', marginTop: '12px', borderRadius: '12px', border: `1px dashed ${C.borderStrong}`, background: `repeating-linear-gradient(to bottom, transparent, transparent 43px, ${C.border} 44px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.fgSubtle }}><BarChart3 size={28} color={chart.color} style={{ opacity: 0.55 }} /><div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 800 }}>{chart.description}</div><div style={{ marginTop: '4px', fontSize: '10px' }}>{startDate} ~ {endDate}</div></div>
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {['좋아요가 많은 레시피 TOP 5', '댓글이 많은 레시피 TOP 5'].map((title) => (
              <div key={title} style={{ minHeight: '190px', padding: '16px', borderRadius: '16px', background: C.card, boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}><span style={{ fontSize: '14px', fontWeight: 900, color: C.fg }}>{title}</span><span style={{ fontSize: '9px', fontWeight: 800, color: C.fgSubtle }}>API 연결 예정</span></div><div style={{ height: '135px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.fgSubtle, fontSize: '11px' }}>집계 결과가 여기에 표시됩니다.</div></div>
            ))}
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

// ─── Main AdminPanel ──────────────────────────────────────────────────────────
export function AdminPanel({
  currentUser, recipes, inquiries, presetIngredients, onClose,
  onFetchRecipes, adminPage, adminTotalPages, adminTotalElements, adminSize,
  onAdminUpdateRecipe, onAdminDeleteRecipe,
  onFetchInquiries, onFetchInquiryDetail, onFetchInquiryCounts, pendingInquiriesCount, answeredInquiriesCount,
  onAnswerInquiry, onDeleteInquiry, onDeleteAnswer, onUpdatePresetIngredients,
}) {
  const [activeTab, setActiveTab] = useState('home');
  const [schedulerRunning, setSchedulerRunning] = useState(false);

  useEffect(() => {
    onFetchInquiryCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRunScheduler = async () => {
    if (schedulerRunning) return;
    setSchedulerRunning(true);
    try {
      await scoreApi.postScheduler();
    } finally {
      setSchedulerRunning(false);
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
          {activeTab === 'home'        && <AdminHomeTab currentUser={currentUser} pendingCount={pendingInquiriesCount} answeredCount={answeredInquiriesCount} presetIngredients={presetIngredients} onNavigate={setActiveTab} onRefreshInquiryCounts={onFetchInquiryCounts} />}
        {activeTab === 'members'     && <MembersTab currentUser={currentUser} />}
        {activeTab === 'recipes'     && <RecipesTab recipes={recipes} onFetchRecipes={onFetchRecipes} adminPage={adminPage} adminTotalPages={adminTotalPages} adminTotalElements={adminTotalElements} adminSize={adminSize} onUpdateRecipe={onAdminUpdateRecipe} onDeleteRecipe={onAdminDeleteRecipe} />}
        {activeTab === 'ingredients' && <IngredientsTab items={presetIngredients} onUpdate={onUpdatePresetIngredients} />}
        {activeTab === 'stats'       && <StatsTab />}
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
