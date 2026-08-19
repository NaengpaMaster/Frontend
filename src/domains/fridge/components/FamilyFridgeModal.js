import { useEffect, useState } from 'react';
import { Crown, Mail, Trash2, UserPlus, Users, X } from 'lucide-react';
import { fridgeApi } from '@/apis/fridgeApi';
import { C } from '@/shared/data/mockData';

const ROLE_LABELS = {
  OWNER: '소유자',
  MEMBER: '구성원',
};

const MAX_FAMILY_MEMBERS = 4;

export function FamilyFridgeModal({ onClose, subscriptionStatus, currentUser }) {
  const [members, setMembers] = useState([]);
  const [sentInvites, setSentInvites] = useState([]);
  const [receivedInvites, setReceivedInvites] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const currentMemberId = currentUser?.memberId ?? Number(currentUser?.id);
  const isPremiumOwner = Boolean(
    subscriptionStatus?.premium
      && subscriptionStatus?.memberId
      && currentMemberId
      && Number(subscriptionStatus.memberId) === Number(currentMemberId)
  );
  const activeMemberCount = members.length;
  const pendingInviteCount = sentInvites.length;
  const reservedMemberCount = Math.min(MAX_FAMILY_MEMBERS, activeMemberCount + pendingInviteCount);
  const remainingInviteCount = Math.max(0, MAX_FAMILY_MEMBERS - reservedMemberCount);
  const isFamilyFull = reservedMemberCount >= MAX_FAMILY_MEMBERS;
  const inviteEmail = email.trim();
  const canInvite = Boolean(inviteEmail) && !saving && !isFamilyFull;
  const capacityMessage = isFamilyFull
    ? '최대 인원에 도달했어요.'
    : `${remainingInviteCount}명까지 추가로 초대할 수 있어요.`;

  async function loadMembers() {
    setLoading(true);
    setError('');
    try {
      const [memberResult, sentInviteResult, receivedInviteResult] = await Promise.allSettled([
        fridgeApi.getMembers(),
        fridgeApi.getSentInvites(),
        fridgeApi.getReceivedInvites(),
      ]);
      setMembers(memberResult.status === 'fulfilled' ? memberResult.value || [] : []);
      setSentInvites(sentInviteResult.status === 'fulfilled' ? sentInviteResult.value || [] : []);
      setReceivedInvites(receivedInviteResult.status === 'fulfilled' ? receivedInviteResult.value || [] : []);

      if (memberResult.status === 'rejected' && receivedInviteResult.status === 'rejected') {
        throw memberResult.reason;
      }
    } catch (err) {
      setError(err.message || '가족 구성원을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function handleInvite() {
    const trimmedEmail = email.trim();
    if (isFamilyFull) {
      setError('가족 공유 냉장고는 본인 포함 최대 4명까지 사용할 수 있습니다.');
      return;
    }

    if (!trimmedEmail) {
      setError('초대할 이메일을 입력해주세요.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await fridgeApi.inviteMember(trimmedEmail);
      setEmail('');
      await loadMembers();
    } catch (err) {
      setError(err.message || '가족 구성원 추가에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAcceptInvite(invite) {
    setSaving(true);
    setError('');
    try {
      await fridgeApi.acceptInvite(invite.fridgeInviteId);
      await loadMembers();
    } catch (err) {
      setError(err.message || '가족 공유 신청 수락에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRejectInvite(invite) {
    setSaving(true);
    setError('');
    try {
      await fridgeApi.rejectInvite(invite.fridgeInviteId);
      await loadMembers();
    } catch (err) {
      setError(err.message || '가족 공유 신청 거절에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(member) {
    if (member.role === 'OWNER') return;
    if (!window.confirm(`${member.nickname || member.email}님을 가족 냉장고에서 제거할까요?`)) return;

    setSaving(true);
    setError('');
    try {
      await fridgeApi.removeMember(member.memberId);
      await loadMembers();
    } catch (err) {
      setError(err.message || '가족 구성원 제거에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.42)', zIndex: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px' }}>
      <div style={{ width: '100%', maxWidth: '520px', maxHeight: '86vh', background: C.bg, borderRadius: '26px', overflow: 'hidden', boxShadow: '0 24px 70px rgba(17,32,29,0.24)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px', background: C.card, borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '16px', background: C.primaryLight, color: C.primary, display: 'grid', placeItems: 'center' }}>
              <Users size={21} />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 950, color: C.fg }}>가족 공유 냉장고</div>
              <div style={{ fontSize: '12px', color: C.fgMuted, marginTop: '3px' }}>프리미엄 구독자만 가족공유를 관리할 수 있어요.</div>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: C.fgMuted, cursor: 'pointer', padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '18px', overflowY: 'auto' }}>
          {isPremiumOwner && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: C.fg }}>가족 공유 신청</div>
                <div style={{ padding: '5px 8px', borderRadius: '999px', background: isFamilyFull ? C.dangerLight : C.primaryLight, color: isFamilyFull ? C.danger : C.primary, fontSize: '11px', fontWeight: 900 }}>
                  가족 구성원 {activeMemberCount}/{MAX_FAMILY_MEMBERS}명
                </div>
              </div>
              <div style={{ marginBottom: '10px', padding: '10px 12px', borderRadius: '14px', background: isFamilyFull ? C.dangerLight : C.surface, color: isFamilyFull ? C.danger : C.fgMuted, fontSize: '12px', fontWeight: 800, lineHeight: 1.45 }}>
                {capacityMessage}{pendingInviteCount > 0 && !isFamilyFull ? ` 신청 대기 ${pendingInviteCount}명은 초대 가능 인원에 포함돼요.` : ''}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.fgMuted }} />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && canInvite && handleInvite()}
                    disabled={isFamilyFull}
                    placeholder={isFamilyFull ? '최대 인원에 도달했어요' : '가족 이메일 입력'}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px 11px 34px', border: `1px solid ${C.border}`, borderRadius: '14px', background: C.surface, color: C.fg, outline: 'none', fontSize: '13px' }}
                  />
                </div>
                <button
                  onClick={handleInvite}
                  type="button"
                  disabled={!canInvite}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 14px', border: 'none', borderRadius: '14px', background: canInvite ? C.primary : C.surface, color: canInvite ? '#FFFFFF' : C.fgMuted, fontSize: '13px', fontWeight: 900, cursor: saving ? 'wait' : !canInvite ? 'not-allowed' : 'pointer' }}
                >
                  <UserPlus size={15} />
                  신청
                </button>
              </div>
              {error && <div style={{ marginTop: '9px', fontSize: '12px', color: C.danger, fontWeight: 700 }}>{error}</div>}
            </div>
          )}

          {!isPremiumOwner && error && <div style={{ marginBottom: '14px', fontSize: '12px', color: C.danger, fontWeight: 700 }}>{error}</div>}

          {receivedInvites.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.primary}`, borderRadius: '20px', overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{ padding: '14px', borderBottom: `1px solid ${C.border}`, fontSize: '13px', fontWeight: 900, color: C.primary }}>받은 가족 공유 신청</div>
              {receivedInvites.map((invite) => (
                <div key={invite.fridgeInviteId} style={{ padding: '13px 14px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: C.fg }}>{invite.inviterNickname || invite.inviterEmail}</div>
                    <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '4px' }}>{invite.inviterEmail}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => handleAcceptInvite(invite)} disabled={saving} style={{ padding: '8px 10px', border: 'none', borderRadius: '12px', background: C.primary, color: '#FFFFFF', fontSize: '11px', fontWeight: 900, cursor: saving ? 'wait' : 'pointer' }}>수락</button>
                    <button onClick={() => handleRejectInvite(invite)} disabled={saving} style={{ padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: '12px', background: C.surface, color: C.fgMuted, fontSize: '11px', fontWeight: 900, cursor: saving ? 'wait' : 'pointer' }}>거절</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isPremiumOwner && sentInvites.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{ padding: '14px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: C.fg }}>신청 대기</div>
                <div style={{ fontSize: '11px', color: C.fgMuted, fontWeight: 800 }}>{sentInvites.length}건</div>
              </div>
              {sentInvites.map((invite) => (
                <div key={invite.fridgeInviteId} style={{ padding: '12px 14px', borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: C.fg }}>{invite.inviteeNickname || invite.inviteeEmail}</div>
                  <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '4px' }}>{invite.inviteeEmail} · 수락 대기 중</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', overflow: 'hidden' }}>
            <div style={{ padding: '14px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, color: C.fg }}>구성원</div>
              <div style={{ fontSize: '11px', color: isFamilyFull ? C.danger : C.fgMuted, fontWeight: 800 }}>{activeMemberCount}/{MAX_FAMILY_MEMBERS}명</div>
            </div>
            {loading ? (
              <div style={{ padding: '22px', textAlign: 'center', color: C.fgMuted, fontSize: '13px' }}>구성원을 불러오는 중...</div>
            ) : members.length === 0 ? (
              <div style={{ padding: '22px', textAlign: 'center', color: C.fgMuted, fontSize: '13px' }}>아직 구성원이 없습니다.</div>
            ) : (
              members.map((member) => (
                <div key={member.fridgeMemberId} style={{ padding: '13px 14px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: C.fg }}>{member.nickname || '이름 없음'}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 7px', borderRadius: '999px', background: member.role === 'OWNER' ? C.primaryLight : C.surface, color: member.role === 'OWNER' ? C.primary : C.fgMuted, fontSize: '10px', fontWeight: 900 }}>
                        {member.role === 'OWNER' && <Crown size={10} />}
                        {ROLE_LABELS[member.role] || member.role}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</div>
                  </div>
                  {isPremiumOwner && member.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRemove(member)}
                      disabled={saving}
                      style={{ width: '32px', height: '32px', border: `1px solid ${C.border}`, borderRadius: '12px', background: C.surface, color: C.danger, display: 'grid', placeItems: 'center', cursor: saving ? 'wait' : 'pointer', flexShrink: 0 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
