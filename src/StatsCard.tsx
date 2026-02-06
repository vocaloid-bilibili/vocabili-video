// src/StatsCard.tsx
import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  spring,
  interpolate,
} from "remotion";
import React from "react";
import {
  PlayIcon,
  StarIcon,
  CoinIcon,
  LikeIcon,
  DanmakuIcon,
  ReplyIcon,
  ShareIcon,
} from "./Icons";

// ------------------------------------------------------------------
// 风格配置
// ------------------------------------------------------------------
const STYLES = {
  colors: {
    bg: "#fffbf0",
    border: "#000",
    card: "#fff",
    dot: "#d7ccc8",
    blue: "#23ADE5",
    redBg: "#ffb9b4",
    greenBg: "#d0f9db",
    redText: "#990000",
    greenText: "#004d00",
    gray: "#888",
    headerBg: "#222",
    headerText: "#fff",
  },
  fontMain: '"Microsoft YaHei", "Heiti SC", sans-serif',
  fontMono: 'Consolas, "Arial Black", monospace',
};

// ------------------------------------------------------------------
// 子组件：统计项 (用于 Row 1 & 2)
// ------------------------------------------------------------------
const StatItem = ({
  label,
  value,
  unit,
  change,
  delay = 0,
}: {
  label: string;
  value: number | string;
  unit: string;
  change: number;
  delay?: number;
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const entrance = spring({
    frame: frame - delay,
    fps,
    from: 0,
    to: 1,
    config: { damping: 12 },
  });

  const changeStr =
    change > 0 ? `+${change}` : change === 0 ? "±0" : `${change}`;
  const changeClass = change > 0 ? "up" : change < 0 ? "down" : "zero";

  const changeStyle = {
    up: { color: STYLES.colors.redText, background: STYLES.colors.redBg },
    down: { color: STYLES.colors.greenText, background: STYLES.colors.greenBg },
    zero: { color: "#333", background: "#e0e0e0" },
  }[changeClass];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        opacity: entrance,
        transform: `translateY(${(1 - entrance) * 20}px)`,
      }}
    >
      <span
        style={{
          fontSize: 32,
          fontWeight: 900,
          color: "#333",
          fontFamily: STYLES.fontMain,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: STYLES.fontMono,
          fontSize: 48,
          fontWeight: 900,
          color: "#222",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 32,
          fontWeight: 900,
          color: "#333",
          fontFamily: STYLES.fontMain,
        }}
      >
        {unit}
      </span>
      <span
        style={{
          fontFamily: STYLES.fontMono,
          fontSize: 24,
          fontWeight: 900,
          padding: "4px 12px",
          borderRadius: 6,
          marginLeft: 8,
          ...changeStyle,
        }}
      >
        {changeStr}
      </span>
    </div>
  );
};

// ------------------------------------------------------------------
// 子组件：分数线项 (用于 Cutoff Row)
// ------------------------------------------------------------------
const CutoffItem = ({
  tag,
  value,
  change,
  percent = 0,
  delay = 0,
}: {
  tag: string;
  value: number;
  change: number;
  percent?: number; // 涨跌幅百分比 (可选)
  delay?: number;
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const entrance = spring({
    frame: frame - delay,
    fps,
    from: 0,
    to: 1,
    config: { damping: 12 },
  });

  const changeStr =
    change > 0
      ? `+${new Intl.NumberFormat().format(change)}`
      : change === 0
        ? "±0"
        : `${new Intl.NumberFormat().format(change)}`;
  const percentStr =
    percent > 0
      ? `(+${percent.toFixed(1)}%)`
      : percent < 0
        ? `(${percent.toFixed(1)}%)`
        : `(0.0%)`;

  // 如果没有传入 percent，则根据 change 计算一个假的或者不显示，这里假设外部传入
  const fullChangeStr = `${changeStr} ${percent !== undefined ? percentStr : ""}`;

  const changeClass = change > 0 ? "up" : change < 0 ? "down" : "zero";

  const changeStyle = {
    up: { color: STYLES.colors.redText, background: STYLES.colors.redBg },
    down: { color: STYLES.colors.greenText, background: STYLES.colors.greenBg },
    zero: { color: "#333", background: "#e0e0e0" },
  }[changeClass];

  return (
    <div
      style={{
        flex: 1,
        border: "3px solid #222",
        borderRadius: 14,
        padding: "8px 12px",
        boxShadow: "4px 4px 0 rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        gap: 5,
        flexWrap: "wrap",
        opacity: entrance,
        transform: `scale(${entrance})`,
      }}
    >
      <span
        style={{
          fontSize: 20,
          fontWeight: 900,
          color: "#fff",
          background: "#222",
          padding: "4px 12px",
          borderRadius: 8,
          whiteSpace: "nowrap",
          fontFamily: STYLES.fontMain,
        }}
      >
        {tag}
      </span>
      <span
        style={{
          fontFamily: STYLES.fontMono,
          fontSize: 36,
          fontWeight: 900,
          color: "#222",
        }}
      >
        {new Intl.NumberFormat().format(value)}
      </span>
      <span
        style={{
          fontFamily: STYLES.fontMono,
          fontSize: 18,
          fontWeight: 900,
          padding: "4px 4px",
          borderRadius: 6,
          whiteSpace: "nowrap",
          ...changeStyle,
        }}
      >
        {fullChangeStr}
      </span>
    </div>
  );
};

// ------------------------------------------------------------------
// 子组件：Grid Cell (用于 Total Stats)
// ------------------------------------------------------------------
const GridCell = ({
  icon: Icon,
  value,
  diff,
  delay = 0,
}: {
  icon: React.FC<any>;
  value: number;
  diff: number;
  delay?: number;
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const entrance = spring({
    frame: frame - delay,
    fps,
    from: 0,
    to: 1,
    config: { damping: 12 },
  });

  const diffStr =
    diff > 0
      ? `+${new Intl.NumberFormat().format(diff)}`
      : diff === 0
        ? "±0"
        : `${new Intl.NumberFormat().format(diff)}`;
  const rate = value !== 0 ? (diff / (value - diff)) * 100 : 0; // 计算环比: (本期 - 上期) / 上期 = diff / (value - diff)
  // 注意：如果 value - diff == 0 (上期为0)，rate 可能 Infinity。简单处理。
  const rateVal = isFinite(rate) ? rate : 0;

  const rateStr =
    rateVal > 0
      ? `(+${rateVal.toFixed(1)}%)`
      : rateVal < 0
        ? `(${rateVal.toFixed(1)}%)`
        : `(0.0%)`;

  const changeClass = diff > 0 ? "up" : diff < 0 ? "down" : "zero";

  const changeStyle = {
    up: { color: STYLES.colors.redText, background: STYLES.colors.redBg },
    down: { color: STYLES.colors.greenText, background: STYLES.colors.greenBg },
    zero: { color: "#333", background: "#e0e0e0" },
  }[changeClass];

  return (
    <div
      style={{
        background: "#fafafa",
        border: "2px solid #ddd",
        borderRadius: 10,
        padding: "4px 8px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        opacity: entrance,
        transform: `translateY(${(1 - entrance) * 20}px)`,
      }}
    >
      <Icon style={{ width: 64, height: 64, color: "#222" }} />
      <div
        style={{
          fontFamily: STYLES.fontMono,
          fontSize: 32,
          fontWeight: 900,
          color: "#222",
        }}
      >
        {new Intl.NumberFormat().format(value)}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <span
          style={{
            fontFamily: STYLES.fontMono,
            fontSize: 18,
            fontWeight: 900,
            padding: "2px 6px",
            borderRadius: 4,
            ...changeStyle,
          }}
        >
          {diffStr}
        </span>
        <span
          style={{
            fontFamily: STYLES.fontMono,
            fontSize: 18,
            fontWeight: 900,
            padding: "2px 6px",
            borderRadius: 4,
            ...changeStyle,
          }}
        >
          {rateStr}
        </span>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 主组件：统计卡片
// ------------------------------------------------------------------
export const StatsCard = (props: { stat: any; comment?: string }) => {
  const { stat, comment } = props;
  const { durationInFrames, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // 默认评论文本
  const displayComment = comment || "请输入文本";

  // 卡片进场
  const cardEntrance = spring({
    frame,
    fps,
    from: 50,
    to: 0,
    config: { damping: 12 },
  });
  const cardOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 卡片退场
  const exitStartFrame = durationInFrames - 30;
  const exitProgress = interpolate(
    frame,
    [exitStartFrame, exitStartFrame + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const cardExitTranslateY = interpolate(exitProgress, [0, 1], [0, 50]);
  const cardExitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);

  // Row 4 外框动画 (delay 43，比内部GridCell的45早一点)
  const row4Entrance = spring({
    frame: frame - 43,
    fps,
    from: 0,
    to: 1,
    config: { damping: 12 },
  });

  // 底部评论区动画 (delay 68，在GridCell之后)
  const commentEntrance = spring({
    frame: frame - 68,
    fps,
    from: 0,
    to: 1,
    config: { damping: 12 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: STYLES.colors.bg,
        backgroundImage: `radial-gradient(${STYLES.colors.dot} 3px, transparent 3px)`,
        backgroundSize: "24px 24px",
        fontFamily: STYLES.fontMain,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 1700,
          height: 940,
          background: STYLES.colors.card,
          border: `3px solid ${STYLES.colors.border}`,
          borderRadius: 24,
          boxShadow: "8px 8px 0 #000",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          opacity: cardOpacity * cardExitOpacity,
          transform: `translateY(${cardEntrance + cardExitTranslateY}px)`,
        }}
      >
        {/* Header */}
        <header
          style={{
            height: 80,
            background: STYLES.colors.headerBg,
            display: "flex",
            alignItems: "center",
            padding: "0 40px",
            borderBottom: `3px solid ${STYLES.colors.border}`,
            flexShrink: 0,
          }}
        >
          <h1
            style={{
              color: "#fff",
              fontSize: 40,
              margin: 0,
              fontWeight: 900,
            }}
          >
            本期榜单统计数据
          </h1>
        </header>

        {/* Content */}
        <main
          style={{
            flex: 1,
            padding: "25px 60px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* Row 1 */}
          <div style={{ display: "flex", gap: 50, flexWrap: "wrap" }}>
            <StatItem
              label="50万分以上"
              value={stat?.count_over_500k?.value || 0}
              unit="首"
              change={stat?.count_over_500k?.diff || 0}
              delay={5}
            />
            <StatItem
              label="10万分以上"
              value={stat?.count_over_100k?.value || 0}
              unit="首"
              change={stat?.count_over_100k?.diff || 0}
              delay={10}
            />
            <StatItem
              label="5万分以上"
              value={stat?.count_over_50k?.value || 0}
              unit="首"
              change={stat?.count_over_50k?.diff || 0}
              delay={15}
            />
          </div>

          {/* Row 2 */}
          <div style={{ display: "flex", gap: 50, flexWrap: "wrap" }}>
            <StatItem
              label="主榜2周内新曲"
              value={stat?.count_new_main?.value || 0}
              unit="首"
              change={stat?.count_new_main?.diff || 0}
              delay={20}
            />
            <StatItem
              label="全榜2周内新曲"
              value={stat?.count_new_total?.value || 0}
              unit="首"
              change={stat?.count_new_total?.diff || 0}
              delay={25}
            />
          </div>

          {/* Row 3: Cutoff */}
          <div style={{ display: "flex", gap: 25 }}>
            <CutoffItem
              tag="主榜起分"
              value={stat?.cutoff_main?.value || 0}
              change={stat?.cutoff_main?.diff || 0}
              percent={
                stat?.cutoff_main?.value &&
                stat?.cutoff_main?.value - stat?.cutoff_main?.diff !== 0
                  ? (stat.cutoff_main.diff /
                      (stat.cutoff_main.value - stat.cutoff_main.diff)) *
                    100
                  : 0
              }
              delay={30}
            />
            <CutoffItem
              tag="副榜起分"
              value={stat?.cutoff_sub?.value || 0}
              change={stat?.cutoff_sub?.diff || 0}
              percent={
                stat?.cutoff_sub?.value &&
                stat?.cutoff_sub?.value - stat?.cutoff_sub?.diff !== 0
                  ? (stat.cutoff_sub.diff /
                      (stat.cutoff_sub.value - stat.cutoff_sub.diff)) *
                    100
                  : 0
              }
              delay={35}
            />
            <CutoffItem
              tag="新曲榜起分"
              value={stat?.cutoff_new?.value || 0}
              change={stat?.cutoff_new?.diff || 0}
              percent={
                stat?.cutoff_new?.value &&
                stat?.cutoff_new?.value - stat?.cutoff_new?.diff !== 0
                  ? (stat.cutoff_new.diff /
                      (stat.cutoff_new.value - stat.cutoff_new.diff)) *
                    100
                  : 0
              }
              delay={40}
            />
          </div>

          {/* Row 4: Total Stats - 添加动画 */}
          <div
            style={{
              border: "3px solid #222",
              borderRadius: 16,
              padding: "8px 12px",
              boxShadow: "4px 4px 0 rgba(0,0,0,0.1)",
              opacity: row4Entrance,
              transform: `translateY(${(1 - row4Entrance) * 30}px)`,
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: "#fff",
                background: "#222",
                padding: "4px 12px",
                borderRadius: 8,
                display: "inline-block",
                marginBottom: 10,
                fontFamily: STYLES.fontMain,
              }}
            >
              单项排名前100总数据
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 10,
              }}
            >
              <GridCell
                icon={PlayIcon}
                value={stat?.total_view?.value || 0}
                diff={stat?.total_view?.diff || 0}
                delay={45}
              />
              <GridCell
                icon={StarIcon}
                value={stat?.total_favorite?.value || 0}
                diff={stat?.total_favorite?.diff || 0}
                delay={48}
              />
              <GridCell
                icon={CoinIcon}
                value={stat?.total_coin?.value || 0}
                diff={stat?.total_coin?.diff || 0}
                delay={51}
              />
              <GridCell
                icon={LikeIcon}
                value={stat?.total_like?.value || 0}
                diff={stat?.total_like?.diff || 0}
                delay={54}
              />
              <GridCell
                icon={DanmakuIcon}
                value={stat?.total_danmaku?.value || 0}
                diff={stat?.total_danmaku?.diff || 0}
                delay={57}
              />
              <GridCell
                icon={ReplyIcon}
                value={stat?.total_reply?.value || 0}
                diff={stat?.total_reply?.diff || 0}
                delay={60}
              />
              <GridCell
                icon={ShareIcon}
                value={stat?.total_share?.value || 0}
                diff={stat?.total_share?.diff || 0}
                delay={63}
              />
            </div>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "2px dashed #ccc",
              margin: "8px 0",
              opacity: commentEntrance,
            }}
          />

          {/* 底部评论区 - 添加动画 */}
          <div
            style={{
              border: "3px solid #222",
              borderRadius: 16,
              background: "#fafafa",
              padding: "25px 30px",
              boxShadow: "4px 4px 0 rgba(0,0,0,0.1)",
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              opacity: commentEntrance,
              transform: `translateY(${(1 - commentEntrance) * 30}px)`,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#333",
                lineHeight: 1.8,
                fontFamily: STYLES.fontMain,
              }}
            >
              {displayComment}
            </div>
          </div>
        </main>
      </div>
    </AbsoluteFill>
  );
};
