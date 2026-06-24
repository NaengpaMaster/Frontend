import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { mockUsers, C } from '@/shared/data/mockData';
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
  transition: 'border-color 0.15s',
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

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');

  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [emailChecked, setEmailChecked] = useState(false);
  const [signupPw, setSignupPw] = useState('');
  const [signupPwConfirm, setSignupPwConfirm] = useState('');
  const [householdType, setHouseholdType] = useState('1인');

  const handleLogin = () => {
    setError('');
    const user = mockUsers.find((u) => u.email === loginEmail && u.password === loginPw);
    if (!user) { setError('이메일 또는 비밀번호가 일치하지 않습니다.'); return; }
    if (user.status === 'inactive') { setError('탈퇴 처리된 계정입니다. 관리자에게 문의하세요.'); return; }
    onLogin(user);
  };

  const handleDemoLogin = (role) => {
    const user = mockUsers.find((u) => u.role === role);
    onLogin(user);
  };

  const handleSignup = () => {
    setError('');
    if (!signupEmail || !signupPw) { setError('이메일과 비밀번호를 입력해주세요.'); return; }
    if (!emailChecked) { setError('이메일 중복검사를 먼저 진행해주세요.'); return; }
    if (signupPw !== signupPwConfirm) { setError('비밀번호가 일치하지 않습니다.'); return; }
    if (mockUsers.find((u) => u.email === signupEmail)) { setError('이미 사용 중인 이메일입니다.'); return; }
    const nickname = `냉파러${Math.floor(1000 + Math.random() * 9000)}`;
    const newUser = {
      id: `u_${Date.now()}`,
      name: nickname,
      email: signupEmail,
      password: signupPw,
      role: 'user',
      householdType,
      preferences: { favoriteFoods: [], allergies: [], avoidIngredients: [] },
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
    };
    onLogin(newUser);
  };

  const handleEmailCheck = () => {
    setError('');
    if (!signupEmail.trim()) { setError('이메일을 입력해주세요.'); return; }
    if (mockUsers.some((u) => u.email === signupEmail.trim())) {
      setEmailChecked(false);
      setError('이미 사용 중인 이메일입니다.');
      return;
    }
    setEmailChecked(true);
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
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ margin: '0 auto 12px', width: '64px', height: '64px' }}>
          <Logo size={64} />
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: C.fg, letterSpacing: '-0.02em' }}>냉파 마스터</div>
        <div style={{ fontSize: '13px', color: C.fgMuted, marginTop: '4px' }}>냉장고 식재료 관리 & 레시피 추천</div>
      </div>

      {/* Card */}
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
        {/* Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${C.border}` }}>
          {(['login', 'signup']).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              style={{
                padding: '14px',
                background: tab === t ? C.card : C.surface,
                border: 'none',
                borderBottom: tab === t ? `2px solid ${C.primary}` : '2px solid transparent',
                color: tab === t ? C.primary : C.fgMuted,
                fontWeight: tab === t ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t === 'login' ? '로그인' : '회원가입'}
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
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.fgMuted }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: C.primary,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  marginTop: '4px',
                }}
              >
                로그인
              </button>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={() => handleDemoLogin('user')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: '14px',
                    color: C.fgMuted,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  데모 사용자
                </button>
                <button
                  onClick={() => handleDemoLogin('admin')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: '14px',
                    color: C.fgMuted,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  관리자 데모
                </button>
              </div>

              <div style={{ fontSize: '11px', color: C.fgSubtle, textAlign: 'center', marginTop: '4px' }}>
                테스트: user@test.com / 1234 &nbsp;|&nbsp; admin@test.com / admin
              </div>
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
                    onChange={(e) => { setSignupEmail(e.target.value); setEmailChecked(false); }}
                  />
                  <button
                    onClick={handleEmailCheck}
                    style={{
                      padding: '0 12px',
                      background: emailChecked ? C.primaryLight : C.surface,
                      border: `1px solid ${emailChecked ? C.primaryMid : C.border}`,
                      borderRadius: '10px',
                      color: emailChecked ? C.primary : C.fgMuted,
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {emailChecked ? '확인완료' : '중복검사'}
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: C.fgSubtle, marginTop: '5px' }}>가입 후 닉네임은 자동으로 랜덤 배정됩니다.</div>
              </div>
              <div>
                <label style={labelStyle}>비밀번호</label>
                <input style={inputStyle} type="password" placeholder="비밀번호" value={signupPw} onChange={(e) => setSignupPw(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>비밀번호 확인</label>
                <input style={inputStyle} type="password" placeholder="비밀번호 재입력" value={signupPwConfirm} onChange={(e) => setSignupPwConfirm(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>가구 유형</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {HOUSEHOLD_TYPES.map((ht) => (
                    <button
                      key={ht}
                      onClick={() => setHouseholdType(ht)}
                      style={{
                        padding: '8px 4px',
                        background: householdType === ht ? C.primaryLight : C.surface,
                        border: `1px solid ${householdType === ht ? C.primary : C.border}`,
                        borderRadius: '10px',
                        color: householdType === ht ? C.primary : C.fgMuted,
                        fontSize: '11px',
                        fontWeight: householdType === ht ? 700 : 500,
                        cursor: 'pointer',
                      }}
                    >
                      {ht}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSignup}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: C.primary,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  marginTop: '4px',
                }}
              >
                회원가입
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
