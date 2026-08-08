'use client';

import { useState } from 'react';
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

function NotificationSection({ title, description, notifications, tone, onStartAcceptShareRequest, onRejectShareRequest }) {
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
              {notification.type === 'FRIDGE_ITEM_REQUESTED' ? (
                <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => onStartAcceptShareRequest?.(notification)}
                    style={{ border: 'none', borderRadius: '8px', background: C.primary, color: '#FFFFFF', fontSize: '11px', fontWeight: 900, padding: '7px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    수락
                  </button>
                  <button
                    type="button"
                    onClick={() => onRejectShareRequest?.(notification)}
                    style={{ border: `1px solid ${C.border}`, borderRadius: '8px', background: C.surface, color: C.fgMuted, fontSize: '11px', fontWeight: 900, padding: '7px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    거절
                  </button>
                </div>
              ) : Number.isFinite(days) && (
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

export function ExpiryNotificationPopup({ notifications, onClose, onConfirm, onGoFridge, onAcceptShareRequest, onRejectShareRequest }) {
  const [acceptingNotification, setAcceptingNotification] = useState(null);
  const [acceptTransferAll, setAcceptTransferAll] = useState(false);
  const [acceptRemainingQuantity, setAcceptRemainingQuantity] = useState('');
  const [acceptError, setAcceptError] = useState('');
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
            onStartAcceptShareRequest={(notification) => { setAcceptingNotification(notification); setAcceptTransferAll(false); setAcceptRemainingQuantity(''); setAcceptError(''); }}
            onRejectShareRequest={onRejectShareRequest}
          />
          <NotificationSection
            title="곧 먹어야 하는 재료가 있어요"
            description="소비기한이 3일 이내인 재료예요. 오늘 식단에 먼저 활용해보세요."
            notifications={expiring}
            tone="accent"
            onStartAcceptShareRequest={(notification) => { setAcceptingNotification(notification); setAcceptTransferAll(false); setAcceptRemainingQuantity(''); setAcceptError(''); }}
            onRejectShareRequest={onRejectShareRequest}
          />
          <NotificationSection
            title="새 소식이 있어요"
            description="문의 답변이나 댓글 답변처럼 확인이 필요한 알림이에요."
            notifications={messages}
            tone="accent"
            onStartAcceptShareRequest={(notification) => { setAcceptingNotification(notification); setAcceptTransferAll(false); setAcceptRemainingQuantity(''); setAcceptError(''); }}
            onRejectShareRequest={onRejectShareRequest}
          />
        </div>

        {acceptingNotification && (
          <div style={{ margin: '0 16px 14px', padding: '14px', border: `1px solid ${C.primaryMid}`, borderRadius: '10px', background: C.primaryLight, display: 'grid', gap: '10px' }}>
            <div>
              <div style={{ color: C.fg, fontSize: '13px', fontWeight: 900 }}>요청 수락하기</div>
              <div style={{ color: C.fgMuted, fontSize: '11px', marginTop: '3px', lineHeight: 1.35 }}>{acceptingNotification.content}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button type="button" onClick={() => { setAcceptTransferAll(false); setAcceptError(''); }} style={{ border: `1px solid ${!acceptTransferAll ? C.primary : C.border}`, borderRadius: '9px', background: !acceptTransferAll ? C.card : C.surface, color: !acceptTransferAll ? C.primary : C.fgMuted, padding: '9px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>일부 보내기</button>
              <button type="button" onClick={() => { setAcceptTransferAll(true); setAcceptRemainingQuantity(''); setAcceptError(''); }} style={{ border: `1px solid ${acceptTransferAll ? C.danger : C.border}`, borderRadius: '9px', background: acceptTransferAll ? C.dangerLight : C.surface, color: acceptTransferAll ? C.danger : C.fgMuted, padding: '9px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>전체 보내기</button>
            </div>
            {!acceptTransferAll && (
              <div style={{ display: 'grid', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', color: C.fgMuted, fontSize: '11px', fontWeight: 900, marginBottom: '5px' }}>보낼 수량</label>
                  <div style={{ border: `1px solid ${C.primaryMid}`, borderRadius: '9px', background: C.card, color: C.primary, padding: '10px 11px', fontSize: '12px', fontWeight: 900 }}>요청받은 수량만큼 보내기</div>
                </div>
                <div>
                  <label style={{ display: 'block', color: C.fgMuted, fontSize: '11px', fontWeight: 900, marginBottom: '5px' }}>내 냉장고에 남길 수량</label>
                  <input value={acceptRemainingQuantity} onChange={(event) => { setAcceptError(''); setAcceptRemainingQuantity(event.target.value); }} placeholder="예: 1개, 200g" style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C.border}`, borderRadius: '9px', background: C.card, color: C.fg, padding: '10px 11px', fontSize: '13px', outline: 'none' }} />
                </div>
              </div>
            )}
            {acceptTransferAll && <div style={{ color: C.danger, fontSize: '11px', fontWeight: 800 }}>전체 보내기를 선택하면 내 냉장고에서 해당 재료가 삭제됩니다.</div>}
            {acceptError && <div style={{ color: C.danger, fontSize: '11px', fontWeight: 800 }}>{acceptError}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button type="button" onClick={() => setAcceptingNotification(null)} style={{ border: `1px solid ${C.border}`, borderRadius: '9px', background: C.surface, color: C.fgMuted, padding: '10px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>취소</button>
              <button type="button" onClick={async () => { if (!acceptTransferAll && !acceptRemainingQuantity.trim()) { setAcceptError('일부만 보낼 때는 남길 수량을 입력해주세요.'); return; } await onAcceptShareRequest?.(acceptingNotification, { transferAll: acceptTransferAll, remainingQuantity: acceptRemainingQuantity.trim() }); setAcceptingNotification(null); }} style={{ border: 'none', borderRadius: '9px', background: C.primary, color: '#FFFFFF', padding: '10px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>수락 완료</button>
            </div>
          </div>
        )}

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
