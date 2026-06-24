import { useState } from 'react';
import { Search, Heart, Clock, X, Plus, Edit2, MessageSquare, Send, Trash2 } from 'lucide-react';
import { getRecipeMatch, getDaysUntilExpiry, C } from '@/shared/data/mockData';
import { RecipeFormModal } from './RecipeFormModal';

function DifficultyDot({ difficulty }) {
  const colors = { 쉬움: C.primary, 보통: C.warn, 어려움: C.accent };
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors[difficulty], display: 'inline-block' }} />
      <span style={{ fontSize: '11px', color: C.fgMuted }}>{difficulty}</span>
    </span>
  );
}

function RecipeDetail({
  recipe, match, currentUser, comments, presetIngredients, onClose, onFavorite, onEdit, onDelete, onAddComment,
}) {
  const [commentText, setCommentText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const recipeComments = comments.filter((c) => c.recipeId === recipe.id);

  const submitComment = () => {
    if (!commentText.trim()) return;
    onAddComment({
      recipeId: recipe.id,
      userId: currentUser.id,
      userName: currentUser.name,
      content: commentText.trim(),
      createdAt: new Date().toISOString().split('T')[0],
    });
    setCommentText('');
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
            <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.1em', marginBottom: '4px', fontWeight: 700 }}>{recipe.category.toUpperCase()}</div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: C.fg, margin: 0, lineHeight: 1.1 }}>{recipe.name}</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {onEdit && (
              <button onClick={onEdit} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', color: C.fgMuted, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                <Edit2 size={13} /> 수정
              </button>
            )}
            {onDelete && (
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
            <button onClick={onFavorite} style={{ background: 'none', border: 'none', cursor: 'pointer', color: recipe.isFavorite ? C.accent : C.fgMuted }}>
              <Heart size={20} fill={recipe.isFavorite ? C.accent : 'none'} />
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
          <span style={{
            fontSize: '12px', fontWeight: 700,
            color: match.percentage === 100 ? C.primary : match.percentage >= 80 ? C.warn : C.accent,
            background: match.percentage === 100 ? C.primaryLight : match.percentage >= 80 ? C.warnLight : C.accentLight,
            borderRadius: '20px', padding: '2px 10px',
          }}>
            보유 {match.percentage}%
          </span>
          {/* 좋아요 수 */}
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: C.accent }}>
            <Heart size={12} fill={C.accent} color={C.accent} /> {recipe.likeCount}
          </span>
        </div>

        <div style={{ height: '6px', background: C.primaryLight, borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ height: '100%', width: `${match.percentage}%`, background: match.percentage === 100 ? C.primary : C.warn, borderRadius: '3px', transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ fontSize: '11px', color: C.fgMuted, marginBottom: '20px' }}>
          {match.matchCount}/{match.totalRequired}개 재료 보유
          {match.missingIngredients.length > 0 && <span style={{ color: C.accent }}> · 부족: {match.missingIngredients.join(', ')}</span>}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: C.fgMuted, marginBottom: '10px' }}>필요 재료</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {recipe.requiredIngredients.map((ri) => {
              const has = !match.missingIngredients.includes(ri);
              return (
                <span key={ri} style={{
                  padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                  background: has ? C.primaryLight : C.dangerLight,
                  color: has ? C.primary : C.danger,
                }}>
                  {has ? '✓ ' : '✗ '}{ri}
                </span>
              );
            })}
          </div>
        </div>

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
            <MessageSquare size={13} /> 댓글 {recipeComments.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            {recipeComments.length === 0 ? (
              <div style={{ fontSize: '12px', color: C.fgSubtle, textAlign: 'center', padding: '16px 0' }}>첫 댓글을 남겨보세요!</div>
            ) : (
              recipeComments.map((c) => (
                <div key={c.id} style={{ background: C.surface, borderRadius: '14px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: C.fg }}>{c.userName}</span>
                    <span style={{ fontSize: '10px', color: C.fgSubtle }}>{c.createdAt}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: C.fg, lineHeight: 1.5 }}>{c.content}</div>
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
              onKeyDown={(e) => e.key === 'Enter' && submitComment()}
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

export function RecipeView({ recipes, ingredients, currentUser, comments, presetIngredients, onToggleFavorite, onAddRecipe, onUpdateRecipe, onDeleteRecipe, onAddComment }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);

  const urgentIngredientNames = ingredients
    .filter((i) => { const d = getDaysUntilExpiry(i.expiryDate); return d >= 0 && d <= 3; })
    .map((i) => i.name);

  const recipesWithMatch = recipes
    .map((r) => ({ ...r, match: getRecipeMatch(r, ingredients) }))
    .filter((r) => {
      const matchesSearch = r.name.includes(search) || r.category.includes(search) || r.requiredIngredients.some((ri) => ri.includes(search));
      if (!matchesSearch) return false;
      if (filter === 'available') return r.match.percentage >= 80;
      if (filter === 'favorites') return r.isFavorite;
      return true;
    })
    .sort((a, b) => {
      const aUrgent = a.requiredIngredients.some((ri) => urgentIngredientNames.includes(ri));
      const bUrgent = b.requiredIngredients.some((ri) => urgentIngredientNames.includes(ri));
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      return b.match.percentage - a.match.percentage;
    });

  const handleEditSave = (data) => {
    if (!editingRecipe) return;
    onUpdateRecipe(editingRecipe.id, data);
    setEditingRecipe(null);
    setSelectedRecipe(null);
  };

  const handleDeleteRecipe = (id) => {
    onDeleteRecipe(id);
    setSelectedRecipe(null);
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
            placeholder="레시피, 재료 검색..."
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

      {/* Urgent notice */}
      {urgentIngredientNames.length > 0 && filter !== 'favorites' && (
        <div style={{ padding: '10px 20px', background: C.accentLight, borderBottom: `1px solid ${C.accent}20` }}>
          <span style={{ fontSize: '11px', color: C.accent, fontWeight: 700 }}>
            ⚡ 임박 재료 우선 표시 — {urgentIngredientNames.join(', ')}
          </span>
        </div>
      )}

      {/* Recipe list */}
      <div className="recipe-list" style={{ background: C.card }}>
        {recipesWithMatch.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.fgMuted }}>검색 결과가 없어요</div>
        ) : (
          <div style={{ padding: '4px 20px 24px' }}>
            {recipesWithMatch.map((recipe) => {
              const isUrgentRecipe = recipe.requiredIngredients.some((ri) => urgentIngredientNames.includes(ri));
              const isOwn = recipe.authorId === currentUser.id;
              return (
                <button
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
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
                        {isOwn && (
                          <span style={{ fontSize: '9px', background: C.primaryLight, color: C.primary, borderRadius: '4px', padding: '1px 5px', fontWeight: 700 }}>내 레시피</span>
                        )}
                        {recipe.isFavorite && <Heart size={12} color={C.accent} fill={C.accent} />}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: C.fgMuted }}>{recipe.category}</span>
                        <Clock size={10} color={C.fgMuted} />
                        <span style={{ fontSize: '11px', color: C.fgMuted }}>{recipe.cookTime}분</span>
                        <DifficultyDot difficulty={recipe.difficulty} />
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: C.accent }}>
                          <Heart size={10} fill={C.accent} color={C.accent} /> {recipe.likeCount}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: recipe.match.percentage === 100 ? C.primary : recipe.match.percentage >= 80 ? C.warn : C.fgMuted, minWidth: '48px', textAlign: 'right' }}>
                      {recipe.match.percentage}%
                    </div>
                  </div>
                  <div style={{ height: '3px', background: C.primaryLight, borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${recipe.match.percentage}%`,
                      background: recipe.match.percentage === 100 ? C.primary : recipe.match.percentage >= 80 ? C.warn : C.accent,
                      borderRadius: '2px',
                    }} />
                  </div>
                  {recipe.match.missingIngredients.length > 0 && (
                    <div style={{ fontSize: '11px', color: C.accent, marginTop: '5px' }}>부족: {recipe.match.missingIngredients.join(', ')}</div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          match={getRecipeMatch(selectedRecipe, ingredients)}
          currentUser={currentUser}
          comments={comments}
          presetIngredients={presetIngredients}
          onClose={() => setSelectedRecipe(null)}
          onFavorite={() => { onToggleFavorite(selectedRecipe.id); setSelectedRecipe({ ...selectedRecipe, isFavorite: !selectedRecipe.isFavorite }); }}
          onEdit={selectedRecipe.authorId === currentUser.id ? () => setEditingRecipe(selectedRecipe) : undefined}
          onDelete={selectedRecipe.authorId === currentUser.id ? () => handleDeleteRecipe(selectedRecipe.id) : undefined}
          onAddComment={onAddComment}
        />
      )}

      {showForm && (
        <RecipeFormModal
          presetIngredients={presetIngredients}
          onSave={(data) => { onAddRecipe(data); setShowForm(false); }}
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
