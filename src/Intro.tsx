import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  spring,
  interpolate,
  Easing,
  Img,
} from "remotion";
import { BilibiliLogo } from "./Icons";

const STYLES = {
  colors: {
    bg: "#fffbf0",
    border: "#000000",
    blue: "#bbdefb",
    biliBlue: "#23ade5",
    orange: "#ffe0b2",
    pink: "#f8bbd0",
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

export const Intro = ({
  issue = "#68",
  date = "2025.12.20",
  coverImg = "",
}: {
  issue?: string;
  date?: string;
  coverImg?: string;
}) => {
  const { fps, durationInFrames, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const containerEntrance = spring({
    frame,
    fps,
    from: height,
    to: 0,
    config: { damping: 14, mass: 1 },
  });

  const titleDelay = 15;
  const titleProgress = spring({
    frame: frame - titleDelay,
    fps,
    config: { damping: 12 },
  });
  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1]);

  const imgDelay = 25;
  const imgScale = spring({
    frame: frame - imgDelay,
    fps,
    from: 0,
    to: 1,
    config: { damping: 10, stiffness: 100 },
  });

  const exitFrames = 30;
  const exitStart = durationInFrames - exitFrames;
  const exitProgress = interpolate(
    frame,
    [exitStart, durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp" },
  );

  const containerExit = interpolate(exitProgress, [0, 1], [0, height], {
    easing: Easing.in(Easing.exp),
  });

  const translateY = frame < exitStart ? containerEntrance : containerExit;

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
          transform: `translateY(${translateY}px)`,
        }}
      >
        <div
          style={{
            width: 1750,
            height: 850,
            backgroundColor: "#fff",
            border: STYLES.border,
            borderRadius: 32,
            boxShadow: STYLES.shadow,
            display: "flex",
            padding: 40,
            gap: 40,
            position: "relative",
            overflow: "hidden",
            zIndex: 1,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 20,
              backgroundColor: STYLES.colors.biliBlue,
              borderRight: STYLES.border,
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 500,
              left: 40,
              width: 600,
              opacity: 0.15,
              zIndex: 0,
              pointerEvents: "none",
            }}
          >
            <BilibiliLogo style={{ width: "100%" }} />
          </div>

          <div
            style={{
              flex: 3,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingLeft: 20,
              zIndex: 2,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 24,
                opacity: titleOpacity,
                transform: `translateY(${titleY}px)`,
              }}
            >
              <span
                style={{
                  backgroundColor: "#222",
                  color: "#fff",
                  padding: "6px 16px",
                  borderRadius: 10,
                  fontSize: 64,
                  fontWeight: "bold",
                  fontFamily: STYLES.fontMain,
                }}
              >
                术力口数据库
              </span>
            </div>

            <h1
              style={{
                fontSize: 100,
                lineHeight: 1.15,
                margin: "0 0 36px 0",
                fontFamily: STYLES.fontMain,
                color: STYLES.colors.textMain,
                opacity: titleOpacity,
                transform: `translateY(${titleY}px)`,
                textShadow: "4px 4px 0px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ whiteSpace: "nowrap" }}>周刊虚拟歌手</div>
              <div
                style={{ color: STYLES.colors.biliBlue, whiteSpace: "nowrap" }}
              >
                外语排行榜
              </div>
            </h1>

            {/* 期数和日期 - 增大字体 */}
            <div
              style={{
                display: "flex",
                gap: 20,
                opacity: titleOpacity,
                transform: `translateY(${titleY}px)`,
              }}
            >
              <div
                style={{
                  backgroundColor: STYLES.colors.yellow,
                  border: STYLES.border,
                  boxShadow: "5px 5px 0 rgba(0,0,0,1)",
                  borderRadius: 16,
                  padding: "14px 32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 56,
                    fontWeight: "900",
                    fontFamily: STYLES.fontHeader,
                    color: "#000",
                  }}
                >
                  {issue}
                </span>
              </div>

              <div
                style={{
                  backgroundColor: "#fff",
                  border: STYLES.border,
                  boxShadow: "5px 5px 0 rgba(0,0,0,1)",
                  borderRadius: 16,
                  padding: "14px 32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 48,
                    fontWeight: "bold",
                    fontFamily: STYLES.fontHeader,
                    color: "#333",
                    letterSpacing: 3,
                  }}
                >
                  {date}
                </span>
              </div>
            </div>
          </div>

          {/* 右侧封面区 - 增大比例 */}
          <div
            style={{
              flex: 5.5,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 520,
                height: 520,
                borderRadius: "50%",
                backgroundColor: STYLES.colors.pink,
                border: STYLES.border,
                right: -80,
                top: -80,
                transform: `scale(${imgScale})`,
                zIndex: 0,
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 280,
                height: 280,
                backgroundColor: STYLES.colors.orange,
                border: STYLES.border,
                left: 0,
                bottom: 0,
                transform: `scale(${imgScale}) rotate(-15deg)`,
                zIndex: 0,
              }}
            />

            {/* 封面图 - 增大尺寸 */}
            <div
              style={{
                width: "95%",
                aspectRatio: "16/9",
                backgroundColor: "#222",
                border: "4px solid #000",
                borderRadius: 28,
                boxShadow: "18px 18px 0px #000",
                overflow: "hidden",
                position: "relative",
                transform: `scale(${imgScale})`,
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {coverImg ? (
                <Img
                  src={coverImg}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#e1bee7",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000",
                  }}
                >
                  <div
                    style={{
                      fontSize: 48,
                      fontWeight: "bold",
                      fontFamily: STYLES.fontHeader,
                    }}
                  >
                    NO COVER
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
