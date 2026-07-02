import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Heart, Clock, X, Plus, Edit2, MessageSquare, Send, Trash2, ShoppingCart, Check } from 'lucide-react';
import { C } from '@/shared/data/mockData';
import { recipesApi } from '@/apis/recipesApi';
import { RecipeFormModal } from './RecipeFormModal';

const DIFFICULTY_LABELS = { EASY: '쉬움', NORMAL: '보통', HARD: '어려움' };

function DifficultyDot({ difficulty }) {
  const label = DIFFICULTY_LABELS[difficulty] ?? difficulty;
  const colors = { 쉬움: C.primary, 보통: C.warn, 어려움: C.accent };
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors[label], display: 'inline-block' }} />
      <span style={{ fontSize: '11px', color: C.fgMuted }}>{label}</span>
    </span>
  );
}

// 상세조회 응답을 RecipeFormModal/화면에서 쓰기 좋은 형태로 변환
function mapDetail(d) {
  return {
    id: d.recipeId,
    name: d.recipeName,
    description: d.description,
    category: d.category,
    cookTime: d.cookTime,
    difficulty: d.difficulty,
    likeCount: d.likeCount,
    liked: d.liked,
    canManage: d.canManage,
    ingredients: d.ingredients ?? [],
    requiredIngredients: (d.ingredients ?? []).map((i) => ({ productId: i.ingredientId, name: i.ingredientName })),
    missingIngredients: d.missingIngredients ?? [],
    steps: (d.steps ?? []).map((s) => s.content),
  };
}

function RecipeDetail({
  recipe, comments, commentsLoading,
  onClose, onFavorite, onEdit, onDelete, onAddComment, onUpdateComment, onDeleteComment, onAddToShoppingList, onRemoveFromShoppingList,
}) {
  const [commentText, setCommentText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [deleteCommentId, setDeleteCommentId] = useState(null);
  // ingredientId → shoppingItemId
  const [addedMap, setAddedMap] = useState({});
  const [addingAll, setAddingAll] = useState(false);
  const [showAddAllConfirm, setShowAddAllConfirm] = useState(false);
  const canManage = recipe.canManage;
  const missingItems = recipe.ingredients.filter((ing) => !ing.owned);

  const handleAddIngredient = async (ing) => {
    try {
      const created = await onAddToShoppingList({ productId: ing.ingredientId, quantity: '1개' });
      const shoppingItemId = created?.shoppingItemId ?? created?.id;
      setAddedMap((prev) => ({ ...prev, [ing.ingredientId]: shoppingItemId }));
    } catch (err) {
      alert(err.message || '장보기 목록 추가 중 오류가 발생했습니다.');
    }
  };

  const handleRemoveIngredient = async (ing) => {
    const shoppingItemId = addedMap[ing.ingredientId];
    if (!shoppingItemId) return;
    try {
      await onRemoveFromShoppingList(shoppingItemId);
      setAddedMap((prev) => {
        const next = { ...prev };
        delete next[ing.ingredientId];
        return next;
      });
    } catch (err) {
      alert(err.message || '장보기 목록 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleAddAllMissing = async () => {
    const targets = missingItems.filter((ing) => !(ing.ingredientId in addedMap));
    if (targets.length === 0) return;
    setAddingAll(true);
    setShowAddAllConfirm(false);
    try {
      const results = await Promise.all(
        targets.map((ing) => onAddToShoppingList({ productId: ing.ingredientId, quantity: '1개' })),
      );
      setAddedMap((prev) => {
        const next = { ...prev };
        targets.forEach((ing, idx) => {
          const created = results[idx];
          next[ing.ingredientId] = created?.shoppingItemId ?? created?.id;
        });
        return next;
      });
    } catch (err) {
      alert(err.message || '장보기 목록 추가 중 오류가 발생했습니다.');
    } finally {
      setAddingAll(false);
    }
  };

  const submitComment = () => {
    if (!commentText.trim()) return;
    onAddComment(commentText.trim());
    setCommentText('');
  };

  const startEditComment = (c) => {
    setEditingCommentId(c.commentId);
    setEditingText(c.content);
  };

  const saveEditComment = (commentId) => {
    if (!editingText.trim()) return;
    onUpdateComment(commentId, editingText.trim());
    setEditingCommentId(null);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.45)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div
        style={{
          background: C.bg, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px',
          width: '100%', maxWidth: '480px', margin: '0 auto', maxHeight: '92vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.1em', marginBottom: '4px', fontWeight: 700 }}>{recipe.category?.toUpperCase()}</div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: C.fg, margin: 0, lineHeight: 1.1 }}>{recipe.name}</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {canManage && (
              <button onClick={onEdit} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: C.fgMuted, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                <Edit2 size={13} /> 수정
              </button>
            )}
            {canManage && (
              confirmDelete ? (
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={onDelete} style={{ background: C.dangerLight, border: 'none', borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: C.danger, fontSize: '12px', fontWeight: 700 }}>삭제 확인</button>
                  <button onClick={() => setConfirmDelete(false)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '6px 8px', cursor: 'pointer', color: C.fgMuted, fontSize: '12px' }}>취소</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: C.fgMuted, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                  <Trash2 size={13} /> 삭제
                </button>
              )
            )}
            <button onClick={onFavorite} style={{ background: 'none', border: 'none', cursor: 'pointer', color: recipe.liked ? C.accent : C.fgMuted }}>
              <Heart size={20} fill={recipe.liked ? C.accent : 'none'} />
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.fgMuted }}><X size={20} /></button>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: C.fgMuted, lineHeight: 1.6, marginBottom: '16px' }}>{recipe.description}</p>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={12} color={C.fgMuted} />
            <span style={{ fontSize: '12px', color: C.fgMuted }}>{recipe.cookTime}분</span>
          </div>
          <DifficultyDot difficulty={recipe.difficulty} />
          {/* 좋아요 수 */}
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: C.accent }}>
            <Heart size={12} fill={C.accent} color={C.accent} /> {recipe.likeCount}
          </span>
        </div>

        {recipe.missingIngredients.length > 0 && (
          <div style={{ fontSize: '11px', color: C.fgMuted, marginBottom: '20px' }}>
            <span style={{ color: C.accent }}>부족: {recipe.missingIngredients.join(', ')}</span>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: C.fgMuted }}>필요 재료</div>
            {missingItems.length > 0 && (
              <button
                onClick={() => setShowAddAllConfirm(true)}
                disabled={addingAll || missingItems.every((ing) => ing.ingredientId in addedMap)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none',
                  cursor: addingAll || missingItems.every((ing) => ing.ingredientId in addedMap) ? 'default' : 'pointer',
                  color: missingItems.every((ing) => ing.ingredientId in addedMap) ? C.fgMuted : C.primary,
                  fontSize: '11px', fontWeight: 700, padding: 0,
                }}
              >
                <ShoppingCart size={12} /> 부족한 재료 전부 장보기에 담기
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {recipe.ingredients.map((ing) => {
              const isAdded = ing.ingredientId in addedMap;
              return (
                <span key={ing.ingredientId} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 8px 5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                  background: ing.owned ? C.primaryLight : isAdded ? C.primaryLight : C.dangerLight,
                  color: ing.owned ? C.primary : isAdded ? C.primary : C.danger,
                }}>
                  {ing.owned ? '✓ ' : '✗ '}{ing.ingredientName}
                  {!ing.owned && (
                    isAdded ? (
                      <button
                        onClick={() => handleRemoveIngredient(ing)}
                        title="장보기 목록에서 제거"
                        style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: C.primary, padding: 0 }}
                      >
                        <Check size={13} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddIngredient(ing)}
                        title="장보기 목록에 추가"
                        style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
                      >
                        <Plus size={13} />
                      </button>
                    )
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {showAddAllConfirm && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}
            onClick={() => setShowAddAllConfirm(false)}
          >
            <div
              style={{ background: C.bg, borderRadius: '20px', padding: '24px 20px', width: '100%', maxWidth: '360px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: '15px', fontWeight: 700, color: C.fg, marginBottom: '6px' }}>부족한 재료 전체 담기</div>
              <div style={{ fontSize: '13px', color: C.fgMuted, marginBottom: '16px' }}>아래 재료를 장보기 목록에 모두 추가할까요?</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                {missingItems.filter((ing) => !(ing.ingredientId in addedMap)).map((ing) => (
                  <span key={ing.ingredientId} style={{ padding: '4px 10px', background: C.dangerLight, color: C.danger, borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                    {ing.ingredientName}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowAddAllConfirm(false)}
                  style={{ flex: 1, padding: '10px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', fontSize: '13px', color: C.fgMuted, cursor: 'pointer', fontWeight: 600 }}
                >
                  취소
                </button>
                <button
                  onClick={handleAddAllMissing}
                  disabled={addingAll}
                  style={{ flex: 1, padding: '10px', background: C.primary, border: 'none', borderRadius: '12px', fontSize: '13px', color: '#FFF', cursor: addingAll ? 'default' : 'pointer', fontWeight: 700 }}
                >
                  {addingAll ? '담는 중...' : '전부 담기'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: C.fgMuted, marginBottom: '12px' }}>조리 과정</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recipe.steps.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  minWidth: '26px', height: '26px', background: C.primary, color: '#FFF',
                  borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, flexShrink: 0,
                }}>
                  {idx + 1}
                </div>
                <p style={{ fontSize: '13px', color: C.fg, lineHeight: 1.6, margin: 0, paddingTop: '3px' }}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 댓글 */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: C.fgMuted, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={13} /> 댓글 {comments.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {commentsLoading ? (
              <div style={{ fontSize: '12px', color: C.fgSubtle, textAlign: 'center', padding: '16px 0' }}>불러오는 중...</div>
            ) : comments.length === 0 ? (
              <div style={{ fontSize: '12px', color: C.fgSubtle, textAlign: 'center', padding: '16px 0' }}>첫 댓글을 남겨보세요!</div>
            ) : (
              comments.map((c) => (
                <div key={c.commentId} style={{ background: C.surface, borderRadius: '14px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: C.fg }}>
                      {c.writerNickname}
                      {c.modified && <span style={{ fontSize: '10px', color: C.fgSubtle, fontWeight: 400 }}> (수정됨)</span>}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', color: C.fgSubtle }}>{c.createdAt?.split('T')[0]}</span>
                      {editingCommentId !== c.commentId && (c.canEdit || c.canDelete) && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {c.canEdit && (
                            <button onClick={() => startEditComment(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.fgSubtle, padding: '2px' }}>
                              <Edit2 size={11} />
                            </button>
                          )}
                          {c.canDelete && (
                            deleteCommentId === c.commentId ? (
                              <span style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => { onDeleteComment(c.commentId); setDeleteCommentId(null); }} style={{ fontSize: '10px', fontWeight: 700, color: C.danger, background: 'none', border: 'none', cursor: 'pointer' }}>삭제</button>
                                <button onClick={() => setDeleteCommentId(null)} style={{ fontSize: '10px', color: C.fgSubtle, background: 'none', border: 'none', cursor: 'pointer' }}>취소</button>
                              </span>
                            ) : (
                              <button onClick={() => setDeleteCommentId(c.commentId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.fgSubtle, padding: '2px' }}>
                                <Trash2 size={11} />
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {editingCommentId === c.commentId ? (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <input
                        autoFocus
                        style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '6px 10px', color: C.fg, fontSize: '13px', outline: 'none' }}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
                          e.preventDefault();
                          saveEditComment(c.commentId);
                        }}
                      />
                      <button onClick={() => saveEditComment(c.commentId)} style={{ padding: '4px 10px', background: C.primary, color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>저장</button>
                      <button onClick={() => setEditingCommentId(null)} style={{ padding: '4px 8px', background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', fontSize: '11px', color: C.fgMuted, cursor: 'pointer' }}>취소</button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: C.fg, lineHeight: 1.5 }}>{c.content}</div>
                  )}
                </div>
              ))
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '9px 12px', color: C.fg, fontSize: '13px', outline: 'none' }}
              placeholder="댓글 입력..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                // 한글 등 IME 조합 중 Enter는 무시 (조합 확정 + 실제 Enter로 두 번 발화되는 것 방지)
                if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
                e.preventDefault();
                submitComment();
              }}
            />
            <button
              onClick={submitComment}
              disabled={!commentText.trim()}
              style={{ width: '38px', height: '38px', background: commentText.trim() ? C.primary : C.surface, border: 'none', borderRadius: '12px', cursor: commentText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: commentText.trim() ? '#FFF' : C.fgSubtle, flexShrink: 0 }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecipeView({
  recipes, recipesLoading, onFetchRecipes, onFetchNextPage, hasNextPage,
  onToggleFavorite, presetIngredients, onAddRecipe, onUpdateRecipe, onDeleteRecipe, onAddToShoppingList, onRemoveFromShoppingList,
  initialRecipeId, onInitialRecipeHandled,
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);

  const debounceRef = useRef(null);
  const observerRef = useRef(null);

  const refetch = () => onFetchRecipes({
    keyword: search,
    favorite: filter === 'favorites',
    match80Only: filter === 'available',
  });

  // 검색어/필터가 바뀔 때마다 추천 API 재호출 (검색어는 살짝 디바운스)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      refetch();
    }, 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter]);

  const sentinelRef = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onFetchNextPage(); },
      { threshold: 0.1 },
    );
    observerRef.current.observe(node);
  }, [onFetchNextPage]);

  const openDetail = async (recipeId) => {
    setDetailLoading(true);
    try {
      const res = await recipesApi.getById(recipeId);
      const d = res.data?.data ?? res.data;
      setSelectedRecipe(mapDetail(d));
      loadComments(recipeId);
    } catch (err) {
      alert(err.message || '레시피 정보를 불러오지 못했습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  // 홈 화면 등 다른 곳에서 특정 레시피 상세를 바로 열도록 요청한 경우 처리
  useEffect(() => {
    if (!initialRecipeId) return;
    openDetail(initialRecipeId);
    onInitialRecipeHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRecipeId]);

  const loadComments = async (recipeId) => {
    setCommentsLoading(true);
    try {
      const res = await recipesApi.getComments(recipeId);
      const body = res.data?.data ?? res.data;
      setComments(body?.comments ?? []);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!selectedRecipe) return;
    try {
      const res = await recipesApi.toggleFavorite(selectedRecipe.id);
      const body = res.data?.data ?? res.data;
      setSelectedRecipe({ ...selectedRecipe, liked: body.liked, likeCount: body.likeCount });
    } catch (err) {
      alert(err.message || '좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  const handleListFavorite = async (e, recipeId) => {
    e.stopPropagation();
    try {
      await onToggleFavorite(recipeId);
    } catch (err) {
      alert(err.message || '좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  const handleAddComment = async (content) => {
    if (!selectedRecipe) return;
    try {
      await recipesApi.addComment(selectedRecipe.id, { content });
      loadComments(selectedRecipe.id);
    } catch (err) {
      alert(err.message || '댓글 등록 중 오류가 발생했습니다.');
    }
  };

  const handleUpdateComment = async (commentId, content) => {
    if (!selectedRecipe) return;
    try {
      await recipesApi.updateComment(commentId, { content });
      loadComments(selectedRecipe.id);
    } catch (err) {
      alert(err.message || '댓글 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!selectedRecipe) return;
    try {
      await recipesApi.deleteComment(commentId);
      loadComments(selectedRecipe.id);
    } catch (err) {
      alert(err.message || '댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEditSave = async (data) => {
    if (!editingRecipe) return;
    await onUpdateRecipe(editingRecipe.id, data);
    setEditingRecipe(null);
    setSelectedRecipe(null);
    refetch();
  };

  const handleDeleteRecipe = async () => {
    if (!selectedRecipe) return;
    try {
      await onDeleteRecipe(selectedRecipe.id);
      setSelectedRecipe(null);
      refetch();
    } catch (err) {
      alert(err.message || '레시피 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="recipe-shell" style={{ display: 'flex', flexDirection: 'column', background: C.bg }}>
      {/* Title row */}
      <div style={{ padding: '20px 20px 0', background: C.card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.1em', fontWeight: 700, marginBottom: '2px' }}>RECIPES</div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: C.fg, margin: 0, letterSpacing: '-0.02em' }}>레시피 추천</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '8px 12px', background: C.primary, color: '#FFF',
              border: 'none', borderRadius: '14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
            }}
          >
            <Plus size={14} /> 레시피 등록
          </button>
        </div>
      </div>

      <div style={{ position: 'sticky', top: 0, zIndex: 5, background: C.card, padding: '0 20px 12px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.fgMuted }} />
          <input
            style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '9px 12px 9px 32px', color: C.fg, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            placeholder="레시피 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.fgMuted }}><X size={14} /></button>}
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ padding: '0 20px 14px', background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {([['all', '전체'], ['available', '80% 이상 가능'], ['favorites', '즐겨찾기']]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              style={{
                padding: '6px 14px',
                background: filter === val ? C.primary : C.surface,
                color: filter === val ? '#FFF' : C.fgMuted,
                border: `1px solid ${filter === val ? C.primary : C.border}`,
                borderRadius: '20px', fontSize: '12px',
                fontWeight: filter === val ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe list */}
      <div className="recipe-list" style={{ background: C.card }}>
        {recipesLoading && recipes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.fgMuted }}>불러오는 중...</div>
        ) : recipes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.fgMuted }}>검색 결과가 없어요</div>
        ) : (
          <div style={{ padding: '4px 20px 24px' }}>
            {recipes.map((recipe) => {
              const isUrgentRecipe = recipe.recommendReasons?.includes('유통기한 임박 재료 활용');
              return (
                <div
                  key={recipe.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(recipe.id)}
                  onKeyDown={(e) => e.key === 'Enter' && openDetail(recipe.id)}
                  className="row-hover"
                  style={{
                    width: '100%', background: 'none', border: 'none',
                    borderBottom: `1px solid ${C.border}`, padding: '16px 20px', margin: '0 -20px', cursor: 'pointer', textAlign: 'left', display: 'block',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '16px', color: C.fg }}>{recipe.name}</span>
                        {isUrgentRecipe && (
                          <span style={{ fontSize: '9px', background: C.accentLight, color: C.accent, borderRadius: '4px', padding: '1px 5px', fontWeight: 700 }}>임박재료</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: C.fgMuted }}>{recipe.category}</span>
                        <Clock size={10} color={C.fgMuted} />
                        <span style={{ fontSize: '11px', color: C.fgMuted }}>{recipe.cookTime}분</span>
                        <DifficultyDot difficulty={recipe.difficulty} />
                        <button
                          onClick={(e) => handleListFavorite(e, recipe.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: recipe.liked ? C.accent : C.fgMuted }}
                        >
                          <Heart size={11} fill={recipe.liked ? C.accent : 'none'} />
                          <span style={{ fontSize: '11px' }}>{recipe.likeCount}</span>
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: recipe.matchRate === 100 ? C.primary : recipe.matchRate >= 80 ? C.warn : C.fgMuted, minWidth: '48px', textAlign: 'right' }}>
                      {recipe.matchRate}%
                    </div>
                  </div>
                  <div style={{ height: '3px', background: C.primaryLight, borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${recipe.matchRate}%`,
                      background: recipe.matchRate === 100 ? C.primary : recipe.matchRate >= 80 ? C.warn : C.accent,
                      borderRadius: '2px',
                    }} />
                  </div>
                  {recipe.missingIngredients.length > 0 && (
                    <div style={{ fontSize: '11px', color: C.accent, marginTop: '5px' }}>부족: {recipe.missingIngredients.join(', ')}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {hasNextPage && (
          <div ref={sentinelRef} style={{ textAlign: 'center', padding: '16px 0', color: C.fgMuted, fontSize: '12px' }}>
            {recipesLoading ? '불러오는 중...' : ''}
          </div>
        )}
      </div>

      {detailLoading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.45)', zIndex: 100, display: 'grid', placeItems: 'center' }}>
          <div style={{ color: '#FFF', fontWeight: 700 }}>불러오는 중...</div>
        </div>
      )}

      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          comments={comments}
          commentsLoading={commentsLoading}
          onClose={() => setSelectedRecipe(null)}
          onFavorite={handleFavorite}
          onEdit={() => setEditingRecipe(selectedRecipe)}
          onDelete={handleDeleteRecipe}
          onAddComment={handleAddComment}
          onUpdateComment={handleUpdateComment}
          onDeleteComment={handleDeleteComment}
          onAddToShoppingList={onAddToShoppingList}
          onRemoveFromShoppingList={onRemoveFromShoppingList}
        />
      )}

      {showForm && (
        <RecipeFormModal
          presetIngredients={presetIngredients}
          onSave={async (data) => { await onAddRecipe(data); setShowForm(false); refetch(); }}
          onClose={() => setShowForm(false)}
        />
      )}

      {editingRecipe && (
        <RecipeFormModal
          initial={editingRecipe}
          title="레시피 수정"
          presetIngredients={presetIngredients}
          onSave={handleEditSave}
          onClose={() => setEditingRecipe(null)}
        />
      )}
    </div>
  );
}
