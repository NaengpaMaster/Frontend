import { useRef, useState } from 'react';
import { Camera, Check, FileText, Image, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { receiptApi } from '@/apis/receiptApi';
import { compressImageFile } from '@/apis/imageFileUtils';
import { C } from '@/shared/data/mockData';
import { IngredientSearchField } from './IngredientSearchField';

const STATUS_LABELS = {
  PENDING: '대기',
  REGISTERED: '등록',
  REJECTED: '제외',
};

export function ReceiptImportModal({ onClose, onRegistered }) {
  const [file, setFile] = useState(null);
  const [receiptAnalysisId, setReceiptAnalysisId] = useState(null);
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ productId: null, name: '', quantity: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const pendingItems = items.filter((item) => item.status === 'PENDING');

  const inputStyle = {
    width: '100%',
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: '10px',
    padding: '10px 12px',
    color: C.fg,
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const refreshItems = async (id = receiptAnalysisId) => {
    if (!id) return;
    const nextItems = await receiptApi.getItems(id);
    setItems(nextItems || []);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('영수증 이미지를 선택해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('영수증 이미지를 업로드하고 있어요.');

    try {
      // 모바일 촬영 원본은 용량이 커질 수 있어 업로드/OCR 전에 한 번 압축한다.
      const analysisFile = await compressImageFile(file);

      const upload = await receiptApi.uploadImage(analysisFile);
      setReceiptAnalysisId(upload.receiptAnalysisId);

      setMessage('OCR로 영수증을 읽는 중이에요.');
      const ocrResult = await receiptApi.analyzeWithAgent(upload.receiptAnalysisId, analysisFile);

      setMessage('인식된 상품을 사전 재료와 매칭하는 중이에요.');
      const matchedItems = await receiptApi.saveOcrResult(upload.receiptAnalysisId, {
        rawText: ocrResult.rawText,
        items: ocrResult.items || [],
        usage: ocrResult.usage,
      });

      setItems(matchedItems || []);
      setMessage((matchedItems || []).length > 0
        ? '냉장고에 등록할 후보를 확인해주세요.'
        : '사전 재료와 매칭된 후보가 없습니다.');
    } catch (err) {
      setError(err.message || '영수증 분석에 실패했습니다.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.receiptAnalysisItemId);
    setEditForm({
      productId: item.productId,
      name: item.matchedProductName || item.normalizedName || item.extractedName,
      quantity: item.quantity || '1개',
    });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.productId || !editForm.quantity.trim()) {
      setError('재료와 수량을 확인해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await receiptApi.updateItem(editingId, {
        productId: editForm.productId,
        quantity: editForm.quantity.trim(),
      });
      setEditingId(null);
      await refreshItems();
    } catch (err) {
      setError(err.message || '후보 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const rejectItem = async (itemId) => {
    setLoading(true);
    setError('');
    try {
      await receiptApi.rejectItem(itemId);
      await refreshItems();
    } catch (err) {
      setError(err.message || '후보 제외에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const registerItems = async (receiptItemIds) => {
    if (!receiptAnalysisId || receiptItemIds.length === 0) return;

    setLoading(true);
    setError('');
    try {
      await receiptApi.registerToFridge(receiptAnalysisId, receiptItemIds);
      await refreshItems();
      await onRegistered?.();
      setMessage('선택한 후보를 냉장고에 등록했습니다.');
    } catch (err) {
      setError(err.message || '냉장고 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] || null);
    setError('');
    setMessage('');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.4)', zIndex: 150, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          margin: '0 auto',
          background: C.bg,
          borderRadius: '24px 24px 0 0',
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.12em', fontWeight: 800 }}>RECEIPT OCR</div>
            <div style={{ color: C.fg, fontSize: '18px', fontWeight: 900, marginTop: '3px' }}>영수증 등록</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.fgMuted, cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '12px', borderRadius: '16px', background: C.card, border: `1px solid ${C.border}` }}>
            <div style={{ color: C.fgMuted, fontSize: '12px', fontWeight: 800, marginBottom: '9px' }}>
              {file ? file.name : '영수증 사진을 선택해주세요.'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', minHeight: '46px', border: `1px solid ${C.primaryMid}`, borderRadius: '12px', background: C.primaryLight, color: C.primary, fontSize: '13px', fontWeight: 900, cursor: 'pointer' }}
              >
                <Camera size={16} /> 사진 찍기
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', minHeight: '46px', border: `1px solid ${C.border}`, borderRadius: '12px', background: C.surface, color: C.fgMuted, fontSize: '13px', fontWeight: 900, cursor: 'pointer' }}
              >
                <Image size={16} /> 갤러리에서 가져오기
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              style={{
                marginTop: '10px',
                width: '100%',
                border: 'none',
                borderRadius: '12px',
                background: file && !loading ? C.primary : C.surface,
                color: file && !loading ? '#FFFFFF' : C.fgMuted,
                padding: '12px',
                fontSize: '13px',
                fontWeight: 900,
                cursor: file && !loading ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? '처리 중' : '영수증 분석'}
            </button>
          </div>

          {(message || error) && (
            <div style={{ padding: '10px 12px', borderRadius: '12px', background: error ? C.dangerLight : C.primaryLight, color: error ? C.danger : C.primary, fontSize: '12px', fontWeight: 800 }}>
              {loading && <Loader2 size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} />}
              {error || message}
            </div>
          )}

          {items.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: C.fg, fontSize: '13px', fontWeight: 900 }}>등록 후보 {pendingItems.length}개</div>
                <button
                  onClick={() => registerItems(pendingItems.map((item) => item.receiptAnalysisItemId))}
                  disabled={pendingItems.length === 0 || loading}
                  style={{
                    border: 'none',
                    borderRadius: '10px',
                    background: pendingItems.length > 0 ? C.primary : C.surface,
                    color: pendingItems.length > 0 ? '#FFFFFF' : C.fgMuted,
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: 900,
                    cursor: pendingItems.length > 0 ? 'pointer' : 'not-allowed',
                  }}
                >
                  전체 등록
                </button>
              </div>

              {items.map((item) => {
                const pending = item.status === 'PENDING';
                const editing = editingId === item.receiptAnalysisItemId;

                return (
                  <div key={item.receiptAnalysisItemId} style={{ padding: '12px', borderRadius: '14px', background: C.card, border: `1px solid ${C.border}` }}>
                    {editing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <IngredientSearchField
                          value={editForm.name}
                          placeholder="수정할 재료 검색"
                          onSelect={(ingredient) => setEditForm({
                            ...editForm,
                            productId: ingredient.productId,
                            name: ingredient.name,
                          })}
                        />
                        <input
                          style={inputStyle}
                          value={editForm.quantity}
                          onChange={(event) => setEditForm({ ...editForm, quantity: event.target.value })}
                          placeholder="수량"
                        />
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={saveEdit} style={{ flex: 1, border: 'none', borderRadius: '10px', background: C.primary, color: '#FFFFFF', padding: '9px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>
                            저장
                          </button>
                          <button onClick={() => setEditingId(null)} style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: '10px', background: C.surface, color: C.fgMuted, padding: '9px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ color: C.fg, fontSize: '14px', fontWeight: 900 }}>
                              {item.matchedProductName || item.normalizedName || item.extractedName}
                              <span style={{ color: C.fgMuted, fontSize: '11px', marginLeft: '6px' }}>{item.quantity}</span>
                            </div>
                            <div style={{ color: C.fgSubtle, fontSize: '11px', marginTop: '3px' }}>
                              OCR: {item.extractedName} · {STATUS_LABELS[item.status] || item.status}
                            </div>
                            <div style={{ color: C.fgSubtle, fontSize: '11px', marginTop: '2px' }}>
                              유통기한 {item.expiryDate || '기한없음'}
                            </div>
                          </div>
                          <FileText size={18} color={pending ? C.primary : C.fgMuted} />
                        </div>

                        {pending && (
                          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                            <button onClick={() => registerItems([item.receiptAnalysisItemId])} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flex: 1, border: 'none', borderRadius: '10px', background: C.primaryLight, color: C.primary, padding: '8px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>
                              <Check size={13} /> 등록
                            </button>
                            <button onClick={() => startEdit(item)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flex: 1, border: `1px solid ${C.border}`, borderRadius: '10px', background: C.surface, color: C.fgMuted, padding: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                              <Pencil size={13} /> 수정
                            </button>
                            <button onClick={() => rejectItem(item.receiptAnalysisItemId)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flex: 1, border: 'none', borderRadius: '10px', background: C.dangerLight, color: C.danger, padding: '8px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>
                              <Trash2 size={13} /> 제외
                            </button>
                          </div>
                        )}
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
