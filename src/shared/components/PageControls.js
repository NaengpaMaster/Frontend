import { ChevronLeft, ChevronRight } from 'lucide-react';
import { C } from '@/shared/data/mockData';

export function PageControls({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '16px', flexWrap: 'wrap' }}>
      <button
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page === 0}
        style={{ width: '28px', height: '28px', border: 'none', borderRadius: '8px', background: C.surface, color: page === 0 ? C.fgSubtle : C.fgMuted, cursor: page === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
        style={{ width: '28px', height: '28px', border: 'none', borderRadius: '8px', background: C.surface, color: page >= totalPages - 1 ? C.fgSubtle : C.fgMuted, cursor: page >= totalPages - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
