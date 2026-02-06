// src/SubRank.tsx
import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  spring,
  interpolate,
  Img,
} from "remotion";
import React, { useState, useRef, useLayoutEffect } from "react";
import {
  PlayIcon,
  LikeIcon,
  CoinIcon,
  DanmakuIcon,
  ReplyIcon,
  ShareIcon,
  StarIcon,
} from "./Icons";

// ------------------------------------------------------------------
// 风格配置
// ------------------------------------------------------------------
const STYLES = {
  colors: {
    bg: "#fffbf0",
    border: "#000000",
    cardBg: "#ffffff",
    cardBorder: "#000000",
    shadow: "rgba(0, 0, 0, 1)",

    play: "#bbdefb",
    fav: "#ffe0b2",
    coin: "#b2ebf2",
    like: "#f8bbd0",
    dan: "#e1bee7",
    rep: "#fff59d",
    share: "#c8e6c9",

    red: "#d50000",
    green: "#2e7d32",
    gray: "#888888",
    darkText: "#222222",
  },
  fontMain:
    '"Microsoft YaHei", "Heiti SC", "Arial Rounded MT Bold", sans-serif',
  fontNum: '"Arial Black", "Impact", sans-serif',
};

// ------------------------------------------------------------------
// 组件：自适应压缩标题 (基于真实DOM宽度)
// ------------------------------------------------------------------
const FitTitle = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const availableWidth = container.clientWidth;
    const actualWidth = textEl.scrollWidth;

    if (actualWidth > availableWidth && availableWidth > 0) {
      setScale(availableWidth / actualWidth);
    } else {
      setScale(1);
    }
  }, [children, style]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        maxWidth: "100%",
        position: "relative",
        ...style,
        display: "block",
      }}
    >
      <div
        style={{
          visibility: "hidden",
          width: "100%",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </div>

      <div
        ref={textRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          whiteSpace: "nowrap",
          transformOrigin: "left center",
          transform: `scaleX(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 组件：单个副榜卡片
// ------------------------------------------------------------------
const SubRankItem = ({ item, index }: { item: any; index: number }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const [imgError, setImgError] = useState(false);

  // 动画配置：入场
  const entrance = spring({
    frame: frame - index * 3,
    fps,
    from: 50,
    to: 0,
    config: { damping: 12 },
  });
  const opacity = interpolate(frame - index * 3, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 动画配置：退场
  const exitStartFrame = durationInFrames - 40;
  const exitVal = interpolate(
    frame,
    [exitStartFrame + index * 2, exitStartFrame + index * 2 + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const exitTranslateY = interpolate(exitVal, [0, 1], [0, 50]);
  const exitOpacity = interpolate(exitVal, [0, 1], [1, 0]);

  const coverSrc = item.image_url || "";
  const isNew = item.rank_before === "-";
  const rankDiff =
    !isNew && item.rank_before ? Number(item.rank_before) - item.rank : 0;

  let trendIcon = "◼";
  let trendColor = STYLES.colors.gray;

  if (isNew) {
    trendIcon = "NEW!!";
    trendColor = STYLES.colors.red;
  } else if (rankDiff > 0) {
    trendIcon = "▲";
    trendColor = STYLES.colors.red;
  } else if (rankDiff < 0) {
    trendIcon = "▼";
    trendColor = STYLES.colors.green;
  }

  // 格式化数字
  const formatNum = (num: number) => new Intl.NumberFormat().format(num);

  // 计算各项数据的最佳排名
  const allRanks = [
    item.view_rank,
    item.favorite_rank,
    item.coin_rank,
    item.like_rank,
    item.danmaku_rank,
    item.reply_rank,
    item.share_rank,
  ]
    .map((r) => parseInt(r))
    .filter((n) => !isNaN(n) && n > 0);

  const minRank = allRanks.length > 0 ? Math.min(...allRanks) : 0;

  return (
    <div
      style={{
        height: 240,
        display: "flex",
        backgroundColor: STYLES.colors.cardBg,
        border: `3px solid ${STYLES.colors.cardBorder}`,
        borderRadius: 16,
        boxShadow: `6px 6px 0 ${STYLES.colors.shadow}`,
        overflow: "hidden",
        width: "100%",
        transform: `translateY(${entrance + exitTranslateY}px)`,
        opacity: opacity * exitOpacity,
        marginBottom: 20,
      }}
    >
      {/* 1. 排名区域 */}
      <div
        style={{
          width: 160,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
          borderRight: "2px solid #e0e0e0",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 16,
          }}
        >
          <div
            style={{
              fontSize: 68,
              lineHeight: 0.9,
              color: STYLES.colors.darkText,
              textShadow: "3px 3px 0 #fff",
              fontFamily: STYLES.fontNum,
              fontWeight: 900,
            }}
          >
            {item.rank}
          </div>
          <div
            style={{
              fontSize: trendIcon === "NEW" ? 24 : 32,
              lineHeight: 1,
              fontFamily: STYLES.fontNum,
              marginTop: 4,
              color: trendColor,
              fontWeight: 900,
            }}
          >
            {trendIcon}
          </div>
          {!isNew && (
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: "#666",
                backgroundColor: "rgba(255, 255, 255, 0.6)",
                padding: "4px 10px",
                borderRadius: 4,
                marginTop: 4,
                fontFamily: STYLES.fontMain,
              }}
            >
              上期 {item.rank_before}
            </div>
          )}
        </div>
        <div
          style={{
            width: "100%",
            height: 42,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
            borderTop: "2px solid #ccc",
            backgroundColor: "#e8e8e8",
            fontSize: 18,
            fontWeight: 900,
            color: "#555",
            fontFamily: STYLES.fontMain,
          }}
        >
          在榜
          <span
            style={{
              fontSize: 28,
              lineHeight: 1,
              color: STYLES.colors.red,
              position: "relative",
              top: -1,
              fontFamily: STYLES.fontNum,
            }}
          >
            {item.count}
          </span>
          次
        </div>
      </div>

      {/* 2. 封面区域 */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          position: "relative",
          borderRight: `3px solid ${STYLES.colors.cardBorder}`,
          backgroundColor: "#ddd",
        }}
      >
        {!imgError && coverSrc ? (
          <Img
            src={coverSrc}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            NO IMG
          </div>
        )}
      </div>

      {/* 3. 内容区域 */}
      <div
        style={{
          flex: 1,
          width: 0,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          padding: "8px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            marginBottom: 4,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              marginBottom: 4,
              overflow: "visible",
            }}
          >
            <FitTitle
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#000",
                fontFamily: STYLES.fontMain,
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}
            >
              {item.title}
            </FitTitle>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              minHeight: 32,
            }}
          >
            <div
              style={{
                flex: 1,
                width: 0,
                minWidth: 0,
                marginRight: 12,
                fontSize: 20,
                color: "#555",
                fontFamily: STYLES.fontMain,
              }}
            >
              <FitTitle
                style={{
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontWeight: "bold",
                    color: "#333",
                    marginRight: 8,
                  }}
                >
                  {item.author}
                </span>
                {item.vocal && <span>feat. {item.vocal}</span>}
              </FitTitle>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {item.honor &&
                item.honor.map((h: string, i: number) => {
                  let badgeStyle = {};
                  if (h === "Emerging Hit!")
                    badgeStyle = {
                      color: "#6A0DAD",
                      backgroundColor: "rgba(106, 13, 173, 0.25)",
                      borderColor: "rgba(106, 13, 173, 0.4)",
                    };
                  else if (h === "Mega Hit!!!")
                    badgeStyle = {
                      color: "#CCA300",
                      backgroundColor: "rgba(204, 163, 0, 0.25)",
                      borderColor: "rgba(255, 163, 0, 0.4)",
                    };
                  else if (h === "门番候补")
                    badgeStyle = {
                      color: "#23AFA4",
                      backgroundColor: "rgba(35, 175, 164, 0.25)",
                      borderColor: "rgba(35, 175, 164, 0.4)",
                    };
                  else if (h === "门番")
                    badgeStyle = {
                      color: "#127436",
                      backgroundColor: "rgba(18, 116, 54, 0.25)",
                      borderColor: "rgba(18, 116, 54, 0.4)",
                    };

                  return (
                    <span
                      key={i}
                      style={{
                        fontSize: 17,
                        fontWeight: 900,
                        fontFamily: STYLES.fontNum,
                        padding: "3px 12px",
                        borderRadius: 6,
                        borderWidth: 2,
                        borderStyle: "solid",
                        whiteSpace: "nowrap",
                        letterSpacing: 0.5,
                        lineHeight: 1.2,
                        boxShadow: "2px 2px 0 rgba(0,0,0,0.1)",
                        ...badgeStyle,
                      }}
                    >
                      {h}
                    </span>
                  );
                })}
            </div>
          </div>
        </div>

        {/* 数据网格 */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gridTemplateRows: "repeat(2, 1fr)",
            gap: 8,
            borderTop: "2px solid #eee",
            paddingTop: 6,
          }}
        >
          {/* Play */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 10px",
              border: "1px solid #000",
              borderRadius: 8,
              boxShadow: "2px 2px 0 rgba(0,0,0,0.05)",
              minWidth: 0,
              backgroundColor: STYLES.colors.play,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 34, height: 34 }}>
                <PlayIcon
                  style={{
                    width: "100%",
                    height: "100%",
                    filter: "drop-shadow(1px 1px 0 rgba(0,0,0,0.2))",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  letterSpacing: -0.5,
                  lineHeight: 1,
                  fontFamily: STYLES.fontNum,
                }}
              >
                {formatNum(item.view)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                padding: "2px 6px",
                borderRadius: 6,
                backgroundColor: "rgba(255,255,255,0.6)",
                color: "#333",
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color:
                    parseInt(item.view_rank) === minRank
                      ? STYLES.colors.red
                      : "#000",
                  fontFamily: STYLES.fontNum,
                  textShadow:
                    parseInt(item.view_rank) === minRank
                      ? "1px 1px 0 rgba(255,255,255,0.8)"
                      : "none",
                }}
              >
                {item.view_rank}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: "bold",
                  marginLeft: 1,
                  color: "#444",
                  fontFamily: STYLES.fontMain,
                }}
              >
                位
              </span>
            </div>
          </div>
          {/* Fav */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 10px",
              border: "1px solid #000",
              borderRadius: 8,
              boxShadow: "2px 2px 0 rgba(0,0,0,0.05)",
              minWidth: 0,
              backgroundColor: STYLES.colors.fav,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 34, height: 34 }}>
                <StarIcon
                  style={{
                    width: "100%",
                    height: "100%",
                    filter: "drop-shadow(1px 1px 0 rgba(0,0,0,0.2))",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  letterSpacing: -0.5,
                  lineHeight: 1,
                  fontFamily: STYLES.fontNum,
                }}
              >
                {formatNum(item.favorite)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                padding: "2px 6px",
                borderRadius: 6,
                backgroundColor: "rgba(255,255,255,0.6)",
                color: "#333",
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color:
                    parseInt(item.favorite_rank) === minRank
                      ? STYLES.colors.red
                      : "#000",
                  fontFamily: STYLES.fontNum,
                  textShadow:
                    parseInt(item.favorite_rank) === minRank
                      ? "1px 1px 0 rgba(255,255,255,0.8)"
                      : "none",
                }}
              >
                {item.favorite_rank}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: "bold",
                  marginLeft: 1,
                  color: "#444",
                  fontFamily: STYLES.fontMain,
                }}
              >
                位
              </span>
            </div>
          </div>
          {/* Coin */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 10px",
              border: "1px solid #000",
              borderRadius: 8,
              boxShadow: "2px 2px 0 rgba(0,0,0,0.05)",
              minWidth: 0,
              backgroundColor: STYLES.colors.coin,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 34, height: 34 }}>
                <CoinIcon
                  style={{
                    width: "100%",
                    height: "100%",
                    filter: "drop-shadow(1px 1px 0 rgba(0,0,0,0.2))",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  letterSpacing: -0.5,
                  lineHeight: 1,
                  fontFamily: STYLES.fontNum,
                }}
              >
                {formatNum(item.coin)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                padding: "2px 6px",
                borderRadius: 6,
                backgroundColor: "rgba(255,255,255,0.6)",
                color: "#333",
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color:
                    parseInt(item.coin_rank) === minRank
                      ? STYLES.colors.red
                      : "#000",
                  fontFamily: STYLES.fontNum,
                  textShadow:
                    parseInt(item.coin_rank) === minRank
                      ? "1px 1px 0 rgba(255,255,255,0.8)"
                      : "none",
                }}
              >
                {item.coin_rank}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: "bold",
                  marginLeft: 1,
                  color: "#444",
                  fontFamily: STYLES.fontMain,
                }}
              >
                位
              </span>
            </div>
          </div>
          {/* Like */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 10px",
              border: "1px solid #000",
              borderRadius: 8,
              boxShadow: "2px 2px 0 rgba(0,0,0,0.05)",
              minWidth: 0,
              backgroundColor: STYLES.colors.like,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 34, height: 34 }}>
                <LikeIcon
                  style={{
                    width: "100%",
                    height: "100%",
                    filter: "drop-shadow(1px 1px 0 rgba(0,0,0,0.2))",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  letterSpacing: -0.5,
                  lineHeight: 1,
                  fontFamily: STYLES.fontNum,
                }}
              >
                {formatNum(item.like)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                padding: "2px 6px",
                borderRadius: 6,
                backgroundColor: "rgba(255,255,255,0.6)",
                color: "#333",
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color:
                    parseInt(item.like_rank) === minRank
                      ? STYLES.colors.red
                      : "#000",
                  fontFamily: STYLES.fontNum,
                  textShadow:
                    parseInt(item.like_rank) === minRank
                      ? "1px 1px 0 rgba(255,255,255,0.8)"
                      : "none",
                }}
              >
                {item.like_rank}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: "bold",
                  marginLeft: 1,
                  color: "#444",
                  fontFamily: STYLES.fontMain,
                }}
              >
                位
              </span>
            </div>
          </div>

          {/* Danmaku */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 10px",
              border: "1px solid #000",
              borderRadius: 8,
              boxShadow: "2px 2px 0 rgba(0,0,0,0.05)",
              minWidth: 0,
              backgroundColor: STYLES.colors.dan,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 34, height: 34 }}>
                <DanmakuIcon
                  style={{
                    width: "100%",
                    height: "100%",
                    filter: "drop-shadow(1px 1px 0 rgba(0,0,0,0.2))",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  letterSpacing: -0.5,
                  lineHeight: 1,
                  fontFamily: STYLES.fontNum,
                }}
              >
                {formatNum(item.danmaku)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                padding: "2px 6px",
                borderRadius: 6,
                backgroundColor: "rgba(255,255,255,0.6)",
                color: "#333",
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color:
                    parseInt(item.danmaku_rank) === minRank
                      ? STYLES.colors.red
                      : "#000",
                  fontFamily: STYLES.fontNum,
                  textShadow:
                    parseInt(item.danmaku_rank) === minRank
                      ? "1px 1px 0 rgba(255,255,255,0.8)"
                      : "none",
                }}
              >
                {item.danmaku_rank}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: "bold",
                  marginLeft: 1,
                  color: "#444",
                  fontFamily: STYLES.fontMain,
                }}
              >
                位
              </span>
            </div>
          </div>
          {/* Reply */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 10px",
              border: "1px solid #000",
              borderRadius: 8,
              boxShadow: "2px 2px 0 rgba(0,0,0,0.05)",
              minWidth: 0,
              backgroundColor: STYLES.colors.rep,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 34, height: 34 }}>
                <ReplyIcon
                  style={{
                    width: "100%",
                    height: "100%",
                    filter: "drop-shadow(1px 1px 0 rgba(0,0,0,0.2))",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  letterSpacing: -0.5,
                  lineHeight: 1,
                  fontFamily: STYLES.fontNum,
                }}
              >
                {formatNum(item.reply)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                padding: "2px 6px",
                borderRadius: 6,
                backgroundColor: "rgba(255,255,255,0.6)",
                color: "#333",
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color:
                    parseInt(item.reply_rank) === minRank
                      ? STYLES.colors.red
                      : "#000",
                  fontFamily: STYLES.fontNum,
                  textShadow:
                    parseInt(item.reply_rank) === minRank
                      ? "1px 1px 0 rgba(255,255,255,0.8)"
                      : "none",
                }}
              >
                {item.reply_rank}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: "bold",
                  marginLeft: 1,
                  color: "#444",
                  fontFamily: STYLES.fontMain,
                }}
              >
                位
              </span>
            </div>
          </div>
          {/* Share */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 10px",
              border: "1px solid #000",
              borderRadius: 8,
              boxShadow: "2px 2px 0 rgba(0,0,0,0.05)",
              minWidth: 0,
              backgroundColor: STYLES.colors.share,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 34, height: 34 }}>
                <ShareIcon
                  style={{
                    width: "100%",
                    height: "100%",
                    filter: "drop-shadow(1px 1px 0 rgba(0,0,0,0.2))",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  letterSpacing: -0.5,
                  lineHeight: 1,
                  fontFamily: STYLES.fontNum,
                }}
              >
                {formatNum(item.share)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                padding: "2px 6px",
                borderRadius: 6,
                backgroundColor: "rgba(255,255,255,0.6)",
                color: "#333",
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color:
                    parseInt(item.share_rank) === minRank
                      ? STYLES.colors.red
                      : "#000",
                  fontFamily: STYLES.fontNum,
                  textShadow:
                    parseInt(item.share_rank) === minRank
                      ? "1px 1px 0 rgba(255,255,255,0.8)"
                      : "none",
                }}
              >
                {item.share_rank}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: "bold",
                  marginLeft: 1,
                  color: "#444",
                  fontFamily: STYLES.fontMain,
                }}
              >
                位
              </span>
            </div>
          </div>

          {/* Total Score */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 10px",
              border: "2px solid #000",
              borderRadius: 8,
              background: "linear-gradient(135deg, #1a1a1a, #333333)",
              color: "#fff",
              boxShadow:
                "inset 0 0 0 2px rgba(255,215,0,0.1), 4px 4px 0 rgba(0,0,0,0.4)",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "flex-end",
                gap: 4,
                paddingRight: 8,
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: "bold",
                  color: "#fff",
                  letterSpacing: 2,
                  whiteSpace: "nowrap",
                  marginBottom: 3,
                  fontFamily: STYLES.fontMain,
                }}
              >
                总
              </span>
              <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                <span
                  style={{
                    fontSize: 40,
                    fontWeight: 900,
                    lineHeight: 1,
                    color: "#fff",
                    textShadow: "0 4px 8px rgba(0,0,0,0.8)",
                    fontFamily: STYLES.fontNum,
                  }}
                >
                  {formatNum(item.point)}
                </span>
              </div>
            </div>
            <div
              style={{
                height: "100%",
                maxWidth: "30%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-end",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    fontSize: item.rate === "NEW" ? 18 : 20,
                    fontWeight: 900,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    backdropFilter: "blur(4px)",
                    color:
                      item.rate && item.rate.startsWith("-")
                        ? "#b9f6ca"
                        : "#ff8a80",
                    fontFamily: STYLES.fontNum,
                    letterSpacing: item.rate === "NEW" ? 1 : 0,
                  }}
                >
                  {item.rate === "NEW" ? "NEW!!" : item.rate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 主组件：副榜列表
// ------------------------------------------------------------------
export const SubRank = (props: { list: any[] }) => {
  const { list } = props;
  const displayList = list || [];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: STYLES.colors.bg,
        backgroundImage: "radial-gradient(#d7ccc8 3px, transparent 3px)",
        backgroundSize: "24px 24px",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        boxSizing: "border-box",
      }}
    >
      {displayList.map((item, idx) => (
        <SubRankItem key={idx} item={item} index={idx} />
      ))}
    </AbsoluteFill>
  );
};
