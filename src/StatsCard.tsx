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
// 子组件：统计项
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
  change: number | string;
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

  const numChange = typeof change === "number" ? change : 0;
  const changeStr =
    typeof change === "string"
      ? change
      : numChange > 0
        ? `+${numChange}`
        : numChange === 0
          ? "±0"
          : `${numChange}`;
  const changeClass = numChange > 0 ? "up" : numChange < 0 ? "down" : "zero";

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
// 子组件：分数线项
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
  change: number | string;
  percent?: number;
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

  const numChange = typeof change === "number" ? change : 0;
  const changeStr =
    typeof change === "string"
      ? change
      : numChange > 0
        ? `+${new Intl.NumberFormat().format(numChange)}`
        : numChange === 0
          ? "±0"
          : `${new Intl.NumberFormat().format(numChange)}`;

  const percentStr =
    percent > 0
      ? `(+${percent.toFixed(1)}%)`
      : percent < 0
        ? `(${percent.toFixed(1)}%)`
        : `(0.0%)`;

  const fullChangeStr = `${changeStr} ${percent !== undefined ? percentStr : ""}`;

  const changeClass = numChange > 0 ? "up" : numChange < 0 ? "down" : "zero";

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
// 子组件：Grid Cell
// ------------------------------------------------------------------
const GridCell = ({
  icon: Icon,
  value,
  diff,
  delay = 0,
}: {
  icon: React.FC<any>;
  value: number;
  diff: number | string;
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

  const numDiff = typeof diff === "number" ? diff : 0;
  const diffStr =
    typeof diff === "string"
      ? diff
      : numDiff > 0
        ? `+${new Intl.NumberFormat().format(numDiff)}`
        : numDiff === 0
          ? "±0"
          : `${new Intl.NumberFormat().format(numDiff)}`;

  const rate =
    value !== 0 && typeof diff === "number"
      ? (numDiff / (value - numDiff)) * 100
      : 0;
  const rateVal = isFinite(rate) ? rate : 0;

  const rateStr =
    rateVal > 0
      ? `(+${rateVal.toFixed(1)}%)`
      : rateVal < 0
        ? `(${rateVal.toFixed(1)}%)`
        : `(0.0%)`;

  const changeClass = numDiff > 0 ? "up" : numDiff < 0 ? "down" : "zero";

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
        {typeof diff === "number" && (
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
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 主组件：统计卡片
// ------------------------------------------------------------------
export const StatsCard = (props: {
  stat: any;
  comment?: string;
  topN?: number;
  scoreThresholds?: Array<{ key: string; label: string }>;
  newSongPeriod?: string;
}) => {
  const {
    stat,
    comment = "请输入文本",
    topN = 100,
    scoreThresholds = [
      { key: "count_over_500k", label: "50万分以上" },
      { key: "count_over_100k", label: "10万分以上" },
      { key: "count_over_50k", label: "5万分以上" },
    ],
    newSongPeriod = "2周内",
  } = props;

  const { durationInFrames, fps } = useVideoConfig();
  const frame = useCurrentFrame();

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

  const exitStartFrame = durationInFrames - 30;
  const exitProgress = interpolate(
    frame,
    [exitStartFrame, exitStartFrame + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const cardExitTranslateY = interpolate(exitProgress, [0, 1], [0, 50]);
  const cardExitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);

  const row4Entrance = spring({
    frame: frame - 43,
    fps,
    from: 0,
    to: 1,
    config: { damping: 12 },
  });

  const commentEntrance = spring({
    frame: frame - 68,
    fps,
    from: 0,
    to: 1,
    config: { damping: 12 },
  });

  const getStatValue = (key: string) => stat?.[key]?.value || 0;
  const getStatDiff = (key: string) => stat?.[key]?.diff ?? "-";

  const calcPercent = (key: string) => {
    const value = getStatValue(key);
    const diff = stat?.[key]?.diff;
    if (typeof diff !== "number" || value - diff === 0) return 0;
    return (diff / (value - diff)) * 100;
  };

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
            style={{ color: "#fff", fontSize: 40, margin: 0, fontWeight: 900 }}
          >
            本期榜单统计数据
          </h1>
        </header>

        <main
          style={{
            flex: 1,
            padding: "25px 60px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", gap: 50, flexWrap: "wrap" }}>
            {scoreThresholds.map((threshold, idx) => (
              <StatItem
                key={threshold.key}
                label={threshold.label}
                value={getStatValue(threshold.key)}
                unit="首"
                change={getStatDiff(threshold.key)}
                delay={5 + idx * 5}
              />
            ))}
          </div>

          <div style={{ display: "flex", gap: 50, flexWrap: "wrap" }}>
            <StatItem
              label={`主榜${newSongPeriod}新曲`}
              value={getStatValue("count_new_main")}
              unit="首"
              change={getStatDiff("count_new_main")}
              delay={20}
            />
            <StatItem
              label={`全榜${newSongPeriod}新曲`}
              value={getStatValue("count_new_total")}
              unit="首"
              change={getStatDiff("count_new_total")}
              delay={25}
            />
          </div>

          <div style={{ display: "flex", gap: 25 }}>
            <CutoffItem
              tag="主榜起分"
              value={getStatValue("cutoff_main")}
              change={getStatDiff("cutoff_main")}
              percent={calcPercent("cutoff_main")}
              delay={30}
            />
            <CutoffItem
              tag="副榜起分"
              value={getStatValue("cutoff_sub")}
              change={getStatDiff("cutoff_sub")}
              percent={calcPercent("cutoff_sub")}
              delay={35}
            />
            <CutoffItem
              tag="新曲榜起分"
              value={getStatValue("cutoff_new")}
              change={getStatDiff("cutoff_new")}
              percent={calcPercent("cutoff_new")}
              delay={40}
            />
          </div>

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
              单项排名前{topN}总数据
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
                value={getStatValue("total_view")}
                diff={getStatDiff("total_view")}
                delay={45}
              />
              <GridCell
                icon={StarIcon}
                value={getStatValue("total_favorite")}
                diff={getStatDiff("total_favorite")}
                delay={48}
              />
              <GridCell
                icon={CoinIcon}
                value={getStatValue("total_coin")}
                diff={getStatDiff("total_coin")}
                delay={51}
              />
              <GridCell
                icon={LikeIcon}
                value={getStatValue("total_like")}
                diff={getStatDiff("total_like")}
                delay={54}
              />
              <GridCell
                icon={DanmakuIcon}
                value={getStatValue("total_danmaku")}
                diff={getStatDiff("total_danmaku")}
                delay={57}
              />
              <GridCell
                icon={ReplyIcon}
                value={getStatValue("total_reply")}
                diff={getStatDiff("total_reply")}
                delay={60}
              />
              <GridCell
                icon={ShareIcon}
                value={getStatValue("total_share")}
                diff={getStatDiff("total_share")}
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
              {comment}
            </div>
          </div>
        </main>
      </div>
    </AbsoluteFill>
  );
};
