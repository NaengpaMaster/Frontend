import {useState, useEffect} from 'react';
import {BarChart3, ChevronRight, Zap, TrendingDown, User, X} from 'lucide-react';
import {
    getDaysUntilExpiry, getExpiryStatus, getDayLabel,
    STATUS_COLORS, C,
    CATEGORY_EMOJIS,
    GRADE_TABLE,
} from '@/shared/data/mockData';
import {CATEGORY_NAMES} from '@/domains/fridge/store/useIngredientStore';
import {statsApi} from '@/apis/statsApi';
import {scoreApi} from '@/apis/scoreApi';

const SCORE_REASON_META = {
    EXPIRED_PRODUCT: {icon: null, meta: '냉장고 만료 1일 방치 페널티'},
    NO_EXPIRED_4DAYS: {icon: '✅', meta: '4일 연속 냉장고 방어 보너스'},
    RECIPE_CREATED: {icon: '📒', meta: '냉파 레시피 1건 등록 보상'}
};

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

function ScoreDetailModal({
                              score,
                              grade,
                              onClose,
                          }) {

    const [scoreHistory, setScoreHistory] = useState([]);

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

                <div style={{flex: 1, overflowY: 'auto', padding: '20px'}}>
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
                            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
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
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: C.fg,
                                        lineHeight: 1.25,
                                    }}>{label}</div>
                                    <div style={{
                                        fontSize: '9px',
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
                        <div style={{fontSize: '11px', color: C.fgMuted, marginTop: '14px'}}>ⓘ 만료/유지점수는 매일 00:00에 반영 되며, 레시피 등록 점수는 즉시 반영 됩니다.
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
                              discardedItems,
                              onNavigate,
                              onOpenMyPage,
                              onOpenRecipe
                          }) {
    const [showScoreDetail, setShowScoreDetail] = useState(false);
    const [showStatsDetail, setShowStatsDetail] = useState(false);
    const sorted = [...ingredients].sort(
        (a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate)
    );

    const urgent = sorted.filter((i) => {
        const d = getDaysUntilExpiry(i.expiryDate);
        return d <= 3 && d >= 0;
    });
    const expired = sorted.filter((i) => getDaysUntilExpiry(i.expiryDate) < 0);

    const [wasteScore, setWasteScore] = useState(0);

    useEffect(() => {
        let alive = true;
        scoreApi.getScore()
            .then((data) => {
                if (alive) setWasteScore(data.score);
            })
            .catch(() => {
                if (alive) setWasteScore(0);
            });
        return () => {
            alive = false;
        };
    }, []);

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
        </div>
    );
}
