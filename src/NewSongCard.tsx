// src/NewSongCard.tsx
import {
  AbsoluteFill,
  OffthreadVideo,
  useVideoConfig,
  useCurrentFrame,
  spring,
  interpolate,
  Easing,
} from "remotion";
import React, { useRef, useState, useLayoutEffect } from "react";
import {
  LikeIcon,
  ShareIcon,
  ReplyIcon,
  PlayIcon,
  DanmakuIcon,
  StarIcon,
  CoinIcon,
} from "./Icons";

// ------------------------------------------------------------------
// 风格配置
// ------------------------------------------------------------------
const STYLES = {
  colors: {
    bg: "#fffbf0",
    border: "#000000",
    blue: "#bbdefb",
    orange: "#ffe0b2",
    cyan: "#b2ebf2",
    pink: "#f8bbd0",
    purple: "#e1bee7",
    yellow: "#e9dc6aff",
    green: "#c8e6c9",
    textMain: "#000000",
    textSub: "#444444",
    accentRed: "#d50000",
  },
  border: "3px solid #000",
  shadow: "8px 8px 0px rgba(0,0,0,1)",
  fontMain:
    '"Microsoft YaHei", "Heiti SC", "Arial Rounded MT Bold", sans-serif',
  fontNum: '"Arial Black", "Impact", sans-serif',
};

// 日刊趋势的7个颜色
const TREND_COLORS = [
  STYLES.colors.blue,
  STYLES.colors.orange,
  STYLES.colors.cyan,
  STYLES.colors.pink,
  STYLES.colors.purple,
  STYLES.colors.yellow,
  STYLES.colors.green,
];

// ------------------------------------------------------------------
// 辅助函数：格式化数字为固定小数位
// ------------------------------------------------------------------
const formatFix = (value: any, decimals: number = 2): string => {
  if (value === undefined || value === null || value === "") return "";
  const num = parseFloat(value);
  if (isNaN(num)) return String(value);
  return num.toFixed(decimals);
};

// ------------------------------------------------------------------
// 组件：自适应压缩内容（支持children）
// ------------------------------------------------------------------
const FitContent = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    content.style.transform = "scaleX(1)";

    const availableWidth = container.clientWidth;
    const actualWidth = content.scrollWidth;

    if (actualWidth > availableWidth && availableWidth > 0) {
      setScale(availableWidth / actualWidth);
    } else {
      setScale(1);
    }

    content.style.transform = `scaleX(${actualWidth > availableWidth ? availableWidth / actualWidth : 1})`;
  }, [children]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          visibility: "hidden",
          whiteSpace: "nowrap",
          display: "inline-flex",
          alignItems: "baseline",
        }}
      >
        {children}
      </div>

      <div
        ref={contentRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          display: "inline-flex",
          alignItems: "baseline",
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
// 组件：自适应压缩标题
// ------------------------------------------------------------------
const FitTitle = ({
  text,
  style,
}: {
  text: string;
  style?: React.CSSProperties;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
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
  }, [text, style]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        overflow: "hidden",
        ...style,
        display: "block",
      }}
    >
      <span
        ref={textRef}
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          transformOrigin: "left center",
          transform: `scaleX(${scale})`,
        }}
      >
        {text}
      </span>
    </div>
  );
};

// 辅助函数：显示修正系数
const FixLabel = ({ value }: { value: any }) => {
  if (value === undefined || value === null || value === "") return null;
  return (
    <span
      style={{
        fontSize: 20,
        color: "#666",
        marginLeft: 8,
        fontWeight: "bold",
      }}
    >
      (×{formatFix(value, 2)})
    </span>
  );
};

// ------------------------------------------------------------------
// 组件：日刊趋势条
// ------------------------------------------------------------------
const DailyTrendBar = ({ trends }: { trends: Record<string, any> }) => {
  if (!trends) return null;

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: 32,
        borderRadius: 6,
        overflow: "hidden",
        border: "2px solid rgba(0,0,0,0.3)",
      }}
    >
      {[1, 2, 3, 4, 5, 6, 7].map((day, idx) => {
        const value = trends[String(day)];
        const displayValue = value === "-" || value === undefined ? "-" : value;

        return (
          <div
            key={day}
            style={{
              flex: 1,
              backgroundColor: TREND_COLORS[idx],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRight: idx < 6 ? "1px solid rgba(0,0,0,0.15)" : "none",
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 900,
                fontFamily: STYLES.fontNum,
                color: "#333",
                lineHeight: 1,
              }}
            >
              {displayValue}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------
// 组件：数据条
// ------------------------------------------------------------------
const StatRow = ({
  icon,
  count,
  rank,
  rate,
  bgColor,
  bgChar,
  isBestRank,
  fixValue,
}: any) => (
  <div
    style={{
      flex: 1,
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: bgColor,
      border: "2px solid #000",
      borderRadius: 8,
      padding: "0 12px",
      marginBottom: 6,
      boxShadow: "3px 3px 0px rgba(0,0,0,0.15)",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        right: 60,
        bottom: 0,
        fontSize: 80,
        fontWeight: "900",
        fontFamily: STYLES.fontMain,
        color: "rgba(255,255,255,0.7)",
        pointerEvents: "none",
        zIndex: 0,
        lineHeight: 1,
      }}
    >
      {bgChar}
    </div>

    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: "100%",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ width: 32, display: "flex", justifyContent: "center" }}>
        {icon}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "baseline",
          marginLeft: 12,
        }}
      >
        <span
          style={{
            fontSize: 38,
            fontWeight: "900",
            fontFamily: STYLES.fontNum,
            letterSpacing: "-1.5px",
            lineHeight: 1,
            color: "#222",
            textShadow: "2px 2px 0px rgba(255,255,255,0.4)",
          }}
        >
          {new Intl.NumberFormat().format(count)}
        </span>
        {fixValue && <FixLabel value={fixValue} />}
      </div>
    </div>

    <div style={{ textAlign: "right", position: "relative", zIndex: 1 }}>
      <div style={{ lineHeight: 1 }}>
        <span
          style={{
            color: isBestRank ? STYLES.colors.accentRed : "#333",
            fontSize: 34,
            fontFamily: STYLES.fontNum,
            textShadow: isBestRank
              ? "2px 2px 0px rgba(255,255,255,0.8)"
              : "none",
          }}
        >
          {rank}
        </span>
        <span
          style={{
            fontSize: 18,
            fontWeight: "bold",
            marginLeft: 2,
            color: "#555",
          }}
        >
          位
        </span>
      </div>
      <div
        style={{
          fontSize: 19,
          color: "#555",
          fontWeight: "bold",
          marginTop: 2,
        }}
      >
        {rate && rate !== "-" ? `×${formatFix(rate, 2)}` : ""}
      </div>
    </div>
  </div>
);

// ------------------------------------------------------------------
// 组件：信息标签
// ------------------------------------------------------------------
const InfoTag = ({ text, color = "#eee", icon = null }: any) => (
  <span
    style={{
      backgroundColor: color,
      border: "2px solid #000",
      padding: "4px 16px",
      borderRadius: 8,
      fontSize: 22,
      fontWeight: "bold",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      boxShadow: "2px 2px 0 rgba(0,0,0,0.1)",
    }}
  >
    {icon} {text}
  </span>
);

// ------------------------------------------------------------------
// 组件：成就胶囊
// ------------------------------------------------------------------
const HonorBadge = ({ text }: { text: string }) => {
  let color = "#333";
  let bg = "rgba(255,255,255,0.75)";
  let border = "rgba(0,0,0,0.5)";

  if (text.includes("Emerging")) {
    color = "#6A0DAD";
    bg = "rgba(106, 13, 173, 0.25)";
    border = "rgba(106, 13, 173, 0.4)";
  } else if (text.includes("Mega")) {
    color = "#CCA300";
    bg = "rgba(204, 163, 0, 0.25)";
    border = "rgba(204, 163, 0, 0.4)";
  } else if (text === "门番") {
    color = "#127436";
    bg = "rgba(18, 116, 54, 0.25)";
    border = "rgba(18, 116, 54, 0.4)";
  } else if (text.includes("门番")) {
    color = "#23AFA4";
    bg = "rgba(35, 175, 164, 0.25)";
    border = "rgba(35, 175, 164, 0.4)";
  }

  return (
    <div
      style={{
        display: "inline-block",
        backgroundColor: bg,
        border: `3px solid ${border}`,
        borderRadius: 10,
        padding: "6px 18px",
        fontSize: 26,
        fontWeight: "900",
        color: color,
        boxShadow: "3px 3px 0 rgba(0,0,0,0.1)",
      }}
    >
      {text}
    </div>
  );
};

// ------------------------------------------------------------------
// 主组件：新曲榜卡片
// ------------------------------------------------------------------
export const NewSongCard = (props: any) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const safeParse = (val: any) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const scoreStr = new Intl.NumberFormat().format(safeParse(props.score));

  // ------------------- 计算各项数据的最佳排名 -------------------
  const allRanks = [
    props.view_rank,
    props.favorite_rank,
    props.coin_rank,
    props.like_rank,
    props.danmaku_rank,
    props.reply_rank,
    props.share_rank,
  ]
    .map((r) => parseInt(r))
    .filter((n) => !isNaN(n) && n > 0);

  const minRank = allRanks.length > 0 ? Math.min(...allRanks) : 0;

  // ------------------- 动画逻辑 -------------------
  const transitionFrames = 35;

  const volume = interpolate(
    frame,
    [
      0,
      transitionFrames,
      durationInFrames - transitionFrames,
      durationInFrames,
    ],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const exitStartFrame = durationInFrames - transitionFrames;
  const exitProgress = interpolate(
    frame,
    [exitStartFrame, durationInFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.back(1.5)),
    },
  );

  const videoEntranceY = spring({
    frame,
    fps,
    from: -1000,
    to: 0,
    config: { damping: 14 },
  });
  const videoExitY = interpolate(exitProgress, [0, 1], [0, -1000]);
  const videoTranslateY = frame < exitStartFrame ? videoEntranceY : videoExitY;

  const infoEntranceY = spring({
    frame,
    fps,
    from: 300,
    to: 0,
    config: { damping: 15 },
  });
  const infoExitY = interpolate(exitProgress, [0, 1], [0, 400]);
  const infoTranslateY = frame < exitStartFrame ? infoEntranceY : infoExitY;

  const sidebarEntranceX = spring({
    frame,
    fps,
    from: 800,
    to: 0,
    config: { damping: 14, mass: 0.8 },
  });
  const sidebarExitX = interpolate(exitProgress, [0, 1], [0, 800]);
  const sidebarTranslateX =
    frame < exitStartFrame ? sidebarEntranceX : sidebarExitX;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: STYLES.colors.bg,
        fontFamily: STYLES.fontMain,
        color: STYLES.colors.textMain,
        backgroundImage: "radial-gradient(#d7ccc8 3px, transparent 3px)",
        backgroundSize: "24px 24px",
        display: "flex",
        flexDirection: "row",
        padding: 24,
        gap: 24,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* ================= 左侧主体 ================= */}
      <div
        style={{
          flex: 120,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          height: "100%",
          minWidth: 0,
        }}
      >
        {/* 1. 视频容器 */}
        <div
          style={{
            width: "100%",
            aspectRatio: "16/9",
            backgroundColor: "#000",
            border: STYLES.border,
            borderRadius: 24,
            boxShadow: STYLES.shadow,
            overflow: "hidden",
            position: "relative",
            transform: `translateY(${videoTranslateY}px)`,
            zIndex: 2,
          }}
        >
          {props.videoSource ? (
            <OffthreadVideo
              src={props.videoSource}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              volume={volume}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 40,
              }}
            >
              NO SIGNAL
            </div>
          )}
        </div>

        {/* 2. 底部信息栏 */}
        <div
          style={{
            flex: 1,
            width: "100%",
            boxSizing: "border-box",
            backgroundColor: "#ffffff",
            border: STYLES.border,
            borderRadius: 24,
            boxShadow: STYLES.shadow,
            padding: "24px 32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 12,
            transform: `translateY(${infoTranslateY}px)`,
            overflow: "hidden",
          }}
        >
          {/* 标题 */}
          <h1 style={{ margin: 0, width: "100%" }}>
            <FitTitle
              text={props.title}
              style={{
                fontSize: 56,
                lineHeight: 1.2,
                fontFamily: STYLES.fontMain,
                fontWeight: "bold",
                letterSpacing: "-2px",
              }}
            />
          </h1>

          {/* 第一行：作者 | 成就 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <FitTitle
                text={props.producers}
                style={{
                  fontSize: 36,
                  fontWeight: "900",
                  fontFamily: STYLES.fontMain,
                }}
              />
            </div>

            {props.honor && props.honor.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "nowrap",
                  alignItems: "center",
                  gap: 12,
                  flexShrink: 0,
                }}
              >
                {props.honor.map((h: string, i: number) => (
                  <HonorBadge key={i} text={h} />
                ))}
              </div>
            )}
          </div>

          {/* 第二行：歌手+引擎 | 标签 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <FitContent>
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: "bold",
                    color: "#444",
                    fontFamily: STYLES.fontMain,
                  }}
                >
                  {props.vocalists}
                </span>
                {props.synthesizers && (
                  <>
                    <span
                      style={{
                        display: "inline-block",
                        width: 16,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 24,
                        color: "#888",
                        fontStyle: "italic",
                        fontFamily: STYLES.fontMain,
                      }}
                    >
                      {props.synthesizers}
                    </span>
                  </>
                )}
              </FitContent>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <InfoTag text={props.pubdate.split(" ")[0]} color="#fff9c4" />
              <InfoTag text={props.songType} color="#e1bee7" />
              <InfoTag
                text={props.copyrightLabel}
                color={STYLES.colors.orange}
              />
              <InfoTag text={props.duration} color="#b2dfdb" />
            </div>
          </div>
        </div>
      </div>

      {/* ================= 右侧侧边栏 ================= */}
      <div
        style={{
          flex: 34,
          backgroundColor: "#ffffff",
          border: STYLES.border,
          borderRadius: 24,
          boxShadow: STYLES.shadow,
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          transform: `translateX(${sidebarTranslateX}px)`,
          boxSizing: "border-box",
        }}
      >
        {/* --- 上半部分：排名与分数 --- */}
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {/* 第一行：排名 + 趋势 */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 16,
              height: 160,
            }}
          >
            {/* 左块：核心排名展示（新曲榜排名，无累计上榜） */}
            <div
              style={{
                flex: 4,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
                backgroundColor: "#f5f5f5",
                border: "3px solid #000",
                borderRadius: 16,
                boxShadow: "4px 4px 0 rgba(0,0,0,0.2)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "100%",
                  backgroundColor: "#000",
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: "bold",
                  textAlign: "center",
                  padding: "6px 0",
                  letterSpacing: 2,
                }}
              >
                新曲榜排名
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 80,
                    fontFamily: STYLES.fontNum,
                    fontWeight: "900",
                    color: STYLES.colors.textMain,
                    lineHeight: 1,
                    letterSpacing: "-4px",
                    textShadow: "4px 4px 0px rgba(255,255,255,1)",
                  }}
                >
                  {props.rank}
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 5,
                  fontSize: 40,
                  fontWeight: "900",
                  color: "rgba(0,0,0,0.05)",
                  pointerEvents: "none",
                  lineHeight: 1,
                  fontFamily: "Arial Black",
                }}
              >
                NEW
              </div>
            </div>
            {/* 右块：新曲榜标识 + 总榜排名 + 日刊趋势 */}
            <div
              style={{
                flex: 5,
                display: "flex",
                flexDirection: "column",
                border: "2px solid #000",
                borderRadius: 12,
                backgroundColor: "#fff",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* 背景水印 TREND - 位于下方 */}
              <div
                style={{
                  position: "absolute",
                  bottom: 40,
                  right: 5,
                  fontSize: 36,
                  fontWeight: "900",
                  color: "rgba(0,0,0,0.05)",
                  pointerEvents: "none",
                  lineHeight: 1,
                  fontFamily: "Arial Black",
                }}
              >
                TREND
              </div>

              {/* 上部：新曲榜（独占） */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  marginTop: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 48,
                    fontWeight: "900",
                    fontFamily: STYLES.fontMain,
                    color: "#d50000",
                    lineHeight: 1,
                    textShadow: "3px 3px 0 rgba(0,0,0,0.1)",
                  }}
                >
                  NEW!!
                </span>
              </div>

              {/* 中部：总榜排名（和TREND一行） */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "4px 8px",
                  zIndex: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    color: "#999",
                    fontWeight: "bold",
                  }}
                >
                  总榜排名
                </span>
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: "900",
                    fontFamily: STYLES.fontNum,
                    color: "#444",
                  }}
                >
                  #{props.main_rank || "-"}
                </span>
              </div>

              {/* 下部：日刊趋势 */}
              {props.daily_trends && (
                <div style={{ padding: "0 8px 8px 8px" }}>
                  <DailyTrendBar trends={props.daily_trends} />
                </div>
              )}
            </div>
          </div>

          {/* 第二行：综合得分 */}
          <div
            style={{
              height: 110,
              width: "100%",
              backgroundColor: "#222",
              border: "2px solid #000",
              borderRadius: 12,
              padding: "12px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 8,
                backgroundColor: STYLES.colors.blue,
              }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  color: "#aaa",
                  fontSize: 20,
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                }}
              >
                综合得分
              </span>

              {/* 新曲榜统一显示 NEW */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  padding: "2px 10px",
                  borderRadius: 6,
                  color: "#ef9a9a",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    fontFamily: STYLES.fontNum,
                    fontWeight: "900",
                    lineHeight: 1.2,
                  }}
                >
                  NEW
                </span>
              </div>

              {props.fixB && props.fixC && (
                <span
                  style={{
                    fontSize: 18,
                    color: "#555",
                    fontFamily: STYLES.fontNum,
                    fontWeight: "bold",
                    marginLeft: "auto",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  ( ×{(props.fixB * props.fixC).toFixed(4)}= )
                </span>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  fontSize: 46,
                  fontWeight: "900",
                  fontFamily: STYLES.fontNum,
                  color: "#fff",
                  letterSpacing: "1px",
                  lineHeight: 0.9,
                  textShadow: "0 4px 10px rgba(0,0,0,0.5)",
                }}
              >
                {scoreStr}
              </div>
            </div>
          </div>
        </div>

        {/* --- 下半部分：详细数据 --- */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            overflow: "hidden",
          }}
        >
          <StatRow
            label="播放"
            bgChar="播放"
            icon={<PlayIcon />}
            count={props.view}
            rank={props.view_rank}
            isBestRank={parseInt(props.view_rank) === minRank}
            rate={props.view_rate}
            bgColor={STYLES.colors.blue}
          />
          <StatRow
            label="收藏"
            bgChar="收藏"
            icon={<StarIcon />}
            count={props.favorite}
            rank={props.favorite_rank}
            isBestRank={parseInt(props.favorite_rank) === minRank}
            rate={props.favorite_rate}
            bgColor={STYLES.colors.orange}
          />
          <StatRow
            label="硬币"
            bgChar="硬币"
            icon={<CoinIcon />}
            count={props.coin}
            rank={props.coin_rank}
            isBestRank={parseInt(props.coin_rank) === minRank}
            rate={props.coin_rate}
            bgColor={STYLES.colors.cyan}
            fixValue={props.fixA}
          />
          <StatRow
            label="点赞"
            bgChar="点赞"
            icon={<LikeIcon />}
            count={props.like}
            rank={props.like_rank}
            isBestRank={parseInt(props.like_rank) === minRank}
            rate={props.like_rate}
            bgColor={STYLES.colors.pink}
          />
          <StatRow
            label="弹幕"
            bgChar="弹幕"
            icon={<DanmakuIcon />}
            count={props.danmaku}
            rank={props.danmaku_rank}
            isBestRank={parseInt(props.danmaku_rank) === minRank}
            rate={props.danmaku_rate}
            bgColor={STYLES.colors.purple}
          />
          <StatRow
            label="评论"
            bgChar="评论"
            icon={<ReplyIcon />}
            count={props.reply}
            rank={props.reply_rank}
            isBestRank={parseInt(props.reply_rank) === minRank}
            rate={props.reply_rate}
            bgColor={STYLES.colors.yellow}
            fixValue={props.fixD}
          />
          <StatRow
            label="分享"
            bgChar="分享"
            icon={<ShareIcon />}
            count={props.share}
            rank={props.share_rank}
            isBestRank={parseInt(props.share_rank) === minRank}
            rate={props.share_rate}
            bgColor={STYLES.colors.green}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
