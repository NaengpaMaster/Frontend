"use client";

import { useEffect, useState } from 'react';

export default function BillingFailPage() {
  const [message, setMessage] = useState('카드 등록에 실패했습니다.');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMessage(params.get('message') || params.get('code') || '카드 등록에 실패했습니다.');
    window.sessionStorage.removeItem('naengpa.subscription.mode');
    window.sessionStorage.removeItem('naengpa.subscription.planType');
  }, []);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F6F8F7', padding: '24px' }}>
      <section style={{ width: '100%', maxWidth: '420px', borderRadius: '22px', background: '#FFFFFF', border: '1px solid #F3D5DA', padding: '28px', textAlign: 'center', boxShadow: '0 18px 44px rgba(15, 23, 42, 0.08)' }}>
        <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.08em', color: '#C2414B' }}>TOSS PAYMENTS</div>
        <h1 style={{ margin: '10px 0 8px', fontSize: '24px', fontWeight: 950, color: '#13231F' }}>카드 등록 실패</h1>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#7B5A5F', lineHeight: 1.6 }}>{message}</p>
        <button
          onClick={() => window.location.assign('/')}
          style={{ marginTop: '22px', width: '100%', height: '48px', border: 'none', borderRadius: '15px', background: '#0E8478', color: '#FFFFFF', fontSize: '14px', fontWeight: 950, cursor: 'pointer' }}
        >
          냉파마스터로 돌아가기
        </button>
      </section>
    </main>
  );
}
