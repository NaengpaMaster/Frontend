import { useEffect, useState } from 'react';
import { Bell, Bot, Check, Crown, Mail, ReceiptText, Refrigerator, Users, X } from 'lucide-react';
import { subscriptionApi } from '@/apis/subscriptionApi';
import { C } from '@/shared/data/mockData';

const PLAN_COMPARE_ITEMS = [
  { icon: Refrigerator, label: '개인 냉장고 재료 관리', free: true, premium: true, description: '재료 등록, 수정, 사용, 삭제' },
  { icon: Bell, label: '소비기한 임박 알림', free: true, premium: true, description: '임박/만료 재료 확인' },
  { icon: Mail, label: '주간 메일 자동 송신', free: true, premium: true, description: '냉장고 소비 내역을 메일로 자동 발송' },
  { icon: Bot, label: 'AI 장보기 추천 대화 기능', free: false, premium: true, description: '필요한 재료를 AI와 대화하며 추천받기' },
  { icon: ReceiptText, label: '영수증으로 냉장고 재료 추가', free: false, premium: true, description: '구매 영수증 기반 재료 등록' },
  { icon: Users, label: '내 냉장고와 공유받은 냉장고 함께 보기', free: false, premium: true, description: '내 냉장고는 그대로 유지하고, 가족이 공유한 냉장고를 별도로 전환해 확인' },
];

const MONTHLY_PRICE = 2900;
const YEARLY_ORIGINAL_PRICE = MONTHLY_PRICE * 12;
const YEARLY_DISCOUNT_PRICE = Math.floor(YEARLY_ORIGINAL_PRICE * 0.8);
const TOSS_SDK_URL = 'https://js.tosspayments.com/v2/standard';

const formatWon = (value) => `${value.toLocaleString('ko-KR')}원`;
const planTypeFromCode = (code) => code === 'YEARLY_PREMIUM' ? 'YEARLY' : 'MONTHLY';

const SUBSCRIPTION_PLANS = [
  {
    code: 'MONTHLY_PREMIUM',
    title: '월간 구독',
    price: MONTHLY_PRICE,
    suffix: '/월',
    description: '부담 없이 매월 이용하는 기본 프리미엄 요금제',
  },
  {
    code: 'YEARLY_PREMIUM',
    title: '연간 구독',
    price: YEARLY_DISCOUNT_PRICE,
    suffix: '/년',
    originalPrice: YEARLY_ORIGINAL_PRICE,
    discountLabel: '20% 할인',
    saveAmount: YEARLY_ORIGINAL_PRICE - YEARLY_DISCOUNT_PRICE,
    description: '월 결제 대비 20% 저렴한 추천 요금제',
  },
];

function PlanMark({ enabled }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '26px',
        height: '26px',
        borderRadius: '999px',
        background: enabled ? C.primaryLight : C.dangerLight,
        color: enabled ? C.primary : C.danger,
      }}
    >
      {enabled ? <Check size={16} strokeWidth={3} /> : <X size={15} strokeWidth={3} />}
    </span>
  );
}

export function SubscriptionPage({ subscriptionStatus, onOpenFamilyManagement }) {
  const isPremium = subscriptionStatus?.premium;
  const [selectedPlanCode, setSelectedPlanCode] = useState('MONTHLY_PREMIUM');
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingKey, setBillingKey] = useState(null);
  const [payments, setPayments] = useState([]);
  const [managementLoading, setManagementLoading] = useState(false);
  const [managementError, setManagementError] = useState('');
  const selectedPlan = SUBSCRIPTION_PLANS.find((plan) => plan.code === selectedPlanCode) ?? SUBSCRIPTION_PLANS[0];

  useEffect(() => {
    loadSubscriptionManagement();
  }, []);

  const handleStartTrial = () => {
    requestBillingAuth('trial');
  };

  const handlePayment = () => {
    requestBillingAuth('payment');
  };

  const requestBillingAuth = async (mode) => {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!clientKey) {
      alert('TossPayments 클라이언트 키가 설정되지 않았습니다.');
      return;
    }

    try {
      setBillingLoading(true);
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: createCustomerKey() });
      const origin = window.location.origin;

      window.sessionStorage.setItem('naengpa.subscription.planType', planTypeFromCode(selectedPlan.code));
      window.sessionStorage.setItem('naengpa.subscription.mode', mode);

      await payment.requestBillingAuth({
        method: 'CARD',
        successUrl: `${origin}/subscription/billing/success`,
        failUrl: `${origin}/subscription/billing/fail`,
        customerName: '냉파마스터 회원',
        windowTarget: 'self',
      });
    } catch (error) {
      alert(error?.message || 'TossPayments 카드 등록창을 열지 못했습니다.');
      setBillingLoading(false);
    }
  };

  const loadSubscriptionManagement = async () => {
    try {
      setManagementLoading(true);
      setManagementError('');
      const [billingKeyResult, paymentResult] = await Promise.allSettled([
        subscriptionApi.getMyBillingKey(),
        subscriptionApi.getMyPayments(),
      ]);

      setBillingKey(billingKeyResult.status === 'fulfilled' ? billingKeyResult.value : null);
      setPayments(paymentResult.status === 'fulfilled' ? paymentResult.value ?? [] : []);
    } catch (error) {
      setManagementError(error?.message || '구독 정보를 불러오지 못했습니다.');
    } finally {
      setManagementLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('현재 이용 기간까지 사용하고 다음 자동결제를 중단할까요?')) {
      return;
    }

    try {
      setManagementLoading(true);
      setManagementError('');
      await subscriptionApi.cancelSubscription();
      alert('구독 해지가 예약되었습니다. 현재 이용 기간까지 프리미엄을 사용할 수 있어요.');
      await loadSubscriptionManagement();
    } catch (error) {
      setManagementError(error?.message || '구독 해지 예약에 실패했습니다.');
    } finally {
      setManagementLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100%', background: '#F2F4F5' }}>
      <div style={{ padding: '24px 20px 12px' }}>
        <div style={{ fontSize: '12px', fontWeight: 950, letterSpacing: '0.1em', color: C.primary, marginBottom: '6px' }}>PREMIUM</div>
        <div style={{ fontSize: '30px', fontWeight: 950, color: C.fg, lineHeight: 1.15 }}>구독 관리</div>
        <div style={{ fontSize: '13px', color: C.fgMuted, marginTop: '8px' }}>등록 카드, 결제 내역, 가족 냉장고를 한 곳에서 관리해요.</div>
      </div>

      <div style={{ padding: '18px' }}>
          <div style={{ background: 'linear-gradient(135deg, #0E8478 0%, #0AAE9F 100%)', color: '#FFFFFF', borderRadius: '26px', padding: '22px', boxShadow: '0 18px 38px rgba(14,132,120,0.24)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', color: '#DDF8F4' }}>REFRIDGE PREMIUM</div>
                <div style={{ fontSize: '24px', fontWeight: 950, marginTop: '8px', lineHeight: 1.2 }}>7일 무료체험으로<br />구독 시작하기</div>
                <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#EAFBF8', marginTop: '10px' }}>AI 추천, 영수증 등록, 공유 냉장고 보기 기능을 먼저 사용해보세요.</div>
              </div>
              <div style={{ width: '54px', height: '54px', borderRadius: '20px', background: 'rgba(255,255,255,0.18)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Crown size={28} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '18px' }}>
              <button
                onClick={handleStartTrial}
                disabled={isPremium || billingLoading}
                style={{ padding: '15px 12px', border: 'none', borderRadius: '17px', background: isPremium ? 'rgba(255,255,255,0.18)' : '#FFFFFF', color: isPremium ? '#DDF8F4' : C.primary, fontSize: '14px', fontWeight: 950, cursor: isPremium || billingLoading ? 'default' : 'pointer' }}
              >
                {isPremium ? '이용 중' : billingLoading ? '연결 중' : '7일 무료체험'}
              </button>
              <button
                onClick={handlePayment}
                disabled={isPremium || billingLoading}
                style={{ padding: '15px 12px', border: '1px solid rgba(255,255,255,0.42)', borderRadius: '17px', background: isPremium ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.18)', color: '#FFFFFF', fontSize: '14px', fontWeight: 950, cursor: isPremium || billingLoading ? 'default' : 'pointer' }}
              >
                {isPremium ? '결제 완료' : billingLoading ? '연결 중' : '결제하기'}
              </button>
            </div>
            {isPremium && (
              <button
                onClick={handleCancelSubscription}
                disabled={managementLoading || subscriptionStatus?.cancelReserved}
                style={{ display: 'block', margin: '10px auto 0', padding: '4px 6px', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.58)', fontSize: '10px', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}
              >
                {subscriptionStatus?.cancelReserved ? '해지 예약됨' : '구독취소'}
              </button>
            )}
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', marginBottom: '13px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: C.fg }}>내 구독 관리</div>
                <div style={{ fontSize: '12px', color: C.fgMuted, marginTop: '4px' }}>등록 카드와 구독 결제 내역을 확인할 수 있어요.</div>
              </div>
              <button
                type="button"
                onClick={loadSubscriptionManagement}
                disabled={managementLoading}
                style={{ padding: '9px 11px', border: `1px solid ${C.border}`, borderRadius: '13px', background: C.surface, color: C.fgMuted, fontSize: '11px', fontWeight: 900, cursor: managementLoading ? 'wait' : 'pointer' }}
              >
                새로고침
              </button>
            </div>

            {managementError && (
              <div style={{ background: C.dangerLight, color: C.danger, borderRadius: '14px', padding: '11px', fontSize: '12px', fontWeight: 800, marginBottom: '10px' }}>{managementError}</div>
            )}

            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: '16px', padding: '13px', background: C.surface }}>
                <div style={{ fontSize: '12px', fontWeight: 900, color: C.primary, marginBottom: '8px' }}>등록 카드</div>
                {billingKey ? (
                  <div style={{ fontSize: '14px', fontWeight: 900, color: C.fg }}>
                    {billingKey.cardCompany || '카드'} · {billingKey.cardNumberMasked || '마스킹 번호 없음'}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', fontWeight: 800, color: C.fgMuted }}>등록된 카드가 없습니다.</div>
                )}
              </div>

              <div style={{ border: `1px solid ${C.border}`, borderRadius: '16px', overflow: 'hidden', background: C.surface }}>
                <div style={{ padding: '13px', fontSize: '12px', fontWeight: 900, color: C.primary, borderBottom: `1px solid ${C.border}` }}>결제 내역</div>
                {payments.length > 0 ? payments.slice(0, 5).map((payment) => (
                  <div key={payment.paymentId} style={{ padding: '12px 13px', borderTop: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: C.fg }}>{payment.orderName || payment.planType}</div>
                        <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '3px' }}>{payment.billingPeriodStart || '-'} ~ {payment.billingPeriodEnd || '-'}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 950, color: C.fg }}>{formatWon(payment.amount || 0)}</div>
                        <div style={{ fontSize: '10px', fontWeight: 900, color: payment.status === 'SUCCESS' ? C.primary : C.fgMuted, marginTop: '3px' }}>{payment.status}</div>
                      </div>
                    </div>
                    {payment.failedReason && (
                      <div style={{ fontSize: '11px', color: C.danger, marginTop: '6px', fontWeight: 700 }}>{payment.failedReason}</div>
                    )}
                  </div>
                )) : (
                  <div style={{ padding: '13px', fontSize: '13px', fontWeight: 800, color: C.fgMuted }}>결제 내역이 없습니다.</div>
                )}
              </div>
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '18px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: C.fg }}>가족 냉장고 관리</div>
                <div style={{ fontSize: '12px', color: C.fgMuted, marginTop: '4px', lineHeight: 1.45 }}>구독 중이면 가족 공유 냉장고 구성원을 관리할 수 있어요.</div>
              </div>
              <button
                type="button"
                onClick={onOpenFamilyManagement}
                disabled={!isPremium}
                style={{ padding: '10px 13px', border: 'none', borderRadius: '14px', background: isPremium ? C.primary : C.surface, color: isPremium ? '#FFFFFF' : C.fgMuted, fontSize: '12px', fontWeight: 950, cursor: isPremium ? 'pointer' : 'not-allowed', flexShrink: 0 }}
              >
                가족 관리
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {SUBSCRIPTION_PLANS.map((plan) => {
              const selected = selectedPlanCode === plan.code;
              return (
                <button
                  key={plan.code}
                  type="button"
                  onClick={() => setSelectedPlanCode(plan.code)}
                  style={{
                    background: selected ? '#F0FBF8' : C.card,
                    border: `1px solid ${selected ? C.primary : C.border}`,
                    borderRadius: '20px',
                    padding: '15px',
                    position: 'relative',
                    boxShadow: selected ? '0 10px 24px rgba(14,132,120,0.12)' : 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {plan.discountLabel && (
                    <div style={{ position: 'absolute', top: '-10px', right: '12px', padding: '5px 8px', borderRadius: '999px', background: C.primary, color: '#FFFFFF', fontSize: '10px', fontWeight: 950 }}>{plan.discountLabel}</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 900, color: C.primary }}>{plan.title}</div>
                    <div style={{ width: '18px', height: '18px', borderRadius: '999px', border: `2px solid ${selected ? C.primary : C.border}`, background: selected ? C.primary : '#FFFFFF', display: 'grid', placeItems: 'center', color: '#FFFFFF' }}>
                      {selected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                  {plan.originalPrice && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '7px' }}>
                      <span style={{ fontSize: '12px', color: C.fgMuted, textDecoration: 'line-through' }}>{formatWon(plan.originalPrice)}</span>
                      <span style={{ fontSize: '10px', fontWeight: 900, color: C.danger }}>SAVE {formatWon(plan.saveAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', marginTop: plan.originalPrice ? '2px' : '8px' }}>
                    <span style={{ fontSize: '23px', fontWeight: 950, color: C.fg }}>{formatWon(plan.price)}</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: C.fgMuted, paddingBottom: '3px' }}>{plan.suffix}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '7px', lineHeight: 1.45 }}>{plan.description}</div>
                </button>
              );
            })}
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '22px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: '15px', fontWeight: 900, color: C.fg }}>무료 vs 구독 비교</div>
              <div style={{ fontSize: '12px', color: C.fgMuted, marginTop: '4px' }}>무료 기능과 프리미엄 확장 기능 제공 여부를 O/X로 확인하세요.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 62px 72px', gap: '8px', padding: '11px 14px', background: C.surface, color: C.fgMuted, fontSize: '11px', fontWeight: 900, alignItems: 'center' }}>
              <span>기능</span>
              <span style={{ textAlign: 'center' }}>무료</span>
              <span style={{ textAlign: 'center', color: C.primary }}>구독</span>
            </div>
            {PLAN_COMPARE_ITEMS.map((item) => (
              <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '1fr 62px 72px', gap: '8px', padding: '13px 14px', borderTop: `1px solid ${C.border}`, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '13px', background: C.primaryLight, color: C.primary, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <item.icon size={17} strokeWidth={2.4} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: C.fg }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '3px', lineHeight: 1.35 }}>{item.description}</div>
                  </div>
                </div>
                <span style={{ textAlign: 'center' }}><PlanMark enabled={item.free} /></span>
                <span style={{ textAlign: 'center' }}><PlanMark enabled={item.premium} /></span>
              </div>
            ))}
          </div>

          <div style={{ background: C.warnLight, color: C.warn, borderRadius: '18px', padding: '14px', fontSize: '12px', lineHeight: 1.55, fontWeight: 700 }}>
            무료체험 시작 전 카드 등록이 필요합니다. 체험 기간 종료 전 해지하면 결제되지 않으며, 해지 후에도 현재 이용 기간 종료일까지 프리미엄 기능을 사용할 수 있습니다.
          </div>
      </div>
    </div>
  );
}

function createCustomerKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `naengpa_${crypto.randomUUID()}`;
  }
  return `naengpa_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function loadTossPayments(clientKey) {
  if (window.TossPayments) {
    return Promise.resolve(window.TossPayments(clientKey));
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${TOSS_SDK_URL}"]`);
    const script = existingScript || document.createElement('script');

    script.onload = () => resolve(window.TossPayments(clientKey));
    script.onerror = () => reject(new Error('TossPayments SDK 로드에 실패했습니다.'));

    if (!existingScript) {
      script.src = TOSS_SDK_URL;
      document.head.appendChild(script);
    }
  });
}
