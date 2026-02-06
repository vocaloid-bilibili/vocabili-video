// src/InfoCard.tsx
import {
  AbsoluteFill,
  useVideoConfig,
  useCurrentFrame,
  spring,
  Img,
} from "remotion";

// ------------------------------------------------------------------
// 风格配置 (保持统一)
// ------------------------------------------------------------------
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

// 背景装饰点
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
}: any) => {
  const { fps, durationInFrames, height } = useVideoConfig();
  const frame = useCurrentFrame();

  // ------------------- 动画逻辑封装 -------------------

  /**
   * 计算单个卡片的 Y 轴位移
   * @param enterDelay 入场延迟帧数
   * @param exitDelay  出场延迟帧数（相对于出场开始时间）
   */
  const getSlideAnimation = (enterDelay: number, exitDelay: number) => {
    // 1. 入场动画：从屏幕下方 (height) 弹入到 0
    const entrance = spring({
      frame: frame - enterDelay,
      fps,
      from: height, // 起始位置：屏幕最下方
      to: 0, // 结束位置：原位
      config: { damping: 14, mass: 0.8, stiffness: 100 },
    });

    // 2. 出场动画：从 0 掉落回屏幕下方 (height)
    // 设定在视频结束前 35 帧开始依次退场
    const exitStartFrame = durationInFrames - 35;
    const exitAnimation = spring({
      frame: frame - exitStartFrame - exitDelay,
      fps,
      from: 0,
      to: height,
      config: { damping: 14, mass: 0.8, stiffness: 100 },
    });

    // 叠加位移：
    // 入场阶段 exitAnimation 为 0，表现为 entrance (height -> 0)
    // 稳定阶段 entrance 为 0，表现为 0
    // 出场阶段 entrance 为 0，表现为 exitAnimation (0 -> height)
    // 注意：spring 完成后会保持最终值，所以需要组合逻辑

    // 由于 entrance 会停留在 0，exit 会从 0 变到 height。
    // 直接相加即可： (EntranceSpring) + (ExitSpring)
    // 但 EntranceSpring 最终是 0，没问题。
    return entrance + exitAnimation;
  };

  // 为三个板块分别计算位移 (依次延迟 5 帧)
  const block1Y = getSlideAnimation(0, 10); // 第 1 个进，第 1 个出
  const block2Y = getSlideAnimation(5, 5); // 第 2 个进，第 2 个出
  const block3Y = getSlideAnimation(10, 0); // 第 3 个进，第 3 个出

  return (
    <AbsoluteFill style={{ backgroundColor: STYLES.colors.bg }}>
      <DotPattern />

      {/* 主容器 (不再整体移动，而是让内部元素自己动) */}
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
          {/* ========================================================
              板块 1: OP / 上期冠军
             ======================================================== */}
          <div
            style={{
              transform: `translateY(${block1Y}px)`, // 应用 Y 轴位移
            }}
          >
            {/* 标题 */}
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
              {opLabel}
            </div>

            {/* 内容卡片 */}
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
              {/* 封面图 */}
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

              {/* 歌曲信息 */}
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

          {/* ========================================================
              板块 2: 统计时间
             ======================================================== */}
          <div
            style={{
              transform: `translateY(${block2Y}px)`, // 应用 Y 轴位移
            }}
          >
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

          {/* ========================================================
              板块 3: 备注/公告
             ======================================================== */}
          <div
            style={{
              transform: `translateY(${block3Y}px)`, // 应用 Y 轴位移
            }}
          >
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
