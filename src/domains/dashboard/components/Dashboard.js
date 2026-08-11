import {useState, useEffect} from 'react';
import {BarChart3, Bot, ChevronRight, Zap, TrendingDown, User, Users, X} from 'lucide-react';
import {
    getDaysUntilExpiry, getExpiryStatus, getDayLabel,
    STATUS_COLORS, C,
    CATEGORY_EMOJIS,
    GRADE_TABLE,
} from '@/shared/data/mockData';
import {CATEGORY_NAMES} from '@/domains/fridge/store/useIngredientStore';
import {statsApi} from '@/apis/statsApi';
import {scoreApi} from '@/apis/scoreApi';
import {InquiryChatModal} from '@/domains/inquiry/components/InquiryChatModal';

const SCORE_REASON_META = {
    EXPIRED_PRODUCT: {icon: null, meta: '냉장고 만료 재료 1일 방치 페널티'},
    NO_EXPIRED_4DAYS: {icon: '✅', meta: '4일 연속 냉장고 방어 보너스'},
    RECIPE_CREATED: {icon: '📒', meta: '냉파 레시피 1건 등록 보상'}
};

const SCORE_ANALYSIS_REASON_LABELS = {
    EXPIRED_PRODUCT: '재료 만료 방치',
    NO_EXPIRED_4DAYS: '만료 방어 성공',
    RECIPE_CREATED: '냉파 레시피 등록',
    QUIZ_CORRECT: '오늘의 퀴즈 정답',
};

const SCORE_ANALYSIS_REASON_ORDER = Object.keys(SCORE_ANALYSIS_REASON_LABELS);

function formatSignedScore(n) {
    if (n > 0) return `+${n}점`;
    if (n < 0) return `${n}점`;
    return '0점';
}

function SkeletonBlock({width = '100%', height = '12px', style = {}}) {
    return (
        <div
            className="score-analysis-skeleton"
            style={{width, height, borderRadius: '6px', ...style}}
        />
    );
}

function highlightKeywords(text, keywordColors = {
    '레시피': {bg: '#FDECEA', color: '#E4572E'},
    '냉장고': {bg: '#D6F5E3', color: '#0E8478'},
}) {
    if (!text) return text;
    const keywords = Object.keys(keywordColors);
    const pattern = new RegExp(`(${keywords.join('|')})`, 'g');
    const parts = text.split(pattern);

    return parts.map((part, idx) => {
        const style = keywordColors[part];
        if (!style) return part;

        return (
            <span
                key={idx}
                style={{
                    background: style.bg,
                    color: style.color,
                    fontWeight: 800,
                    borderRadius: '4px',
                    padding: '0 3px',
                }}
            >
                {part}
            </span>
        );
    });
}

function DayBadge({expiryDate}) {
    const days = getDaysUntilExpiry(expiryDate);
    const status = getExpiryStatus(days);
    const colors = STATUS_COLORS[status];
    return (
        <span
            style={{
                background: colors.bg,
                color: colors.text,
                borderRadius: '20px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
            }}
        >
      {getDayLabel(days)}
    </span>
    );
}

function SectionLabel({children}) {
    return (
        <div style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: C.fgMuted,
            textTransform: 'uppercase',
            marginBottom: '12px'
        }}>
            {children}
        </div>
    );
}

function getGradeEntry(score) {
    return (
        [...GRADE_TABLE].reverse().find((g) => score >= g.minScore) ?? GRADE_TABLE[0]
    );
}

function getGradeEmoji(score) {
    return getGradeEntry(score).emoji;
}

function formatDateDot(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
}

function getThisMonthRangeLabel() {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return `${formatDateDot(monthStart)} ~ ${formatDateDot(today)}`;
}

function getGradeProgress(score) {
    const currentIndex = GRADE_TABLE.reduce((acc, g, i) => (score >= g.minScore ? i : acc), 0);
    const current = GRADE_TABLE[currentIndex];
    const next = GRADE_TABLE[currentIndex + 1] ?? null;
    const rangeMin = current.minScore;
    const rangeMax = next ? next.minScore : current.maxScore;
    const percentage = Math.min(100, Math.max(0, ((score - rangeMin) / (rangeMax - rangeMin)) * 100));
    const pointsToNext = next ? Math.max(0, next.minScore - score) : 0;
    return {next, rangeMin, rangeMax, percentage, pointsToNext};
}

function EmptyNotice({children}) {
    return (
        <div style={{
            color: C.fgMuted,
            fontSize: '13px',
            textAlign: 'center',
            padding: '20px 0',
        }}>
            {children}
        </div>
    );
}

function ScoreAnalysisTab({cardStyle}) {
    const [highlight, setHighlight] = useState({status: 'loading', data: null});
    const [byReason, setByReason] = useState({status: 'loading', data: []});
    const [summary, setSummary] = useState({status: 'loading', data: null});

    useEffect(() => {
        let alive = true;

        scoreApi.getAnalysisHighlight()
            .then((data) => {
                if (!alive) return;
                setHighlight({status: data ? 'ready' : 'empty', data: data ?? null});
            })
            .catch(() => {
                if (alive) setHighlight({status: 'error', data: null});
            });

        scoreApi.getAnalysisByReason()
            .then((data) => {
                if (!alive) return;
                const list = data ?? [];
                setByReason({status: list.length === 0 ? 'empty' : 'ready', data: list});
            })
            .catch(() => {
                if (alive) setByReason({status: 'error', data: []});
            });

        scoreApi.getAnalysisSummary()
            .then((data) => {
                if (!alive) return;
                const isEmpty = !data || (!data.totalGained && !data.totalLost && !data.netChange);
                setSummary({status: isEmpty ? 'empty' : 'ready', data: data ?? null});
            })
            .catch(() => {
                if (alive) setSummary({status: 'error', data: null});
            });

        return () => {
            alive = false;
        };
    }, []);

    const sortedByReason = [...byReason.data].sort(
        (a, b) => SCORE_ANALYSIS_REASON_ORDER.indexOf(a.scoreReason) - SCORE_ANALYSIS_REASON_ORDER.indexOf(b.scoreReason)
    );
    const maxAbsDelta = Math.max(1, ...sortedByReason.map((item) => Math.abs(item.totalDelta)));

    return (
        <>
            <div style={{marginBottom: '18px'}}>
                <div style={{fontSize: '14px', fontWeight: 700, color: C.fg, marginBottom: '4px'}}>
                    이번 달 점수 분석
                </div>
                <div style={{fontSize: '12px', fontWeight: 500, color: C.fgSubtle}}>
                    {getThisMonthRangeLabel()}
                </div>
            </div>

            <div style={{
                background: C.primaryLight,
                border: `1px solid ${C.primaryMid}`,
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '14px',
            }}>
                <span style={{fontSize: '18px', flexShrink: 0}}>🏆</span>
                <div style={{minWidth: 0, flex: 1}}>
                    <div style={{fontSize: '11px', fontWeight: 700, color: C.primary, marginBottom: '2px'}}>
                        이번 달 최대 영향 사유
                    </div>
                    {highlight.status === 'loading' ? (
                        <SkeletonBlock width="150px" height="15px"/>
                    ) : highlight.status === 'ready' ? (
                        <div style={{fontSize: '13px', fontWeight: 700, color: C.fg}}>
                            {SCORE_ANALYSIS_REASON_LABELS[highlight.data.scoreReason] ?? highlight.data.scoreReason}
                            {' · '}{highlight.data.count}건{' · '}{formatSignedScore(highlight.data.totalDelta)}
                        </div>
                    ) : (
                        <div style={{fontSize: '13px', fontWeight: 600, color: C.fgMuted}}>
                            {highlight.status === 'error' ? '하이라이트를 불러오지 못했어요' : '아직 하이라이트가 없어요'}
                        </div>
                    )}
                </div>
            </div>

            <div style={{...cardStyle, marginBottom: '14px'}}>
                <div style={{fontSize: '14px', fontWeight: 700, color: C.fg, marginBottom: '14px'}}>
                    사유별 점수 획득 현황
                </div>
                {byReason.status === 'loading' ? (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i}>
                                <SkeletonBlock width="96px" height="11px" style={{marginBottom: '8px'}}/>
                                <SkeletonBlock width="100%" height="10px" style={{borderRadius: '999px'}}/>
                            </div>
                        ))}
                    </div>
                ) : byReason.status === 'ready' ? (
                    <div>
                        {sortedByReason.map((item, idx) => {
                            const width = (Math.abs(item.totalDelta) / maxAbsDelta) * 50;
                            const isPositive = item.totalDelta >= 0;
                            return (
                                <div key={item.scoreReason}
                                     style={{marginBottom: idx < sortedByReason.length - 1 ? '14px' : 0}}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'baseline',
                                        marginBottom: '6px',
                                    }}>
                                        <span style={{fontSize: '12px', fontWeight: 700, color: C.fg}}>
                                            {SCORE_ANALYSIS_REASON_LABELS[item.scoreReason] ?? item.scoreReason}
                                        </span>
                                        <span style={{fontSize: '11px', fontWeight: 600, color: C.fgMuted}}>
                                            {item.count}건 · {formatSignedScore(item.totalDelta)}
                                        </span>
                                    </div>
                                    <div style={{
                                        position: 'relative',
                                        height: '10px',
                                        background: C.surface,
                                        borderRadius: '999px',
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            left: '50%',
                                            top: 0,
                                            bottom: 0,
                                            width: '1px',
                                            background: C.border,
                                        }}/>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            bottom: 0,
                                            borderRadius: isPositive ? '0 999px 999px 0' : '999px 0 0 999px',
                                            background: isPositive ? C.primary : C.accent,
                                            ...(isPositive
                                                ? {left: '50%', width: `${width}%`}
                                                : {right: '50%', width: `${width}%`}),
                                        }}/>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyNotice>
                        {byReason.status === 'error' ? '데이터를 불러오지 못했어요' : '아직 점수 변동 기록이 없어요'}
                    </EmptyNotice>
                )}
            </div>

            <div style={{...cardStyle, marginBottom: '14px'}}>
                <div style={{fontSize: '14px', fontWeight: 700, color: C.fg, marginBottom: '14px'}}>
                    이번 달 점수 변동 요약
                </div>
                {summary.status === 'loading' ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        gap: '8px',
                    }}>
                        {[0, 1, 2].map((i) => (
                            <div key={i} style={{
                                background: C.surface,
                                border: `1px solid ${C.border}`,
                                borderRadius: '14px',
                                padding: '14px 6px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                            }}>
                                <SkeletonBlock width="34px" height="9px"/>
                                <SkeletonBlock width="42px" height="16px"/>
                            </div>
                        ))}
                    </div>
                ) : summary.status === 'ready' ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        gap: '8px',
                    }}>
                        {[
                            {label: '총 획득', value: `+${summary.data.totalGained}점`, color: C.primary, bg: '#F3FBFA'},
                            {
                                label: '총 감점',
                                value: `${summary.data.totalLost > 0 ? '-' : ''}${summary.data.totalLost}점`,
                                color: C.accent,
                                bg: '#FDF4F3'
                            },
                            {label: '순변동', value: formatSignedScore(summary.data.netChange), color: C.fg, bg: C.surface},
                        ].map(({label, value, color, bg}) => (
                            <div key={label} style={{
                                background: bg,
                                border: `1px solid ${C.border}`,
                                borderRadius: '14px',
                                padding: '14px 6px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px',
                                textAlign: 'center',
                            }}>
                                <div style={{fontSize: '11px', fontWeight: 700, color: C.fgMuted}}>{label}</div>
                                <div style={{fontSize: '18px', fontWeight: 900, color}}>{value}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyNotice>
                        {summary.status === 'error' ? '데이터를 불러오지 못했어요' : '아직 점수 변동 기록이 없어요'}
                    </EmptyNotice>
                )}
            </div>
        </>
    );
}

function ScoreDetailModal({
                              score,
                              grade,
                              onClose,
                          }) {

    const [scoreHistory, setScoreHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('score');

    useEffect(() => {
        let alive = true;

        scoreApi.getScoreHistories(7)
            .then((page) => {
                if (!alive) return;
                setScoreHistory(page.content.map((item, idx) => {
                    const reasonMeta = SCORE_REASON_META[item.scoreReason] ?? {icon: '✅', meta: ''};
                    const icon = item.scoreReason === 'EXPIRED_PRODUCT'
                        ? CATEGORY_EMOJIS[
                        CATEGORY_NAMES[item.productCategoryId] || '기타']
                        : reasonMeta.icon;
                    const title = item.scoreReason === 'NO_EXPIRED_4DAYS'
                        ? '만료 방어 성공' : item.targetName;

                    return {
                        id: idx,
                        icon,
                        title,
                        meta: reasonMeta.meta,
                        date: item.createdAt?.slice(0, 10) ?? "",
                        score: item.scoreDelta,
                    };
                }));

            })
            .catch(() => {
                if (alive) setScoreHistory([]);
            });
        return () => {
            alive = false;
        };
    }, []);

    const {next, rangeMax, percentage, pointsToNext} = getGradeProgress(score);

    const cardStyle = {
        background: C.card,
        borderRadius: '18px',
        padding: '18px',
        boxShadow: '0 8px 24px rgba(17,32,29,0.08)',
    };
    const policyItems = [
        {
            label: '재료 만료 방치',
            subtitle: '냉장고 속 재료가 만료된 후 하루가 지날 때마다',
            point: '-2점',
            isPlus: false,
        },
        {
            label: '만료 방어 성공',
            subtitle: '만료 재료 없이 4일 연속 냉장고 유지 시',
            point: '+5점',
            isPlus: true,
        },
        {
            label: '냉파 레시피 등록',
            subtitle: '나만의 레시피를 등록할 때마다 즉시',
            point: '+3점',
            isPlus: true,
        },
        {
            label: '오늘의 퀴즈 정답',
            subtitle: '매일 제공되는 냉파 퀴즈를 맞히면 즉시',
            point: '+2점',
            isPlus: true,
        },
    ];

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17,32,29,0.45)',
            zIndex: 160,
            display: 'flex',
            alignItems: 'flex-end'
        }} onClick={onClose}>
            <div
                style={{
                    background: C.bg,
                    borderRadius: '24px 24px 0 0',
                    width: '100%',
                    maxWidth: '480px',
                    margin: '0 auto',
                    maxHeight: '92vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 -18px 60px rgba(17,32,29,0.2)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        padding: '20px',
                        background: C.card,
                        borderBottom: `1px solid ${C.border}`,
                        borderRadius: '24px 24px 0 0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexShrink: 0,
                    }}
                >
                    <div>
                        <div style={{
                            fontSize: '10px',
                            color: C.fgMuted,
                            letterSpacing: '0.1em',
                            fontWeight: 800,
                            marginBottom: '4px'
                        }}>NAENGPA SCORE
                        </div>
                        <div style={{fontSize: '18px', fontWeight: 700, color: C.fg}}>냉파 점수 상세</div>
                    </div>
                    <button onClick={onClose}
                            style={{background: 'none', border: 'none', color: C.fgMuted, cursor: 'pointer'}}><X
                        size={20}/></button>
                </div>

                <div style={{
                    display: 'flex',
                    padding: '0 20px',
                    background: C.card,
                    borderBottom: `1px solid ${C.border}`,
                    flexShrink: 0,
                }}>
                    {[
                        {key: 'score', label: '냉파 점수'},
                        {key: 'analysis', label: '점수 분석'},
                    ].map(({key, label}) => {
                        const isActive = activeTab === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                style={{
                                    flex: 1,
                                    padding: '12px 0',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: `2px solid ${isActive ? C.primary : 'transparent'}`,
                                    color: isActive ? C.primary : C.fgMuted,
                                    fontWeight: isActive ? 700 : 500,
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                <div style={{flex: 1, overflowY: 'auto', padding: '20px'}}>
                    {activeTab === 'analysis' ? (
                        <ScoreAnalysisTab cardStyle={cardStyle}/>
                    ) : (
                    <>
                    <div style={{
                        background: 'linear-gradient(135deg, #0E8478 0%, #049D8E 100%)',
                        color: '#FFF',
                        borderRadius: '20px',
                        padding: '20px',
                        marginBottom: '16px'
                    }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                            <div style={{fontSize: '13px', fontWeight: 900, opacity: 0.9}}>현재 등급</div>
                            <div style={{
                                background: 'rgba(255,255,255,0.2)',
                                borderRadius: '999px',
                                padding: '4px 10px',
                                fontSize: '10px',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                            }}>⚙ 자동 산정
                            </div>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'space-between',
                            gap: '14px',
                            marginTop: '8px'
                        }}>
                            <div>
                                <div style={{fontSize: '22px', fontWeight: 900}}>{getGradeEmoji(score)} {grade}</div>
                                <div style={{fontSize: '11px', opacity: 0.85, marginTop: '4px'}}>
                                    {next ? `다음 등급까지 ${pointsToNext}점 남았어요!` : '최고 등급을 달성했어요!'}
                                </div>
                            </div>
                            <div style={{fontSize: '44px', fontWeight: 900, lineHeight: 0.9}}>{score}<span
                                style={{fontSize: '16px', marginLeft: '3px'}}>점</span></div>
                        </div>

                        <div style={{
                            position: 'relative',
                            height: '16px',
                            background: C.border,
                            borderRadius: '999px',
                            overflow: 'hidden',
                            marginTop: '14px',
                        }}>
                            <div style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%',
                                width: `${percentage}%`,
                                background: '#3DDC97',
                                borderRadius: '999px',
                                transition: 'width 0.3s ease',
                            }}/>
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#FFF',
                                textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                            }}>
                                {score} / {rangeMax}
                            </div>
                        </div>
                    </div>

                    <div style={{...cardStyle, marginBottom: '14px'}}>
                        <div style={{fontSize: '14px', fontWeight: 700, color: C.fg, marginBottom: '12px'}}>등급표</div>


                        <div style={{overflowX: 'auto'}}>
                            <table style={{width: '100%', borderCollapse: 'collapse', minWidth: '360px'}}>
                                <thead>
                                <tr>

                                    {GRADE_TABLE.map(({label, characterImage}) => {
                                        const isCurrent = label === grade;
                                        return (
                                            <th key={label} style={{
                                                padding: '8px 4px',
                                                textAlign: 'center',
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                color: isCurrent ? C.primary : C.fg,
                                                borderBottom: `2px solid ${isCurrent ? C.primary : C.border}`,
                                                whiteSpace: 'nowrap'
                                            }}>
                                                <img
                                                    src={characterImage}
                                                    alt={label}
                                                    style={{
                                                        width: '30px',
                                                        height: '30px',
                                                        display: 'block',
                                                        margin: '0 auto 4px',
                                                        objectFit: 'contain'
                                                    }}
                                                />
                                                {label}
                                            </th>
                                        );
                                    })}
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    {GRADE_TABLE.map(({range, label}) => {
                                        const isCurrent = label === grade;
                                        return (
                                            <td key={range} style={{
                                                padding: '6px 4px',
                                                textAlign: 'center',
                                                fontSize: '9px',
                                                color: isCurrent ? C.primary : C.fgMuted,
                                                fontWeight: isCurrent ? 700 : 500,
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {range}
                                            </td>
                                        );
                                    })}
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div style={{...cardStyle, marginBottom: '14px'}}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '14px'
                        }}>
                            <div style={{fontSize: '14px', fontWeight: 700, color: C.fg}}>자동 점수 정책</div>
                            <div style={{
                                background: '#E6F7F5',
                                color: C.primary,
                                borderRadius: '999px',
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                            }}>✓ 현재 적용 중
                            </div>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: '8px',
                        }}>
                            {policyItems.map(({label, subtitle, point, isPlus}) => (
                                <div key={label} style={{
                                    background: isPlus ? '#F3FBFA' : '#FDF4F3',
                                    border: `1px solid ${C.border}`,
                                    borderRadius: '14px',
                                    padding: '10px 6px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    gap: '5px',
                                }}>
                                    <div style={{
                                        width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                                        background: isPlus ? '#E6F7F5' : '#FDECEA',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '13px', fontWeight: 900, color: isPlus ? C.primary : C.accent,
                                    }}>
                                        {isPlus ? '+' : '−'}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: C.fg,
                                        lineHeight: 1.25,
                                    }}>{label}</div>
                                    <div style={{
                                        fontSize: '10px',
                                        color: C.fgMuted,
                                        lineHeight: 1.35,
                                        wordBreak: 'keep-all',
                                        overflowWrap: 'break-word'
                                    }}>{highlightKeywords(subtitle)}</div>
                                    <div style={{
                                        fontSize: '13px',
                                        fontWeight: 900,
                                        color: isPlus ? C.primary : C.accent,
                                        marginTop: '2px',
                                    }}>{point}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{fontSize: '11px', color: C.fgMuted, marginTop: '14px'}}>ⓘ 만료/유지 점수는 매일 00:00에 반영됩니다.
                        </div>
                        <div style={{fontSize: '11px', color: C.fgMuted, marginTop: '4px'}}>ⓘ 레시피 등록 점수와 퀴즈 정답 점수는 즉시 반영됩니다.
                        </div>
                        <div style={{fontSize: '11px', color: C.fgMuted, marginTop: '4px'}}>ⓘ 회원 가입 시 초기 점수 10점이 지급 됩니다.
                        </div>
                    </div>

                    <div style={{...cardStyle, marginBottom: '14px'}}>
                        <div style={{fontSize: '14px', fontWeight: 700, color: C.fg, marginBottom: '10px'}}>점수 산정 내역
                        </div>
                        {scoreHistory.length === 0 ? (
                            <div style={{
                                color: C.fgMuted,
                                fontSize: '13px',
                                textAlign: 'center',
                                padding: '20px 0',
                            }}>
                                최근 점수 산정 내역이 없습니다.
                            </div>
                        ) : scoreHistory.map((item) => (
                            <div key={item.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 0',
                                borderBottom: `1px solid ${C.border}`
                            }}>
                                <div style={{display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0}}>
                                    <span style={{
                                        width: '28px',
                                        fontSize: '18px',
                                        textAlign: 'center'
                                    }}>{item.icon}</span>
                                    <div style={{minWidth: 0}}>
                                        <div style={{fontSize: '13px', fontWeight: 700, color: C.fg}}>{item.title}</div>
                                        {(item.meta || item.date) && (
                                            <div style={{fontSize: '11px', color: C.fgMuted, marginTop: '2px'}}>
                                                {highlightKeywords(item.meta)}{item.meta && item.date && ' · '}{item.date}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: '13px',
                                    color: item.score < 0 ? C.accent : C.primary,
                                    fontWeight: 700,
                                    whiteSpace: 'nowrap'
                                }}>{item.score > 0 ? '+' : ''}{item.score}점</span>
                            </div>
                        ))}
                    </div>
                    </>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatsDetailModal({
                              onClose,
                          }) {
    //최근 만료 기록
    const [recentExpired, setRecentExpired] = useState([]);

    useEffect(() => {
        let alive = true;
        statsApi.getExpiredRecords(7)
            .then((items) => {
                if (!alive) return;
                //setRecentExpired(items.slice(0, 5).map((item, idx) => ({
                setRecentExpired(items.map((item, idx) => ({
                    id: idx,
                    name: item.ingredientName,
                    date: item.expiredDate,
                    emoji: CATEGORY_EMOJIS[CATEGORY_NAMES[item.productCategoryId] ?? '기타'],
                })));
            })
            .catch(() => {
                if (alive) setRecentExpired([]);
            });
        return () => {
            alive = false;
        };
    }, []);

    //카테고리별 만료량
    const [categoryCounts, setCategoryCounts] = useState([]);

    useEffect(() => {
        let alive = true;
        statsApi.getExpiredCategories(7)
            .then((items) => {
                if (!alive) return;
                setCategoryCounts(items.map((item) => ({name: item.categoryName, count: item.expiredCount})));
            })
            .catch(() => {
                if (alive) setCategoryCounts([]);
            });
        return () => {
            alive = false;
        };
    }, []);

    //가장 많이 만료된 재료 TOP 5
    const [topExpired, setTopExpired] = useState([]);

    useEffect(() => {
        let alive = true;
        statsApi.getTopExpiredIngredients(7)
            .then((items) => {
                if (!alive) return;
                setTopExpired(items.map((item) => [item.ingredientName, item.expiredCount]));
            })
            .catch(() => {
                if (alive) setTopExpired([]);
            });
        return () => {
            alive = false;
        };
    }, []);


    const maxCategoryCount = Math.max(...categoryCounts.map((item) => item.count), 1);
    const cardStyle = {
        background: C.card,
        borderRadius: '18px',
        padding: '18px',
        boxShadow: '0 8px 24px rgba(17,32,29,0.08)',
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17,32,29,0.45)',
            zIndex: 160,
            display: 'flex',
            alignItems: 'flex-end'
        }} onClick={onClose}>
            <div
                style={{
                    background: C.bg,
                    borderRadius: '24px 24px 0 0',
                    width: '100%',
                    maxWidth: '480px',
                    margin: '0 auto',
                    maxHeight: '92vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 -18px 60px rgba(17,32,29,0.2)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        padding: '20px',
                        background: C.card,
                        borderBottom: `1px solid ${C.border}`,
                        borderRadius: '24px 24px 0 0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexShrink: 0,
                    }}
                >
                    <div>
                        <div style={{
                            fontSize: '10px',
                            color: C.fgMuted,
                            letterSpacing: '0.1em',
                            fontWeight: 800,
                            marginBottom: '4px'
                        }}>NAENGPA STATS
                        </div>
                        <div style={{fontSize: '18px', fontWeight: 700, color: C.fg}}>냉파 통계</div>
                        <div style={{fontSize: '11px', color: C.fgMuted, marginTop: '10px'}}>ⓘ 집계 기준 : 최근 7일</div>
                    </div>
                    <button onClick={onClose}
                            style={{background: 'none', border: 'none', color: C.fgMuted, cursor: 'pointer'}}><X
                        size={20}/></button>
                </div>

                <div style={{flex: 1, overflowY: 'auto', padding: '20px'}}>
                    <div style={{...cardStyle, marginBottom: '14px'}}>
                        <div style={{fontSize: '14px', fontWeight: 700, color: C.fg, marginBottom: '10px'}}>가장 많이 만료된 재료
                            TOP 5
                        </div>
                        {topExpired.length === 0 ? (
                            <div style={{
                                color: C.fgMuted,
                                fontSize: '13px',
                                textAlign: 'center',
                                padding: '20px 0',
                            }}>
                                최근 만료된 재료가 없습니다.
                            </div>
                        ) : topExpired.map(([name, count], idx) => (
                            <div key={name} style={{
                                display: 'grid',
                                gridTemplateColumns: '24px 1fr auto',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '8px 0'
                            }}>
                                <div style={{
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: idx === 0 ? C.accent : C.fgMuted
                                }}>{idx + 1}</div>
                                <div style={{fontSize: '13px', fontWeight: 700, color: C.fg}}>{name}</div>
                                <div style={{
                                    fontSize: '12px',
                                    color: C.fgMuted,
                                    fontWeight: 600,
                                    textAlign: 'right'
                                }}>{count}회
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={cardStyle}>
                        <div style={{fontSize: '14px', fontWeight: 700, color: C.fg, marginBottom: '14px'}}>카테고리별 만료량
                        </div>
                        {categoryCounts.length === 0 ? (
                            <div style={{
                                color: C.fgMuted,
                                fontSize: '13px',
                                textAlign: 'center',
                                padding: '20px 0',
                            }}>
                                최근 만료된 재료가 없습니다.
                            </div>
                        ) : (
                            <div style={{height: '160px', display: 'grid', gridTemplateColumns: '28px 1fr', gap: '10px'}}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    color: C.fgMuted,
                                    fontSize: '11px',
                                    fontWeight: 600
                                }}>
                                    {[4, 3, 2, 1, 0].map((n) => <span
                                        key={n}>{Math.round((maxCategoryCount * n) / 4)}</span>)}
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${categoryCounts.length}, 1fr)`,
                                    alignItems: 'end',
                                    gap: '12px',
                                    borderBottom: `1px solid ${C.border}`,
                                    paddingTop: '4px'
                                }}>
                                    {categoryCounts.map((item) => (
                                        <div key={item.name} style={{textAlign: 'center'}}>
                                            <div style={{
                                                fontSize: '11px',
                                                color: C.fg,
                                                fontWeight: 700,
                                                marginBottom: '6px'
                                            }}>{item.count}</div>
                                            <div style={{
                                                height: `${(item.count / maxCategoryCount) * 112}px`,
                                                background: 'linear-gradient(180deg, #069B8D, #0E8478)',
                                                borderRadius: '2px 2px 0 0'
                                            }}/>
                                            <div style={{
                                                fontSize: '11px',
                                                color: C.fgMuted,
                                                marginTop: '8px',
                                                whiteSpace: 'nowrap'
                                            }}>{item.name}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{...cardStyle, marginTop: '14px'}}>
                        <div style={{fontSize: '14px', fontWeight: 700, color: C.fg, marginBottom: '10px'}}>최근 만료 기록
                        </div>
                        <div style={{maxHeight: '280px', overflowY: 'auto', paddingRight: '8px'}}>
                            {recentExpired.length === 0 ? (
                                <div style={{
                                    color: C.fgMuted,
                                    fontSize: '13px',
                                    textAlign: 'center',
                                    padding: '20px 0',
                                }}>
                                    최근 만료된 재료가 없습니다.
                                </div>
                            ) : recentExpired.map((d) => (
                                <div key={d.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 0',
                                    borderBottom: `1px solid ${C.border}`
                                }}>
                                    <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                                      <span style={{
                                          fontSize: '16px',
                                          width: '22px',
                                          textAlign: 'center'
                                      }}>{d.emoji}</span>
                                        <div style={{fontSize: '13px', fontWeight: 700, color: C.fg}}>{d.name}</div>
                                    </div>

                                    <span style={{fontSize: '11px', color: C.fgMuted}}>{d.date}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


export function Dashboard({
                              ingredients,
                              homeRecipes,
                              homeRecipesTotal,
                              urgentHomeRecipes,
                              currentUser,
                              fridgeInfo,
                              subscriptionStatus,
                              familyInvites = [],
                              loading = false,
                              discardedItems,
                              onNavigate,
                              onOpenMyPage,
                              onOpenFamilyManagement,
                              onAcceptFamilyInvite,
                              onRejectFamilyInvite,
                              onOpenRecipe
                          }) {
    const [showScoreDetail, setShowScoreDetail] = useState(false);
    const [showStatsDetail, setShowStatsDetail] = useState(false);
    const [showInquiryChat, setShowInquiryChat] = useState(false);
    const [wasteScore, setWasteScore] = useState(null);
    const [scoreLoading, setScoreLoading] = useState(true);
    const sorted = [...ingredients].sort(
        (a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate)
    );

    const urgent = sorted.filter((i) => {
        const d = getDaysUntilExpiry(i.expiryDate);
        return d <= 3 && d >= 0;
    });
    const expired = sorted.filter((i) => getDaysUntilExpiry(i.expiryDate) < 0);

    useEffect(() => {
        let alive = true;
        setScoreLoading(true);
        scoreApi.getScore()
            .then((data) => {
                if (alive) setWasteScore(data.score);
            })
            .catch(() => {
                if (alive) setWasteScore(0);
            })
            .finally(() => {
                if (alive) setScoreLoading(false);
            });
        return () => {
            alive = false;
        };
    }, []);

    if (loading || scoreLoading) {
        return (
            <div style={{
                minHeight: '100%',
                display: 'grid',
                placeItems: 'center',
                padding: '40px 20px',
                background: C.bg,
            }}>
                <div className="home-loading-card" role="status" aria-live="polite">
                    <div className="home-loading-spinner" aria-hidden="true"/>
                    <div style={{color: C.fg, fontSize: '15px', fontWeight: 900}}>
                        홈 정보를 불러오는 중
                    </div>
                    <div className="home-loading-dots" aria-hidden="true">
                        <span/>
                        <span/>
                        <span/>
                    </div>
                </div>
            </div>
        );
    }

    const isPremium = subscriptionStatus?.premium;
    const gradeEntry = getGradeEntry(wasteScore);
    const grade = gradeEntry.label;


    return (
        <div style={{padding: '0 0 24px', background: C.bg}}>
            {/* Header */}
            <div
                style={{
                    padding: '20px 20px 16px',
                    background: C.card,
                    borderBottom: `1px solid ${C.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                }}
            >
                <div style={{display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0}}>
                    <div
                        style={{
                            width: '96px',
                            height: '96px',
                            borderRadius: '26px',
                            background: C.primaryLight,
                            border: '1px solid rgb(179, 225, 217)',
                            boxShadow: '0 10px 24px rgba(14,132,120,0.14)',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                            overflow: 'hidden',
                        }}
                    >
                        <img
                            src={gradeEntry.characterImage}
                            alt={`${grade} 캐릭터`}
                            style={{
                                width: '110px',
                                height: '110px',
                                objectFit: 'contain',
                                objectPosition: 'center',
                            }}
                        />
                    </div>
                    <div style={{minWidth: 0}}>
                        <div style={{
                            fontSize: '20px',
                            fontWeight: 900,
                            color: C.fg,
                            lineHeight: 1.2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            flexWrap: 'wrap'
                        }}>
                            <span>안녕하세요,</span>
                            <span
                                style={{
                                    color: 'rgb(14, 132, 120)',
                                    fontWeight: 900,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                {grade}
              </span>
                        </div>
                        <div style={{
                            fontSize: '17px',
                            fontWeight: 800,
                            color: C.fgMuted,
                            lineHeight: 1.35,
                            marginTop: '2px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {currentUser.name}님
                        </div>
                    </div>
                </div>
                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                    <button
                        onClick={() => setShowScoreDetail(true)}
                        style={{
                            width: '58px',
                            height: '58px',
                            background: C.primaryLight,
                            color: C.primary,
                            borderRadius: '14px',
                            border: `1px solid ${C.primaryMid}`,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                            flexShrink: 0,
                        }}
                    >
                        <div style={{fontSize: '20px', fontWeight: 900, lineHeight: 1}}>{wasteScore}<span
                            style={{fontSize: '9px', marginLeft: '1px'}}>점</span></div>
                        <div style={{fontSize: '10px', fontWeight: 700, letterSpacing: '0.02em'}}>냉파점수</div>
                    </button>
                    <button
                        onClick={() => setShowStatsDetail(true)}
                        style={{
                            width: '58px',
                            height: '58px',
                            background: C.primaryLight,
                            color: C.primary,
                            borderRadius: '14px',
                            border: `1px solid ${C.primaryMid}`,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            flexShrink: 0,
                        }}
                    >
                        <BarChart3 size={18} strokeWidth={2.5}/>
                        <div style={{fontSize: '10px', fontWeight: 700}}>통계</div>
                    </button>
                    <button
                        onClick={onOpenMyPage}
                        style={{
                            width: '42px',
                            height: '42px',
                            background: C.surface,
                            border: `1px solid ${C.border}`,
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: C.fgMuted,
                            flexShrink: 0,
                        }}
                    >
                        <User size={18}/>
                    </button>
                    {isPremium && (
                        <button
                            onClick={onOpenFamilyManagement}
                            style={{
                                height: '42px',
                                padding: '0 12px',
                                background: C.primaryLight,
                                border: `1px solid ${C.primaryMid}`,
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                cursor: 'pointer',
                                color: C.primary,
                                fontSize: '11px',
                                fontWeight: 900,
                                flexShrink: 0,
                            }}
                        >
                            <Users size={15}/>
                            가족관리
                        </button>
                    )}
                </div>
            </div>

            {showScoreDetail && (
                <ScoreDetailModal
                    score={wasteScore}
                    grade={grade}
                    onClose={() => setShowScoreDetail(false)}
                />
            )}
            {showStatsDetail && (
                <StatsDetailModal
                    onClose={() => setShowStatsDetail(false)}
                />
            )}


            {familyInvites.length > 0 && (
                <div style={{padding: '12px 20px', background: C.primaryLight, borderBottom: `1px solid ${C.primaryMid}`}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <Users size={16} color={C.primary}/>
                        <div style={{flex: 1, minWidth: 0}}>
                            <div style={{fontSize: '13px', fontWeight: 900, color: C.primary}}>
                                가족 냉장고 공유 신청이 도착했어요
                            </div>
                            <div style={{fontSize: '11px', color: C.fgMuted, marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                {familyInvites[0].inviterNickname || familyInvites[0].inviterEmail}님의 냉장고 초대
                                {familyInvites.length > 1 ? ` 외 ${familyInvites.length - 1}건` : ''}
                            </div>
                        </div>
                        <button
                            onClick={() => onAcceptFamilyInvite?.(familyInvites[0].fridgeInviteId)}
                            style={{padding: '8px 10px', border: 'none', borderRadius: '12px', background: C.primary, color: '#FFFFFF', fontSize: '11px', fontWeight: 900, cursor: 'pointer', flexShrink: 0}}
                        >
                            수락
                        </button>
                        <button
                            onClick={() => onRejectFamilyInvite?.(familyInvites[0].fridgeInviteId)}
                            style={{padding: '8px 10px', border: `1px solid ${C.border}`, borderRadius: '12px', background: C.card, color: C.fgMuted, fontSize: '11px', fontWeight: 900, cursor: 'pointer', flexShrink: 0}}
                        >
                            거절
                        </button>
                    </div>
                </div>
            )}

            {/* Urgent alert strip */}
            {urgent.length > 0 && (
                <button
                    onClick={() => onNavigate('fridge')}
                    style={{
                        width: '100%',
                        background: C.accentLight,
                        borderTop: 'none',
                        borderBottom: `1px solid ${C.accent}30`,
                        borderLeft: 'none',
                        borderRight: 'none',
                        padding: '11px 20px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                    }}
                >
                    <Zap size={14} color={C.accent} fill={C.accent}/>
                    <span style={{fontSize: '12px', color: C.accent, fontWeight: 700, flex: 1}}>
            지금 먹어야 해요! —&nbsp;
                        {urgent.map((i) => `${i.name} (D-${getDaysUntilExpiry(i.expiryDate)})`).join(' · ')}
          </span>
                    <ChevronRight size={14} color={C.accent}/>
                </button>
            )}

            <div className="dash-grid">
                <div className="dash-col-left">
                    {/* Stats */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        background: C.card,
                        borderBottom: `1px solid ${C.border}`
                    }}>
                        {[
                            {label: '전체 재료', value: ingredients.length, color: C.fg, tab: 'fridge'},
                            {
                                label: '임박 재료',
                                value: urgent.length + expired.length,
                                color: urgent.length + expired.length > 0 ? C.accent : C.primary,
                                tab: 'fridge'
                            },
                            {label: '가능 레시피', value: homeRecipesTotal, color: C.primary, tab: 'recipe'},
                        ].map((stat, i) => (
                            <button
                                key={stat.label}
                                onClick={() => onNavigate(stat.tab)}
                                style={{
                                    padding: '18px 12px',
                                    textAlign: 'center',
                                    background: 'none',
                                    border: 'none',
                                    borderRight: i < 2 ? `1px solid ${C.border}` : 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{
                                    fontSize: '30px',
                                    fontWeight: 900,
                                    color: stat.color,
                                    lineHeight: 1
                                }}>{stat.value}</div>
                                <div style={{
                                    fontSize: '9px',
                                    color: C.fgSubtle,
                                    marginTop: '4px',
                                    letterSpacing: '0.04em'
                                }}>{stat.label}</div>
                            </button>
                        ))}
                    </div>

                    {/* Urgent recipe recs */}
                    {urgentHomeRecipes.length > 0 && (
                        <div style={{padding: '20px 20px 0'}}>
                            <div style={{
                                fontSize: '16px',
                                fontWeight: 700,
                                color: C.fg,
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{color: C.accent}}>⚡</span> 임박 재료 활용 추천
                            </div>
                            <div className="card-grid">
                                {urgentHomeRecipes.map((r) => (
                                    <button
                                        key={r.id}
                                        onClick={() => onOpenRecipe(r.id)}
                                        className="card-hover"
                                        style={{
                                            background: C.card,
                                            borderLeft: `4px solid ${C.accent}`,
                                            borderRadius: '8px 16px 16px 8px',
                                            padding: '14px 16px',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            width: '100%',
                                            boxShadow: '0 2px 10px rgba(17,32,29,0.08)',
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            gap: '12px'
                                        }}>
                                            <span
                                                style={{fontWeight: 700, color: C.fg, fontSize: '14px'}}>{r.name}</span>
                                            <span style={{
                                                fontSize: '12px',
                                                color: C.fgMuted,
                                                whiteSpace: 'nowrap'
                                            }}>{r.cookTime}분</span>
                                        </div>
                                        {r.missingIngredients.length > 0 && (
                                            <div style={{
                                                fontSize: '12px',
                                                color: C.fgMuted,
                                                marginTop: '4px'
                                            }}>부족: {r.missingIngredients.join(', ')}</div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Available recipes */}
                    <div style={{padding: '20px 20px 0'}}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px'
                        }}>
                            <div style={{fontSize: '16px', fontWeight: 700, color: C.fg}}>지금 가능한 레시피</div>
                            <button onClick={() => onNavigate('recipe')} style={{
                                fontSize: '13px',
                                color: C.primary,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 700
                            }}>
                                전체보기 →
                            </button>
                        </div>
                        {homeRecipes.length === 0 ? (
                            <div style={{
                                color: C.fgMuted,
                                fontSize: '13px',
                                textAlign: 'center',
                                padding: '20px 0',
                                background: C.card,
                                borderRadius: '16px',
                                boxShadow: '0 2px 10px rgba(17,32,29,0.08)'
                            }}>
                                재료를 더 등록하면 레시피를 추천해드려요
                            </div>
                        ) : (
                            <div className="card-grid">
                                {homeRecipes.map((r) => (
                                    <button
                                        key={r.id}
                                        onClick={() => onOpenRecipe(r.id)}
                                        className="card-hover"
                                        style={{
                                            background: C.card,
                                            borderRadius: '14px',
                                            padding: '12px 16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            cursor: 'pointer',
                                            width: '100%',
                                            textAlign: 'left',
                                            boxShadow: '0 2px 10px rgba(17,32,29,0.08)',
                                        }}
                                    >
                                        <div style={{flex: 1}}>
                                            <div style={{fontWeight: 700, color: C.fg, fontSize: '14px'}}>{r.name}</div>
                                            <div style={{fontSize: '12px', color: C.fgMuted, marginTop: '3px'}}>
                                                {r.difficulty} · {r.cookTime}분
                                                {r.missingIngredients.length > 0 && ` · 부족: ${r.missingIngredients.join(', ')}`}
                                            </div>
                                        </div>
                                        <ChevronRight size={16} color={C.fgSubtle}/>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{padding: '20px 20px 20px'}}>
                        <button
                            type="button"
                            onClick={() => setShowInquiryChat(true)}
                            className="card-hover"
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 16px',
                                border: `1px solid ${C.primaryMid}`,
                                borderRadius: '16px',
                                background: C.primaryLight,
                                color: C.fg,
                                cursor: 'pointer',
                                textAlign: 'left',
                            }}
                        >
                            <span style={{width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: '12px', background: C.card, color: C.primary}}>
                                <Bot size={20}/>
                            </span>
                            <span style={{flex: 1}}>
                                <span style={{display: 'block', fontSize: '14px', fontWeight: 800}}>서비스 이용이 궁금한가요?</span>
                                <span style={{display: 'block', marginTop: '3px', fontSize: '12px', color: C.fgMuted}}>문의 AI 챗봇에게 바로 물어보세요.</span>
                            </span>
                            <ChevronRight size={17} color={C.primary}/>
                        </button>
                    </div>

                </div>

                <div className="dash-col-right">
                    {/* Expired warning */}
                    {expired.length > 0 && (
                        <div style={{padding: '16px 20px 0'}}>
                            <div style={{
                                background: C.dangerLight,
                                borderRadius: '16px',
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <TrendingDown size={16} color={C.danger}/>
                                <div>
                                    <div style={{fontSize: '12px', fontWeight: 700, color: C.danger}}>기한 만료 재료</div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: C.fgMuted,
                                        marginTop: '2px'
                                    }}>{expired.map((i) => i.name).join(', ')} — 냉장고를 확인해주세요
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent ingredients */}
                    <div style={{padding: '20px 20px 0'}}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px'
                        }}>
                            <SectionLabel>유통기한 임박 재료</SectionLabel>
                            <button onClick={() => onNavigate('fridge')} style={{
                                fontSize: '12px',
                                color: C.primary,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 700
                            }}>
                                냉장고 →
                            </button>
                        </div>
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
                            {sorted.slice(0, 9).map((ingredient) => (
                                <div
                                    key={ingredient.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: C.card,
                                        borderRadius: '20px',
                                        padding: '6px 12px',
                                        boxShadow: '0 3px 10px rgba(17,32,29,0.08)',
                                    }}
                                >
                                    <span style={{fontSize: '13px'}}>{CATEGORY_EMOJIS[ingredient.category]}</span>
                                    <span style={{
                                        fontSize: '12px',
                                        color: C.fg,
                                        fontWeight: 500
                                    }}>{ingredient.name}</span>
                                    <DayBadge expiryDate={ingredient.expiryDate}/>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {showInquiryChat && (
                <InquiryChatModal
                    onClose={() => setShowInquiryChat(false)}
                    onOpenInquiry={() => onNavigate('inquiry')}
                />
            )}
        </div>
    );
}
