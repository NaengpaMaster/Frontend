import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/apis/authApi';
import { C } from '@/shared/data/mockData';
import { Logo } from '@/shared/components/Logo';

const HOUSEHOLD_TYPES = ['1인', '2인', '3인 이상', '기타'];
const NICKNAME_PATTERN = /^[가-힣A-Za-z0-9 ]+$/;
const INVALID_NICKNAME_MESSAGE = '닉네임은 한글, 영문, 숫자, 공백만 사용할 수 있습니다.';

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

const socialButtonBaseStyle = {
  width: '100%',
  minHeight: '44px',
  borderRadius: '12px',
  border: 'none',
  fontSize: '13px',
  fontWeight: 900,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '9px',
};

const socialLogoStyle = {
  width: '22px',
  height: '22px',
  borderRadius: '8px',
  display: 'grid',
  placeItems: 'center',
  fontSize: '13px',
  fontWeight: 950,
  flexShrink: 0,
};

function SocialLoginButtons({ context }) {
  const handleOAuthStart = (provider) => {
    if (typeof window === 'undefined') return;
    window.location.href = `/oauth2/authorization/${provider}`;
  };

  return (
    <div style={{ display: 'grid', gap: '9px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: C.fgMuted, fontSize: '11px', fontWeight: 800 }}>
        <span style={{ flex: 1, height: '1px', background: C.border }} />
        {context === 'signup' ? '소셜 계정으로 간편 회원가입' : '소셜 계정으로 간편 로그인'}
        <span style={{ flex: 1, height: '1px', background: C.border }} />
      </div>
      <button
        type="button"
        onClick={() => handleOAuthStart('kakao')}
        style={{ ...socialButtonBaseStyle, background: '#FEE500', color: '#191919' }}
      >
        <span style={{ ...socialLogoStyle, background: '#191919', color: '#FEE500' }}>K</span>
        카카오로 {context === 'signup' ? '회원가입' : '로그인'}
      </button>
      <button
        type="button"
        onClick={() => handleOAuthStart('naver')}
        style={{ ...socialButtonBaseStyle, background: '#03C75A', color: '#FFFFFF' }}
      >
        <span style={{ ...socialLogoStyle, background: '#FFFFFF', color: '#03C75A' }}>N</span>
        네이버로 {context === 'signup' ? '회원가입' : '로그인'}
      </button>
    </div>
  );
}

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
  const [householdType, setHouseholdType] = useState('');

  const oauthParams = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search);
  const oauthSignupToken = oauthParams?.get('oauthSignupToken') || oauthParams?.get('signupToken') || '';
  const oauthProvider = oauthParams?.get('provider') || '소셜';
  const oauthProviderEmail = oauthParams?.get('providerEmail') || '';
  const oauthError = oauthParams?.get('oauthError') || '';
  const oauthErrorMessage = oauthParams?.get('oauthErrorMessage') || '';
  const isOAuthEmailCompletion = Boolean(oauthSignupToken);
  const [oauthEmail, setOauthEmail] = useState(oauthProviderEmail);
  const [oauthNickname, setOauthNickname] = useState('');
  const [oauthHouseholdType, setOauthHouseholdType] = useState('');
  const [oauthVerificationSent, setOauthVerificationSent] = useState(false);
  const [oauthEmailVerified, setOauthEmailVerified] = useState(false);
  const [oauthVerificationCode, setOauthVerificationCode] = useState('');

  useEffect(() => {
    if (!oauthError) return;

    const fallbackMessages = {
      cancelled: '소셜 로그인이 취소되었습니다.',
      duplicate: '이미 연동된 소셜 계정입니다.',
      inactive: '탈퇴 또는 비활성 처리된 회원입니다. 관리자에게 문의해주세요.',
      failed: '소셜 로그인 중 오류가 발생했습니다. 다시 시도해주세요.',
    };
    setError(oauthErrorMessage || fallbackMessages[oauthError] || fallbackMessages.failed);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.delete('oauthError');
      params.delete('oauthErrorMessage');
      const nextSearch = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`);
    }
  }, [oauthError, oauthErrorMessage]);

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
    if (signupNickname.trim() && !NICKNAME_PATTERN.test(signupNickname.trim())) {
      setError(INVALID_NICKNAME_MESSAGE);
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

  const handleSendOAuthVerificationCode = async () => {
    setError('');

    if (!oauthEmail.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await authApi.sendOAuth2EmailVerification(oauthEmail.trim());
      setOauthVerificationSent(true);
      setOauthEmailVerified(false);
      setOauthVerificationCode('');
    } catch (err) {
      setOauthVerificationSent(false);
      setOauthEmailVerified(false);
      setOauthVerificationCode('');
      setError(err.message || '인증 코드 발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOAuthVerificationCode = async () => {
    setError('');

    if (!oauthEmail.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    if (!oauthVerificationCode.trim()) {
      setError('인증 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await authApi.confirmEmailVerification(oauthEmail.trim(), oauthVerificationCode.trim());
      setOauthEmailVerified(true);
    } catch (err) {
      setOauthEmailVerified(false);
      setError(err.message || '이메일 인증 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOAuthEmail = async () => {
    setError('');

    if (!oauthEmailVerified) {
      setError('이메일 인증을 먼저 완료해주세요.');
      return;
    }
    if (oauthNickname.trim() && !NICKNAME_PATTERN.test(oauthNickname.trim())) {
      setError(INVALID_NICKNAME_MESSAGE);
      return;
    }

    setLoading(true);
    try {
      await authApi.completeOAuth2Email({
        signupToken: oauthSignupToken,
        email: oauthEmail.trim(),
        nickname: oauthNickname.trim(),
        householdType: oauthHouseholdType,
      });
      const user = await authApi.getMe();
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
      onLogin(user);
    } catch (err) {
      setError(err.message || '소셜 로그인 완료 중 오류가 발생했습니다.');
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
        <div style={{ margin: '0 auto 12px', display: 'flex', justifyContent: 'center' }}>
          <Logo width={230} src="/brand/naengpa-master-logo-vertical.png" />
        </div>
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
        {!isOAuthEmailCompletion && (
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
        )}

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

          {isOAuthEmailCompletion ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: C.fg, marginBottom: '6px' }}>
                  {oauthProvider} 회원가입 마무리
                </div>
                <div style={{ fontSize: '12px', color: C.fgMuted, lineHeight: 1.5 }}>
                  냉파마스터에서 사용할 이메일과 프로필 정보를 입력해주세요.
                </div>
              </div>
              <div>
                <label style={labelStyle}>이메일</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    type="email"
                    placeholder="example@email.com"
                    value={oauthEmail}
                    onChange={(e) => {
                      setOauthEmail(e.target.value);
                      setOauthVerificationSent(false);
                      setOauthEmailVerified(false);
                      setOauthVerificationCode('');
                    }}
                    disabled={oauthEmailVerified}
                  />
                  <button
                    onClick={handleSendOAuthVerificationCode}
                    disabled={loading || oauthEmailVerified}
                    style={{
                      padding: '0 12px',
                      background: oauthEmailVerified ? C.primaryLight : C.surface,
                      border: `1px solid ${oauthEmailVerified ? C.primaryMid : C.border}`,
                      borderRadius: '10px',
                      color: oauthEmailVerified ? C.primary : C.fgMuted,
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: loading || oauthEmailVerified ? 'default' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {oauthEmailVerified ? '인증완료' : oauthVerificationSent ? '재발송' : '인증코드 발송'}
                  </button>
                </div>
              </div>
              {oauthVerificationSent && !oauthEmailVerified && (
                <div>
                  <label style={labelStyle}>인증 코드</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6자리 코드"
                      value={oauthVerificationCode}
                      onChange={(e) => setOauthVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                    <button
                      onClick={handleConfirmOAuthVerificationCode}
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
              {oauthEmailVerified && (
                <div style={{ fontSize: '12px', color: C.primary, fontWeight: 700 }}>
                  이메일 인증이 완료되었습니다.
                </div>
              )}
              <div>
                <label style={labelStyle}>닉네임</label>
                <input
                  style={inputStyle}
                  placeholder="미입력 시 자동 생성"
                  value={oauthNickname}
                  onChange={(e) => setOauthNickname(e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>가구 유형</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {HOUSEHOLD_TYPES.map((item) => (
                    <button
                      key={item}
                      onClick={() => setOauthHouseholdType(item)}
                      type="button"
                      style={{
                        padding: '8px 4px',
                        background: oauthHouseholdType === item ? C.primaryLight : C.surface,
                        border: `1px solid ${oauthHouseholdType === item ? C.primary : C.border}`,
                        borderRadius: '10px',
                        color: oauthHouseholdType === item ? C.primary : C.fgMuted,
                        fontSize: '11px',
                        fontWeight: oauthHouseholdType === item ? 700 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleCompleteOAuthEmail}
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
                {loading ? '처리 중...' : '가입 완료'}
              </button>
            </div>
          ) : tab === 'login' ? (
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

              <SocialLoginButtons context="login" />
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

              <SocialLoginButtons context="signup" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
