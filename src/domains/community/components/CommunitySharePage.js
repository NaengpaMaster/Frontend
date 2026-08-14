import { useEffect, useMemo, useState } from 'react';
import { HandHeart, MapPin, Plus, RefreshCw, Users, X } from 'lucide-react';
import { communityShareApi } from '@/apis/communityShareApi';
import { IngredientSearchField } from '@/domains/fridge/components/IngredientSearchField';
import { PageControls } from '@/shared/components/PageControls';
import { C } from '@/shared/data/mockData';

const DEFAULT_LOCATION = {
  latitude: 37.5665,
  longitude: 126.9780,
};

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`;
}

function getErrorMessage(error) {
  return error?.message || '요청 처리 중 오류가 발생했습니다.';
}

function CreateShareModal({ location, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    productId: null,
    productName: '',
    quantity: '',
    totalPrice: '',
    participantLimit: 3,
    address: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const sharePrice = useMemo(() => {
    const price = Number(form.totalPrice || 0);
    const limit = Number(form.participantLimit || 1);
    return Math.ceil(price / limit);
  }, [form.totalPrice, form.participantLimit]);

  const inputStyle = {
    width: '100%',
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: '12px',
    padding: '11px 12px',
    color: C.fg,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: '11px', fontWeight: 800, color: C.fgMuted, display: 'block', marginBottom: '6px' };

  const handleSubmit = async () => {
    if (!form.title || !form.productId || !form.quantity || form.totalPrice === '' || !form.address.trim() || !form.description.trim()) {
      setError('제목, 재료 이름, 나눌 수량, 총 구매 금액, 총 나눔 인원, 위치, 상세 글을 입력해주세요.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await communityShareApi.create({
        title: form.title,
        productId: Number(form.productId),
        quantity: form.quantity,
        totalPrice: Number(form.totalPrice),
        participantLimit: Number(form.participantLimit),
        latitude: location.latitude,
        longitude: location.longitude,
        address: form.address,
        description: form.description,
      });
      await onCreated();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.42)', zIndex: 120, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto', background: C.bg, borderRadius: '24px 24px 0 0', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: C.fg }}>재료 함께 나눔</div>
            <div style={{ fontSize: '12px', color: C.fgMuted, marginTop: '3px' }}>작성자 포함 선착순으로 함께 나눠 가져요.</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', color: C.fgMuted, cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'grid', gap: '14px' }}>
          <div>
            <label style={labelStyle}><span style={{ color: C.danger }}>*</span> 제목</label>
            <input style={inputStyle} placeholder="예: 수박 3명이 나눠가져요" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}><span style={{ color: C.danger }}>*</span> 재료 이름</label>
            <IngredientSearchField
              value={form.productName}
              placeholder="재료 이름을 검색하세요"
              onSelect={(ingredient) => setForm({
                ...form,
                productId: ingredient.productId,
                productName: ingredient.name,
              })}
              onFormSubmit={handleSubmit}
            />
          </div>
          <div>
            <label style={labelStyle}><span style={{ color: C.danger }}>*</span> 나눌 수량</label>
            <input style={inputStyle} placeholder="1통, 1/2개" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div>
              <label style={labelStyle}><span style={{ color: C.danger }}>*</span> 총 구매 금액</label>
              <input type="number" min="0" style={inputStyle} placeholder="20000" value={form.totalPrice} onChange={(e) => setForm({ ...form, totalPrice: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}><span style={{ color: C.danger }}>*</span> 총 나눔 인원</label>
              <input type="number" min="2" max="20" style={inputStyle} value={form.participantLimit} onChange={(e) => setForm({ ...form, participantLimit: e.target.value })} />
            </div>
          </div>
          <div style={{ padding: '13px 14px', borderRadius: '16px', background: C.primaryLight, color: C.primary, fontSize: '13px', fontWeight: 900 }}>
            1인 예상 부담금 {formatPrice(sharePrice)} · 실제 송금/정산은 만남 후 직접 진행
          </div>
          <div>
            <label style={labelStyle}><span style={{ color: C.danger }}>*</span> 거래 위치 안내</label>
            <input style={inputStyle} placeholder="예: 역삼역 3번 출구 근처" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}><span style={{ color: C.danger }}>*</span> 상세 글</label>
            <textarea style={{ ...inputStyle, minHeight: '82px', resize: 'none' }} placeholder="보관 상태, 나눌 방식, 가능 시간 등을 자세히 적어주세요." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          {error && <div style={{ color: C.danger, fontSize: '12px', fontWeight: 800 }}>{error}</div>}
        </div>

        <div style={{ padding: '16px 20px 22px', borderTop: `1px solid ${C.border}`, background: C.bg }}>
          <button onClick={handleSubmit} disabled={saving} style={{ width: '100%', border: 'none', borderRadius: '16px', padding: '14px', background: C.primary, color: '#fff', fontSize: '15px', fontWeight: 900, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? '등록 중...' : '나눔 모집 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

function getMapLevel(radiusKm) {
  if (radiusKm <= 0.5) return 5;
  if (radiusKm <= 1) return 6;
  return 7;
}

const MAP_GROUP_GRID_SIZE = 0.00045;

function getMapGroupKey(post) {
  const latitude = Number(post.latitude);
  const longitude = Number(post.longitude);
  return `${Math.round(latitude / MAP_GROUP_GRID_SIZE)}:${Math.round(longitude / MAP_GROUP_GRID_SIZE)}`;
}

function groupSharePostsByPosition(posts) {
  const groups = new Map();

  posts.forEach((post) => {
    const latitude = Number(post.latitude);
    const longitude = Number(post.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const key = getMapGroupKey(post);
    const group = groups.get(key) || {
      key,
      posts: [],
      latitudeTotal: 0,
      longitudeTotal: 0,
    };

    group.posts.push(post);
    group.latitudeTotal += latitude;
    group.longitudeTotal += longitude;
    groups.set(key, group);
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    latitude: group.latitudeTotal / group.posts.length,
    longitude: group.longitudeTotal / group.posts.length,
  }));
}

function CommunityShareMap({ posts, location, radiusKm, selectedPostId, onSelectPost, onSelectGroup }) {
  const [mapStatus, setMapStatus] = useState('loading');
  const [mapError, setMapError] = useState('');
  const [mapOrigin, setMapOrigin] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY?.trim();
    setMapOrigin(window.location.origin);
    setMapError('');
    if (!appKey) {
      setMapStatus('missing-key');
      setMapError('NEXT_PUBLIC_KAKAO_MAP_APP_KEY가 프론트 환경변수에 없습니다.');
      return undefined;
    }

    if (window.kakao?.maps?.load) {
      window.kakao.maps.load(() => setMapStatus('ready'));
      return undefined;
    }

    setMapStatus('loading');
    const sdkUrl = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    const existingScript = document.querySelector('script[data-kakao-map-sdk="true"]');
    const script = existingScript || document.createElement('script');

    const handleLoad = () => {
      if (!window.kakao?.maps?.load) {
        setMapError('SDK script는 로드됐지만 window.kakao.maps.load가 없습니다. JavaScript 키 또는 JavaScript SDK 도메인 설정을 확인해야 합니다.');
        setMapStatus('error');
        return;
      }
      window.kakao.maps.load(() => setMapStatus('ready'));
    };

    const handleError = () => {
      setMapError('SDK script 로드에 실패했습니다. 현재 접속 주소가 JavaScript SDK 도메인에 등록되어 있는지, 키가 JavaScript 키인지 확인해야 합니다.');
      setMapStatus('error');
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    if (!existingScript) {
      script.dataset.kakaoMapSdk = 'true';
      script.src = sdkUrl;
      script.async = true;
      document.head.appendChild(script);
    }

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, [retryCount]);

  useEffect(() => {
    if (mapStatus !== 'ready' || typeof window === 'undefined' || !window.kakao?.maps) return undefined;

    const kakao = window.kakao;
    const container = document.getElementById('community-share-map');
    if (!container) return undefined;

    const center = new kakao.maps.LatLng(location.latitude, location.longitude);
    const map = new kakao.maps.Map(container, {
      center,
      level: getMapLevel(radiusKm),
    });

    new kakao.maps.Marker({
      map,
      position: center,
      title: '현재 위치',
    });

    new kakao.maps.Circle({
      map,
      center,
      radius: radiusKm * 1000,
      strokeWeight: 2,
      strokeColor: C.primary,
      strokeOpacity: 0.55,
      fillColor: C.primary,
      fillOpacity: 0.08,
    });

    const groupedPosts = groupSharePostsByPosition(posts);

    groupedPosts.forEach((group, index) => {
      const primaryPost = group.posts[0];
      const hiddenCount = group.posts.length - 1;
      const position = new kakao.maps.LatLng(group.latitude, group.longitude);
      const marker = new kakao.maps.Marker({
        map,
        position,
        title: hiddenCount > 0 ? `${primaryPost.ingredientName} 외 ${hiddenCount}개` : primaryPost.ingredientName,
      });
      const active = group.posts.some((post) => selectedPostId === post.communitySharePostId);
      const overlay = new kakao.maps.CustomOverlay({
        map,
        position,
        yAnchor: 1.45,
        content: `
          <button type="button" data-share-group-index="${index}" style="
            border: 0;
            border-radius: 999px;
            padding: 8px 11px;
            background: ${active ? C.primary : '#FFFFFF'};
            color: ${active ? '#FFFFFF' : C.primary};
            box-shadow: 0 8px 22px rgba(17,32,29,0.18);
            font-size: 12px;
            font-weight: 900;
            cursor: pointer;
            white-space: nowrap;
          ">${primaryPost.ingredientName}${hiddenCount > 0 ? ` +${hiddenCount}` : ''} · ${formatPrice(primaryPost.sharePrice)}</button>
        `,
      });

      const handleGroupClick = () => {
        if (group.posts.length > 1) {
          onSelectGroup(group.posts);
          return;
        }
        onSelectPost(primaryPost.communitySharePostId);
      };

      kakao.maps.event.addListener(marker, 'click', handleGroupClick);
      setTimeout(() => {
        const overlayButton = document.querySelector(`[data-share-group-index="${index}"]`);
        overlayButton?.addEventListener('click', handleGroupClick);
      }, 0);
    });

    map.setCenter(center);
    map.setLevel(getMapLevel(radiusKm));

    return undefined;
  }, [mapStatus, posts, location, radiusKm, selectedPostId, onSelectPost, onSelectGroup]);

  if (mapStatus === 'missing-key') {
    return (
      <div style={{ height: '220px', borderRadius: '20px', background: C.card, border: `1px dashed ${C.borderStrong}`, display: 'grid', placeItems: 'center', padding: '18px', textAlign: 'center', color: C.fgMuted, fontSize: '12px', lineHeight: 1.5 }}>
        <div>
          <MapPin size={24} />
          <div style={{ marginTop: '8px', fontWeight: 900 }}>지도 표시를 위해 카카오맵 키가 필요합니다.</div>
          <div style={{ marginTop: '4px' }}>`.env.local`에 `NEXT_PUBLIC_KAKAO_MAP_APP_KEY`를 추가해주세요.</div>
        </div>
      </div>
    );
  }

  if (mapStatus === 'error') {
    return (
      <div style={{ height: '220px', borderRadius: '20px', background: C.dangerLight, color: C.danger, display: 'grid', placeItems: 'center', padding: '18px', textAlign: 'center', fontSize: '12px', fontWeight: 900, lineHeight: 1.5 }}>
        <div>
          <div>지도를 불러오지 못했습니다.</div>
          {mapError && <div style={{ marginTop: '6px', fontWeight: 700 }}>{mapError}</div>}
          {mapOrigin && <div style={{ marginTop: '6px', fontWeight: 700 }}>현재 접속 주소: {mapOrigin}</div>}
          <button type="button" onClick={() => setRetryCount((count) => count + 1)} style={{ marginTop: '10px', border: 'none', borderRadius: '12px', padding: '8px 12px', background: C.card, color: C.danger, fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>지도 다시 불러오기</button>
        </div>
      </div>
    );
  }

  return <div id="community-share-map" style={{ height: '320px', borderRadius: '22px', overflow: 'hidden', border: `1px solid ${C.border}`, background: C.surface, marginBottom: '14px' }} />;
}

function ShareActions({ post, onJoin, onCancelJoin, onClosePost, onCancelPost, busy }) {
  const isOpen = post.status === 'OPEN';
  const canJoin = isOpen && !post.mine && !post.joined && post.remainingSlots > 0;
  const canCancelJoin = isOpen && !post.mine && post.joined;

  return (
    <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
      {canJoin && <button onClick={() => onJoin(post.communitySharePostId)} disabled={busy} style={{ flex: 1, border: 'none', borderRadius: '14px', padding: '12px', background: C.primary, color: '#fff', fontSize: '13px', fontWeight: 900, cursor: 'pointer' }}>참여</button>}
      {canCancelJoin && <button onClick={() => onCancelJoin(post.communitySharePostId)} disabled={busy} style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '12px', background: C.card, color: C.fgMuted, fontSize: '13px', fontWeight: 900, cursor: 'pointer' }}>참여취소</button>}
      {post.mine && isOpen && <button onClick={() => onClosePost(post.communitySharePostId)} disabled={busy} style={{ flex: 1, border: 'none', borderRadius: '14px', padding: '12px', background: C.primaryLight, color: C.primary, fontSize: '13px', fontWeight: 900, cursor: 'pointer' }}>마감</button>}
      {post.mine && isOpen && <button onClick={() => onCancelPost(post.communitySharePostId)} disabled={busy} style={{ flex: 1, border: 'none', borderRadius: '14px', padding: '12px', background: C.dangerLight, color: C.danger, fontSize: '13px', fontWeight: 900, cursor: 'pointer' }}>취소</button>}
    </div>
  );
}

function ShareGroupPreviewModal({ posts, onClose, onOpenDetail }) {
  if (!posts?.length) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.32)', zIndex: 125, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto', background: C.bg, borderRadius: '22px 22px 0 0', padding: '18px 20px 22px', boxShadow: '0 -14px 34px rgba(17,32,29,0.16)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: C.fg }}>겹친 나눔 {posts.length}개</div>
            <div style={{ fontSize: '12px', color: C.fgMuted, marginTop: '3px' }}>확인할 재료를 선택해주세요.</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', color: C.fgMuted, cursor: 'pointer', padding: '2px' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'grid', gap: '9px' }}>
          {posts.map((post) => (
            <button
              key={post.communitySharePostId}
              type="button"
              onClick={() => {
                onOpenDetail(post);
                onClose();
              }}
              style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: '16px', background: C.card, padding: '12px', textAlign: 'left', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: C.fg }}>{post.ingredientName}</div>
                  <div style={{ fontSize: '12px', color: C.fgMuted, marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 950, color: C.primary }}>{formatPrice(post.sharePrice)}</div>
                  <div style={{ fontSize: '10px', color: C.fgMuted, marginTop: '2px' }}>{post.joinedCount}/{post.participantLimit}명</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShareCard({ post, selected, onOpenDetail }) {
  const isOpen = post.status === 'OPEN';

  return (
    <button
      type="button"
      onClick={() => onOpenDetail(post)}
      style={{ width: '100%', background: C.card, border: `1px solid ${selected ? C.primaryMid : C.border}`, borderRadius: '18px', padding: '14px', boxShadow: selected ? '0 10px 26px rgba(14,132,120,0.14)' : '0 8px 22px rgba(17,32,29,0.05)', cursor: 'pointer', textAlign: 'left' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '7px' }}>
            <span style={{ padding: '4px 8px', borderRadius: '999px', background: isOpen ? C.primaryLight : C.surface, color: isOpen ? C.primary : C.fgMuted, fontSize: '10px', fontWeight: 900 }}>{isOpen ? '모집중' : post.status === 'CLOSED' ? '마감' : '취소'}</span>
            {post.mine && <span style={{ padding: '4px 8px', borderRadius: '999px', background: C.warnLight, color: C.warn, fontSize: '10px', fontWeight: 900 }}>내 글</span>}
            {post.distanceKm != null && <span style={{ padding: '4px 8px', borderRadius: '999px', background: C.surface, color: C.fgMuted, fontSize: '10px', fontWeight: 800 }}>{post.distanceKm}km</span>}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: C.fg, lineHeight: 1.25 }}>{post.ingredientName}</div>
          <div style={{ fontSize: '12px', color: C.fgMuted, marginTop: '4px' }}>{post.quantity} · {post.joinedCount}/{post.participantLimit}명</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '16px', fontWeight: 950, color: C.primary }}>{formatPrice(post.sharePrice)}</div>
          <div style={{ fontSize: '10px', color: C.fgMuted, marginTop: '2px' }}>1인 예상</div>
        </div>
      </div>
    </button>
  );
}

function ShareDetailModal({ post, onClose, onJoin, onCancelJoin, onClosePost, onCancelPost, busy }) {
  if (!post) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,32,29,0.42)', zIndex: 130, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto', background: C.bg, borderRadius: '24px 24px 0 0', maxHeight: '88vh', overflowY: 'auto', padding: '20px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', color: C.primary, fontWeight: 900, marginBottom: '5px' }}>재료 함께 나눔 상세</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: C.fg, letterSpacing: '-0.03em' }}>{post.ingredientName}</div>
            <div style={{ fontSize: '13px', color: C.fgMuted, marginTop: '5px' }}>{post.title}</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', color: C.fgMuted, cursor: 'pointer', padding: '2px' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          <div style={{ borderRadius: '14px', background: C.card, padding: '12px' }}>
            <div style={{ fontSize: '10px', color: C.fgMuted, fontWeight: 800 }}>나눌 수량</div>
            <div style={{ fontSize: '14px', color: C.fg, fontWeight: 900, marginTop: '4px' }}>{post.quantity}</div>
          </div>
          <div style={{ borderRadius: '14px', background: C.card, padding: '12px' }}>
            <div style={{ fontSize: '10px', color: C.fgMuted, fontWeight: 800 }}>1인 예상</div>
            <div style={{ fontSize: '14px', color: C.primary, fontWeight: 950, marginTop: '4px' }}>{formatPrice(post.sharePrice)}</div>
          </div>
          <div style={{ borderRadius: '14px', background: C.card, padding: '12px' }}>
            <div style={{ fontSize: '10px', color: C.fgMuted, fontWeight: 800 }}>총 금액</div>
            <div style={{ fontSize: '14px', color: C.fg, fontWeight: 900, marginTop: '4px' }}>{formatPrice(post.totalPrice)}</div>
          </div>
          <div style={{ borderRadius: '14px', background: C.card, padding: '12px' }}>
            <div style={{ fontSize: '10px', color: C.fgMuted, fontWeight: 800 }}>참여 현황</div>
            <div style={{ fontSize: '14px', color: C.fg, fontWeight: 900, marginTop: '4px' }}>{post.joinedCount}/{post.participantLimit}명 · {post.remainingSlots}자리</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          <div style={{ background: C.card, borderRadius: '16px', padding: '13px 14px' }}>
            <div style={{ fontSize: '11px', color: C.fgMuted, fontWeight: 900, marginBottom: '6px' }}>위치</div>
            <div style={{ display: 'flex', gap: '7px', color: C.fg, fontSize: '13px', lineHeight: 1.5 }}><MapPin size={15} style={{ marginTop: '2px', flexShrink: 0 }} /> <span>{post.address || '작성자가 위치 설명을 입력하지 않았습니다.'}</span></div>
            {post.distanceKm != null && <div style={{ fontSize: '11px', color: C.fgMuted, marginTop: '6px' }}>현재 위치에서 약 {post.distanceKm}km</div>}
          </div>
          <div style={{ background: C.card, borderRadius: '16px', padding: '13px 14px' }}>
            <div style={{ fontSize: '11px', color: C.fgMuted, fontWeight: 900, marginBottom: '6px' }}>상세 글</div>
            <div style={{ color: C.fg, fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{post.description || '작성자가 상세 설명을 입력하지 않았습니다.'}</div>
          </div>
        </div>

        <ShareActions post={post} busy={busy} onJoin={onJoin} onCancelJoin={onCancelJoin} onClosePost={onClosePost} onCancelPost={onCancelPost} />
      </div>
    </div>
  );
}

export function CommunitySharePage() {
  const [posts, setPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [joinedPosts, setJoinedPosts] = useState([]);
  const [nearbyPage, setNearbyPage] = useState({ page: 0, last: true, totalElements: 0, totalPages: 1 });
  const [myPage, setMyPage] = useState({ page: 0, last: true, totalElements: 0, totalPages: 1 });
  const [joinedPage, setJoinedPage] = useState({ page: 0, last: true, totalElements: 0, totalPages: 1 });
  const [tab, setTab] = useState('nearby');
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [locationLabel, setLocationLabel] = useState('현재 위치 확인 중');
  const [locationError, setLocationError] = useState('');
  const [radiusKm, setRadiusKm] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [detailPost, setDetailPost] = useState(null);
  const [groupPreviewPosts, setGroupPreviewPosts] = useState([]);

  const applyPage = (pageResponse, setter, pageSetter, append) => {
    const content = pageResponse?.content || [];
    setter((prev) => (append ? [...prev, ...content] : content));
    pageSetter({
      page: pageResponse?.page ?? 0,
      last: pageResponse?.last ?? true,
      totalElements: pageResponse?.totalElements ?? content.length,
      totalPages: pageResponse?.totalPages ?? 1,
    });
  };

  const loadNearbyPosts = async (nextLocation = location, page = 0, append = false) => {
    const openPage = await communityShareApi.getOpen({ ...nextLocation, radiusKm, page });
    applyPage(openPage, setPosts, setNearbyPage, append);
  };

  const loadMyPosts = async (page = 0, append = false) => {
    const minePageResponse = await communityShareApi.getMine(page);
    applyPage(minePageResponse, setMyPosts, setMyPage, append);
  };

  const loadJoinedPosts = async (page = 0, append = false) => {
    const joinedPageResponse = await communityShareApi.getJoined(page);
    applyPage(joinedPageResponse, setJoinedPosts, setJoinedPage, append);
  };

  const loadPosts = async (nextLocation = location) => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        loadNearbyPosts(nextLocation, 0, false),
        loadMyPosts(0, false),
        loadJoinedPosts(0, false),
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const requestCurrentLocation = (reload = true) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationLabel('기본 위치');
      setLocationError('이 브라우저에서는 현재 위치를 사용할 수 없습니다.');
      if (reload) loadPosts(DEFAULT_LOCATION);
      return;
    }

    setLocationLabel('현재 위치 확인 중');
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(nextLocation);
        setLocationLabel('현재 위치');
        setLocationError('');
        if (reload) loadPosts(nextLocation);
      },
      (geoError) => {
        setLocationLabel('기본 위치');
        const messages = {
          [geoError.PERMISSION_DENIED]: '위치 권한이 거부되어 기본 위치로 표시 중입니다. 브라우저 주소창의 위치 권한을 허용해주세요.',
          [geoError.POSITION_UNAVAILABLE]: '현재 기기에서 위치 정보를 계산하지 못해 기본 위치로 표시 중입니다. Wi-Fi/GPS를 켠 뒤 다시 눌러주세요.',
          [geoError.TIMEOUT]: '현재 위치 확인 시간이 초과되어 기본 위치로 표시 중입니다. 다시 현재위치를 눌러주세요.',
        };
        setLocationError(messages[geoError.code] || '현재 위치를 가져오지 못해 기본 위치로 표시 중입니다.');
        if (reload) loadPosts(location);
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 300000 }
    );
  };

  useEffect(() => {
    requestCurrentLocation(true);
  }, [radiusKm]);

  const refresh = () => loadPosts(location);

  const movePage = async (nextPage) => {
    if (nextPage < 0 || nextPage >= currentPageInfo.totalPages || nextPage === currentPageInfo.page) return;

    setLoading(true);
    setError('');
    try {
      if (tab === 'nearby') {
        await loadNearbyPosts(location, nextPage, false);
      } else if (tab === 'mine') {
        await loadMyPosts(nextPage, false);
      } else {
        await loadJoinedPosts(nextPage, false);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const patchPostState = (updatedPost) => {
    if (!updatedPost?.communitySharePostId) return;
    const replacePost = (items) => items.map((item) => (
      item.communitySharePostId === updatedPost.communitySharePostId ? { ...item, ...updatedPost } : item
    ));

    setPosts(replacePost);
    setMyPosts(replacePost);
    setJoinedPosts(replacePost);
    setDetailPost((current) => (
      current?.communitySharePostId === updatedPost.communitySharePostId ? { ...current, ...updatedPost } : current
    ));
    setGroupPreviewPosts((current) => current.map((item) => (
      item.communitySharePostId === updatedPost.communitySharePostId ? { ...item, ...updatedPost } : item
    )));
  };

  const runAction = async (postId, action) => {
    setBusyId(postId);
    setError('');
    try {
      const updatedPost = await action(postId);
      patchPostState(updatedPost);
      await Promise.all([
        loadNearbyPosts(location, nearbyPage.page, false),
        loadMyPosts(myPage.page, false),
        loadJoinedPosts(joinedPage.page, false),
      ]);
      patchPostState(updatedPost);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const visiblePosts = tab === 'nearby' ? posts : tab === 'mine' ? myPosts : joinedPosts;
  const currentPageInfo = tab === 'nearby' ? nearbyPage : tab === 'mine' ? myPage : joinedPage;
  const selectedPost = visiblePosts.find((post) => post.communitySharePostId === selectedPostId);

  const openDetail = (post) => {
    setSelectedPostId(post.communitySharePostId);
    setDetailPost(post);
  };

  const handleSelectPost = (postId) => {
    setSelectedPostId(postId);
    const post = visiblePosts.find((item) => item.communitySharePostId === postId);
    if (post) setDetailPost(post);
    setTimeout(() => {
      document.getElementById(`community-share-card-${postId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  };


  return (
    <div style={{ minHeight: '100%', boxSizing: 'border-box', background: C.bg }}>
      <div style={{ padding: '20px', background: C.card, borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '10px', color: C.fgMuted, letterSpacing: '0.1em', fontWeight: 700, marginBottom: '2px' }}>SHARE</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: C.fg, lineHeight: 1, margin: 0, letterSpacing: '-0.02em' }}>재료 함께 나눔</h1>
          <div style={{ fontSize: '12px', color: C.fgMuted, marginTop: '5px' }}>다 먹을 수 없는 재료들을 주변 이웃과 나눠가져요.</div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, border: 'none', borderRadius: '12px', background: C.primary, color: '#fff', padding: '9px 12px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}><Plus size={15} /> 등록</button>
      </div>

      <div style={{ padding: '18px 20px 96px' }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginBottom: '14px' }}>
        {[{ id: 'nearby', label: '주변 나눔' }, { id: 'mine', label: '내 나눔' }, { id: 'joined', label: '나눔 참여' }].map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} style={{ border: 'none', borderRadius: '14px', padding: '12px 6px', background: tab === item.id ? C.primary : C.card, color: tab === item.id ? '#fff' : C.fgMuted, fontSize: '13px', fontWeight: 900, cursor: 'pointer' }}>{item.label}</button>
        ))}
      </div>

      {tab === 'nearby' && (
        <>
          <CommunityShareMap
            posts={posts}
            location={location}
            radiusKm={radiusKm}
            selectedPostId={selectedPostId}
            onSelectPost={handleSelectPost}
            onSelectGroup={setGroupPreviewPosts}
          />

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '12px', marginBottom: '14px', display: 'grid', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: C.fgMuted, fontSize: '12px', fontWeight: 800 }}><MapPin size={15} /> {locationLabel} 기준</div>
              <button onClick={() => requestCurrentLocation(true)} style={{ border: 'none', background: C.surface, color: C.fgMuted, borderRadius: '12px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}><RefreshCw size={14} /> 현재위치</button>
            </div>
            {locationError && <div style={{ padding: '9px 10px', borderRadius: '12px', background: C.warnLight, color: C.warn, fontSize: '11px', fontWeight: 800, lineHeight: 1.4 }}>{locationError}</div>}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: C.fgMuted, fontSize: '12px', fontWeight: 800 }}>반경</span>
              {[
                { value: 0.5, label: '500m' },
                { value: 1, label: '1km' },
                { value: 2, label: '2km' },
              ].map((item) => (
                <button key={item.value} onClick={() => setRadiusKm(item.value)} style={{ border: `1px solid ${radiusKm === item.value ? C.primaryMid : C.border}`, background: radiusKm === item.value ? C.primaryLight : C.surface, color: radiusKm === item.value ? C.primary : C.fgMuted, borderRadius: '999px', padding: '7px 10px', fontSize: '12px', fontWeight: 900, cursor: 'pointer' }}>{item.label}</button>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedPost && tab === 'nearby' && (
        <div style={{ marginBottom: '12px', padding: '12px 14px', borderRadius: '16px', background: C.primaryLight, color: C.primary, fontSize: '12px', fontWeight: 900 }}>
          지도에서 선택됨: {selectedPost.title}
        </div>
      )}
      {error && <div style={{ marginBottom: '12px', padding: '12px', borderRadius: '14px', background: C.dangerLight, color: C.danger, fontSize: '12px', fontWeight: 800 }}>{error}</div>}
      {loading && <div style={{ padding: '24px', textAlign: 'center', color: C.fgMuted, fontSize: '13px' }}>나눔 글을 불러오는 중...</div>}
      {!loading && visiblePosts.length === 0 && (
        <div style={{ background: C.card, border: `1px dashed ${C.borderStrong}`, borderRadius: '22px', padding: '28px 18px', textAlign: 'center', color: C.fgMuted }}>
          <Users size={26} />
          <div style={{ marginTop: '10px', fontSize: '14px', fontWeight: 900 }}>{tab === 'nearby' ? '주변 모집글이 없습니다.' : tab === 'mine' ? '아직 등록한 나눔이 없습니다.' : '참여한 나눔이 없습니다.'}</div>
          <div style={{ marginTop: '5px', fontSize: '12px' }}>{tab === 'joined' ? '주변 나눔에서 필요한 재료에 참여해보세요.' : '큰 재료가 남을 때 첫 나눔을 등록해보세요.'}</div>
        </div>
      )}
      <div style={{ display: 'grid', gap: '12px' }}>
        {visiblePosts.map((post) => (
          <div id={`community-share-card-${post.communitySharePostId}`} key={post.communitySharePostId}>
          <ShareCard
            post={post}
            selected={selectedPostId === post.communitySharePostId}
            onOpenDetail={openDetail}
          />
          </div>
        ))}
      </div>

      {!loading && visiblePosts.length > 0 && (
        <PageControls
          page={currentPageInfo.page}
          totalPages={currentPageInfo.totalPages}
          onChange={movePage}
        />
      )}

        {showCreate && <CreateShareModal location={location} onClose={() => setShowCreate(false)} onCreated={refresh} />}
        {groupPreviewPosts.length > 0 && (
          <ShareGroupPreviewModal
            posts={groupPreviewPosts}
            onClose={() => setGroupPreviewPosts([])}
            onOpenDetail={openDetail}
          />
        )}
        {detailPost && (
          <ShareDetailModal
            post={detailPost}
            busy={busyId === detailPost.communitySharePostId}
            onClose={() => setDetailPost(null)}
            onJoin={(id) => runAction(id, communityShareApi.join)}
            onCancelJoin={(id) => runAction(id, communityShareApi.cancelJoin)}
            onClosePost={(id) => runAction(id, communityShareApi.close)}
            onCancelPost={(id) => runAction(id, communityShareApi.cancel)}
          />
        )}
      </div>
    </div>
  );
}
