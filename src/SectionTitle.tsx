// src/SectionTitle.tsx
import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  spring,
  interpolate,
  Easing,
} from "remotion";

const STYLES = {
  colors: {
    bg: "#fffbf0",
    border: "#000000",
    textMain: "#000000",
    textSub: "#444444",
  },
  border: "3px solid #000",
  shadow: "8px 8px 0px rgba(0,0,0,1)",
  fontMain:
    '"Microsoft YaHei", "Heiti SC", "Arial Rounded MT Bold", sans-serif',
  fontNum: "",
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

export interface SectionTitleProps {
  title?: string;
  from?: string | number;
  to?: string | number;
  themeColor?: string;
  edName?: string;
  edAuthor?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title = "",
  from = 10,
  to = 1,
  themeColor = "#23ade5",
  edName = "",
  edAuthor = "",
}) => {
  const { fps, durationInFrames, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const entranceY = spring({
    frame,
    fps,
    from: height,
    to: 0,
    config: { damping: 14, mass: 0.8 },
  });

  const titleSlide = spring({
    frame: frame - 10,
    fps,
    from: -50,
    to: 0,
    config: { damping: 12 },
  });
  const titleOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const numScale = spring({
    frame: frame - 15,
    fps,
    from: 0,
    to: 1,
    config: { damping: 12, stiffness: 80 },
  });

  const edOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const edSlide = spring({
    frame: frame - 20,
    fps,
    from: 30,
    to: 0,
    config: { damping: 12 },
  });

  const exitFrames = 30;
  const exitStart = durationInFrames - exitFrames;
  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp" },
  );
  const exitY = interpolate(exitProgress, [0, 1], [0, height], {
    easing: Easing.in(Easing.exp),
  });

  const translateY = frame < exitStart ? entranceY : exitY;
  const hasEd = edName && edAuthor;

  return (
    <AbsoluteFill style={{ backgroundColor: STYLES.colors.bg }}>
      <DotPattern />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) translateY(${translateY}px)`,
          width: 1400,
          height: 800,
          backgroundColor: "#fff",
          border: STYLES.border,
          borderRadius: 32,
          boxShadow: STYLES.shadow,
          overflow: "hidden",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {title && (
          <div
            style={{
              position: "absolute",
              top: 60,
              left: 60,
              opacity: titleOpacity,
              transform: `translateX(${titleSlide}px)`,
            }}
          >
            <div
              style={{
                fontSize: 90,
                fontWeight: "900",
                fontFamily: STYLES.fontMain,
                color: "#222",
                lineHeight: 1,
                marginBottom: 16,
              }}
            >
              {title}
            </div>
            <div
              style={{
                width: 120,
                height: 12,
                backgroundColor: themeColor,
                borderRadius: 6,
              }}
            />
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 60,
            transform: `scale(${numScale})`,
          }}
        >
          <span
            style={{
              fontSize: 320,
              fontFamily: STYLES.fontNum,
              color: "#222",
              lineHeight: 1,
              fontWeight: "bold",
            }}
          >
            {from}
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 320,
            }}
          >
            <span
              style={{
                fontSize: 180,
                fontFamily: STYLES.fontMain,
                color: "#222",
                lineHeight: 1,
              }}
            >
              →
            </span>
          </div>

          <span
            style={{
              fontSize: 320,
              fontFamily: STYLES.fontNum,
              color: "#222",
              lineHeight: 1,
              fontWeight: "bold",
            }}
          >
            {to}
          </span>
        </div>

        {hasEd && (
          <div
            style={{
              position: "absolute",
              bottom: 60,
              left: 0,
              right: 0,
              opacity: edOpacity,
              transform: `translateY(${edSlide}px)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontFamily: STYLES.fontMain,
                fontWeight: "600",
                color: "#999",
                letterSpacing: 4,
              }}
            >
              ED
            </div>
            <div
              style={{
                fontSize: 48,
                fontFamily: STYLES.fontMain,
                fontWeight: "bold",
                color: "#333",
              }}
            >
              {edName}
            </div>
            <div
              style={{
                fontSize: 36,
                fontFamily: STYLES.fontMain,
                fontWeight: "500",
                color: "#666",
              }}
            >
              {edAuthor}
            </div>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            bottom: -50,
            right: -50,
            width: 200,
            height: 200,
            backgroundColor: themeColor,
            opacity: 0.1,
            borderRadius: "50%",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
