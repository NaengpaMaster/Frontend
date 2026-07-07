import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { C } from '@/shared/data/mockData';

const PAGE_WINDOW_SIZE = 10;

export function PageControls({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const groupStart = Math.floor(page / PAGE_WINDOW_SIZE) * PAGE_WINDOW_SIZE;
  const groupEnd = Math.min(groupStart + PAGE_WINDOW_SIZE, totalPages);
  const pages = Array.from({ length: groupEnd - groupStart }, (_, i) => groupStart + i);
  const hasPrevGroup = groupStart > 0;
  const hasNextGroup = groupEnd < totalPages;

  const navButtonStyle = (disabled) => ({
    width: '28px', height: '28px', border: 'none', borderRadius: '8px', background: C.surface,
    color: disabled ? C.fgSubtle : C.fgMuted, cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '16px', flexWrap: 'wrap' }}>
      <button
        onClick={() => onChange(groupStart - PAGE_WINDOW_SIZE)}
        disabled={!hasPrevGroup}
        style={navButtonStyle(!hasPrevGroup)}
      >
        <ChevronsLeft size={14} />
      </button>
      <button
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page === 0}
        style={navButtonStyle(page === 0)}
      >
        <ChevronLeft size={14} />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          style={{
            minWidth: '28px', height: '28px', padding: '0 6px', border: 'none', borderRadius: '8px',
            background: p === page ? C.primary : C.surface,
            color: p === page ? '#FFF' : C.fgMuted,
            fontWeight: 700, fontSize: '12px', cursor: 'pointer',
          }}
        >
          {p + 1}
        </button>
      ))}
      <button
        onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        style={navButtonStyle(page >= totalPages - 1)}
      >
        <ChevronRight size={14} />
      </button>
      <button
        onClick={() => onChange(groupEnd)}
        disabled={!hasNextGroup}
        style={navButtonStyle(!hasNextGroup)}
      >
        <ChevronsRight size={14} />
      </button>
    </div>
  );
}
