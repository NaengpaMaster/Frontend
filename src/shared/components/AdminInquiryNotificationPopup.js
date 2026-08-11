'use client';

import { BellRing, ChevronRight, MessageSquare, X } from 'lucide-react';
import { C } from '@/shared/data/mockData';

export function AdminInquiryNotificationPopup({ count, onClose, onGoInquiries }) {
  if (!count || count <= 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="새 문의사항 알림"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 80,
        background: 'rgba(17,32,29,0.42)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '18px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: C.card,
          borderRadius: '18px',
          boxShadow: '0 22px 60px rgba(17,32,29,0.3)',
          border: `1px solid ${C.border}`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '18px 18px 16px',
            borderBottom: `1px solid ${C.border}`,
            background: `linear-gradient(180deg, ${C.primaryLight} 0%, ${C.card} 76%)`,
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ display: 'flex', gap: '11px', alignItems: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '14px',
                background: C.card,
                color: C.primary,
                boxShadow: '0 6px 18px rgba(14,132,120,0.18)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <BellRing size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ color: C.fg, fontSize: '18px', fontWeight: 950, lineHeight: 1.25 }}>새 문의사항이 왔습니다</div>
              <div style={{ color: C.fgMuted, fontSize: '12px', lineHeight: 1.45, marginTop: '3px' }}>
                답변 대기 중인 문의가 {count}건 있습니다.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{
              width: '32px',
              height: '32px',
              border: `1px solid ${C.border}`,
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.78)',
              color: C.fgMuted,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '18px', display: 'grid', gap: '14px' }}>
          <div
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: '14px',
              background: C.surface,
              padding: '14px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '11px', background: C.accentLight, color: C.accent, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <MessageSquare size={17} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ color: C.fg, fontSize: '14px', fontWeight: 900 }}>확인이 필요한 문의</div>
              <div style={{ color: C.fgMuted, fontSize: '12px', lineHeight: 1.5, marginTop: '3px' }}>
                문의 탭에서 내용을 확인하고 답변을 등록해주세요.
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ border: `1px solid ${C.border}`, borderRadius: '13px', background: C.surface, color: C.fgMuted, fontSize: '13px', fontWeight: 900, padding: '12px', cursor: 'pointer' }}
            >
              나중에 보기
            </button>
            <button
              type="button"
              onClick={onGoInquiries}
              style={{ border: 'none', borderRadius: '13px', background: C.primary, color: '#FFFFFF', fontSize: '13px', fontWeight: 950, padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              문의 확인하기 <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
