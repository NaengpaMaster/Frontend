"use client";

import { useEffect, useState } from 'react';
import { subscriptionApi } from '@/apis/subscriptionApi';

export default function BillingSuccessPage() {
  const [message, setMessage] = useState('카드 등록 결과를 확인하고 있습니다.');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authKey = params.get('authKey');
    const customerKey = params.get('customerKey');
    const mode = window.sessionStorage.getItem('naengpa.subscription.mode') || 'trial';
    const planType = window.sessionStorage.getItem('naengpa.subscription.planType') || 'MONTHLY';

    if (!authKey || !customerKey) {
      setMessage('카드 등록 인증 정보가 없습니다.');
      setDone(true);
      return;
    }

    async function completeBilling() {
      try {
        setMessage('카드를 등록하고 있습니다.');
        await subscriptionApi.issueBillingKey({ authKey, customerKey });

        if (mode === 'payment') {
          setMessage('구독 결제를 승인하고 있습니다.');
          await subscriptionApi.approveSubscriptionPayment(planType);
          setMessage('구독 결제가 완료되었습니다.');
        } else if (mode === 'trial') {
          setMessage('무료체험을 시작하고 있습니다.');
          await subscriptionApi.startTrial();
          setMessage('무료체험이 시작되었습니다.');
        } else {
          setMessage('카드 등록이 완료되었습니다.');
        }
      } catch (error) {
        setMessage(error?.message || '구독 처리 중 오류가 발생했습니다.');
      } finally {
        window.sessionStorage.removeItem('naengpa.subscription.mode');
        window.sessionStorage.removeItem('naengpa.subscription.planType');
        setDone(true);
      }
    }

    completeBilling();
  }, []);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F6F8F7', padding: '24px' }}>
      <section style={{ width: '100%', maxWidth: '420px', borderRadius: '22px', background: '#FFFFFF', border: '1px solid #E0E7E4', padding: '28px', textAlign: 'center', boxShadow: '0 18px 44px rgba(15, 23, 42, 0.08)' }}>
        <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.08em', color: '#0E8478' }}>TOSS PAYMENTS</div>
        <h1 style={{ margin: '10px 0 8px', fontSize: '24px', fontWeight: 950, color: '#13231F' }}>구독 처리</h1>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#55706A', lineHeight: 1.6 }}>{message}</p>
        {done && (
          <button
            onClick={() => window.location.assign('/')}
            style={{ marginTop: '22px', width: '100%', height: '48px', border: 'none', borderRadius: '15px', background: '#0E8478', color: '#FFFFFF', fontSize: '14px', fontWeight: 950, cursor: 'pointer' }}
          >
            냉파마스터로 돌아가기
          </button>
        )}
      </section>
    </main>
  );
}
