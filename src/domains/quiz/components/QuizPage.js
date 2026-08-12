import { useCallback, useEffect, useState } from 'react';
import { Circle, X, CheckCircle2, XCircle, Info, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';
import { C } from '@/shared/data/mockData';
import { quizApi } from '@/apis/quizApi';

function fireQuizConfetti() {
  confetti({
    particleCount: 100,
    spread: 75,
    startVelocity: 45,
    origin: { y: 0.65 },
    colors: [C.primary, C.primaryMid, '#FFD966', C.accent],
    zIndex: 9999,
  });
}

export function QuizPage() {
  const [quizState, setQuizState] = useState({ status: 'loading', data: null, error: null });
  const [solved, setSolved] = useState(false);
  const [alreadySolvedOnLoad, setAlreadySolvedOnLoad] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [result, setResult] = useState(null);
  const [submitState, setSubmitState] = useState({ status: 'idle', error: null });

  const fetchQuiz = useCallback(async () => {
    setQuizState((prev) => ({ ...prev, status: 'loading', error: null }));
    try {
      const data = await quizApi.getTodayQuiz();
      setQuizState({ status: 'ready', data, error: null });
      if (data?.alreadySolved) {
        setSolved(true);
        setAlreadySolvedOnLoad(true);
        setSelectedAnswer(data.submittedAnswer);
        setResult({ isCorrect: data.isCorrect, explanation: data.explanation ?? null, scoreDelta: null });
      } else {
        setSolved(false);
        setAlreadySolvedOnLoad(false);
        setSelectedAnswer(null);
        setResult(null);
      }
    } catch (error) {
      setQuizState({ status: 'error', data: null, error: error.message || '퀴즈를 불러오지 못했어요.' });
    }
  }, []);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const handleSubmit = async (answer) => {
    const quiz = quizState.data;
    if (!quiz || quiz.quizId == null || solved || submitState.status === 'submitting') {
      return;
    }

    setSubmitState({ status: 'submitting', error: null });
    try {
      const res = await quizApi.submitTodayQuiz(quiz.quizId, answer);
      setSelectedAnswer(answer);
      setSolved(true);
      setResult(res);
      setSubmitState({ status: 'idle', error: null });
      if (res?.isCorrect) {
        fireQuizConfetti();
      }
    } catch (error) {
      if (error.status === 409) {
        setSubmitState({ status: 'idle', error: null });
        fetchQuiz();
      } else {
        setSubmitState({ status: 'error', error: error.message || '제출 중 오류가 발생했어요.' });
      }
    }
  };

  const quiz = quizState.data;
  const isSubmitting = submitState.status === 'submitting';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: C.bg }}>
      <div style={{ padding: '20px', background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.1em', fontWeight: 700, marginBottom: '2px' }}>QUIZ</div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: C.fg, margin: 0, letterSpacing: '-0.02em' }}>냉파 퀴즈</h1>
        <div style={{ fontSize: '12px', color: C.fgMuted, marginTop: '5px' }}>매일 새로운 냉파 퀴즈를 풀고 점수를 모아보세요.</div>
      </div>

      <div style={{ padding: '16px 20px 24px' }}>
        {quizState.status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '42px 20px', background: C.card, borderRadius: '16px', color: C.fgMuted, boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>불러오는 중...</div>
          </div>
        )}

        {quizState.status === 'error' && (
          <div style={{ textAlign: 'center', padding: '42px 20px', background: C.card, borderRadius: '16px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: C.danger, marginBottom: '12px' }}>{quizState.error}</div>
            <button
              onClick={fetchQuiz}
              style={{ border: `1px solid ${C.border}`, background: C.surface, color: C.fg, borderRadius: '10px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              다시 시도
            </button>
          </div>
        )}

        {quizState.status === 'ready' && quiz && quiz.quizId == null && (
          <div style={{ textAlign: 'center', padding: '42px 20px', background: C.card, borderRadius: '16px', color: C.fgMuted, boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
            <Lightbulb size={34} style={{ margin: '0 auto 10px', opacity: 0.25 }} />
            <div style={{ fontSize: '14px', fontWeight: 700 }}>오늘의 퀴즈를 준비 중이에요</div>
          </div>
        )}

        {quizState.status === 'ready' && quiz && quiz.quizId != null && (
          <div style={{ background: C.card, borderRadius: '16px', padding: '20px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
            {quiz.sourceProductName && (
              <div
                style={{
                  display: 'inline-block',
                  background: C.primaryLight,
                  color: C.primary,
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '999px',
                  padding: '5px 10px',
                  marginBottom: '12px',
                }}
              >
                🥬 {quiz.sourceProductName}과 관련된 퀴즈예요!
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: C.primary, flexShrink: 0 }}>Q.</span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: C.fg, lineHeight: 1.5 }}>{quiz.statement}</span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <AnswerButton
                type="O"
                selected={solved && selectedAnswer === true}
                dimmed={solved && selectedAnswer !== true}
                disabled={solved || isSubmitting}
                onClick={() => handleSubmit(true)}
              />
              <AnswerButton
                type="X"
                selected={solved && selectedAnswer === false}
                dimmed={solved && selectedAnswer !== false}
                disabled={solved || isSubmitting}
                onClick={() => handleSubmit(false)}
              />
            </div>

            {submitState.status === 'error' && (
              <div style={{ marginTop: '12px', fontSize: '12px', color: C.danger, fontWeight: 700 }}>
                {submitState.error}
              </div>
            )}

            {solved && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${C.border}` }}>
                {alreadySolvedOnLoad && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: C.surface,
                      color: C.fgMuted,
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '999px',
                      padding: '5px 10px',
                      marginBottom: '10px',
                    }}
                  >
                    <CheckCircle2 size={13} />
                    이미 오늘의 퀴즈를 제출하셨습니다.
                  </div>
                )}
                {result && result.isCorrect != null && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: result.isCorrect ? C.primaryLight : C.dangerLight,
                    }}
                  >
                    {result.isCorrect ? (
                      <CheckCircle2 size={18} color={C.primary} style={{ flexShrink: 0 }} />
                    ) : (
                      <XCircle size={18} color={C.danger} style={{ flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: '14px', fontWeight: 800, color: result.isCorrect ? C.primary : C.danger }}>
                      {result.isCorrect ? '정답입니다!' : '아쉽지만 오답이었어요.'}
                    </span>
                    {result.scoreDelta != null && (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: C.fgMuted }}>
                        (+{result.scoreDelta}점)
                      </span>
                    )}
                  </div>
                )}
                {result?.explanation && (
                  <div style={{ marginTop: '10px', fontSize: '13px', color: C.fgMuted, lineHeight: 1.5 }}>
                    {result.explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '11px',
            color: C.fgSubtle,
          }}
        >
          <Info size={12} style={{ flexShrink: 0 }} />
          AI가 일반적인 식품 보관 상식을 기반으로 생성했어요.
        </div>
      </div>
    </div>
  );
}

function AnswerButton({ type, selected, dimmed, disabled, onClick }) {
  const isO = type === 'O';
  const Icon = isO ? Circle : X;
  const activeColor = isO ? C.primary : C.accent;
  const activeBg = isO ? C.primaryLight : C.accentLight;
  const activeShadow = isO ? 'rgba(14,132,120,0.25)' : 'rgba(255,106,77,0.25)';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '22px 0',
        borderRadius: '18px',
        border: `2px solid ${selected ? activeColor : dimmed ? C.border : C.borderStrong}`,
        background: selected ? activeBg : dimmed ? C.surface : C.card,
        boxShadow: selected ? `0 4px 14px ${activeShadow}` : '0 1px 4px rgba(17,32,29,0.06)',
        opacity: dimmed ? 0.55 : 1,
        cursor: disabled ? 'default' : 'pointer',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.18s ease',
      }}
    >
      <Icon size={30} strokeWidth={3} color={selected ? activeColor : dimmed ? C.fgSubtle : C.fg} />
    </button>
  );
}
