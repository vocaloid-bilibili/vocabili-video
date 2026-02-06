// src/AchievementRank.tsx
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
  },
  fontMain:
    '"Microsoft YaHei", "Heiti SC", "Arial Rounded MT Bold", sans-serif',
  fontNum: '"Arial Black", "Impact", sans-serif',
};

// 成就徽章宽度映射（根据文字长度预估）
const HONOR_BADGE_WIDTH: Record<string, number> = {
  "Emerging Hit!": 300,
  "Mega Hit!!!": 250,
  门番候补: 200,
  门番: 130,
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
// 组件：单个成就卡片
// ------------------------------------------------------------------
const AchievementItem = ({ item, index }: { item: any; index: number }) => {
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

  // 处理图片链接
  const coverSrc = item.image_url || "";

  // 处理日期
  const pubDateSimple = item.pubdate ? item.pubdate.split(" ")[0] : "";

  // 确定成就样式
  const honor = item.honor || "";
  let honorColor = "#000";
  let honorBg = "#fff";
  let honorBorder = "#000";
  let honorShadow = "rgba(0,0,0,0.15)";

  if (honor === "Emerging Hit!") {
    honorColor = "#6A0DAD";
    honorBg = "rgba(106, 13, 173, 0.25)";
    honorBorder = "#6A0DAD";
    honorShadow = "rgba(106, 13, 173, 0.4)";
  } else if (honor === "Mega Hit!!!") {
    honorColor = "#CCA300";
    honorBg = "rgba(204, 163, 0, 0.25)";
    honorBorder = "#CCA300";
    honorShadow = "rgba(204, 163, 0, 0.4)";
  } else if (honor === "门番候补") {
    honorColor = "#23AFA4";
    honorBg = "rgba(35, 175, 164, 0.25)";
    honorBorder = "#23AFA4";
    honorShadow = "rgba(35, 175, 164, 0.4)";
  } else if (honor === "门番") {
    honorColor = "#127436";
    honorBg = "rgba(18, 116, 54, 0.25)";
    honorBorder = "#127436";
    honorShadow = "rgba(18, 116, 54, 0.5)";
  }

  // 根据成就动态计算徽章宽度，无成就时为0
  const badgeWidth = honor ? HONOR_BADGE_WIDTH[honor] || 200 : 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        border: "3px solid #222",
        borderRadius: 14,
        backgroundColor: STYLES.colors.cardBg,
        boxShadow: "8px 8px 0 #000",
        height: 176,
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

        {/* 作者 - 使用FitTitle，根据成就宽度动态避让 */}
        <div
          style={{
            // 有成就时才减去徽章宽度，无成就时全宽
            width: badgeWidth > 0 ? `calc(100% - ${badgeWidth}px)` : "100%",
            overflow: "hidden",
            paddingLeft: 8,
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
            paddingLeft: 8,
          }}
        >
          {pubDateSimple}
        </div>
      </div>

      {/* 3. 荣誉徽章 - 绝对定位右下角 */}
      {honor && (
        <div
          style={{
            position: "absolute",
            right: 16,
            bottom: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 20px",
            borderRadius: 12,
            border: `4px solid ${honorBorder}`,
            backgroundColor: honorBg,
            boxShadow: `4px 4px 0 ${honorShadow}`,
          }}
        >
          <span
            style={{
              fontFamily: STYLES.fontMain,
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: 1,
              color: honorColor,
            }}
          >
            {honor}
          </span>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------
// 主组件：成就列表
// ------------------------------------------------------------------
export const AchievementRank = (props: { list: any[] }) => {
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

  // 布局计算 - 与MillionRank统一
  const cardHeight = 176;
  const cardGap = 14;
  const maxCards = 5;
  const totalCardsHeight = maxCards * cardHeight + (maxCards - 1) * cardGap;
  const availableHeight = 1040;
  const verticalPadding = (availableHeight - totalCardsHeight) / 2;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: STYLES.colors.bg,
        fontFamily: STYLES.fontMain,
        color: STYLES.colors.textMain,
        backgroundImage: "radial-gradient(#d7ccc8 3px, transparent 3px)",
        backgroundSize: "24px 24px",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "row",
        gap: 30,
        boxSizing: "border-box",
      }}
    >
      {/* 1. 左侧容器：卡片列表 */}
      <div
        style={{
          width: "calc(100% - 380px)",
          display: "flex",
          flexDirection: "column",
          gap: cardGap,
          justifyContent: "flex-start",
          height: "100%",
          paddingTop: verticalPadding,
          paddingRight: 20,
        }}
      >
        {displayList.map((item, idx) => (
          <AchievementItem key={idx} item={item} index={idx} />
        ))}
      </div>

      {/* 2. 右侧容器：标题区域 */}
      <div
        style={{
          width: 340,
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
          成就达成
        </div>
      </div>
    </AbsoluteFill>
  );
};
