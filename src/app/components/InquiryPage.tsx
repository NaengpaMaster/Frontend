import { useState } from 'react';
import { CheckCircle, Clock, MessageSquare, Plus, Edit2, Trash2 } from 'lucide-react';
import { C, Inquiry, User } from '../data/mockData';

interface InquiryPageProps {
  inquiries: Inquiry[];
  currentUser: User;
  onAddInquiry: (subject: string, content: string) => void;
  onUpdateInquiry: (id: string, subject: string, content: string) => void;
  onDeleteInquiry: (id: string) => void;
}

export function InquiryPage({ inquiries, currentUser, onAddInquiry, onUpdateInquiry, onDeleteInquiry }: InquiryPageProps) {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editContent, setEditContent] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const myInquiries = inquiries.filter((inq) => inq.userId === currentUser.id);

  const submit = () => {
    if (!subject.trim() || !content.trim()) return;
    onAddInquiry(subject.trim(), content.trim());
    setSubject('');
    setContent('');
  };

  const startEdit = (inq: Inquiry) => {
    setEditingId(inq.id);
    setEditSubject(inq.subject);
    setEditContent(inq.content);
  };

  const saveEdit = () => {
    if (!editingId || !editSubject.trim() || !editContent.trim()) return;
    onUpdateInquiry(editingId, editSubject.trim(), editContent.trim());
    setEditingId(null);
  };

  const status = (inq: Inquiry) => {
    if (inq.status === 'answered') return { label: '답변완료', Icon: CheckCircle, color: C.primary, bg: C.primaryLight };
    return { label: '미답변', Icon: Clock, color: C.accent, bg: C.accentLight };
  };

  const inputStyle = {
    width: '100%',
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: '14px',
    padding: '10px 12px',
    color: C.fg,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: C.bg }}>
      <div style={{ padding: '20px', background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.1em', fontWeight: 700, marginBottom: '2px' }}>INQUIRY</div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: C.fg, margin: 0, letterSpacing: '-0.02em' }}>문의하기</h1>
        <div style={{ fontSize: '12px', color: C.fgMuted, marginTop: '5px' }}>서비스 이용 중 필요한 내용을 관리자에게 남겨요.</div>
      </div>

      <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: C.card, borderRadius: '16px', padding: '16px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: C.fg, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={15} color={C.primary} /> 새 문의 작성
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input style={inputStyle} placeholder="제목" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <textarea
              style={{ ...inputStyle, minHeight: '90px', resize: 'none' } as React.CSSProperties}
              placeholder="문의 내용을 입력하세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <button
              onClick={submit}
              disabled={!subject.trim() || !content.trim()}
              style={{
                width: '100%',
                padding: '12px',
                background: subject.trim() && content.trim() ? C.primary : C.surface,
                color: subject.trim() && content.trim() ? '#FFF' : C.fgMuted,
                border: 'none',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '14px',
                cursor: subject.trim() && content.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              문의 등록
            </button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: C.fgMuted, marginBottom: '10px' }}>내 문의 내역</div>
          {myInquiries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '42px 20px', background: C.card, borderRadius: '16px', color: C.fgMuted, boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
              <MessageSquare size={34} style={{ margin: '0 auto 10px', opacity: 0.25 }} />
              <div style={{ fontSize: '14px', fontWeight: 700 }}>등록된 문의가 없어요</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myInquiries.map((inq) => {
                const s = status(inq);
                const isEditing = editingId === inq.id;
                const isDeleteConfirm = deleteConfirmId === inq.id;
                return (
                  <div key={inq.id} style={{ background: C.card, borderRadius: '16px', padding: '14px 16px', boxShadow: '0 2px 10px rgba(17,32,29,0.08)' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                          style={{ ...inputStyle, borderRadius: '10px' }}
                          value={editSubject}
                          onChange={(e) => setEditSubject(e.target.value)}
                          placeholder="제목"
                        />
                        <textarea
                          style={{ ...inputStyle, borderRadius: '10px', minHeight: '80px', resize: 'none' } as React.CSSProperties}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="내용"
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={saveEdit}
                            disabled={!editSubject.trim() || !editContent.trim()}
                            style={{ flex: 2, padding: '9px', background: C.primary, color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{ flex: 1, padding: '9px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', color: C.fgMuted, fontSize: '13px', cursor: 'pointer' }}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: C.fg }}>{inq.subject}</div>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '20px', background: s.bg, color: s.color, fontSize: '10px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                            <s.Icon size={12} /> {s.label}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: C.fgMuted, lineHeight: 1.6 }}>{inq.content}</div>
                        {inq.answer && (
                          <div style={{ marginTop: '10px', padding: '10px 12px', background: C.primaryLight, borderRadius: '14px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: C.primary, marginBottom: '4px' }}>관리자 답변</div>
                            <div style={{ fontSize: '12px', color: C.fg, lineHeight: 1.6 }}>{inq.answer}</div>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                          <div style={{ fontSize: '10px', color: C.fgSubtle }}>{inq.createdAt}</div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {inq.status === 'pending' && (
                              <button
                                onClick={() => startEdit(inq)}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 9px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.fgMuted, fontSize: '11px', cursor: 'pointer' }}
                              >
                                <Edit2 size={11} /> 수정
                              </button>
                            )}
                            {isDeleteConfirm ? (
                              <>
                                <button onClick={() => { onDeleteInquiry(inq.id); setDeleteConfirmId(null); }} style={{ padding: '4px 9px', background: C.dangerLight, border: 'none', borderRadius: '8px', color: C.danger, fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>삭제 확인</button>
                                <button onClick={() => setDeleteConfirmId(null)} style={{ padding: '4px 8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.fgMuted, fontSize: '11px', cursor: 'pointer' }}>취소</button>
                              </>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(inq.id)}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 9px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '8px', color: C.fgMuted, fontSize: '11px', cursor: 'pointer' }}
                              >
                                <Trash2 size={11} /> 삭제
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
