import { LayoutDashboard, Refrigerator, ChefHat, MessageSquare, ShoppingCart, User as UserIcon, Shield } from 'lucide-react';
import { C } from '@/shared/data/mockData';
import { Logo } from './Logo';

const tabs = [
  { id: 'home',     label: '홈',     Icon: LayoutDashboard },
  { id: 'fridge',   label: '냉장고', Icon: Refrigerator   },
  { id: 'recipe',   label: '레시피', Icon: ChefHat        },
  { id: 'shopping', label: '장보기', Icon: ShoppingCart   },
  { id: 'inquiry',  label: '문의',   Icon: MessageSquare  },
];

export function Sidebar({ active, onChange, currentUser, onOpenMyPage, onOpenAdmin }) {
  return (
    <aside
      className="app-sidebar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '240px',
        height: '100vh',
        background: C.card,
        borderRight: `1px solid ${C.border}`,
        flexDirection: 'column',
        padding: '24px 16px',
        overflowY: 'auto',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px', marginBottom: '28px' }}>
        <Logo size={32} />
        <span style={{ fontSize: '17px', fontWeight: 700, color: C.fg, letterSpacing: '-0.02em' }}>냉파 마스터</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {tabs.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="sidebar-nav-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 12px',
                background: isActive ? C.primaryLight : undefined,
                border: 'none',
                borderRadius: '16px',
                color: isActive ? C.primary : C.fgMuted,
                fontWeight: isActive ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.75} />
              {label}
            </button>
          );
        })}
      </nav>

      {currentUser.role === 'admin' && (
        <button
          onClick={onOpenAdmin}
          className="sidebar-nav-item"
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '11px 12px', marginBottom: '6px',
            border: `1px solid ${C.border}`, borderRadius: '16px',
            color: C.fgMuted, fontSize: '13px', fontWeight: 600, cursor: 'pointer', textAlign: 'left',
            transition: 'background 0.15s',
          }}
        >
          <Shield size={16} /> 관리자 대시보드
        </button>
      )}

      <button
        onClick={onOpenMyPage}
        className="sidebar-profile-btn"
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px',
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px',
          color: C.fg, fontSize: '13px', fontWeight: 700, cursor: 'pointer', textAlign: 'left',
          transition: 'background 0.15s',
        }}
      >
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%', background: C.primaryLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <UserIcon size={15} color={C.primary} />
        </div>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</span>
      </button>
    </aside>
  );
}
