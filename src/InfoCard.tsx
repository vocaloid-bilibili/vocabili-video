// src/InfoCard.tsx
import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  spring,
  Img,
} from "remotion";

const STYLES = {
  colors: {
    bg: "#fffbf0",
    border: "#000000",
    blue: "#bbdefb",
    green: "#c8e6c9",
    purple: "#e1bee7",
    yellow: "#fff176",
    textMain: "#000000",
    textSub: "#444444",
  },
  border: "3px solid #000",
  shadow: "8px 8px 0px rgba(0,0,0,1)",
  fontMain:
    '"Microsoft YaHei", "Heiti SC", "Arial Rounded MT Bold", sans-serif',
  fontHeader: '"Arial Black", "Impact", sans-serif',
};

const DotPattern = () => (
  <AbsoluteFill
    style={{
      backgroundImage: "radial-gradient(#d7ccc8 3px, transparent 3px)",
      backgroundSize: "24px 24px",
      opacity: 0.6,
      zIndex: 0,
    }}
  />
);

export const InfoCard = ({
  opLabel = "OP / 上期冠军",
  opTitle,
  opArtist,
  opCover,
  timeLabel = "统计时间",
  timeRange,
  note,
  issueType = "weekly", // 新增：期刊类型
}: any) => {
  const { fps, durationInFrames, height } = useVideoConfig();
  const frame = useCurrentFrame();

  // 根据期刊类型调整标签
  const getOpLabel = () => {
    switch (issueType) {
      case "monthly":
        return "OP / 上月冠军";
      case "special":
        return "OP";
      default:
        return "OP / 上期冠军";
    }
  };

  const displayOpLabel = opLabel === "OP / 上期冠军" ? getOpLabel() : opLabel;

  const getSlideAnimation = (enterDelay: number, exitDelay: number) => {
    const entrance = spring({
      frame: frame - enterDelay,
      fps,
      from: height,
      to: 0,
      config: { damping: 14, mass: 0.8, stiffness: 100 },
    });

    const exitStartFrame = durationInFrames - 35;
    const exitAnimation = spring({
      frame: frame - exitStartFrame - exitDelay,
      fps,
      from: 0,
      to: height,
      config: { damping: 14, mass: 0.8, stiffness: 100 },
    });

    return entrance + exitAnimation;
  };

  const block1Y = getSlideAnimation(0, 10);
  const block2Y = getSlideAnimation(5, 5);
  const block3Y = getSlideAnimation(10, 0);

  return (
    <AbsoluteFill style={{ backgroundColor: STYLES.colors.bg }}>
      <DotPattern />

      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 1400,
            display: "flex",
            flexDirection: "column",
            gap: 32,
            zIndex: 1,
          }}
        >
          {/* 板块 1: OP */}
          <div style={{ transform: `translateY(${block1Y}px)` }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: "900",
                fontFamily: STYLES.fontMain,
                marginBottom: 16,
                color: "#333",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {displayOpLabel}
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                border: STYLES.border,
                borderRadius: 24,
                boxShadow: STYLES.shadow,
                padding: 24,
                display: "flex",
                alignItems: "center",
                gap: 32,
              }}
            >
              <div
                style={{
                  width: 280,
                  aspectRatio: "16/9",
                  backgroundColor: "#eee",
                  border: "2px solid #000",
                  borderRadius: 12,
                  overflow: "hidden",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {opCover ? (
                  <Img
                    src={opCover}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 40 }}>🎵</span>
                )}
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div
                  style={{
                    fontSize: 42,
                    fontWeight: "bold",
                    fontFamily: STYLES.fontMain,
                    lineHeight: 1.2,
                  }}
                >
                  {opTitle}
                </div>
                <div
                  style={{
                    fontSize: 32,
                    color: "#666",
                    fontFamily: STYLES.fontMain,
                  }}
                >
                  {opArtist}
                </div>
              </div>
            </div>
          </div>

          {/* 板块 2: 统计时间 */}
          <div style={{ transform: `translateY(${block2Y}px)` }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: "900",
                fontFamily: STYLES.fontMain,
                marginBottom: 16,
                color: "#333",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {timeLabel}
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                border: STYLES.border,
                borderRadius: 24,
                boxShadow: STYLES.shadow,
                padding: "24px 40px",
                fontSize: 40,
                fontWeight: "bold",
                fontFamily: STYLES.fontHeader,
                textAlign: "center",
                color: STYLES.colors.textSub,
                letterSpacing: 1,
              }}
            >
              {timeRange}
            </div>
          </div>

          {/* 板块 3: 备注 */}
          <div style={{ transform: `translateY(${block3Y}px)` }}>
            <div
              style={{
                backgroundColor: STYLES.colors.yellow,
                border: STYLES.border,
                borderRadius: 24,
                boxShadow: STYLES.shadow,
                padding: "32px 40px",
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 36,
                  fontWeight: "bold",
                  fontFamily: STYLES.fontMain,
                  color: "#000",
                }}
              >
                {note}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
