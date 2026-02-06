// src/MillionRank.tsx
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
// 风格配置 (复用 SingerRank)
// ------------------------------------------------------------------
const STYLES = {
  colors: {
    bg: "#fffbf0",
    border: "#000000",
    cardBg: "#fafafa",
    badgeBg: "#222",
    textMain: "#000000",
    textSub: "#333333",
  },
  fontMain:
    '"Microsoft YaHei", "Heiti SC", "Arial Rounded MT Bold", sans-serif',
  fontNum: '"Arial Black", "Impact", sans-serif',
};

// ------------------------------------------------------------------
// 组件：自适应压缩标题 (基于真实DOM宽度)
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
// 组件：单个百万达成卡片
// ------------------------------------------------------------------
const MillionItem = ({ item, index }: { item: any; index: number }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const [imgError, setImgError] = useState(false);

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
  const pubDateSimple = item.pubdate ? item.pubdate.split(" ")[0] : "";

  // 计算徽章宽度预估（根据数字位数）
  // 例如 "1300万达成！" 大约需要 280px
  const badgeWidth = 280;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        border: "3px solid #222",
        borderRadius: 14,
        backgroundColor: STYLES.colors.cardBg,
        boxShadow: "8px 8px 0 #000",
        height: 176, // 调整高度：(1040 - 14*4) / 5 ≈ 196，但保持紧凑用176
        flexShrink: 0,
        overflow: "hidden",
        position: "relative",
        width: "100%",
        transform: `translateY(${entrance + exitTranslateY}px)`,
        opacity: opacity * exitOpacity,
      }}
    >
      {/* 1. 封面图 */}
      <div
        style={{
          height: "100%",
          aspectRatio: "16 / 9",
          flexShrink: 0,
          backgroundColor: "#ddd",
          borderRight: "3px solid #222",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {!imgError && coverSrc ? (
          <Img
            src={coverSrc}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#aaa",
              fontSize: 24,
              fontWeight: "bold",
            }}
          >
            NO IMG
          </div>
        )}
      </div>

      {/* 2. 信息区 */}
      <div
        style={{
          flex: 1,
          width: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 6,
          padding: "12px 20px",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* 标题 - 全宽压缩 */}
        <div style={{ width: "100%", overflow: "hidden" }}>
          <FitTitle
            text={item.title}
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: "#222",
              fontFamily: STYLES.fontMain,
              whiteSpace: "nowrap",
            }}
          />
        </div>

        {/* 作者 - 需要避开右下角徽章 */}
        <div
          style={{
            width: `calc(100% - ${badgeWidth}px - 20px)`,
            overflow: "hidden",
            paddingLeft: 8, // 缩进
          }}
        >
          <FitTitle
            text={item.author}
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#333",
              fontFamily: STYLES.fontMain,
              whiteSpace: "nowrap",
            }}
          />
        </div>

        {/* 投稿时间 - 缩进 */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#555",
            fontFamily: STYLES.fontMain,
            paddingLeft: 8, // 缩进
          }}
        >
          {pubDateSimple}
        </div>
      </div>

      {/* 3. 百万达成徽章 - 绝对定位右下角 */}
      <div
        style={{
          position: "absolute",
          right: 16,
          bottom: 10,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          padding: "8px 20px",
          borderRadius: 12,
          backgroundColor: "#222",
          boxShadow: "3px 3px 0 rgba(0,0,0,0.2)",
        }}
      >
        <span
          style={{
            fontFamily: STYLES.fontNum,
            fontSize: 48,
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1,
          }}
        >
          {item.million_crossed}00
        </span>
        <span
          style={{
            fontFamily: STYLES.fontMain,
            fontSize: 36,
            fontWeight: 900,
            color: "#fff",
            marginLeft: 2,
            lineHeight: 1,
          }}
        >
          万达成！
        </span>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 主组件
// ------------------------------------------------------------------
export const MillionRank = (props: { list: any[] }) => {
  const { list } = props;
  const displayList = list || [];
  const { durationInFrames, fps } = useVideoConfig();
  const frame = useCurrentFrame();

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

  const exitStartFrame = durationInFrames - 30;
  const exitProgress = interpolate(
    frame,
    [exitStartFrame, exitStartFrame + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const titleExitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);
  const titleExitTranslateX = interpolate(exitProgress, [0, 1], [0, 50]);

  const cardHeight = 176;
  const cardGap = 14;
  const maxCards = 5;
  const totalCardsHeight = maxCards * cardHeight + (maxCards - 1) * cardGap;
  const availableHeight = 1040; // 1080 - 40 padding
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
      {/* 1. 左侧卡片列表 */}
      <div
        style={{
          width: "calc(100% - 380px)",
          display: "flex",
          flexDirection: "column",
          gap: cardGap,
          justifyContent: "flex-start", // 顶部对齐，不会强行填充
          height: "100%",
          paddingTop: verticalPadding, // 上下等距
          paddingRight: 20,
        }}
      >
        {displayList.map((item, idx) => (
          <MillionItem key={idx} item={item} index={idx} />
        ))}
      </div>

      {/* 2. 右侧标题区域 */}
      <div
        style={{
          width: 340,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "flex-end",
          flexShrink: 0,
          paddingBottom: verticalPadding, // 与卡片底部对齐
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
          百万达成
        </div>
      </div>
    </AbsoluteFill>
  );
};
