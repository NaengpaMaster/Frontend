import { useRef, useState } from 'react';
import { Camera, Check, Image, Loader2, Pencil, Trash2, X } from 'lucide-react';
import { fridgePhotoApi } from '@/apis/fridgePhotoApi';
import { C } from '@/shared/data/mockData';
import { IngredientSearchField } from './IngredientSearchField';

const STATUS_LABELS = {
  PENDING: '대기',
  REGISTERED: '등록',
  REJECTED: '제외',
};

export function FridgePhotoImportModal({ onClose, onRegistered }) {
  const [file, setFile] = useState(null);
  const [fridgePhotoAnalysisId, setFridgePhotoAnalysisId] = useState(null);
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

  const refreshItems = async (id = fridgePhotoAnalysisId) => {
    if (!id) return;
    const nextItems = await fridgePhotoApi.getItems(id);
    setItems(nextItems || []);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('냉장고 사진을 선택해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('냉장고 사진을 업로드하고 있어요.');

    try {
      const imageFile = await fridgePhotoApi.prepareImage(file);
      const upload = await fridgePhotoApi.uploadImage(imageFile);
      setFridgePhotoAnalysisId(upload.fridgePhotoAnalysisId);

      setMessage('AI가 냉장고 사진 속 재료를 분석하는 중이에요.');
      const analysisResult = await fridgePhotoApi.analyzeWithAgent(upload.fridgePhotoAnalysisId, imageFile);

      setMessage('인식된 재료를 사전 재료와 매칭하는 중이에요.');
      const matchedItems = await fridgePhotoApi.saveAnalysisResult(upload.fridgePhotoAnalysisId, {
        rawText: analysisResult.rawText,
        items: analysisResult.items || [],
        usage: analysisResult.usage,
      });

      setItems(matchedItems || []);
      setMessage((matchedItems || []).length > 0
        ? '냉장고에 등록할 후보를 확인해주세요.'
        : '사전 재료와 매칭된 후보가 없습니다.');
    } catch (err) {
      setError(err.message || '냉장고 사진 분석에 실패했습니다.');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.fridgePhotoItemId);
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
      await fridgePhotoApi.updateItem(editingId, {
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
      await fridgePhotoApi.rejectItem(itemId);
      await refreshItems();
    } catch (err) {
      setError(err.message || '후보 제외에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const registerItems = async (fridgePhotoItemIds) => {
    if (!fridgePhotoAnalysisId || fridgePhotoItemIds.length === 0) return;

    setLoading(true);
    setError('');
    try {
      await fridgePhotoApi.registerToFridge(fridgePhotoAnalysisId, fridgePhotoItemIds);
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
            <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.12em', fontWeight: 800 }}>FRIDGE PHOTO</div>
            <div style={{ color: C.fg, fontSize: '18px', fontWeight: 900, marginTop: '3px' }}>냉장고 사진 등록</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.fgMuted, cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '12px', borderRadius: '16px', background: C.card, border: `1px solid ${C.border}` }}>
            <div style={{ color: C.fgMuted, fontSize: '12px', fontWeight: 800, marginBottom: '9px' }}>
              {file ? file.name : '냉장고 사진을 선택해주세요.'}
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
              {loading ? '처리 중' : '냉장고 사진 분석'}
            </button>
          </div>

          {(message || error) && (
            <div style={{ padding: '10px 12px', borderRadius: '12px', background: error ? C.dangerLight : C.primaryLight, color: error ? C.danger : C.primary, fontSize: '12px', fontWeight: 800, lineHeight: 1.45 }}>
              {loading && <Loader2 size={13} style={{ verticalAlign: 'middle', marginRight: '6px' }} />}
              {error || message}
            </div>
          )}

          {items.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: C.fg, fontSize: '13px', fontWeight: 900 }}>등록 후보 {pendingItems.length}개</div>
                <button
                  onClick={() => registerItems(pendingItems.map((item) => item.fridgePhotoItemId))}
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
                const editing = editingId === item.fridgePhotoItemId;

                return (
                  <div key={item.fridgePhotoItemId} style={{ padding: '12px', borderRadius: '14px', background: C.card, border: `1px solid ${C.border}` }}>
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
                              AI: {item.extractedName} · {STATUS_LABELS[item.status] || item.status}
                            </div>
                            <div style={{ color: C.fgSubtle, fontSize: '11px', marginTop: '2px' }}>
                              유통기한 {item.expiryDate || '기한없음'}
                            </div>
                          </div>
                          <Camera size={18} color={pending ? C.primary : C.fgMuted} />
                        </div>

                        {pending && (
                          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                            <button onClick={() => registerItems([item.fridgePhotoItemId])} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flex: 1, border: 'none', borderRadius: '10px', background: C.primaryLight, color: C.primary, padding: '8px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>
                              <Check size={13} /> 등록
                            </button>
                            <button onClick={() => startEdit(item)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flex: 1, border: `1px solid ${C.border}`, borderRadius: '10px', background: C.surface, color: C.fgMuted, padding: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>
                              <Pencil size={13} /> 수정
                            </button>
                            <button onClick={() => rejectItem(item.fridgePhotoItemId)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flex: 1, border: 'none', borderRadius: '10px', background: C.dangerLight, color: C.danger, padding: '8px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>
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
