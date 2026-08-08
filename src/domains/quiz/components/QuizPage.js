import { Lightbulb } from 'lucide-react';
import { C } from '@/shared/data/mockData';

export function QuizPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: C.bg }}>
      <div style={{ padding: '20px', background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.1em', fontWeight: 700, marginBottom: '2px' }}>QUIZ</div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: C.fg, margin: 0, letterSpacing: '-0.02em' }}>냉파 퀴즈</h1>
        <div style={{ fontSize: '12px', color: C.fgMuted, marginTop: '5px' }}>매일 새로운 냉파 퀴즈를 풀고 점수를 모아보세요.</div>
      </div>

      <div style={{ padding: '16px 20px 24px' }}>
        <div style={{ textAlign: 'center', padding: '42px 20px', background: C.card, borderRadius: '16px', color: C.fgMuted, boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
          <Lightbulb size={34} style={{ margin: '0 auto 10px', opacity: 0.25 }} />
          <div style={{ fontSize: '14px', fontWeight: 700 }}>내용은 API 연결 후 표시됩니다.</div>
        </div>
      </div>
    </div>
  );
}
