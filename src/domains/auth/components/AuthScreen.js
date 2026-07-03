import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/apis/authApi';
import { C } from '@/shared/data/mockData';
import { Logo } from '@/shared/components/Logo';

const HOUSEHOLD_TYPES = ['1인', '2인', '3인 이상', '기타'];

const inputStyle = {
  width: '100%',
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: '10px',
  padding: '12px 14px',
  color: C.fg,
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: '12px',
  fontWeight: 700,
  color: C.fgMuted,
  display: 'block',
  marginBottom: '6px',
  letterSpacing: '0.04em',
};

export function AuthScreen({ onLogin }) {
  const [tab, setTab] = useState('login');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');

  const [signupEmail, setSignupEmail] = useState('');
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [signupNickname, setSignupNickname] = useState('');
  const [signupPw, setSignupPw] = useState('');
  const [signupPwConfirm, setSignupPwConfirm] = useState('');
  const [householdType, setHouseholdType] = useState('1인');

  const handleLogin = async () => {
    setError('');

    if (!loginEmail.trim()) {
      setError('이메일은 공백일 수 없습니다.');
      return;
    }
    if (!loginPw) {
      setError('비밀번호는 공백일 수 없습니다.');
      return;
    }

    setLoading(true);

    try {
      await authApi.login(loginEmail.trim(), loginPw);
      const user = await authApi.getMe();
      onLogin(user);
    } catch (err) {
      setError(err.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setError('');

    if (!signupEmail.trim() || !signupPw) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (!emailVerified) {
      setError('이메일 인증을 먼저 완료해주세요.');
      return;
    }
    if (signupPw !== signupPwConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const user = await authApi.register({
        email: signupEmail.trim(),
        password: signupPw,
        passwordConfirm: signupPwConfirm,
        nickname: signupNickname.trim(),
        householdType,
      });
      await authApi.login(signupEmail.trim(), signupPw);
      onLogin(user);
    } catch (err) {
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const resetEmailVerification = () => {
    setEmailVerificationSent(false);
    setEmailVerified(false);
    setVerificationCode('');
  };

  const handleSendVerificationCode = async () => {
    setError('');

    if (!signupEmail.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await authApi.sendEmailVerification(signupEmail.trim());
      setEmailVerificationSent(true);
      setEmailVerified(false);
      setVerificationCode('');
    } catch (err) {
      resetEmailVerification();
      setError(err.message || '인증 코드 발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVerificationCode = async () => {
    setError('');

    if (!signupEmail.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    if (!verificationCode.trim()) {
      setError('인증 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await authApi.confirmEmailVerification(signupEmail.trim(), verificationCode.trim());
      setEmailVerified(true);
    } catch (err) {
      setEmailVerified(false);
      setError(err.message || '이메일 인증 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        background: C.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ margin: '0 auto 12px', width: '64px', height: '64px' }}>
          <Logo size={64} />
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: C.fg }}>냉파 마스터</div>
        <div style={{ fontSize: '13px', color: C.fgMuted, marginTop: '4px' }}>
          냉장고 식재료 관리와 레시피 추천
        </div>
      </div>

      <div
        style={{
          background: C.card,
          borderRadius: '18px',
          boxShadow: '0 8px 32px rgba(17,32,29,0.08)',
          width: '100%',
          maxWidth: '400px',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${C.border}` }}>
          {['login', 'signup'].map((item) => (
            <button
              key={item}
              onClick={() => {
                setTab(item);
                setError('');
              }}
              style={{
                padding: '14px',
                background: tab === item ? C.card : C.surface,
                border: 'none',
                borderBottom: tab === item ? `2px solid ${C.primary}` : '2px solid transparent',
                color: tab === item ? C.primary : C.fgMuted,
                fontWeight: tab === item ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {item === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px 24px 28px' }}>
          {error && (
            <div
              style={{
                background: C.dangerLight,
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                color: C.danger,
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>이메일</label>
                <input
                  style={inputStyle}
                  type="email"
                  placeholder="example@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div>
                <label style={labelStyle}>비밀번호</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={inputStyle}
                    type={showPw ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    value={loginPw}
                    onChange={(e) => setLoginPw(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: C.fgMuted,
                    }}
                    type="button"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading ? C.fgSubtle : C.primary,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: loading ? 'default' : 'pointer',
                  marginTop: '4px',
                }}
              >
                {loading ? '처리 중...' : '로그인'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>이메일</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    type="email"
                    placeholder="example@email.com"
                    value={signupEmail}
                    onChange={(e) => {
                      setSignupEmail(e.target.value);
                      resetEmailVerification();
                    }}
                    disabled={emailVerified}
                  />
                  <button
                    onClick={handleSendVerificationCode}
                    disabled={loading || emailVerified}
                    style={{
                      padding: '0 12px',
                      background: emailVerified ? C.primaryLight : C.surface,
                      border: `1px solid ${emailVerified ? C.primaryMid : C.border}`,
                      borderRadius: '10px',
                      color: emailVerified ? C.primary : C.fgMuted,
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: loading || emailVerified ? 'default' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {emailVerified ? '인증완료' : emailVerificationSent ? '재발송' : '인증코드 발송'}
                  </button>
                </div>
              </div>
              {emailVerificationSent && !emailVerified && (
                <div>
                  <label style={labelStyle}>인증 코드</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6자리 코드"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                    <button
                      onClick={handleConfirmVerificationCode}
                      disabled={loading}
                      style={{
                        padding: '0 12px',
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: '10px',
                        color: C.fgMuted,
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: loading ? 'default' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      인증 확인
                    </button>
                  </div>
                </div>
              )}
              {emailVerified && (
                <div style={{ fontSize: '12px', color: C.primary, fontWeight: 700 }}>
                  이메일 인증이 완료되었습니다.
                </div>
              )}
              <div>
                <label style={labelStyle}>닉네임</label>
                <input
                  style={inputStyle}
                  placeholder="미입력 시 자동 생성"
                  value={signupNickname}
                  onChange={(e) => setSignupNickname(e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>비밀번호</label>
                <input
                  style={inputStyle}
                  type="password"
                  placeholder="영문 소문자와 특수문자 포함 8~15자"
                  value={signupPw}
                  onChange={(e) => setSignupPw(e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>비밀번호 확인</label>
                <input
                  style={inputStyle}
                  type="password"
                  placeholder="비밀번호 재입력"
                  value={signupPwConfirm}
                  onChange={(e) => setSignupPwConfirm(e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>가구 유형</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {HOUSEHOLD_TYPES.map((item) => (
                    <button
                      key={item}
                      onClick={() => setHouseholdType(item)}
                      type="button"
                      style={{
                        padding: '8px 4px',
                        background: householdType === item ? C.primaryLight : C.surface,
                        border: `1px solid ${householdType === item ? C.primary : C.border}`,
                        borderRadius: '10px',
                        color: householdType === item ? C.primary : C.fgMuted,
                        fontSize: '11px',
                        fontWeight: householdType === item ? 700 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSignup}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading ? C.fgSubtle : C.primary,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: loading ? 'default' : 'pointer',
                  marginTop: '4px',
                }}
              >
                {loading ? '처리 중...' : '회원가입'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
