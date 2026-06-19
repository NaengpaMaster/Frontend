import { LayoutDashboard, Refrigerator, ChefHat, MessageSquare, ShoppingCart } from 'lucide-react';
import { C } from '../data/mockData';

export type TabId = 'home' | 'fridge' | 'recipe' | 'shopping' | 'inquiry';

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: 'home',     label: '홈',    Icon: LayoutDashboard },
  { id: 'fridge',   label: '냉장고', Icon: Refrigerator   },
  { id: 'recipe',   label: '레시피', Icon: ChefHat        },
  { id: 'shopping', label: '장보기', Icon: ShoppingCart   },
  { id: 'inquiry',  label: '문의',   Icon: MessageSquare  },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      className="app-bottomnav"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: C.card,
        borderTop: `1px solid ${C.border}`,
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        boxShadow: '0 -4px 20px rgba(17,32,29,0.05)',
        zIndex: 10,
      }}
    >
      {tabs.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              padding: '10px 4px 8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? C.primary : C.fgMuted,
              transition: 'color 0.15s',
              borderTop: isActive ? `2px solid ${C.primary}` : '2px solid transparent',
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
            <span style={{ fontSize: '10px', fontWeight: isActive ? 700 : 400, letterSpacing: '0.02em' }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
