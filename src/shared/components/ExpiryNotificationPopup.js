'use client';

import { AlertTriangle, BellRing, Check, ChevronRight, X } from 'lucide-react';
import { C, getDayLabel, getDaysUntilExpiry } from '@/shared/data/mockData';

const EXPIRY_TYPES = new Set(['EXPIRY_SOON', 'EXPIRED']);

function groupNotifications(notifications) {
  return {
    expired: notifications.filter((notification) => notification.type === 'EXPIRED'),
    expiring: notifications.filter((notification) => notification.type === 'EXPIRY_SOON'),
    messages: notifications.filter((notification) => !EXPIRY_TYPES.has(notification.type)),
  };
}

function NotificationSection({ title, description, notifications, tone }) {
  if (notifications.length === 0) return null;

  const isDanger = tone === 'danger';
  const color = isDanger ? C.danger : C.accent;
  const bg = isDanger ? C.dangerLight : C.accentLight;

  return (
    <section className="expiry-popup-section" style={{ display: 'grid', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '9px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            background: bg,
            color,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={16} strokeWidth={2.4} />
        </div>
        <div>
          <div style={{ color: C.fg, fontSize: '14px', fontWeight: 800, lineHeight: 1.3 }}>{title}</div>
          <div style={{ color: C.fgMuted, fontSize: '12px', lineHeight: 1.45, marginTop: '2px' }}>{description}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '6px' }}>
        {notifications.slice(0, 4).map((notification) => {
          const days = getDaysUntilExpiry(notification.targetExpiryDate);

          return (
            <div
              className="expiry-popup-item"
              key={`${tone}-${notification.notificationId}`}
              style={{
                minHeight: '42px',
                border: `1px solid ${C.border}`,
                borderRadius: '8px',
                background: C.card,
                padding: '9px 10px',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ color: C.fg, fontSize: '13px', fontWeight: 700, lineHeight: 1.25 }}>{notification.title}</div>
                <div style={{ color: C.fgMuted, fontSize: '11px', lineHeight: 1.3, marginTop: '2px' }}>
                  {notification.content}
                </div>
              </div>
              {Number.isFinite(days) && (
                <div
                  style={{
                    borderRadius: '999px',
                    background: bg,
                    color,
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '5px 8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getDayLabel(days)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {notifications.length > 4 && (
        <div style={{ color: C.fgMuted, fontSize: '11px', paddingLeft: '39px' }}>
          외 {notifications.length - 4}개 알림이 더 있어요
        </div>
      )}
    </section>
  );
}

export function ExpiryNotificationPopup({ notifications, onClose, onConfirm, onGoFridge }) {
  const { expired, expiring, messages } = groupNotifications(notifications);
  const totalCount = expired.length + expiring.length + messages.length;
  const hasExpiryNotification = expired.length > 0 || expiring.length > 0;

  if (totalCount === 0) return null;

  return (
    <div
      className="expiry-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="소비기한 알림"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        background: 'rgba(17,32,29,0.42)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '18px',
      }}
    >
      <div
        className="expiry-popup-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          maxHeight: 'calc(100% - 36px)',
          overflow: 'auto',
          background: C.card,
          borderRadius: '8px',
          boxShadow: '0 22px 60px rgba(17,32,29,0.3)',
          border: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            padding: '16px 16px 14px',
            borderBottom: `1px solid ${C.border}`,
            background: `linear-gradient(180deg, ${C.primaryLight} 0%, ${C.card} 72%)`,
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div
              className="expiry-popup-bell"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: C.card,
                color: C.primary,
                boxShadow: '0 6px 18px rgba(14,132,120,0.18)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <BellRing size={18} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ color: C.fg, fontSize: '17px', fontWeight: 900, lineHeight: 1.25 }}>소비기한 알림</div>
              <div style={{ color: C.fgMuted, fontSize: '12px', lineHeight: 1.4, marginTop: '2px' }}>
                확인이 필요한 알림 {totalCount}개가 있어요
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
              borderRadius: '8px',
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

        <div style={{ padding: '16px', display: 'grid', gap: '18px' }}>
          <NotificationSection
            title="기한이 지난 재료가 있어요"
            description="만료된 재료는 상태를 확인하고 사용 여부를 정리해주세요."
            notifications={expired}
            tone="danger"
          />
          <NotificationSection
            title="곧 먹어야 하는 재료가 있어요"
            description="소비기한이 3일 이내인 재료예요. 오늘 식단에 먼저 활용해보세요."
            notifications={expiring}
            tone="accent"
          />
          <NotificationSection
            title="새 소식이 있어요"
            description="문의 답변이나 댓글 답변처럼 확인이 필요한 알림이에요."
            notifications={messages}
            tone="accent"
          />
        </div>

        <div
          style={{
            padding: '12px 16px 16px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            borderTop: `1px solid ${C.border}`,
          }}
        >
          <button
            type="button"
            onClick={onConfirm}
            style={{
              minHeight: '42px',
              border: `1px solid ${C.border}`,
              borderRadius: '8px',
            background: C.surface,
              color: C.fg,
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Check size={15} />
            확인
          </button>
          <button
            type="button"
            onClick={onGoFridge}
            disabled={!hasExpiryNotification}
            style={{
              minHeight: '42px',
              border: `1px solid ${hasExpiryNotification ? C.primary : C.border}`,
              borderRadius: '8px',
              background: hasExpiryNotification ? C.primary : C.surface,
              color: hasExpiryNotification ? '#FFFFFF' : C.fgMuted,
              fontSize: '13px',
              fontWeight: 800,
              cursor: hasExpiryNotification ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            냉장고 보기
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
