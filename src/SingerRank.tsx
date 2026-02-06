// src/SingerRank.tsx
import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  spring,
  interpolate,
  Img,
} from "remotion";
import React, { useState, useRef, useLayoutEffect } from "react";

// ------------------------------------------------------------------
// 风格配置
// ------------------------------------------------------------------
const STYLES = {
  colors: {
    bg: "#fffbf0",
    border: "#000000",
    cardBg: "#fafafa",
    textMain: "#000000",
    textSub: "#333333",
    accentRed: "#d50000",
    accentGreen: "#2e7d32",
    cyan: "#b2ebf2",
    pink: "#f8bbd0",
    green: "#c8e6c9",
    yellow: "#e9dc6aff",
    purple: "#e1bee7",
  },
  fontMain:
    '"Microsoft YaHei", "Heiti SC", "Arial Rounded MT Bold", sans-serif',
  fontNum: '"Arial Black", "Impact", sans-serif',
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
  }, [text, style]);

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
        {text}
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
        {text}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 组件：单个歌手卡片
// ------------------------------------------------------------------
const SingerItem = ({ singer, index }: { singer: any; index: number }) => {
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

  // 排名变动逻辑
  let trendIcon = "■";
  let trendColor = "#888";

  if (singer.last_rank && singer.last_rank !== 0) {
    const rankDiff = singer.last_rank - singer.rank;
    if (rankDiff > 0) {
      trendIcon = "▲";
      trendColor = STYLES.colors.accentRed;
    } else if (rankDiff < 0) {
      trendIcon = "▼";
      trendColor = STYLES.colors.accentGreen;
    }
  } else {
    trendIcon = "NEW";
    trendColor = STYLES.colors.accentRed;
  }

  const avatarColors = [
    STYLES.colors.cyan,
    STYLES.colors.pink,
    STYLES.colors.green,
    STYLES.colors.yellow,
    STYLES.colors.purple,
  ];
  const avatarBg = avatarColors[(singer.rank - 1) % avatarColors.length];

  const avatarSrc =
    singer.avatar ||
    `http://localhost:3002/downloads/avatar/${encodeURIComponent(
      singer.name,
    )}.png`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        border: "3px solid #000",
        borderRadius: 14,
        padding: "10px 14px",
        boxShadow: "8px 8px 0px rgba(0,0,0,1)",
        transform: `translateY(${entrance + exitTranslateY}px)`,
        opacity: opacity * exitOpacity,
        gap: 12,
        height: 176, // 与 HistoryRank 统一
        boxSizing: "border-box",
        overflow: "hidden",
        width: "100%",
        flexShrink: 0,
      }}
    >
      {/* 1. 头像 */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 12,
          border: "2px solid #000",
          backgroundColor: avatarBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {!imgError ? (
          <Img
            src={avatarSrc}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <span
            style={{
              fontSize: 50,
              fontWeight: "bold",
              color: "rgba(0,0,0,0.2)",
            }}
          >
            {singer.name.substring(0, 1)}
          </span>
        )}
      </div>

      {/* 2. 中间信息 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 6,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* 歌手名 */}
        <div style={{ width: "100%", overflow: "hidden" }}>
          <FitTitle
            text={singer.name}
            style={{
              fontSize: 34,
              fontWeight: 900,
              color: "#222",
              fontFamily: STYLES.fontMain,
              whiteSpace: "nowrap",
            }}
          />
        </div>

        {/* 总分 */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            paddingLeft: 2,
          }}
        >
          <span style={{ fontSize: 20, color: "#555", fontWeight: "bold" }}>
            总分
          </span>
          <span
            style={{
              fontSize: 26,
              fontFamily: STYLES.fontNum,
              fontWeight: "bold",
              color: "#333",
            }}
          >
            {new Intl.NumberFormat().format(singer.score)}
          </span>
        </div>

        {/* 首位曲 */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            paddingLeft: 2,
            overflow: "hidden",
            width: "100%",
          }}
        >
          <span
            style={{
              fontSize: 20,
              color: "#555",
              fontWeight: "bold",
              flexShrink: 0,
            }}
          >
            首位
          </span>
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
            <FitTitle
              text={singer.firstname}
              style={{
                fontSize: 20,
                fontWeight: "500",
                color: "#333",
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. 右侧排名 & 趋势 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 75,
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {/* 排名大字 */}
        <div
          style={{
            fontSize: 56,
            fontFamily: STYLES.fontNum,
            lineHeight: 0.9,
            fontWeight: "900",
            textShadow: "3px 3px 0px rgba(0,0,0,0.1)",
            color: "#222",
          }}
        >
          {singer.rank}
        </div>

        {/* 趋势部分 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 2,
          }}
        >
          {trendIcon === "NEW" ? (
            <span
              style={{
                fontSize: 28,
                fontWeight: "900",
                color: STYLES.colors.accentRed,
                fontFamily: STYLES.fontNum,
              }}
            >
              NEW
            </span>
          ) : (
            <>
              <span
                style={{
                  fontSize: 28,
                  color: trendColor,
                  lineHeight: 0.8,
                }}
              >
                {trendIcon}
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                <span
                  style={{ fontSize: 14, color: "#888", fontWeight: "bold" }}
                >
                  上期
                </span>
                <span
                  style={{
                    fontSize: 20,
                    fontFamily: STYLES.fontNum,
                    fontWeight: "bold",
                  }}
                >
                  {singer.last_rank}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 主组件：歌手排名列表
// ------------------------------------------------------------------
export const SingerRank = (props: { list: any[] }) => {
  const { list } = props;
  const displayList = list || [];
  const { durationInFrames, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // 标题入场动画
  const titleEntranceTranslateX = spring({
    frame: frame - 5,
    fps,
    from: 100,
    to: 0,
    config: { damping: 12 },
  });

  const titleEntranceOpacity = interpolate(frame - 5, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 标题退场动画
  const exitStartFrame = durationInFrames - 30;
  const exitProgress = interpolate(
    frame,
    [exitStartFrame, exitStartFrame + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const titleExitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);
  const titleExitTranslateX = interpolate(exitProgress, [0, 1], [0, 50]);

  // 布局计算 - 与 HistoryRank 完全统一
  const cardHeight = 176;
  const cardGap = 14;
  const middleGap = 20; // 两列之间的间距
  const rowsPerColumn = 5;

  // 分成左右两列
  const leftColumn = displayList.slice(0, rowsPerColumn);
  const rightColumn = displayList.slice(rowsPerColumn, rowsPerColumn * 2);

  const totalCardsHeight =
    rowsPerColumn * cardHeight + (rowsPerColumn - 1) * cardGap;
  const availableHeight = 1040;
  const verticalPadding = (availableHeight - totalCardsHeight) / 2;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: STYLES.colors.bg,
        fontFamily: STYLES.fontMain,
        backgroundImage: "radial-gradient(#d7ccc8 3px, transparent 3px)",
        backgroundSize: "24px 24px",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "row",
        gap: 30,
        boxSizing: "border-box",
      }}
    >
      {/* 1. 左侧卡片区域（两列）- 使用固定宽度 */}
      <div
        style={{
          width: "calc(100% - 380px)", // 与 HistoryRank 统一
          display: "flex",
          flexDirection: "row",
          gap: middleGap,
          height: "100%",
          paddingTop: verticalPadding,
          paddingRight: 20,
        }}
      >
        {/* 左列 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: cardGap,
            minWidth: 0,
          }}
        >
          {leftColumn.map((singer, idx) => (
            <SingerItem key={idx} singer={singer} index={idx} />
          ))}
        </div>

        {/* 右列 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: cardGap,
            minWidth: 0,
          }}
        >
          {rightColumn.map((singer, idx) => (
            <SingerItem
              key={idx + rowsPerColumn}
              singer={singer}
              index={idx + rowsPerColumn}
            />
          ))}
        </div>
      </div>

      {/* 2. 右侧标题区域 - 与 HistoryRank 统一 */}
      <div
        style={{
          width: 340, // 与 HistoryRank 统一
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "flex-end",
          flexShrink: 0,
          paddingBottom: verticalPadding,
          opacity: titleEntranceOpacity * titleExitOpacity,
          transform: `translateX(${titleEntranceTranslateX + titleExitTranslateX}px)`,
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: "#222",
            fontFamily: STYLES.fontMain,
            lineHeight: 1,
            textShadow: "4px 4px 0px #fff",
            whiteSpace: "nowrap",
          }}
        >
          歌手排名
        </div>
      </div>
    </AbsoluteFill>
  );
};
