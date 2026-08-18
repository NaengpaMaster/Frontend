import { useEffect, useRef, useState } from 'react';
import { Bot, Send, X } from 'lucide-react';
import { inquiryChatApi } from '@/apis/inquiriesApi';
import { C } from '@/shared/data/mockData';

export function InquiryChatModal({ onClose, onOpenInquiry }) {
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesListRef = useRef(null);

  useEffect(() => {
    const list = messagesListRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, sending]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || sending) return;

    setInput('');
    setError('');
    setMessages((current) => [...current, { role: 'USER', content: question }]);
    setSending(true);
    try {
      const response = await inquiryChatApi.sendMessage(sessionId, question);
      setSessionId(response.conversationSessionId);
      setMessages((current) => [...current, {
        role: 'ASSISTANT',
        content: response.answer,
        answerable: response.answerable,
      }]);
    } catch (err) {
      setError(err.message || 'AI 답변을 불러오지 못했습니다.');
    } finally {
      setSending(false);
    }
  };

  const openInquiry = () => {
    const lastQuestion = [...messages].reverse().find((message) => message.role === 'USER')?.content ?? '';
    onOpenInquiry?.(lastQuestion);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="문의 AI 챗봇"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(17, 32, 29, 0.42)' }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{ width: '100%', maxWidth: '430px', height: 'min(620px, 82vh)', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '18px', background: C.card, boxShadow: '0 20px 60px rgba(17, 32, 29, 0.24)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <span style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: C.primaryLight, color: C.primary }}><Bot size={18} /></span>
            <div><div style={{ fontSize: '14px', fontWeight: 900, color: C.fg }}>냉파마스터 AI</div><div style={{ marginTop: '2px', fontSize: '10px', color: C.fgMuted }}>서비스 이용 방법을 물어보세요.</div></div>
          </div>
          <button type="button" aria-label="챗봇 닫기" onClick={onClose} style={{ padding: '5px', border: 'none', background: 'transparent', color: C.fgMuted, cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div ref={messagesListRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', background: C.bg }}>
          {messages.length === 0 && (
            <div style={{ alignSelf: 'flex-start', maxWidth: '82%', padding: '11px 13px', borderRadius: '4px 14px 14px', background: C.card, color: C.fg, fontSize: '13px', lineHeight: 1.55, boxShadow: '0 1px 4px rgba(17,32,29,0.07)' }}>
              안녕하세요. 냉장고, 재료, 레시피, 장보기 등 서비스 이용 방법을 안내해 드릴게요.
            </div>
          )}
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} style={{ alignSelf: message.role === 'USER' ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
              <div style={{ padding: '10px 12px', borderRadius: message.role === 'USER' ? '14px 4px 14px 14px' : '4px 14px 14px', background: message.role === 'USER' ? C.primary : C.card, color: message.role === 'USER' ? '#FFF' : C.fg, fontSize: '13px', lineHeight: 1.55, boxShadow: '0 1px 4px rgba(17,32,29,0.07)' }}>{message.content}</div>
              {message.role === 'ASSISTANT' && message.answerable === false && onOpenInquiry && (
                <button type="button" onClick={openInquiry} style={{ marginTop: '7px', padding: '8px 10px', border: 'none', borderRadius: '10px', background: C.primaryLight, color: C.primary, fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                  관리자에게 문의하기
                </button>
              )}
            </div>
          ))}
          {sending && <div style={{ alignSelf: 'flex-start', padding: '10px 12px', borderRadius: '4px 14px 14px', background: C.card, color: C.fgMuted, fontSize: '12px' }}>답변을 확인하고 있어요…</div>}
          {error && <div style={{ padding: '9px 11px', borderRadius: '10px', background: C.dangerLight, color: C.danger, fontSize: '11px', fontWeight: 700 }}>{error}</div>}
        </div>

        <div style={{ display: 'flex', gap: '8px', padding: '12px', borderTop: `1px solid ${C.border}`, background: C.card }}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) sendMessage(); }}
            placeholder="궁금한 내용을 입력하세요"
            maxLength={2000}
            style={{ flex: 1, minWidth: 0, padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: '12px', background: C.surface, color: C.fg, fontSize: '13px', outline: 'none' }}
          />
          <button type="button" aria-label="질문 보내기" onClick={sendMessage} disabled={!input.trim() || sending} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '11px', background: input.trim() && !sending ? C.primary : C.surface, color: input.trim() && !sending ? '#FFF' : C.fgSubtle, cursor: input.trim() && !sending ? 'pointer' : 'not-allowed' }}><Send size={16} /></button>
        </div>
      </div>
    </div>
  );
}
